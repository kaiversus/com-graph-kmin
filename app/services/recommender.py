"""
Recommender — checklist sinh tu schema.

Cho 1 root label, tra RELATIONSHIP_SCHEMA de liet ke tat ca loai node con hop le
(ca 2 chieu outgoing/incoming) cho admin tick chon. Khong co ranking — chi la
schema traversal + list node da ton tai.

Xem design/doc/recommend_feature_spec.md.
"""
from typing import Any

from app.config import (
    allowed_ends,
    get_driver,
    NEO4J_DATABASE,
    NODE_LABELS,
    NODE_PROP_SCHEMA,
    RELATIONSHIP_SCHEMA,
    primary_key_of,
)

# Prefix goi y id (slug co tien to theo loai node, vd skill_react, knowledge_js).
# Tat ca node gio deu do admin TU GO id (khong con auto LABEL-NNN) — prefix chi
# dung lam goi y placeholder. Xem needs_manual_id().
ID_PREFIX = {
    "Skill": "SKILL",
    "Knowledge": "KNOWLEDGE",
    "KnowledgeArea": "KNOWLEDGEAREA",
    "JobRole": "JOBROLE",
    "Account": "ACCOUNT",
    "Content": "CONTENT",
    "Task": "TASK",
    "Quiz": "QUIZ",
    "Mentor": "MENTOR",
}

# Shadow node — chi co primary key, data that nam o relational/Mongo.
SHADOW_LABELS = {"Account", "Content", "Task", "Quiz", "Mentor"}

# Rel same_label nhung doi xung ve nghia → chi render 1 card, ghi outgoing.
# PARENT_OF/IS_A/PREREQUISITE cung same_label nhung co thu bac/chieu nen KHONG o day.
SYMMETRIC_RELS = {"RELATED_TO"}

# Nhan tieng Viet cho tung nhanh: (root_label, rel_type, direction, child_label)
DISPLAY_LABELS = {
    # --- KnowledgeArea ---
    ("KnowledgeArea", "PARENT_OF", "outgoing", "KnowledgeArea"): "Lĩnh vực con",
    ("KnowledgeArea", "PARENT_OF", "incoming", "KnowledgeArea"): "Lĩnh vực cha",
    ("KnowledgeArea", "HAS", "outgoing", "Knowledge"): "Knowledge thuộc lĩnh vực",
    # --- Skill ---
    ("Skill", "REQUIRES", "outgoing", "Skill"): "Skill tiên quyết",
    ("Skill", "REQUIRES", "outgoing", "Knowledge"): "Knowledge tiên quyết",
    ("Skill", "REQUIRES", "incoming", "Skill"): "Skill cần skill này",
    ("Skill", "REQUIRES", "incoming", "JobRole"): "Vai trò cần skill này",
    ("Skill", "PRACTICES", "incoming", "Task"): "Task luyện skill",
    ("Skill", "HAS_SKILL", "incoming", "Account"): "Account có skill",
    ("Skill", "ASSESSES", "incoming", "Quiz"): "Quiz đánh giá skill",
    ("Skill", "COACHES", "incoming", "Mentor"): "Mentor coach skill",
    ("Skill", "RELATED_TO", "symmetric", "Skill"): "Skill liên quan",
    # --- Knowledge ---
    ("Knowledge", "IS_A", "outgoing", "Knowledge"): "Là một loại (cha)",
    ("Knowledge", "IS_A", "incoming", "Knowledge"): "Loại con kế thừa",
    ("Knowledge", "PREREQUISITE", "outgoing", "Knowledge"): "Knowledge tiên quyết",
    ("Knowledge", "PREREQUISITE", "incoming", "Knowledge"): "Knowledge cần cái này trước",
    ("Knowledge", "HAS", "incoming", "KnowledgeArea"): "Lĩnh vực chứa knowledge",
    ("Knowledge", "REQUIRES", "incoming", "Skill"): "Skill cần knowledge",
    ("Knowledge", "APPLIES", "incoming", "Task"): "Task áp dụng knowledge",
    ("Knowledge", "COVERS", "incoming", "Content"): "Content bao phủ knowledge",
    ("Knowledge", "ASSESSES", "incoming", "Quiz"): "Quiz đánh giá knowledge",
    ("Knowledge", "COACHES", "incoming", "Mentor"): "Mentor coach knowledge",
    ("Knowledge", "RELATED_TO", "symmetric", "Knowledge"): "Knowledge liên quan",
    # --- JobRole (graph-owned) ---
    ("JobRole", "REQUIRES", "outgoing", "Skill"): "Skill vai trò cần",
    # --- Task (shadow) ---
    ("Task", "PRACTICES", "outgoing", "Skill"): "Skill được luyện",
    ("Task", "APPLIES", "outgoing", "Knowledge"): "Knowledge được áp dụng",
    # --- Content (shadow) ---
    ("Content", "COVERS", "outgoing", "Knowledge"): "Knowledge nội dung bao phủ",
    # --- Account (shadow) ---
    ("Account", "HAS_SKILL", "outgoing", "Skill"): "Skill account có",
    # --- Quiz (shadow) ---
    ("Quiz", "ASSESSES", "outgoing", "Skill"): "Skill quiz đánh giá",
    ("Quiz", "ASSESSES", "outgoing", "Knowledge"): "Knowledge quiz đánh giá",
    # --- Mentor (shadow) ---
    ("Mentor", "COACHES", "outgoing", "Skill"): "Skill mentor coach",
    ("Mentor", "COACHES", "outgoing", "Knowledge"): "Knowledge mentor coach",
}


def _display_label(root: str, rel: str, direction: str, child: str) -> str:
    """Nhan hien thi; fallback generic neu chua khai bao trong DISPLAY_LABELS."""
    key = (root, rel, direction, child)
    if key in DISPLAY_LABELS:
        return DISPLAY_LABELS[key]
    arrow = "→" if direction == "outgoing" else ("←" if direction == "incoming" else "↔")
    return f"{child} ({arrow} {rel})"


# ---- Schema traversal -------------------------------------------------------


def build_suggestions(root_label: str) -> list[dict]:
    """
    Liet ke moi nhanh hop le tu root_label, ca 2 chieu.

    Moi suggestion = 1 card tren UI:
      { rel_type, direction, child_label, display_label, allow_create_new,
        child_props_spec, rel_props_spec }
    """
    if root_label not in NODE_LABELS:
        raise ValueError(f"Unknown label '{root_label}'")

    out: list[dict] = []

    for rel_type, spec in RELATIONSHIP_SCHEMA.items():
        same_label = spec.get("same_label", False)
        is_symmetric = rel_type in SYMMETRIC_RELS

        # Chieu di ra: root nam o dau start (end co the bi restrict theo start)
        if root_label in spec["starts"]:
            for child in sorted(allowed_ends(spec, root_label)):
                # same_label → chi ghep voi chinh label do (Topic→Topic, khong Topic→Concept)
                if same_label and child != root_label:
                    continue
                direction = "symmetric" if is_symmetric else "outgoing"
                out.append(_make_suggestion(root_label, rel_type, direction, child, spec))

        # Chieu di vao: root nam o dau end
        if root_label in spec["ends"]:
            for child in sorted(spec["starts"]):
                if same_label and child != root_label:
                    continue
                # start bi restrict khong toi duoc root nay → bo (vd Role khong toi Concept)
                if root_label not in allowed_ends(spec, child):
                    continue
                # Rel doi xung da phat 1 card o tren roi → khong lap lai
                if is_symmetric:
                    continue
                out.append(_make_suggestion(root_label, rel_type, "incoming", child, spec))

    return out


def rel_types_between(start_label: str, end_label: str) -> list[dict]:
    """
    Cac relationship hop le noi start_label -> end_label (dung chieu do).

    Dung cho thao tac "noi 2 node da co san tren graph" — khac voi
    build_suggestions() la liet ke theo 1 root.
    """
    if start_label not in NODE_LABELS or end_label not in NODE_LABELS:
        raise ValueError("Label khong hop le")

    out: list[dict] = []
    for rel_type, spec in RELATIONSHIP_SCHEMA.items():
        if start_label not in spec["starts"] or end_label not in allowed_ends(spec, start_label):
            continue
        if spec.get("same_label") and start_label != end_label:
            continue
        out.append({
            "rel_type": rel_type,
            "props_spec": spec.get("props", {}),
            "same_label": spec.get("same_label", False),
        })
    return out


def needs_manual_id(label: str) -> bool:
    """
    Moi node gio deu do admin TU GO id (slug co tien to theo loai, vd skill_react).
    Khong con auto-increment LABEL-NNN. UI luon hien o nhap id.
    """
    return label in NODE_LABELS


def _make_suggestion(root: str, rel_type: str, direction: str, child: str, spec: dict) -> dict:
    return {
        "rel_type": rel_type,
        "direction": direction,
        "child_label": child,
        "display_label": _display_label(root, rel_type, direction, child),
        "allow_create_new": True,
        "manual_id": needs_manual_id(child),
        "child_props_spec": NODE_PROP_SCHEMA[child],
        "rel_props_spec": spec.get("props", {}),
    }


# ---- Liet ke node da ton tai ------------------------------------------------


# Label co nhieu hon nguong nay thi khong do het ra dropdown — bat admin go tim.
# Do het 200/394 theo alphabet chi ra mot lat cat A-... vo nghia.
SEARCH_THRESHOLD = 100


def list_existing(
    labels: set[str],
    q: str | None = None,
    limit: int = 200,
    exclude: dict[str, str] | None = None,
) -> dict[str, dict]:
    """
    Tra ve { label: {items, total, truncated, needs_search} }.

    Shadow node khong co 'name' → dung chinh id lam name.
    `q` loc theo name/id (khong phan biet hoa thuong).
    `exclude` = {label: id} — bo node goc ra khoi danh sach cua chinh label do,
    tranh viec admin tu noi node vao chinh no.
    `needs_search=True` khi label qua lon va admin chua go gi → UI hien
    "Go de tim trong N ..." thay vi do bua mot lat cat alphabet.
    """
    exclude = exclude or {}
    result: dict[str, dict] = {}
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        for label in sorted(labels):
            if label not in NODE_LABELS:
                continue
            pk = primary_key_of(label)
            has_name = "name" in NODE_PROP_SCHEMA[label]
            name_expr = "n.name" if has_name else f"n.`{pk}`"

            clauses: list[str] = []
            params: dict[str, Any] = {"limit": limit}
            if q:
                clauses.append(
                    f"(toLower({name_expr}) CONTAINS toLower($q) "
                    f"OR toLower(n.`{pk}`) CONTAINS toLower($q))"
                )
                params["q"] = q
            if label in exclude:
                clauses.append(f"n.`{pk}` <> $excl")
                params["excl"] = exclude[label]
            where = ("WHERE " + " AND ".join(clauses) + " ") if clauses else ""

            total = session.run(
                f"MATCH (n:`{label}`) {where}RETURN count(n) AS c", **params
            ).single()["c"]

            # Chua go gi ma label qua lon → khong do ra, bat go tim
            if not q and total > SEARCH_THRESHOLD:
                result[label] = {
                    "items": [], "total": total,
                    "truncated": True, "needs_search": True,
                }
                continue

            rows = session.run(
                f"MATCH (n:`{label}`) {where}"
                f"RETURN n.`{pk}` AS id, {name_expr} AS name "
                f"ORDER BY {name_expr} LIMIT $limit",
                **params,
            ).data()
            result[label] = {
                "items": rows,
                "total": total,
                "truncated": total > len(rows),
                "needs_search": False,
            }
    return result


def mark_linked(root_label: str, root_id: str | None, suggestions: list[dict]) -> None:
    """
    Danh dau item da noi san voi node goc (item['linked'] = True) de UI hien
    "(da noi)" va khong cho chon lai.

    Chi chay khi root da ton tai trong DB. Mo 1 session dung chung cho moi
    suggestion thay vi moi card mot session.
    """
    if not root_id:
        return
    root_pk = primary_key_of(root_label)
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        for s in suggestions:
            ex = s.get("existing") or {}
            child_label = s["child_label"]
            child_pk = primary_key_of(child_label)
            rel_type = s["rel_type"]
            # incoming: child la dau start; con lai root la dau start
            if s["direction"] == "incoming":
                pattern = (
                    f"(c:`{child_label}`)-[:`{rel_type}`]->"
                    f"(r:`{root_label}` {{`{root_pk}`: $rid}})"
                )
            else:
                pattern = (
                    f"(r:`{root_label}` {{`{root_pk}`: $rid}})"
                    f"-[:`{rel_type}`]->(c:`{child_label}`)"
                )
            rec = session.run(
                f"MATCH {pattern} RETURN collect(c.`{child_pk}`) AS ids", rid=root_id
            ).single()
            linked = set(rec["ids"] if rec else [])
            for item in ex.get("items", []):
                if item["id"] in linked:
                    item["linked"] = True
            ex["linked_count"] = len(linked)


# ---- Sinh id LABEL-NNN ------------------------------------------------------


def allocate_ids(session, label: str, count: int) -> list[str]:
    """
    Cap `count` id lien tiep cho label, tiep noi so lon nhat dang co trong DB.

    toInteger() tra null neu hau to khong phai so (vd id nhap tay 'SKILL-abc'),
    max() bo qua null → khong vo khi data co id la.
    """
    if count <= 0:
        return []
    prefix = ID_PREFIX[label]
    pk = primary_key_of(label)
    offset = len(prefix) + 1  # bo qua 'SKILL-'

    record = session.run(
        f"MATCH (n:`{label}`) WHERE n.`{pk}` STARTS WITH $prefix "
        f"RETURN max(toInteger(substring(n.`{pk}`, $offset))) AS max_num",
        prefix=f"{prefix}-",
        offset=offset,
    ).single()

    start = (record["max_num"] or 0) + 1 if record else 1
    return [f"{prefix}-{i:03d}" for i in range(start, start + count)]


def allocate_tree_ids(nodes: list[dict]) -> dict[str, str]:
    """
    Cap id that cho toan bo node moi trong cay, tra ve map { temp_id: real_id }.

    Gom theo label roi cap 1 dai lien tiep cho moi label — 1 query / label,
    khong query lai tung node.
    """
    by_label: dict[str, list[str]] = {}
    id_map: dict[str, str] = {}
    for n in nodes:
        temp_id = n.get("temp_id")
        if not temp_id:
            continue
        # Node da tu go id (shadow node) → khong cap de len, nhung VAN phai
        # vao id_map, khong thi relationship tro vao temp id se treo.
        pk = primary_key_of(n["label"])
        provided = (n.get("props") or {}).get(pk)
        if provided:
            id_map[temp_id] = provided
            continue
        by_label.setdefault(n["label"], []).append(temp_id)

    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        for label, temp_ids in by_label.items():
            if label not in ID_PREFIX:
                raise ValueError(f"Unknown label '{label}'")
            real_ids = allocate_ids(session, label, len(temp_ids))
            for temp_id, real_id in zip(temp_ids, real_ids):
                id_map[temp_id] = real_id
    return id_map


def resolve_ref(ref: str, id_map: dict[str, str]) -> str:
    """temp id → id that; id that (node da co san trong DB) giu nguyen."""
    return id_map.get(ref, ref)
