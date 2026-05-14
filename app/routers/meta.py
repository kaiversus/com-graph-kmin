"""
Audit log, restore, schema introspection, and graph data feed for neovis.js.
"""
from fastapi import APIRouter, HTTPException
from app.config import (
    get_driver,
    NEO4J_DATABASE,
    NEO4J_URI,
    NEO4J_USER,
    NEO4J_PASSWORD,
    NODE_PROP_SCHEMA,
    RELATIONSHIP_SCHEMA,
)
from app.services.importer import run_restore

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/neovis-config")
def get_neovis_config():
    """
    Return Neo4j connection details for the browser-side neovis.js.

    Note: neovis.js connects directly from browser to Neo4j via Bolt, so the
    URI/credentials must be reachable from the user's browser. For Aura cloud,
    keep using neo4j+s://. For local dev, bolt://localhost:7687 is fine.
    Treat this as demo-grade — in prod, prefer a server-side proxy and
    short-lived credentials.
    """
    return {
        "uri": NEO4J_URI,
        "user": NEO4J_USER,
        "password": NEO4J_PASSWORD,
        "database": NEO4J_DATABASE,
    }


@router.get("/schema")
def get_schema():
    """Return the full schema definition so the frontend can render forms dynamically."""
    return {
        "nodes": NODE_PROP_SCHEMA,
        "relationships": RELATIONSHIP_SCHEMA,
    }


@router.get("/audit")
def list_audit_logs(limit: int = 50):
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        result = session.run(
            "MATCH (a:AuditLog) RETURN a.id AS id, a.timestamp AS timestamp, "
            "a.actor AS actor, a.operation AS operation, a.option AS option, "
            "a.status AS status, a.affected_nodes_count AS nc, "
            "a.affected_rels_count AS rc, a.error AS error "
            "ORDER BY a.timestamp DESC LIMIT $limit",
            limit=limit,
        )
        return [dict(r) for r in result]


@router.get("/audit/{audit_id}")
def get_audit_detail(audit_id: str):
    import json
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        record = session.run(
            "MATCH (a:AuditLog {id: $id}) RETURN a", id=audit_id
        ).single()
        if not record:
            raise HTTPException(status_code=404, detail="Audit log not found")
        node = record["a"]
        data = dict(node)
        # Parse JSON-serialized snapshot fields back
        for k in ("snapshot_nodes", "snapshot_rels", "payload_summary"):
            if k in data and isinstance(data[k], str):
                try:
                    data[k] = json.loads(data[k])
                except Exception:
                    pass
        return data


@router.post("/audit/{audit_id}/restore")
def restore_from_audit(audit_id: str):
    try:
        result = run_restore(audit_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True, **result}


# ---- Graph data for neovis.js ---------------------------------------------


@router.get("/graph")
def get_graph_data(limit: int = 200):
    """Return all non-AuditLog nodes and rels for neovis to render."""
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


@router.get("/graph/query/users-by-skill/{skill_id}")
def users_by_skill(skill_id: str):
    """Users that HAS_SKILL a specific Skill, plus the skill node itself."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            "MATCH (u:User)-[r:HAS_SKILL]->(s:Skill {id: $sid}) "
            "RETURN elementId(u) AS uid, labels(u) AS ulabels, properties(u) AS uprops, "
            "       elementId(s) AS sid, labels(s) AS slabels, properties(s) AS sprops, "
            "       elementId(r) AS rid, type(r) AS rtype, properties(r) AS rprops",
            sid=skill_id,
        ).data()
    nodes_map = {}
    rels = []
    for rec in records:
        nodes_map[rec["uid"]] = {"internal_id": rec["uid"], "labels": rec["ulabels"], "props": rec["uprops"]}
        nodes_map[rec["sid"]] = {"internal_id": rec["sid"], "labels": rec["slabels"], "props": rec["sprops"]}
        rels.append({"internal_id": rec["rid"], "type": rec["rtype"], "start": rec["uid"], "end": rec["sid"], "props": rec["rprops"]})
    nodes = list(nodes_map.values())
    return {"nodes": nodes, "relationships": rels, "node_count": len(nodes), "rel_count": len(rels)}


@router.get("/graph/query/courses-by-concept/{concept_id}")
def courses_by_concept(concept_id: str):
    """Courses that COVERS a specific Concept, plus the concept node itself."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            "MATCH (c:Course)-[r:COVERS]->(co:Concept {id: $cid}) "
            "RETURN elementId(c) AS cid, labels(c) AS clabels, properties(c) AS cprops, "
            "       elementId(co) AS coid, labels(co) AS colabels, properties(co) AS coprops, "
            "       elementId(r) AS rid, type(r) AS rtype, properties(r) AS rprops",
            cid=concept_id,
        ).data()
    nodes_map = {}
    rels = []
    for rec in records:
        nodes_map[rec["cid"]] = {"internal_id": rec["cid"], "labels": rec["clabels"], "props": rec["cprops"]}
        nodes_map[rec["coid"]] = {"internal_id": rec["coid"], "labels": rec["colabels"], "props": rec["coprops"]}
        rels.append({"internal_id": rec["rid"], "type": rec["rtype"], "start": rec["cid"], "end": rec["coid"], "props": rec["rprops"]})
    nodes = list(nodes_map.values())
    return {"nodes": nodes, "relationships": rels, "node_count": len(nodes), "rel_count": len(rels)}


@router.get("/graph/query/skills-by-course/{course_id}")
def skills_by_course(course_id: str):
    """Skills that a Course TEACHES, plus the course node itself."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            "MATCH (c:Course {id_course: $cid})-[r:TEACHES]->(s:Skill) "
            "RETURN elementId(c) AS cid, labels(c) AS clabels, properties(c) AS cprops, "
            "       elementId(s) AS sid, labels(s) AS slabels, properties(s) AS sprops, "
            "       elementId(r) AS rid, type(r) AS rtype, properties(r) AS rprops",
            cid=course_id,
        ).data()
    nodes_map = {}
    rels = []
    for rec in records:
        nodes_map[rec["cid"]] = {"internal_id": rec["cid"], "labels": rec["clabels"], "props": rec["cprops"]}
        nodes_map[rec["sid"]] = {"internal_id": rec["sid"], "labels": rec["slabels"], "props": rec["sprops"]}
        rels.append({"internal_id": rec["rid"], "type": rec["rtype"], "start": rec["cid"], "end": rec["sid"], "props": rec["rprops"]})
    nodes = list(nodes_map.values())
    return {"nodes": nodes, "relationships": rels, "node_count": len(nodes), "rel_count": len(rels)}


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
