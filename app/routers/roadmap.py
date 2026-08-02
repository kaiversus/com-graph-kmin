"""
Roadmap — lộ trình học CÁ NHÂN HÓA từ 1 JobRole hoặc 1 KnowledgeArea.

Khác bản cũ (chỉ vẽ cây tĩnh), bản này overlay hồ sơ của 1 Account để trả lời:
  - "Tôi đang ở đâu": mỗi skill/knowledge → done / in_progress / not_started
    (suy từ Account -HAS_SKILL-> Skill {proficiency}).
  - "Cái gì quan trọng": importance suy từ REQUIRES.weight (essential/important/optional).
  - "Học gì trước / đã sẵn sàng chưa": readiness suy từ tiên quyết (Skill->Skill,
    Knowledge PREREQUISITE Knowledge).
  - "Học ở đâu, chứng minh sao": resources = số Content/Quiz/Mentor gắn vào.
  - Tiến độ %, "Học tiếp theo", milestone, câu headline tạo động lực → gói trong `summary`.

Cả by-role và by-area quy về cùng cấu trúc { root, account, nodes, edges, summary }.
Node vẫn giữ id/label/type/level/meta để FE vẽ cây; kèm thêm status/importance/... để
FE tô màu và dựng panel bên phải. account_id là query param TÙY CHỌN — bỏ trống thì
roadmap về chế độ "bản chung" (không có tiến độ cá nhân).
"""
from fastapi import APIRouter, HTTPException

from app.config import get_driver, NEO4J_DATABASE

router = APIRouter(prefix="/api", tags=["roadmap"])

SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"]
_LEVEL_RANK = {lvl: i for i, lvl in enumerate(SKILL_LEVELS)}

# Ngưỡng proficiency (0..1) → trạng thái học. Đồng bộ với các band trong schema:
# advanced (>=0.6) coi như "đã đạt" để hành nghề; dưới đó mà >0 là đang học.
DONE_THRESHOLD = 0.6


def _status_of(prof) -> str:
    """proficiency (hoặc None) → 'done' | 'in_progress' | 'not_started'."""
    if prof is None:
        return "not_started"
    if prof >= DONE_THRESHOLD:
        return "done"
    if prof > 0:
        return "in_progress"
    return "not_started"


def _importance_of(weight) -> str:
    """REQUIRES.weight / HAS.weight → nhãn độ quan trọng."""
    w = 1.0 if weight is None else float(weight)
    if w >= 0.8:
        return "essential"
    if w >= 0.5:
        return "important"
    return "optional"


IMPORTANCE_LABEL = {
    "essential": "Bắt buộc",
    "important": "Quan trọng",
    "optional": "Nên có",
}
STATUS_LABEL = {
    "done": "Đã đạt",
    "in_progress": "Đang học",
    "not_started": "Chưa học",
}


@router.get("/roadmap/sources")
def roadmap_sources():
    """Điểm bắt đầu roadmap: job roles, knowledge areas, và accounts (để cá nhân hóa)."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        roles = session.run(
            "MATCH (r:JobRole) RETURN r.id AS id, r.name AS name ORDER BY name"
        ).data()
        areas = session.run(
            "MATCH (a:KnowledgeArea) RETURN a.id AS id, a.name AS name ORDER BY name"
        ).data()
        accounts = session.run(
            "MATCH (a:Account) RETURN a.id_account AS id "
            "ORDER BY a.id_account"
        ).data()
    return {"roles": roles, "areas": areas, "accounts": accounts}


def _account_skill_map(session, account_id: str | None) -> dict:
    """skill_id -> proficiency cho 1 account. {} nếu không truyền account."""
    if not account_id:
        return {}
    rows = session.run(
        "MATCH (a:Account {id_account: $aid})-[hs:HAS_SKILL]->(s:Skill) "
        "RETURN s.id AS id, hs.proficiency AS prof",
        aid=account_id,
    ).data()
    return {r["id"]: r["prof"] for r in rows}


def _skill_resources(session, skill_ids: list) -> dict:
    """skill_id -> {quizzes, mentors} (Content chỉ cover Knowledge nên skill không có)."""
    if not skill_ids:
        return {}
    rows = session.run(
        "MATCH (s:Skill) WHERE s.id IN $ids "
        "OPTIONAL MATCH (q:Quiz)-[:ASSESSES]->(s) "
        "OPTIONAL MATCH (m:Mentor)-[:COACHES]->(s) "
        "RETURN s.id AS id, count(DISTINCT q) AS quizzes, count(DISTINCT m) AS mentors",
        ids=skill_ids,
    ).data()
    return {r["id"]: {"contents": 0, "quizzes": r["quizzes"], "mentors": r["mentors"]} for r in rows}


def _knowledge_resources(session, knowledge_ids: list) -> dict:
    """knowledge_id -> {contents, quizzes, mentors}."""
    if not knowledge_ids:
        return {}
    rows = session.run(
        "MATCH (k:Knowledge) WHERE k.id IN $ids "
        "OPTIONAL MATCH (c:Content)-[:COVERS]->(k) "
        "OPTIONAL MATCH (q:Quiz)-[:ASSESSES]->(k) "
        "OPTIONAL MATCH (m:Mentor)-[:COACHES]->(k) "
        "RETURN k.id AS id, count(DISTINCT c) AS contents, "
        "       count(DISTINCT q) AS quizzes, count(DISTINCT m) AS mentors",
        ids=knowledge_ids,
    ).data()
    return {r["id"]: {"contents": r["contents"], "quizzes": r["quizzes"], "mentors": r["mentors"]} for r in rows}


def _account_name(session, account_id: str | None):
    if not account_id:
        return None
    rec = session.run(
        "MATCH (a:Account {id_account: $aid}) RETURN a.id_account AS id",
        aid=account_id,
    ).single()
    return {"id": rec["id"], "name": rec["id"]} if rec else None


# ---------------------------------------------------------------------------
# BY ROLE
# ---------------------------------------------------------------------------
@router.get("/roadmap/by-role/{role_id}")
def roadmap_by_role(role_id: str, account_id: str | None = None):
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        role_rec = session.run(
            "MATCH (r:JobRole {id: $rid}) RETURN r.id AS id, r.name AS name, r.level AS level",
            rid=role_id,
        ).single()
        if not role_rec:
            raise HTTPException(404, "JobRole not found")

        skills = session.run(
            "MATCH (r:JobRole {id: $rid})-[req:REQUIRES]->(s:Skill) "
            "RETURN s.id AS id, s.name AS name, s.level AS level, req.weight AS weight "
            "ORDER BY s.level, s.name",
            rid=role_id,
        ).data()

        # tiên quyết của các skill cần: Skill -REQUIRES-> Skill/Knowledge
        prereqs = session.run(
            "MATCH (r:JobRole {id: $rid})-[:REQUIRES]->(s:Skill)-[pr:REQUIRES]->(p) "
            "WHERE p:Skill OR p:Knowledge "
            "RETURN s.id AS skill_id, p.id AS prereq_id, p.name AS prereq_name, "
            "       head(labels(p)) AS prereq_type, p.level AS prereq_level, pr.weight AS weight",
            rid=role_id,
        ).data()

        acc_map = _account_skill_map(session, account_id)
        skill_ids = [s["id"] for s in skills]
        prereq_skill_ids = [p["prereq_id"] for p in prereqs if p["prereq_type"] == "Skill"]
        prereq_know_ids = [p["prereq_id"] for p in prereqs if p["prereq_type"] == "Knowledge"]
        res_skill = _skill_resources(session, list(set(skill_ids + prereq_skill_ids)))
        res_know = _knowledge_resources(session, prereq_know_ids)
        account = _account_name(session, account_id)

    return _build_role_tree(
        root={"id": role_rec["id"], "name": role_rec["name"],
               "type": "JobRole", "level": role_rec.get("level")},
        skills=skills,
        prereqs=prereqs,
        acc_map=acc_map,
        res_skill=res_skill,
        res_know=res_know,
        account=account,
        personalized=account is not None,
    )


def _build_role_tree(root, skills, prereqs, acc_map, res_skill, res_know, account, personalized):
    """
    Cây phẳng, KHÔNG còn node "Level" trung gian (bỏ theo yêu cầu — trùng nghĩa
    với màu vàng "đang học"). Thay vào đó:
      - root nối thẳng tới từng Skill; Skill được xếp TẦNG theo độ khó (beginner
        ở trên → expert ở dưới) để vẫn đọc được thứ tự học.
      - Tiên quyết mà cũng là Skill của vai trò → KHÔNG nhân đôi node, chỉ vẽ 1
        cạnh phụ thuộc (nét đứt) giữa 2 skill (skill nền → skill phụ thuộc).
      - Tiên quyết kiểu Knowledge → node riêng treo dưới cùng.
    """
    root_id = f"root_{root['id']}"
    nodes = [{"id": root_id, "label": root["name"], "type": root["type"], "level": 0,
              "meta": (root.get("level") or ""), "status": None}]
    edges = []
    seen = {root_id}

    prereq_by_skill: dict[str, list] = {}
    for p in prereqs:
        prereq_by_skill.setdefault(p["skill_id"], []).append(p)

    # ---- Tính toán per-skill ----
    skill_items = []
    for s in skills:
        sid = s["id"]
        prof = acc_map.get(sid)
        locked_by = [
            p["prereq_name"] for p in prereq_by_skill.get(sid, [])
            if p["prereq_type"] == "Skill" and _status_of(acc_map.get(p["prereq_id"])) != "done"
        ]
        skill_items.append({
            "ref_id": sid, "name": s["name"], "type": "Skill",
            "level": s.get("level") or "beginner",
            "prof": prof, "status": _status_of(prof),
            "importance": _importance_of(s.get("weight")), "weight": s.get("weight"),
            "ready": len(locked_by) == 0, "locked_by": locked_by,
            "resources": res_skill.get(sid, {"contents": 0, "quizzes": 0, "mentors": 0}),
        })
    skill_id_set = {it["ref_id"] for it in skill_items}

    # ---- Skill nodes: root → skill, xếp tầng theo độ khó ----
    KNOW_TIER = len(SKILL_LEVELS) + 2  # dưới mọi skill
    for it in skill_items:
        nid = f"skill_{it['ref_id']}"
        tier = 1 + _LEVEL_RANK.get(it["level"], 0)
        nodes.append({
            "id": nid, "label": it["name"], "type": "Skill", "level": tier,
            "meta": IMPORTANCE_LABEL[it["importance"]],
            "status": it["status"] if personalized else None,
            "ref_id": it["ref_id"], "importance": it["importance"],
            "ready": it["ready"], "locked_by": it["locked_by"],
            "difficulty": it["level"], "proficiency": it["prof"],
            "resources": it["resources"],
        })
        seen.add(nid)
        edges.append({"from": root_id, "to": nid})

    # ---- Tiên quyết ----
    for skill_id, plist in prereq_by_skill.items():
        sid = f"skill_{skill_id}"
        if sid not in seen:
            continue
        for p in plist:
            ref = p["prereq_id"]
            if ref in skill_id_set:
                # phụ thuộc giữa 2 skill vai trò: skill nền → skill phụ thuộc (thứ tự học)
                edges.append({"from": f"skill_{ref}", "to": sid, "style": "dashed"})
                continue
            pid = f"prereq_{ref}"
            ptype = p.get("prereq_type") or "Knowledge"
            if pid not in seen:
                pstatus = _status_of(acc_map.get(ref)) if ptype == "Skill" else None
                nodes.append({
                    "id": pid, "label": p["prereq_name"], "type": ptype, "level": KNOW_TIER,
                    "meta": "", "status": pstatus if personalized else None,
                    "ref_id": ref, "importance": _importance_of(p.get("weight")),
                    "ready": True, "locked_by": [],
                    "difficulty": p.get("prereq_level"),
                    "resources": (res_know if ptype == "Knowledge" else res_skill).get(
                        ref, {"contents": 0, "quizzes": 0, "mentors": 0}),
                })
                seen.add(pid)
            edges.append({"from": sid, "to": pid, "style": "dashed"})

    summary = _summarize(skill_items, root, "kỹ năng", personalized, unit_label="skill")
    return {"root": root, "account": account, "personalized": personalized,
            "nodes": nodes, "edges": edges, "summary": summary}


# ---------------------------------------------------------------------------
# BY AREA
# ---------------------------------------------------------------------------
@router.get("/roadmap/by-area/{area_id}")
def roadmap_by_area(area_id: str, account_id: str | None = None):
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        area_rec = session.run(
            "MATCH (a:KnowledgeArea {id: $aid}) RETURN a.id AS id, a.name AS name",
            aid=area_id,
        ).single()
        if not area_rec:
            raise HTTPException(404, "KnowledgeArea not found")

        subareas = session.run(
            "MATCH (a:KnowledgeArea {id: $aid})-[r:PARENT_OF]->(c:KnowledgeArea) "
            "RETURN c.id AS id, c.name AS name, r.order AS ord "
            "ORDER BY coalesce(r.order, 9999), c.name",
            aid=area_id,
        ).data()

        knowledge = session.run(
            "MATCH (a:KnowledgeArea {id: $aid}) "
            "MATCH (owner:KnowledgeArea)-[h:HAS]->(k:Knowledge) "
            "WHERE owner = a OR (a)-[:PARENT_OF]->(owner) "
            "RETURN owner.id AS area_id, owner.name AS area_name, "
            "       k.id AS id, k.name AS name, k.kind AS kind, "
            "       k.difficulty AS difficulty, h.weight AS weight "
            "ORDER BY k.name",
            aid=area_id,
        ).data()

        know_ids = [k["id"] for k in knowledge]

        # "Tôi đang ở đâu" cho Knowledge (không có Account->Knowledge trực tiếp):
        # proxy = proficiency CAO NHẤT của các Skill mà account đã có và Skill đó REQUIRES k.
        know_prof = {}
        if account_id and know_ids:
            rows = session.run(
                "MATCH (a:Account {id_account: $aid})-[hs:HAS_SKILL]->(s:Skill)"
                "-[:REQUIRES]->(k:Knowledge) "
                "WHERE k.id IN $ids "
                "RETURN k.id AS id, max(hs.proficiency) AS prof",
                aid=account_id, ids=know_ids,
            ).data()
            know_prof = {r["id"]: r["prof"] for r in rows}

        # tiên quyết giữa knowledge trong phạm vi (để tính readiness/thứ tự)
        prereq_pairs = []
        if know_ids:
            prereq_pairs = session.run(
                "MATCH (k1:Knowledge)-[:PREREQUISITE]->(k2:Knowledge) "
                "WHERE k1.id IN $ids AND k2.id IN $ids "
                "RETURN k1.id AS before, k2.id AS after",
                ids=know_ids,
            ).data()

        res_know = _knowledge_resources(session, know_ids)
        account = _account_name(session, account_id)

    return _build_area_tree(
        root={"id": area_rec["id"], "name": area_rec["name"], "type": "KnowledgeArea"},
        subareas=subareas, knowledge=knowledge, know_prof=know_prof,
        prereq_pairs=prereq_pairs, res_know=res_know,
        account=account, personalized=account is not None,
    )


def _build_area_tree(root, subareas, knowledge, know_prof, prereq_pairs, res_know,
                     account, personalized):
    root_id = f"root_{root['id']}"
    nodes = [{"id": root_id, "label": root["name"], "type": root["type"], "level": 0,
              "meta": "", "status": None}]
    edges = []
    seen = {root_id}

    for a in subareas:
        aid = f"area_{a['id']}"
        if aid not in seen:
            nodes.append({"id": aid, "label": a["name"], "type": "KnowledgeArea",
                          "level": 1, "meta": "lĩnh vực con", "status": None})
            seen.add(aid)
        edges.append({"from": root_id, "to": aid})

    # readiness: k sẵn sàng nếu mọi tiên quyết (before) đã done
    prereq_before: dict[str, list] = {}
    for pp in prereq_pairs:
        prereq_before.setdefault(pp["after"], []).append(pp["before"])

    def kstatus(kid):
        return _status_of(know_prof.get(kid))

    know_items = []
    for k in knowledge:
        kid = k["id"]
        status = kstatus(kid)
        importance = _importance_of(k.get("weight"))
        locked_by = [b for b in prereq_before.get(kid, []) if kstatus(b) != "done"]
        # map id tiên quyết -> tên để hiển thị
        locked_names = [nk["name"] for nk in knowledge if nk["id"] in locked_by]
        know_items.append({
            "ref_id": kid, "name": k["name"], "type": "Knowledge",
            "level": k.get("difficulty") or "beginner",
            "prof": know_prof.get(kid), "status": status,
            "importance": importance, "weight": k.get("weight"),
            "ready": len(locked_by) == 0, "locked_by": locked_names,
            "area_id": k["area_id"], "kind": k.get("kind"),
            "resources": res_know.get(kid, {"contents": 0, "quizzes": 0, "mentors": 0}),
        })

    for it in know_items:
        kid = f"knowledge_{it['ref_id']}"
        owner = it["area_id"]
        parent_id = root_id if owner == root["id"] else f"area_{owner}"
        if parent_id not in seen:
            parent_id = root_id
        if kid not in seen:
            nodes.append({
                "id": kid, "label": it["name"], "type": "Knowledge", "level": 2,
                "meta": IMPORTANCE_LABEL[it["importance"]] if personalized else (it["kind"] or ""),
                "status": it["status"] if personalized else None,
                "ref_id": it["ref_id"], "importance": it["importance"],
                "ready": it["ready"], "locked_by": it["locked_by"],
                "difficulty": it["level"], "proficiency": it["prof"],
                "kind": it["kind"], "resources": it["resources"],
            })
            seen.add(kid)
        edges.append({"from": parent_id, "to": kid})

    summary = _summarize(know_items, root, "kiến thức", personalized, unit_label="knowledge")
    return {"root": root, "account": account, "personalized": personalized,
            "nodes": nodes, "edges": edges, "summary": summary}


# ---------------------------------------------------------------------------
# SUMMARY (panel bên phải)
# ---------------------------------------------------------------------------
def _summarize(items, root, unit_vi, personalized, unit_label):
    """
    items: list dict có status/importance/weight/ready/level/name/locked_by/resources.
    Trả về summary cho panel: tiến độ %, phân bố, next_steps, milestones, headline.
    """
    total = len(items)
    done = sum(1 for it in items if it["status"] == "done")
    in_progress = sum(1 for it in items if it["status"] == "in_progress")
    not_started = total - done - in_progress

    # % theo trọng số quan trọng (weight); fallback đếm nếu tổng weight = 0
    def w(it):
        return 1.0 if it.get("weight") is None else float(it["weight"])
    total_w = sum(w(it) for it in items)
    done_w = sum(w(it) for it in items if it["status"] == "done")
    percent = round(done_w / total_w * 100) if total_w else 0
    percent_count = round(done / total * 100) if total else 0

    # Milestone theo cấp độ (beginner→expert)
    ms_map: dict[str, dict] = {}
    for it in items:
        lvl = it["level"] if it["level"] in _LEVEL_RANK else "beginner"
        m = ms_map.setdefault(lvl, {"level": lvl, "total": 0, "done": 0})
        m["total"] += 1
        if it["status"] == "done":
            m["done"] += 1
    milestones = [
        {**ms_map[lvl], "percent": round(ms_map[lvl]["done"] / ms_map[lvl]["total"] * 100)}
        for lvl in SKILL_LEVELS if lvl in ms_map
    ]

    # "Học tiếp theo": các mục CHƯA done, ưu tiên sẵn sàng + quan trọng + dễ trước.
    imp_rank = {"essential": 0, "important": 1, "optional": 2}

    def sort_key(it):
        return (
            0 if it["ready"] else 1,                         # sẵn sàng trước
            0 if it["status"] == "in_progress" else 1,       # đang học dở → xong nốt
            imp_rank.get(it["importance"], 3),               # quan trọng hơn trước
            _LEVEL_RANK.get(it["level"], 9),                 # dễ hơn trước
            it["name"],
        )

    pending = [it for it in items if it["status"] != "done"]
    pending.sort(key=sort_key)
    next_steps = []
    for it in pending[:6]:
        if not it["ready"]:
            why = "Cần học trước: " + ", ".join(it["locked_by"][:3])
        elif it["status"] == "in_progress":
            why = "Đang học dở — hoàn thành nốt để đạt"
        else:
            why = "Đã đủ điều kiện, bắt đầu được ngay"
        next_steps.append({
            "ref_id": it["ref_id"], "name": it["name"], "type": it["type"],
            "importance": it["importance"], "importance_label": IMPORTANCE_LABEL[it["importance"]],
            "ready": it["ready"], "status": it["status"], "why": why,
            "difficulty": it["level"], "resources": it["resources"],
        })

    # Headline tạo động lực
    if not personalized:
        headline = f"Lộ trình gồm {total} {unit_vi}. Chọn một học viên để xem bạn đang ở đâu."
        sub = None
    elif total == 0:
        headline = "Lộ trình này chưa có nội dung."
        sub = None
    elif done == total:
        headline = f"🎉 Xuất sắc! Bạn đã hoàn thành toàn bộ {total} {unit_vi} của lộ trình."
        sub = "Sẵn sàng cho thử thách tiếp theo!"
    elif done == 0:
        headline = f"🚀 Bắt đầu hành trình! {total} {unit_vi} đang chờ bạn chinh phục."
        sub = f"Ưu tiên: {next_steps[0]['name']}" if next_steps else None
    else:
        remaining = total - done
        headline = f"💪 Bạn đã đi được {percent}% — còn {remaining} {unit_vi} nữa là hoàn thành!"
        # milestone chưa xong gần nhất
        nxt_ms = next((m for m in milestones if m["done"] < m["total"]), None)
        if nxt_ms:
            left = nxt_ms["total"] - nxt_ms["done"]
            sub = f"Còn {left} {unit_vi} cấp {nxt_ms['level'].title()} để hoàn tất chặng này."
        else:
            sub = None

    return {
        "total": total, "done": done, "in_progress": in_progress, "not_started": not_started,
        "percent": percent, "percent_count": percent_count,
        "milestones": milestones, "next_steps": next_steps,
        "headline": headline, "sub": sub,
        "status_label": STATUS_LABEL, "importance_label": IMPORTANCE_LABEL,
    }
