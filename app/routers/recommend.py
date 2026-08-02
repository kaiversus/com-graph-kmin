"""
Recommend — guided build: root node → checklist node con theo schema → commit ca cay.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import (
    NEO4J_DATABASE,
    NODE_LABELS,
    NODE_PROP_SCHEMA,
    get_driver,
    primary_key_of,
)
from app.services.guided import apply_guided_build, BuildValidationError
from app.services.recommender import (
    allocate_ids,
    allocate_tree_ids,
    build_suggestions,
    list_existing,
    mark_linked,
    needs_manual_id,
    rel_types_between,
    resolve_ref,
)
from app.services.validator import validate_node_record, validate_relationship_record

router = APIRouter(prefix="/api/recommend", tags=["recommend"])


class ChildrenRequest(BaseModel):
    label: str
    # id cua root — chi de tham chieu, khong bat buoc (root co the chua ton tai)
    id: str | None = None
    # co keo danh sach node da ton tai ve khong (tat di cho nhe neu chi can schema)
    include_existing: bool = True


class DraftNode(BaseModel):
    temp_id: str
    label: str
    props: dict = Field(default_factory=dict)


class DraftRel(BaseModel):
    rel_type: str
    start_label: str
    start: str  # temp id hoac id that
    end_label: str
    end: str
    props: dict = Field(default_factory=dict)


class CommitRequest(BaseModel):
    actor: str = "admin"
    nodes: list[DraftNode] = Field(default_factory=list)
    relationships: list[DraftRel] = Field(default_factory=list)


@router.get("/labels")
def get_root_labels():
    """Label chon lam root o buoc 1."""
    return [
        {
            "label": label,
            "allow_create_new": True,
            "manual_id": needs_manual_id(label),
            "props_spec": NODE_PROP_SCHEMA[label],
            "primary_key": primary_key_of(label),
        }
        for label in sorted(NODE_LABELS)
    ]


@router.get("/next-id/{label}")
def get_next_id(label: str):
    """
    Goi y id ke tiep — dung lam placeholder cho o nhap id cua shadow node.
    Chi la goi y; admin co the go id khac cho khop ben quan he.
    """
    if label not in NODE_LABELS:
        raise HTTPException(status_code=400, detail=f"Unknown label '{label}'")
    driver = get_driver()
    try:
        with driver.session(database=NEO4J_DATABASE) as session:
            return {"label": label, "next_id": allocate_ids(session, label, 1)[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neo4j error: {e}")


@router.post("/children")
def get_children(req: ChildrenRequest):
    """
    Checklist node con hop le cho 1 label — ca 2 chieu.
    Thuan schema traversal, khong ranking.
    """
    try:
        suggestions = build_suggestions(req.label)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    empty = {"items": [], "total": 0, "truncated": False, "needs_search": False}
    if req.include_existing:
        needed = {s["child_label"] for s in suggestions}
        # Bỏ chính node gốc khỏi danh sách cùng label → không tự nối vào mình
        exclude = {req.label: req.id} if req.id else {}
        try:
            existing = list_existing(needed, exclude=exclude)
            for s in suggestions:
                s["existing"] = existing.get(s["child_label"], dict(empty))
            mark_linked(req.label, req.id, suggestions)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Neo4j error: {e}")
    else:
        for s in suggestions:
            s["existing"] = dict(empty)

    return {
        "root": {"label": req.label, "id": req.id},
        "has_children": bool(suggestions),
        "suggestions": suggestions,
    }


@router.get("/existing/{label}")
def search_existing(
    label: str,
    q: str | None = None,
    limit: int = 50,
    root_label: str | None = None,
    root_id: str | None = None,
    rel_type: str | None = None,
    direction: str | None = None,
):
    """
    Tim node da ton tai de link — o search trong tung card checklist.

    Truyen kem root_label/root_id/rel_type/direction thi ket qua search cung
    duoc loai node goc va danh dau "(da noi)" giong luc load lan dau.
    """
    if label not in NODE_LABELS:
        raise HTTPException(status_code=400, detail=f"Unknown label '{label}'")
    exclude = {root_label: root_id} if root_label and root_id else {}
    try:
        result = list_existing({label}, q=q, limit=limit, exclude=exclude)[label]
        if root_label and root_id and rel_type and direction:
            fake = [{
                "child_label": label, "rel_type": rel_type,
                "direction": direction, "existing": result,
            }]
            mark_linked(root_label, root_id, fake)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neo4j error: {e}")


@router.get("/rel-types")
def get_rel_types(
    start_label: str,
    end_label: str,
    start_id: str | None = None,
    end_id: str | None = None,
):
    """
    Quan he hop le noi start_label -> end_label. Dung cho thao tac noi 2 node
    da co san tren graph (khong tao node moi).

    Truyen kem start_id + end_id (2 node deu da ton tai trong DB) thi moi
    rel_type duoc gan them exists_in_db — de UI chu thich "(da co trong DB)"
    va chan noi trung.
    """
    try:
        types = rel_types_between(start_label, end_label)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if start_id and end_id and types:
        spk = primary_key_of(start_label)
        epk = primary_key_of(end_label)
        driver = get_driver()
        try:
            with driver.session(database=NEO4J_DATABASE) as session:
                rows = session.run(
                    f"MATCH (s:`{start_label}` {{`{spk}`: $sid}})"
                    f"-[r]->"
                    f"(e:`{end_label}` {{`{epk}`: $eid}}) "
                    "RETURN DISTINCT type(r) AS t",
                    sid=start_id, eid=end_id,
                ).data()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Neo4j error: {e}")
        existing = {row["t"] for row in rows}
        for t in types:
            t["exists_in_db"] = t["rel_type"] in existing

    return {
        "start_label": start_label,
        "end_label": end_label,
        "rel_types": types,
    }


@router.get("/neighborhood/{label}/{node_id}")
def get_neighborhood(label: str, node_id: str, limit: int = 40):
    """
    Hang xom 1 hop cua root — de ve graph ngu canh quanh node dang lam viec.

    Tra ve node that su da noi trong DB (khac voi suggestions la nhanh schema
    con trong). UI ve 2 loai nay bang 2 kieu khac nhau.
    """
    if label not in NODE_LABELS:
        raise HTTPException(status_code=400, detail=f"Unknown label '{label}'")
    pk = primary_key_of(label)
    driver = get_driver()
    try:
        with driver.session(database=NEO4J_DATABASE) as session:
            rows = session.run(
                f"MATCH (r:`{label}` {{`{pk}`: $id}})-[rel]-(n) "
                "WHERE NOT n:AuditLog "
                "RETURN type(rel) AS rel_type, "
                "       startNode(rel) = r AS outgoing, "
                "       labels(n)[0] AS label, "
                "       coalesce(n.id, n.id_account, n.id_content, n.id_task, n.id_quiz, n.id_mentor) AS id, "
                "       coalesce(n.name, n.id_account, n.id_content, n.id_task, n.id_quiz, n.id_mentor) AS name "
                "LIMIT $limit",
                id=node_id, limit=limit,
            ).data()
            total = session.run(
                f"MATCH (r:`{label}` {{`{pk}`: $id}})-[]-(n) "
                "WHERE NOT n:AuditLog RETURN count(*) AS c",
                id=node_id,
            ).single()["c"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neo4j error: {e}")

    return {
        "root": {"label": label, "id": node_id},
        "neighbors": rows,
        "total": total,
        "truncated": total > len(rows),
    }


@router.post("/commit")
def commit_tree(req: CommitRequest):
    """
    Commit ca cay 1 lan (admin, ghi truc tiep). Cap id that -> resolve tham chieu
    -> validate -> run_import (1 transaction, moi rang buoc). Logic dung chung o
    services.guided.apply_guided_build (de duyet ChangeRequest cung dung lai).
    """
    nodes = [n.model_dump() for n in req.nodes]
    rels = [r.model_dump() for r in req.relationships]
    try:
        result = apply_guided_build(req.actor, nodes, rels)
    except BuildValidationError as e:
        raise HTTPException(status_code=400, detail={"errors": e.errors, "id_map": e.id_map})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "phase": "transaction"})
    return {"success": True, **result}
