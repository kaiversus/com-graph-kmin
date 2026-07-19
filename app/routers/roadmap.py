"""
Roadmap — dung cay lo trinh hoc tu 1 Course hoac 1 Topic.

Ca 2 nguon deu quy ve cung mot cau truc phang { nodes, edges } qua
_build_roadmap_tree(), de FE chi phai viet 1 ham ve.
"""
from fastapi import APIRouter, HTTPException

from app.config import get_driver, NEO4J_DATABASE

router = APIRouter(prefix="/api", tags=["roadmap"])

SKILL_LEVELS = ["foundational", "beginner", "intermediate", "advance", "expert"]
CONCEPT_DEPTHS = ["overview", "applied", "deep_dive"]


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
    """Build a flat node+edge list structured for hierarchical rendering.

    TODO: `concept_children` chua duoc dung — roadmap_by_course van chay query
    PARENT_OF de lay no roi vut di. Hoac ve sub-concept vao cay, hoac bo han
    query do di cho do 1 round-trip.
    """
    nodes = [{"id": f"root_{root['id']}", "label": root["name"],
              "type": root["type"], "level": 0, "meta": ""}]
    edges = []
    seen_ids = {nodes[0]["id"]}

    skill_groups: dict[str, list] = {}
    for s in skills:
        lvl = s.get("level") or "beginner"
        skill_groups.setdefault(lvl, []).append(s)

    level_idx = 1
    for lvl in SKILL_LEVELS:
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

        for depth_key in CONCEPT_DEPTHS:
            depth_concepts = [c for c in concepts if c.get("depth") == depth_key]
            for c in depth_concepts:
                cid = f"concept_{c['id']}"
                if cid not in seen_ids:
                    nodes.append({"id": cid, "label": c["name"], "type": "Concept",
                                  "level": 2, "meta": depth_key.replace("_", " ")})
                    seen_ids.add(cid)
                edges.append({"from": concept_group_id, "to": cid})

    return {"root": root, "nodes": nodes, "edges": edges}
