"""
Graph data feed cho tab Visualizer.

Tra ve node/rel duoi dang phang { nodes: [...], relationships: [...] } de
vis-network ve. AuditLog luon bi loai — no la metadata, khong phai du lieu do thi.
"""
from fastapi import APIRouter, HTTPException

from app.config import get_driver, NEO4J_DATABASE, NODE_LABELS

router = APIRouter(prefix="/api", tags=["graph"])

# Chỉ hiển thị node NGHIỆP VỤ. Các node hệ thống (AuditLog, ChangeRequest,
# AppUser — tài khoản đăng nhập) bị loại: không phải dữ liệu đồ thị và không được
# lộ (AppUser có mật khẩu băm).
_BUSINESS_LABELS = list(NODE_LABELS)


@router.get("/graph")
def get_graph_data(limit: int = 200):
    """Chỉ trả node/rel nghiệp vụ cho visualizer (ẩn node hệ thống)."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        node_records = session.run(
            "MATCH (n) WHERE any(l IN labels(n) WHERE l IN $labels) "
            "RETURN elementId(n) AS internal_id, "
            "labels(n) AS labels, properties(n) AS props LIMIT $limit",
            labels=_BUSINESS_LABELS, limit=limit,
        ).data()
        rel_records = session.run(
            "MATCH (s)-[r]->(e) WHERE any(l IN labels(s) WHERE l IN $labels) "
            "AND any(l IN labels(e) WHERE l IN $labels) "
            "RETURN elementId(r) AS internal_id, type(r) AS type, "
            "elementId(s) AS start, elementId(e) AS end, properties(r) AS props LIMIT $limit",
            labels=_BUSINESS_LABELS, limit=limit * 2,
        ).data()

    return {
        "nodes": node_records,
        "relationships": rel_records,
        "node_count": len(node_records),
        "rel_count": len(rel_records),
    }


# ---- Quick queries ----------------------------------------------------------


def _pair_result(cypher: str, **params) -> dict:
    """
    Chay 1 query dang (a)-[r]->(b) roi go ve format graph.

    Query PHAI tra dung bo alias: aid/alabels/aprops, bid/blabels/bprops,
    rid/rtype/rprops. Dedup node qua dict — 1 node xuat hien o nhieu dong
    (vd 10 user cung tro vao 1 skill) chi ve 1 lan.
    """
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(cypher, **params).data()

    nodes_map: dict[str, dict] = {}
    rels: list[dict] = []
    for rec in records:
        for side in ("a", "b"):
            nid = rec[f"{side}id"]
            nodes_map[nid] = {
                "internal_id": nid,
                "labels": rec[f"{side}labels"],
                "props": rec[f"{side}props"],
            }
        rels.append({
            "internal_id": rec["rid"],
            "type": rec["rtype"],
            "start": rec["aid"],
            "end": rec["bid"],
            "props": rec["rprops"],
        })

    nodes = list(nodes_map.values())
    return {
        "nodes": nodes,
        "relationships": rels,
        "node_count": len(nodes),
        "rel_count": len(rels),
    }


_PAIR_RETURN = (
    "RETURN elementId(a) AS aid, labels(a) AS alabels, properties(a) AS aprops, "
    "       elementId(b) AS bid, labels(b) AS blabels, properties(b) AS bprops, "
    "       elementId(r) AS rid, type(r) AS rtype, properties(r) AS rprops"
)


@router.get("/graph/query/accounts-by-skill/{skill_id}")
def accounts_by_skill(skill_id: str):
    """Accounts that HAS_SKILL a specific Skill, plus the skill node itself."""
    return _pair_result(
        f"MATCH (a:Account)-[r:HAS_SKILL]->(b:Skill {{id: $sid}}) {_PAIR_RETURN}",
        sid=skill_id,
    )


@router.get("/graph/query/quizzes-by-skill/{skill_id}")
def quizzes_by_skill(skill_id: str):
    """Quizzes that ASSESSES a specific Skill, plus the skill node itself."""
    return _pair_result(
        f"MATCH (a:Quiz)-[r:ASSESSES]->(b:Skill {{id: $sid}}) {_PAIR_RETURN}",
        sid=skill_id,
    )


@router.get("/graph/query/knowledge-by-area/{area_id}")
def knowledge_by_area(area_id: str):
    """Knowledge that a KnowledgeArea HAS, plus the area node itself."""
    return _pair_result(
        f"MATCH (a:KnowledgeArea {{id: $aid}})-[r:HAS]->(b:Knowledge) {_PAIR_RETURN}",
        aid=area_id,
    )


@router.get("/graph/options/{label}")
def get_node_options(label: str):
    """Return list of {id, name} for a given label, used by quick query dropdowns."""
    allowed = {"Skill", "Knowledge", "KnowledgeArea"}
    if label not in allowed:
        raise HTTPException(status_code=400, detail=f"Label must be one of: {sorted(allowed)}")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            f"MATCH (n:{label}) RETURN n.id AS id, n.name AS name ORDER BY n.name",
        ).data()
    return records


@router.delete("/graph/wipe")
def wipe_graph(confirm: str = ""):
    """Demo-only: xoá dữ liệu NGHIỆP VỤ. Giữ nguyên node hệ thống (AuditLog,
    ChangeRequest, AppUser — tài khoản đăng nhập). Requires confirm=YES."""
    if confirm != "YES":
        raise HTTPException(status_code=400, detail="Pass ?confirm=YES to confirm")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        session.run(
            "MATCH (n) WHERE any(l IN labels(n) WHERE l IN $labels) DETACH DELETE n",
            labels=_BUSINESS_LABELS,
        )
    return {"success": True}
