"""
Audit log, restore, schema introspection, graph data feed, and export endpoints.
"""
import csv
import io
import json as json_mod
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.config import (
    get_driver,
    NEO4J_DATABASE,
    NEO4J_URI,
    NEO4J_USER,
    NEO4J_PASSWORD,
    NODE_LABELS,
    NODE_PROP_SCHEMA,
    RELATIONSHIP_SCHEMA,
    primary_key_of,
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


# ---- Roadmap endpoints -------------------------------------------------------


@router.get("/roadmap/sources")
def roadmap_sources():
    """List available starting points for roadmap: courses and topics."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        courses = session.run(
            "MATCH (c:Course) RETURN c.id_course AS id, "
            "coalesce(c.name, c.id_course) AS name ORDER BY name"
        ).data()
        topics = session.run(
            "MATCH (t:Topic) RETURN t.id AS id, t.name AS name ORDER BY name"
        ).data()
    return {"courses": courses, "topics": topics}


@router.get("/roadmap/by-course/{course_id}")
def roadmap_by_course(course_id: str):
    """Build a top-down roadmap tree for a course.

    Structure:  Course → Skills (via TEACHES) → Prerequisites (via REQUIRES)
                Course → Concepts (via COVERS) → Sub-concepts (via PARENT_OF)
    """
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        course_rec = session.run(
            "MATCH (c:Course {id_course: $cid}) "
            "RETURN c.id_course AS id, coalesce(c.name, c.id_course) AS name",
            cid=course_id,
        ).single()
        if not course_rec:
            raise HTTPException(404, "Course not found")

        skills = session.run(
            "MATCH (c:Course {id_course: $cid})-[r:TEACHES]->(s:Skill) "
            "RETURN s.id AS id, s.name AS name, s.level AS level, "
            "       r.relevance AS relevance ORDER BY s.level, s.name",
            cid=course_id,
        ).data()

        concepts = session.run(
            "MATCH (c:Course {id_course: $cid})-[r:COVERS]->(co:Concept) "
            "RETURN co.id AS id, co.name AS name, r.depth AS depth "
            "ORDER BY r.depth, co.name",
            cid=course_id,
        ).data()

        prereqs = session.run(
            "MATCH (c:Course {id_course: $cid})-[:TEACHES]->(s:Skill)-[:REQUIRES]->(p:Skill) "
            "RETURN s.id AS skill_id, p.id AS prereq_id, p.name AS prereq_name, "
            "       p.level AS prereq_level",
            cid=course_id,
        ).data()

        concept_children = session.run(
            "MATCH (c:Course {id_course: $cid})-[:COVERS]->(co:Concept)"
            "<-[:PARENT_OF]-(parent:Concept) "
            "RETURN co.id AS child_id, parent.id AS parent_id, parent.name AS parent_name",
            cid=course_id,
        ).data()

    return _build_roadmap_tree(
        root={"id": course_rec["id"], "name": course_rec["name"], "type": "Course"},
        skills=skills,
        concepts=concepts,
        prereqs=prereqs,
        concept_children=concept_children,
    )


@router.get("/roadmap/by-topic/{topic_id}")
def roadmap_by_topic(topic_id: str):
    """Build a top-down roadmap tree for a topic.

    Structure: Topic → Skills/Concepts (via INCLUDES) → Prerequisites
    """
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        topic_rec = session.run(
            "MATCH (t:Topic {id: $tid}) RETURN t.id AS id, t.name AS name",
            tid=topic_id,
        ).single()
        if not topic_rec:
            raise HTTPException(404, "Topic not found")

        skills = session.run(
            "MATCH (t:Topic {id: $tid})-[:INCLUDES]->(s:Skill) "
            "RETURN s.id AS id, s.name AS name, s.level AS level "
            "ORDER BY s.level, s.name",
            tid=topic_id,
        ).data()

        concepts = session.run(
            "MATCH (t:Topic {id: $tid})-[:INCLUDES]->(co:Concept) "
            "RETURN co.id AS id, co.name AS name, 'applied' AS depth "
            "ORDER BY co.name",
            tid=topic_id,
        ).data()

        prereqs = session.run(
            "MATCH (t:Topic {id: $tid})-[:INCLUDES]->(s:Skill)-[:REQUIRES]->(p:Skill) "
            "RETURN s.id AS skill_id, p.id AS prereq_id, p.name AS prereq_name, "
            "       p.level AS prereq_level",
            tid=topic_id,
        ).data()

    return _build_roadmap_tree(
        root={"id": topic_rec["id"], "name": topic_rec["name"], "type": "Topic"},
        skills=skills,
        concepts=concepts,
        prereqs=prereqs,
        concept_children=[],
    )


def _build_roadmap_tree(root, skills, concepts, prereqs, concept_children):
    """Build a flat node+edge list structured for hierarchical rendering."""
    LEVEL_ORDER = {"foundational": 0, "beginner": 1, "intermediate": 2, "advance": 3, "expert": 4}
    DEPTH_ORDER = {"overview": 0, "applied": 1, "deep_dive": 2}

    nodes = [{"id": f"root_{root['id']}", "label": root["name"],
              "type": root["type"], "level": 0, "meta": ""}]
    edges = []
    seen_ids = {nodes[0]["id"]}

    skill_groups: dict[str, list] = {}
    for s in skills:
        lvl = s.get("level") or "beginner"
        skill_groups.setdefault(lvl, []).append(s)

    level_idx = 1
    for lvl in ["foundational", "beginner", "intermediate", "advance", "expert"]:
        group = skill_groups.get(lvl, [])
        if not group:
            continue
        group_id = f"level_{lvl}"
        nodes.append({"id": group_id, "label": lvl.replace("_", " ").title(),
                       "type": "Level", "level": level_idx, "meta": f"{len(group)} skills"})
        edges.append({"from": nodes[0]["id"], "to": group_id})
        seen_ids.add(group_id)
        level_idx += 1

        for s in group:
            sid = f"skill_{s['id']}"
            if sid not in seen_ids:
                nodes.append({"id": sid, "label": s["name"], "type": "Skill",
                              "level": level_idx, "meta": lvl})
                seen_ids.add(sid)
            edges.append({"from": group_id, "to": sid})

    prereq_map: dict[str, list] = {}
    for p in prereqs:
        prereq_map.setdefault(p["skill_id"], []).append(p)
    for skill_id, plist in prereq_map.items():
        sid = f"skill_{skill_id}"
        for p in plist:
            pid = f"prereq_{p['prereq_id']}"
            if pid not in seen_ids:
                nodes.append({"id": pid, "label": p["prereq_name"],
                              "type": "Prerequisite", "level": level_idx + 1,
                              "meta": p.get("prereq_level", "")})
                seen_ids.add(pid)
            edges.append({"from": sid, "to": pid, "style": "dashed"})

    if concepts:
        concept_group_id = "group_concepts"
        nodes.append({"id": concept_group_id, "label": "Concepts",
                       "type": "ConceptGroup", "level": 1, "meta": f"{len(concepts)} concepts"})
        edges.append({"from": nodes[0]["id"], "to": concept_group_id})
        seen_ids.add(concept_group_id)

        for depth_key in ["overview", "applied", "deep_dive"]:
            depth_concepts = [c for c in concepts if c.get("depth") == depth_key]
            for c in depth_concepts:
                cid = f"concept_{c['id']}"
                if cid not in seen_ids:
                    nodes.append({"id": cid, "label": c["name"], "type": "Concept",
                                  "level": 2, "meta": depth_key.replace("_", " ")})
                    seen_ids.add(cid)
                edges.append({"from": concept_group_id, "to": cid})

    return {"root": root, "nodes": nodes, "edges": edges}


# ---- Export endpoints --------------------------------------------------------


@router.get("/export/stats")
def export_stats():
    """Return counts per label and per relationship type for the export UI."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        node_counts = {}
        for label in NODE_LABELS:
            rec = session.run(f"MATCH (n:`{label}`) RETURN count(n) AS c").single()
            node_counts[label] = rec["c"] if rec else 0
        rel_counts = {}
        for rtype in RELATIONSHIP_SCHEMA:
            rec = session.run(
                f"MATCH ()-[r:`{rtype}`]->() RETURN count(r) AS c"
            ).single()
            rel_counts[rtype] = rec["c"] if rec else 0
    return {"nodes": node_counts, "relationships": rel_counts}


@router.get("/export/nodes/{label}")
def export_nodes(
    label: str,
    fmt: str = Query("json", pattern="^(json|csv)$"),
):
    """Export all nodes of a label as JSON or CSV."""
    if label not in NODE_LABELS:
        raise HTTPException(400, f"Unknown label: {label}")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            f"MATCH (n:`{label}`) RETURN properties(n) AS props ORDER BY n.`{primary_key_of(label)}`"
        ).data()
    rows = [r["props"] for r in records]

    if fmt == "csv":
        return _to_csv_response(rows, f"nodes_{label}.csv")
    return rows


@router.get("/export/relationships/{rel_type}")
def export_relationships(
    rel_type: str,
    fmt: str = Query("json", pattern="^(json|csv)$"),
):
    """Export all relationships of a type as JSON or CSV."""
    if rel_type not in RELATIONSHIP_SCHEMA:
        raise HTTPException(400, f"Unknown relationship type: {rel_type}")
    schema = RELATIONSHIP_SCHEMA[rel_type]
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            f"MATCH (s)-[r:`{rel_type}`]->(e) "
            "RETURN labels(s)[0] AS start_label, properties(s) AS start_props, "
            "       labels(e)[0] AS end_label, properties(e) AS end_props, "
            "       properties(r) AS rel_props"
        ).data()

    rows = []
    for rec in records:
        sl = rec["start_label"]
        el = rec["end_label"]
        spk = primary_key_of(sl) if sl in NODE_LABELS else "id"
        epk = primary_key_of(el) if el in NODE_LABELS else "id"
        row = {
            "start_label": sl,
            "start_id": rec["start_props"].get(spk, ""),
            "end_label": el,
            "end_id": rec["end_props"].get(epk, ""),
            **rec["rel_props"],
        }
        rows.append(row)

    if fmt == "csv":
        return _to_csv_response(rows, f"rels_{rel_type}.csv")
    return rows


@router.get("/export/full")
def export_full_json():
    """Export entire graph (nodes + relationships) as a single JSON structure."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        nodes_out = {}
        for label in NODE_LABELS:
            pk = primary_key_of(label)
            records = session.run(
                f"MATCH (n:`{label}`) RETURN properties(n) AS props ORDER BY n.`{pk}`"
            ).data()
            nodes_out[label] = [r["props"] for r in records]

        rels_out = {}
        for rtype, schema in RELATIONSHIP_SCHEMA.items():
            records = session.run(
                f"MATCH (s)-[r:`{rtype}`]->(e) "
                "RETURN labels(s)[0] AS sl, properties(s) AS sp, "
                "       labels(e)[0] AS el, properties(e) AS ep, "
                "       properties(r) AS rp"
            ).data()
            rows = []
            for rec in records:
                sl = rec["sl"]
                el = rec["el"]
                spk = primary_key_of(sl) if sl in NODE_LABELS else "id"
                epk = primary_key_of(el) if el in NODE_LABELS else "id"
                rows.append({
                    "start_label": sl,
                    "start_id": rec["sp"].get(spk, ""),
                    "end_label": el,
                    "end_id": rec["ep"].get(epk, ""),
                    "properties": rec["rp"],
                })
            if rows:
                rels_out[rtype] = rows

    return {"nodes": nodes_out, "relationships": rels_out}


@router.get("/export/cypher")
def export_cypher():
    """Export graph as re-importable Cypher statements."""
    driver = get_driver()
    statements: list[str] = []
    with driver.session(database=NEO4J_DATABASE) as session:
        for label in NODE_LABELS:
            pk = primary_key_of(label)
            records = session.run(
                f"MATCH (n:`{label}`) RETURN properties(n) AS props ORDER BY n.`{pk}`"
            ).data()
            for rec in records:
                props = rec["props"]
                props_str = ", ".join(
                    f"{k}: {_cypher_val(v)}" for k, v in props.items()
                )
                statements.append(f"MERGE (n:`{label}` {{{props_str}}});")

        for rtype in RELATIONSHIP_SCHEMA:
            records = session.run(
                f"MATCH (s)-[r:`{rtype}`]->(e) "
                "RETURN labels(s)[0] AS sl, properties(s) AS sp, "
                "       labels(e)[0] AS el, properties(e) AS ep, "
                "       properties(r) AS rp"
            ).data()
            for rec in records:
                sl, el = rec["sl"], rec["el"]
                spk = primary_key_of(sl) if sl in NODE_LABELS else "id"
                epk = primary_key_of(el) if el in NODE_LABELS else "id"
                sid = _cypher_val(rec["sp"].get(spk, ""))
                eid = _cypher_val(rec["ep"].get(epk, ""))
                rp = rec["rp"]
                rp_str = ""
                if rp:
                    rp_str = " {" + ", ".join(
                        f"{k}: {_cypher_val(v)}" for k, v in rp.items()
                    ) + "}"
                statements.append(
                    f"MATCH (s:`{sl}` {{{spk}: {sid}}}), (e:`{el}` {{{epk}: {eid}}}) "
                    f"MERGE (s)-[:`{rtype}`{rp_str}]->(e);"
                )

    text = "\n".join(statements)
    return StreamingResponse(
        io.StringIO(text),
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=graph_export.cypher"},
    )


@router.get("/export/node/{label}/{node_id}")
def export_single_node(label: str, node_id: str):
    """Return all properties + connected relationships of a single node."""
    if label not in NODE_LABELS:
        raise HTTPException(400, f"Unknown label: {label}")
    pk = primary_key_of(label)
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        rec = session.run(
            f"MATCH (n:`{label}` {{{pk}: $nid}}) RETURN properties(n) AS props",
            nid=node_id,
        ).single()
        if not rec:
            raise HTTPException(404, "Node not found")
        props = rec["props"]

        rels_out = session.run(
            f"MATCH (n:`{label}` {{{pk}: $nid}})-[r]-(m) "
            "WHERE NOT m:AuditLog "
            "RETURN type(r) AS rtype, properties(r) AS rprops, "
            "       startNode(r) = n AS is_outgoing, "
            "       labels(m)[0] AS other_label, properties(m) AS other_props",
            nid=node_id,
        ).data()

        connections = []
        for rel in rels_out:
            ol = rel["other_label"]
            opk = primary_key_of(ol) if ol in NODE_LABELS else "id"
            connections.append({
                "rel_type": rel["rtype"],
                "direction": "outgoing" if rel["is_outgoing"] else "incoming",
                "rel_props": rel["rprops"],
                "other_label": ol,
                "other_id": rel["other_props"].get(opk, ""),
                "other_name": rel["other_props"].get("name", rel["other_props"].get(opk, "")),
            })

    return {"label": label, "properties": props, "connections": connections}


def _cypher_val(v) -> str:
    if isinstance(v, str):
        return "'" + v.replace("\\", "\\\\").replace("'", "\\'") + "'"
    if isinstance(v, bool):
        return "true" if v else "false"
    if v is None:
        return "null"
    return str(v)


def _to_csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        return StreamingResponse(
            io.StringIO(""),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    buf = io.StringIO()
    all_keys = list(dict.fromkeys(k for row in rows for k in row))
    writer = csv.DictWriter(buf, fieldnames=all_keys)
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
