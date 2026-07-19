"""
Graph data feed cho tab Visualizer.

Tra ve node/rel duoi dang phang { nodes: [...], relationships: [...] } de
vis-network ve. AuditLog luon bi loai — no la metadata, khong phai du lieu do thi.
"""
from fastapi import APIRouter, HTTPException

from app.config import get_driver, NEO4J_DATABASE

router = APIRouter(prefix="/api", tags=["graph"])


@router.get("/graph")
def get_graph_data(limit: int = 200):
    """Return all non-AuditLog nodes and rels for the visualizer to render."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        node_records = session.run(
            "MATCH (n) WHERE NOT n:AuditLog RETURN elementId(n) AS internal_id, "
            "labels(n) AS labels, properties(n) AS props LIMIT $limit",
            limit=limit,
        ).data()
        rel_records = session.run(
            "MATCH (s)-[r]->(e) WHERE NOT s:AuditLog AND NOT e:AuditLog "
            "RETURN elementId(r) AS internal_id, type(r) AS type, "
            "elementId(s) AS start, elementId(e) AS end, properties(r) AS props LIMIT $limit",
            limit=limit * 2,
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


@router.get("/graph/query/users-by-skill/{skill_id}")
def users_by_skill(skill_id: str):
    """Users that HAS_SKILL a specific Skill, plus the skill node itself."""
    return _pair_result(
        f"MATCH (a:User)-[r:HAS_SKILL]->(b:Skill {{id: $sid}}) {_PAIR_RETURN}",
        sid=skill_id,
    )


@router.get("/graph/query/courses-by-concept/{concept_id}")
def courses_by_concept(concept_id: str):
    """Courses that COVERS a specific Concept, plus the concept node itself."""
    return _pair_result(
        f"MATCH (a:Course)-[r:COVERS]->(b:Concept {{id: $cid}}) {_PAIR_RETURN}",
        cid=concept_id,
    )


@router.get("/graph/query/skills-by-course/{course_id}")
def skills_by_course(course_id: str):
    """Skills that a Course TEACHES, plus the course node itself."""
    return _pair_result(
        f"MATCH (a:Course {{id_course: $cid}})-[r:TEACHES]->(b:Skill) {_PAIR_RETURN}",
        cid=course_id,
    )


@router.get("/graph/options/{label}")
def get_node_options(label: str):
    """Return list of {id, name} for a given label, used by quick query dropdowns."""
    allowed = {"Skill": "id", "Concept": "id", "Course": "id_course"}
    if label not in allowed:
        raise HTTPException(status_code=400, detail=f"Label must be one of: {list(allowed.keys())}")
    pk = allowed[label]
    name_field = "name" if label != "Course" else "id_course"
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            f"MATCH (n:{label}) RETURN n.{pk} AS id, n.{name_field} AS name ORDER BY n.{name_field}",
        ).data()
    return records


@router.delete("/graph/wipe")
def wipe_graph(confirm: str = ""):
    """Demo-only: clear all graph data (NOT AuditLog). Requires confirm=YES."""
    if confirm != "YES":
        raise HTTPException(status_code=400, detail="Pass ?confirm=YES to confirm")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        session.run("MATCH (n) WHERE NOT n:AuditLog DETACH DELETE n")
    return {"success": True}
