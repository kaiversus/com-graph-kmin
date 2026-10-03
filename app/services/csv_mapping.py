"""
CSV Preset Mapping.

Mỗi preset khai báo:
  - kind: 'node' hoặc 'rel'
  - target: label (Skill, Concept, ...) hoặc rel_type (REQUIRES, ...)
  - filename_pattern: tên file mặc định (để lookup khi user upload)
  - header_map: mapping cột CSV của user → field nội bộ
                Với rel: cần cố định start_label, end_label vì user không ghi trong file

Hệ thống đọc preset → transform CSV của user → format chuẩn nội bộ → đẩy
qua validator + importer như cũ.
"""
from typing import Any

from app.config import NODE_PROP_SCHEMA, RELATIONSHIP_SCHEMA, primary_key_of

# start_id / end_id là 2 đầu quan hệ → luôn bắt buộc
_ROUTING_REQUIRED = {"start_id", "end_id"}

# ---- Node presets --------------------------------------------------------
# Node CSV: header thẳng tên field; chỉ cần map filename → label.
# Field mảng (aliases/keywords) trong CSV là chuỗi cách nhau bởi dấu phẩy (nhớ
# quote cả ô). Field json (practice_resource/learning_resource) là chuỗi JSON.
NODE_PRESETS: dict[str, dict] = {
    "nodes_skills.csv": {
        "label": "Skill",
        "header_map": {
            "id": "id", "name": "name", "description": "description", "level": "level",
            "aliases": "aliases", "practice_resource": "practice_resource",
            "source": "source", "status": "status",
        },
    },
    "nodes_knowledge.csv": {
        "label": "Knowledge",
        "header_map": {
            "id": "id", "name": "name", "description": "description", "kind": "kind",
            "aliases": "aliases", "keywords": "keywords", "difficulty": "difficulty",
            "deprecated": "deprecated", "learning_resource": "learning_resource",
            "source": "source", "status": "status",
        },
    },
    "nodes_knowledge_areas.csv": {
        "label": "KnowledgeArea",
        "header_map": {
            "id": "id", "name": "name", "description": "description",
            "aliases": "aliases", "source": "source", "status": "status",
        },
    },
    "nodes_job_roles.csv": {
        "label": "JobRole",
        "header_map": {
            "id": "id", "name": "name", "description": "description", "level": "level",
            "aliases": "aliases", "source": "source", "status": "status",
        },
    },
    "nodes_accounts.csv": {
        "label": "Account",
        "header_map": {"id_account": "id_account", "source": "source", "status": "status"},
    },
    "nodes_contents.csv": {
        "label": "Content",
        "header_map": {"id_content": "id_content", "source": "source", "status": "status"},
    },
    "nodes_tasks.csv": {
        "label": "Task",
        "header_map": {"id_task": "id_task", "id": "id_task", "name": "_ignore", "description": "_ignore", "source": "source", "status": "status"},
    },
    "nodes_quizzes.csv": {
        "label": "Quiz",
        "header_map": {"id_quiz": "id_quiz", "id": "id_quiz", "name": "_ignore", "description": "_ignore", "source": "source", "status": "status"},
    },
    "nodes_mentors.csv": {
        "label": "Mentor",
        "header_map": {"id_mentor": "id_mentor", "id": "id_mentor", "name": "_ignore", "description": "_ignore", "source": "source", "status": "status"},
    },
    # --- ALIAS PRESETS FOR USER ---
    "nodes_concepts.csv": {
        "label": "Knowledge",
        "header_map": {
            "id": "id", "name": "name", "description": "description", "kind": "kind",
            "aliases": "aliases", "keywords": "keywords", "difficulty": "difficulty",
            "deprecated": "deprecated", "learning_resource": "learning_resource",
            "source": "source", "status": "status",
        },
    },
    "nodes_topics.csv": {
        "label": "KnowledgeArea",
        "header_map": {
            "id": "id", "name": "name", "description": "description",
            "aliases": "aliases", "source": "source", "status": "status",
        },
    },
    "nodes_courses.csv": {
        "label": "Content",
        "header_map": {"id_content": "id_content", "id": "id_content", "id_course": "id_content", "name": "_ignore", "description": "_ignore", "source": "source", "status": "status"},
    },
    "nodes_users.csv": {
        "label": "Account",
        "header_map": {"id_account": "id_account", "id": "id_account", "id_user": "id_account", "name": "_ignore", "email": "_ignore", "source": "source", "status": "status"},
    },
}

# ---- Relationship presets -----------------------------------------------
# Mỗi preset chốt cứng start_label & end_label (do tên file đã ngụ ý)
# header_map: { csv_column: 'start_id' | 'end_id' | <prop_name> }
REL_PRESETS: dict[str, dict] = {
    # REQUIRES — JobRole → Skill, Skill → Skill | Knowledge (có weight)
    "rels_requires_role_skill.csv": {
        "rel_type": "REQUIRES",
        "start_label": "JobRole",
        "end_label": "Skill",
        "header_map": {"role_id": "start_id", "skill_id": "end_id", "weight": "weight"},
    },
    "rels_requires_skill_skill.csv": {
        "rel_type": "REQUIRES",
        "start_label": "Skill",
        "end_label": "Skill",
        "header_map": {"source_skill_id": "start_id", "start_id": "start_id", "target_skill_id": "end_id", "end_id": "end_id", "weight": "weight"},
    },
    "rels_requires_skill_knowledge.csv": {
        "rel_type": "REQUIRES",
        "start_label": "Skill",
        "end_label": "Knowledge",
        "header_map": {"skill_id": "start_id", "start_id": "start_id", "knowledge_id": "end_id", "end_id": "end_id", "weight": "weight"},
    },
    "rels_requires_skill_concept.csv": {
        "rel_type": "REQUIRES",
        "start_label": "Skill",
        "end_label": "Knowledge",
        "header_map": {"skill_id": "start_id", "start_id": "start_id", "concept_id": "end_id", "end_id": "end_id", "weight": "weight"},
    },
    # RELATED_TO — same-label (skill/knowledge)
    "rels_related_to_skill.csv": {
        "rel_type": "RELATED_TO",
        "start_label": "Skill",
        "end_label": "Skill",
        "header_map": {
            "a_skill_id": "start_id", "start_id": "start_id", "b_skill_id": "end_id", "end_id": "end_id", "relation_type": "relation_type", "relational_type": "relation_type", "weight": "_ignore",
        },
    },
    "rels_related_to_knowledge.csv": {
        "rel_type": "RELATED_TO",
        "start_label": "Knowledge",
        "end_label": "Knowledge",
        "header_map": {
            "a_knowledge_id": "start_id", "b_knowledge_id": "end_id", "relation_type": "relation_type",
        },
    },
    "rels_related_to_concept.csv": {
        "rel_type": "RELATED_TO",
        "start_label": "Knowledge",
        "end_label": "Knowledge",
        "header_map": {
            "a_concept_id": "start_id", "start_id": "start_id", "b_concept_id": "end_id", "end_id": "end_id", "relation_type": "relation_type", "relational_type": "relation_type", "weight": "_ignore",
        },
    },
    "rels_related_to_topic.csv": {
        "rel_type": "RELATED_TO",
        "start_label": "KnowledgeArea",
        "end_label": "KnowledgeArea",
        "header_map": {
            "a_topic_id": "start_id", "start_id": "start_id", "b_topic_id": "end_id", "end_id": "end_id", "relation_type": "relation_type", "relational_type": "relation_type", "weight": "_ignore",
        },
    },
    # HAS — KnowledgeArea → Knowledge
    "rels_has.csv": {
        "rel_type": "HAS",
        "start_label": "KnowledgeArea",
        "end_label": "Knowledge",
        "header_map": {"area_id": "start_id", "knowledge_id": "end_id", "weight": "weight"},
    },
    "rels_includes_topic_concept.csv": {
        "rel_type": "HAS",
        "start_label": "KnowledgeArea",
        "end_label": "Knowledge",
        "header_map": {"topic_id": "start_id", "start_id": "start_id", "concept_id": "end_id", "end_id": "end_id", "weight": "weight"},
    },
    "rels_includes_topic_skill.csv": {
        "rel_type": "HAS",
        "start_label": "KnowledgeArea",
        "end_label": "Skill",
        "header_map": {"topic_id": "start_id", "start_id": "start_id", "skill_id": "end_id", "end_id": "end_id", "weight": "weight"},
    },
    # PARENT_OF — KnowledgeArea → KnowledgeArea
    "rels_parent_of_area.csv": {
        "rel_type": "PARENT_OF",
        "start_label": "KnowledgeArea",
        "end_label": "KnowledgeArea",
        "header_map": {"parent_id": "start_id", "child_id": "end_id", "order": "order"},
    },
    "rels_parent_of_topic.csv": {
        "rel_type": "PARENT_OF",
        "start_label": "KnowledgeArea",
        "end_label": "KnowledgeArea",
        "header_map": {"parent_id": "start_id", "start_id": "start_id", "child_id": "end_id", "end_id": "end_id", "order": "order"},
    },
    "rels_parent_of_concept.csv": {
        "rel_type": "IS_A",
        "start_label": "Knowledge",
        "end_label": "Knowledge",
        "header_map": {"parent_id": "end_id", "start_id": "end_id", "child_id": "start_id", "end_id": "start_id"},
    },
    # IS_A — Knowledge → Knowledge (con IS_A cha)
    "rels_is_a.csv": {
        "rel_type": "IS_A",
        "start_label": "Knowledge",
        "end_label": "Knowledge",
        "header_map": {"child_id": "start_id", "parent_id": "end_id"},
    },
    # PREREQUISITE — Knowledge → Knowledge
    "rels_prerequisite.csv": {
        "rel_type": "PREREQUISITE",
        "start_label": "Knowledge",
        "end_label": "Knowledge",
        "header_map": {"source_id": "start_id", "target_id": "end_id"},
    },
    # PRACTICES — Task → Skill
    "rels_practices.csv": {
        "rel_type": "PRACTICES",
        "start_label": "Task",
        "end_label": "Skill",
        "header_map": {"task_id": "start_id", "start_id": "start_id", "skill_id": "end_id", "end_id": "end_id", "weight": "weight", "is_core": "is_core"},
    },
    # APPLIES — Task → Knowledge
    "rels_applies.csv": {
        "rel_type": "APPLIES",
        "start_label": "Task",
        "end_label": "Knowledge",
        "header_map": {"task_id": "start_id", "start_id": "start_id", "knowledge_id": "end_id", "concept_id": "end_id", "end_id": "end_id"},
    },
    # COVERS — Content → Knowledge
    "rels_covers.csv": {
        "rel_type": "COVERS",
        "start_label": "Content",
        "end_label": "Knowledge",
        "header_map": {"content_id": "start_id", "start_id": "start_id", "course_id": "start_id", "knowledge_id": "end_id", "concept_id": "end_id", "end_id": "end_id", "depth": "depth"},
    },
    "rels_teaches.csv": {
        "rel_type": "COVERS",
        "start_label": "Content",
        "end_label": "Skill",
        "header_map": {"start_id": "start_id", "course_id": "start_id", "end_id": "end_id", "skill_id": "end_id", "depth": "depth", "relevance": "_ignore"},
    },
    # HAS_SKILL — Account → Skill
    "rels_has_skill.csv": {
        "rel_type": "HAS_SKILL",
        "start_label": "Account",
        "end_label": "Skill",
        "header_map": {
            "account_id": "start_id", "start_id": "start_id", "user_id": "start_id", "skill_id": "end_id", "end_id": "end_id",
            "proficiency": "proficiency", "confidence": "confidence",
            "credentials": "credentials", "source": "source",
        },
    },
    # ASSESSES — Quiz → Skill | Knowledge
    "rels_assesses_skill.csv": {
        "rel_type": "ASSESSES",
        "start_label": "Quiz",
        "end_label": "Skill",
        "header_map": {
            "quiz_id": "start_id", "skill_id": "end_id",
            "level": "level", "quiz_tag": "quiz_tag", "weight": "weight",
        },
    },
    "rels_assesses_knowledge.csv": {
        "rel_type": "ASSESSES",
        "start_label": "Quiz",
        "end_label": "Knowledge",
        "header_map": {
            "quiz_id": "start_id", "knowledge_id": "end_id",
            "level": "level", "quiz_tag": "quiz_tag", "weight": "weight",
        },
    },
    # COACHES — Mentor → Skill | Knowledge
    "rels_coaches_skill.csv": {
        "rel_type": "COACHES",
        "start_label": "Mentor",
        "end_label": "Skill",
        "header_map": {"mentor_id": "start_id", "skill_id": "end_id"},
    },
    "rels_coaches_knowledge.csv": {
        "rel_type": "COACHES",
        "start_label": "Mentor",
        "end_label": "Knowledge",
        "header_map": {"mentor_id": "start_id", "knowledge_id": "end_id"},
    },
}

# --- GENERIC PRESETS FOR EXPORTED FILES ---
for _lbl, _schema in NODE_PROP_SCHEMA.items():
    _fname = f"nodes_{_lbl.lower()}.csv"
    if _fname not in NODE_PRESETS:
        _hmap = {k: k for k in _schema.keys()}
        _hmap[primary_key_of(_lbl)] = primary_key_of(_lbl)
        NODE_PRESETS[_fname] = {"label": _lbl, "header_map": _hmap}

for _rtype, _rschema in RELATIONSHIP_SCHEMA.items():
    _fname = f"rels_{_rtype.lower()}.csv"
    if _fname not in REL_PRESETS:
        _hmap = {"start_id": "start_id", "end_id": "end_id", "start_label": "_ignore", "end_label": "_ignore"}
        for k in _rschema.get("props", {}).keys():
            _hmap[k] = k
        REL_PRESETS[_fname] = {
            "rel_type": _rtype,
            "start_label": None,
            "end_label": None,
            "header_map": _hmap,
        }

# Inject generic columns to all relationship presets to handle re-importing exports
for p in REL_PRESETS.values():
    if "start_id" not in p["header_map"]:
        p["header_map"]["start_id"] = "start_id"
    if "end_id" not in p["header_map"]:
        p["header_map"]["end_id"] = "end_id"
    if "start_label" not in p["header_map"]:
        p["header_map"]["start_label"] = "_ignore"
    if "end_label" not in p["header_map"]:
        p["header_map"]["end_label"] = "_ignore"


def detect_preset(filename: str) -> tuple[str, dict] | None:
    """
    Trả về (kind, preset) từ tên file. kind = 'node' hoặc 'rel'.
    Bỏ qua đường dẫn, chỉ so với basename, lower-case.
    """
    import os
    base = os.path.basename(filename).lower().strip()
    if base in NODE_PRESETS:
        return "node", NODE_PRESETS[base]
    if base in REL_PRESETS:
        return "rel", REL_PRESETS[base]
    return None


def transform_node_row(preset: dict, raw_row: dict) -> dict:
    """Apply header_map: csv_col → internal_field. Bỏ field trống."""
    header_map = preset["header_map"]
    out: dict[str, Any] = {}
    for csv_col, internal_field in header_map.items():
        if internal_field == "_ignore":
            continue
        v = raw_row.get(csv_col)
        if v is not None and str(v).strip() != "":
            out[internal_field] = v
            
    if preset.get("label") == "Skill":
        lvl = str(out.get("level", "")).strip().lower()
        if lvl == "foundational":
            out["level"] = "beginner"
        elif lvl == "advance":
            out["level"] = "advanced"
            
    if preset.get("label") == "Knowledge" and "kind" not in out:
        out["kind"] = "concept"
        
    return out


def transform_rel_row(preset: dict, raw_row: dict) -> dict:
    """Apply header_map for relationship row, đính kèm start_label/end_label cố định hoặc động."""
    header_map = preset["header_map"]
    out: dict[str, Any] = {
        "start_label": raw_row.get("start_label", preset.get("start_label")),
        "end_label": raw_row.get("end_label", preset.get("end_label")),
    }
    for csv_col, internal_field in header_map.items():
        if internal_field == "_ignore":
            continue
        v = raw_row.get(csv_col)
        if v is not None and str(v).strip() != "":
            out[internal_field] = v
            
    # Patch values to match Kmin schema
    if "depth" in out:
        d = str(out["depth"]).strip().lower()
        if d == "applied": out["depth"] = "practice"
        elif d == "deep_dive": out["depth"] = "mastery"
    elif preset.get("rel_type") == "COVERS":
        out["depth"] = "overview"
        
    if "relation_type" in out:
        r = str(out["relation_type"]).strip().lower()
        if r == "complementary": out["relation_type"] = "complements"
        
    if "proficiency" in out:
        p = str(out["proficiency"]).strip().lower()
        
        level_map = {
            "foundational": 0.1, 
            "beginner": 0.3, 
            "intermediate": 0.5, 
            "advanced": 0.7, 
            "advance": 0.7, 
            "expert": 0.9,
            "low": 0.3,
            "medium": 0.6,
            "high": 0.9
        }
        
        if p in level_map:
            out["proficiency"] = level_map[p]
        elif p.endswith("%"):
            try:
                out["proficiency"] = float(p.rstrip("%")) / 100.0
            except ValueError:
                pass
        else:
            try:
                pf = float(p)
                if pf > 1.0: out["proficiency"] = pf / 100.0
                else: out["proficiency"] = pf
            except ValueError:
                pass
                
    return out


def _field_required(kind: str, target: str, internal_field: str) -> bool:
    """Cột CSV này có bắt buộc không? Suy trực tiếp từ schema."""
    if internal_field == "_ignore": return False
    if kind == "node":
        return bool(NODE_PROP_SCHEMA.get(target, {}).get(internal_field, {}).get("required"))
    # rel: start_id/end_id luôn bắt buộc; còn lại tra prop spec
    if internal_field in _ROUTING_REQUIRED:
        return True
    return bool(RELATIONSHIP_SCHEMA.get(target, {}).get("props", {}).get(internal_field, {}).get("required"))


def _marked_header(preset: dict, kind: str, target: str) -> list[str]:
    """expected_header có gắn '*' ở cột bắt buộc (vd id*, proficiency*)."""
    out = []
    for csv_col, internal_field in preset["header_map"].items():
        if internal_field == "_ignore": continue
        out.append(csv_col + ("*" if _field_required(kind, target, internal_field) else ""))
    return out


_TYPE_LABEL = {
    "string": "string", "float": "float", "int": "int", "boolean": "boolean",
    "datetime": "datetime", "json": "json", "string_list": "string[]",
    "enum_list": "enum[] (chọn nhiều)",
}


def _field_detail(preset: dict, kind: str, target: str, csv_col: str, internal_field: str) -> dict:
    """Mô tả 1 cột: required, type, enum values, default, range."""
    if internal_field == "_ignore":
        return {"column": csv_col, "required": False, "type": "ignored"}
    d: dict[str, Any] = {"column": csv_col, "required": _field_required(kind, target, internal_field)}
    # 2 đầu quan hệ → là id tham chiếu tới start/end node
    if kind == "rel" and internal_field in _ROUTING_REQUIRED:
        ref = preset["start_label"] if internal_field == "start_id" else preset["end_label"]
        d["type"] = f"ref → {ref}.id"
        return d
    if kind == "node":
        spec = NODE_PROP_SCHEMA.get(target, {}).get(internal_field, {})
    else:
        spec = RELATIONSHIP_SCHEMA.get(target, {}).get("props", {}).get(internal_field, {})
    d["type"] = _TYPE_LABEL.get(spec.get("type"), spec.get("type") or "string")
    if "enum" in spec:
        d["enum"] = list(spec["enum"])
    if "default" in spec:
        d["default"] = spec["default"]
    if "min" in spec or "max" in spec:
        d["range"] = [spec.get("min"), spec.get("max")]
    if spec.get("primary_key"):
        d["primary_key"] = True
    return d


def _fields(preset: dict, kind: str, target: str) -> list[dict]:
    return [
        _field_detail(preset, kind, target, csv_col, internal_field)
        for csv_col, internal_field in preset["header_map"].items()
    ]


def list_all_presets() -> list[dict]:
    """
    Liệt kê toàn bộ preset cho FE hiển thị.
    - expected_header: tên cột, cột bắt buộc có '*' (vd id*, depth*).
    - fields: chi tiết từng cột — required, type, enum values, default, range.
    """
    out = []
    for fname, p in NODE_PRESETS.items():
        out.append({
            "filename": fname, "kind": "node", "target": p["label"],
            "expected_header": _marked_header(p, "node", p["label"]),
            "fields": _fields(p, "node", p["label"]),
        })
    for fname, p in REL_PRESETS.items():
        out.append({
            "filename": fname, "kind": "rel", "target": p["rel_type"],
            "start_label": p["start_label"], "end_label": p["end_label"],
            "expected_header": _marked_header(p, "rel", p["rel_type"]),
            "fields": _fields(p, "rel", p["rel_type"]),
        })
    return out
