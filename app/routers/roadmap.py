"""
Roadmap — cây lộ trình từ 1 JobRole hoặc 1 KnowledgeArea.

- by-role: JobRole -REQUIRES-> Skill (nhóm theo level) -REQUIRES-> tiên quyết (Skill/Knowledge)
- by-area: KnowledgeArea -PARENT_OF-> lĩnh vực con, và -HAS-> Knowledge

Cả 2 nguồn quy về cùng cấu trúc phẳng { root, nodes, edges } để FE chỉ viết 1 hàm vẽ.
"""
from fastapi import APIRouter, HTTPException

from app.config import get_driver, NEO4J_DATABASE

router = APIRouter(prefix="/api", tags=["roadmap"])

SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"]


@router.get("/roadmap/sources")
def roadmap_sources():
    """List available starting points for roadmap: job roles and knowledge areas."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        roles = session.run(
            "MATCH (r:JobRole) RETURN r.id AS id, r.name AS name ORDER BY name"
        ).data()
        areas = session.run(
            "MATCH (a:KnowledgeArea) RETURN a.id AS id, a.name AS name ORDER BY name"
        ).data()
    return {"roles": roles, "areas": areas}


@router.get("/roadmap/by-role/{role_id}")
def roadmap_by_role(role_id: str):
    """Build a top-down roadmap for a job role.

    Structure:  JobRole → Skills (via REQUIRES, nhóm theo level)
                        → Prerequisites (Skill/Knowledge, via REQUIRES)
    """
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        role_rec = session.run(
            "MATCH (r:JobRole {id: $rid}) RETURN r.id AS id, r.name AS name",
            rid=role_id,
        ).single()
        if not role_rec:
            raise HTTPException(404, "JobRole not found")

        skills = session.run(
            "MATCH (r:JobRole {id: $rid})-[:REQUIRES]->(s:Skill) "
            "RETURN s.id AS id, s.name AS name, s.level AS level "
            "ORDER BY s.level, s.name",
            rid=role_id,
        ).data()

        # tiên quyết của các skill: Skill -REQUIRES-> Skill/Knowledge
        prereqs = session.run(
            "MATCH (r:JobRole {id: $rid})-[:REQUIRES]->(s:Skill)-[:REQUIRES]->(p) "
            "WHERE p:Skill OR p:Knowledge "
            "RETURN s.id AS skill_id, p.id AS prereq_id, p.name AS prereq_name, "
            "       head(labels(p)) AS prereq_type, p.level AS prereq_level",
            rid=role_id,
        ).data()

    return _build_role_tree(
        root={"id": role_rec["id"], "name": role_rec["name"], "type": "JobRole"},
        skills=skills,
        prereqs=prereqs,
    )


@router.get("/roadmap/by-area/{area_id}")
def roadmap_by_area(area_id: str):
    """Build a roadmap for a knowledge area.

    Structure: KnowledgeArea → sub-areas (via PARENT_OF) → Knowledge (via HAS)
               KnowledgeArea → Knowledge (via HAS, nếu là lĩnh vực lá)
    """
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

        # Knowledge của chính area + của các lĩnh vực con (1 cấp)
        knowledge = session.run(
            "MATCH (a:KnowledgeArea {id: $aid}) "
            "MATCH (owner:KnowledgeArea)-[:HAS]->(k:Knowledge) "
            "WHERE owner = a OR (a)-[:PARENT_OF]->(owner) "
            "RETURN owner.id AS area_id, k.id AS id, k.name AS name, k.kind AS kind "
            "ORDER BY k.name",
            aid=area_id,
        ).data()

    return _build_area_tree(
        root={"id": area_rec["id"], "name": area_rec["name"], "type": "KnowledgeArea"},
        subareas=subareas,
        knowledge=knowledge,
    )


def _build_role_tree(root, skills, prereqs):
    """Flat node+edge list: role → level groups → skills → prerequisites."""
    root_id = f"root_{root['id']}"
    nodes = [{"id": root_id, "label": root["name"], "type": root["type"], "level": 0, "meta": ""}]
    edges = []
    seen = {root_id}

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
        nodes.append({"id": group_id, "label": lvl.title(), "type": "Level",
                      "level": level_idx, "meta": f"{len(group)} skills"})
        edges.append({"from": root_id, "to": group_id})
        seen.add(group_id)
        level_idx += 1
        for s in group:
            sid = f"skill_{s['id']}"
            if sid not in seen:
                nodes.append({"id": sid, "label": s["name"], "type": "Skill",
                              "level": level_idx, "meta": lvl})
                seen.add(sid)
            edges.append({"from": group_id, "to": sid})

    prereq_map: dict[str, list] = {}
    for p in prereqs:
        prereq_map.setdefault(p["skill_id"], []).append(p)
    for skill_id, plist in prereq_map.items():
        sid = f"skill_{skill_id}"
        for p in plist:
            pid = f"prereq_{p['prereq_id']}"
            if pid not in seen:
                nodes.append({"id": pid, "label": p["prereq_name"],
                              "type": p.get("prereq_type") or "Prerequisite",
                              "level": level_idx + 1, "meta": p.get("prereq_level") or "tiên quyết"})
                seen.add(pid)
            edges.append({"from": sid, "to": pid, "style": "dashed"})

    return {"root": root, "nodes": nodes, "edges": edges}


def _build_area_tree(root, subareas, knowledge):
    """Flat node+edge list: area → sub-areas → knowledge (grouped by owning area)."""
    root_id = f"root_{root['id']}"
    nodes = [{"id": root_id, "label": root["name"], "type": root["type"], "level": 0, "meta": ""}]
    edges = []
    seen = {root_id}

    # sub-areas là con trực tiếp
    for a in subareas:
        aid = f"area_{a['id']}"
        if aid not in seen:
            nodes.append({"id": aid, "label": a["name"], "type": "KnowledgeArea",
                          "level": 1, "meta": "lĩnh vực con"})
            seen.add(aid)
        edges.append({"from": root_id, "to": aid})

    # knowledge nối vào area sở hữu (root hoặc sub-area)
    for k in knowledge:
        kid = f"knowledge_{k['id']}"
        owner = k["area_id"]
        parent_id = root_id if owner == root["id"] else f"area_{owner}"
        if parent_id not in seen:
            # owner là sub-area chưa xuất hiện (an toàn): neo tạm vào root
            parent_id = root_id
        if kid not in seen:
            nodes.append({"id": kid, "label": k["name"], "type": "Knowledge",
                          "level": 2, "meta": k.get("kind") or ""})
            seen.add(kid)
        edges.append({"from": parent_id, "to": kid})

    return {"root": root, "nodes": nodes, "edges": edges}
