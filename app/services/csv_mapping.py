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

# ---- Node presets --------------------------------------------------------
# Node CSV của Louis: header thẳng tên field; chỉ cần map filename → label
NODE_PRESETS: dict[str, dict] = {
    "nodes_skills.csv": {
        "label": "Skill",
        # 1-1 mapping: header CSV trùng tên field
        "header_map": {"id": "id", "name": "name", "description": "description", "level": "level"},
    },
    "nodes_concepts.csv": {
        "label": "Concept",
        "header_map": {"id": "id", "name": "name", "description": "description"},
    },
    "nodes_topics.csv": {
        "label": "Topic",
        "header_map": {"id": "id", "name": "name", "description": "description"},
    },
    "nodes_tasks.csv": {
        "label": "Task",
        "header_map": {"id": "id", "name": "name", "description": "description"},
    },
    "nodes_users.csv": {
        "label": "User",
        "header_map": {"id_user": "id_user"},
    },
    "nodes_courses.csv": {
        "label": "Course",
        "header_map": {"id_course": "id_course"},
    },
}

# ---- Relationship presets -----------------------------------------------
# Mỗi preset chốt cứng start_label & end_label (do tên file đã ngụ ý)
# header_map: { csv_column: 'start_id' | 'end_id' | <prop_name> }
REL_PRESETS: dict[str, dict] = {
    # PARENT_OF — same-label, có 2 file riêng cho topic/concept
    "rels_parent_of_topic.csv": {
        "rel_type": "PARENT_OF",
        "start_label": "Topic",
        "end_label": "Topic",
        "header_map": {"parent_id": "start_id", "child_id": "end_id"},
    },
    "rels_parent_of_concept.csv": {
        "rel_type": "PARENT_OF",
        "start_label": "Concept",
        "end_label": "Concept",
        "header_map": {"parent_id": "start_id", "child_id": "end_id"},
    },
    # INCLUDES — Topic → Skill | Concept
    "rels_includes_topic_skill.csv": {
        "rel_type": "INCLUDES",
        "start_label": "Topic",
        "end_label": "Skill",
        "header_map": {"topic_id": "start_id", "skill_id": "end_id"},
    },
    "rels_includes_topic_concept.csv": {
        "rel_type": "INCLUDES",
        "start_label": "Topic",
        "end_label": "Concept",
        "header_map": {"topic_id": "start_id", "concept_id": "end_id"},
    },
    # REQUIRES — Skill → Skill | Concept (có weight)
    "rels_requires_skill_skill.csv": {
        "rel_type": "REQUIRES",
        "start_label": "Skill",
        "end_label": "Skill",
        "header_map": {"source_skill_id": "start_id", "target_skill_id": "end_id", "weight": "weight"},
    },
    "rels_requires_skill_concept.csv": {
        "rel_type": "REQUIRES",
        "start_label": "Skill",
        "end_label": "Concept",
        "header_map": {"skill_id": "start_id", "concept_id": "end_id", "weight": "weight"},
    },
    # RELATED_TO — same-label, có 3 file (skill/concept/topic)
    "rels_related_to_skill.csv": {
        "rel_type": "RELATED_TO",
        "start_label": "Skill",
        "end_label": "Skill",
        "header_map": {
            "a_skill_id": "start_id", "b_skill_id": "end_id",
            "weight": "weight", "relational_type": "relational_type",
        },
    },
    "rels_related_to_concept.csv": {
        "rel_type": "RELATED_TO",
        "start_label": "Concept",
        "end_label": "Concept",
        "header_map": {
            "a_concept_id": "start_id", "b_concept_id": "end_id",
            "weight": "weight", "relational_type": "relational_type",
        },
    },
    "rels_related_to_topic.csv": {
        "rel_type": "RELATED_TO",
        "start_label": "Topic",
        "end_label": "Topic",
        "header_map": {
            "a_topic_id": "start_id", "b_topic_id": "end_id",
            "weight": "weight", "relational_type": "relational_type",
        },
    },
    # PRACTICES — Task → Skill
    "rels_practices.csv": {
        "rel_type": "PRACTICES",
        "start_label": "Task",
        "end_label": "Skill",
        "header_map": {"task_id": "start_id", "skill_id": "end_id"},
    },
    # APPLIES — Task → Concept
    "rels_applies.csv": {
        "rel_type": "APPLIES",
        "start_label": "Task",
        "end_label": "Concept",
        "header_map": {"task_id": "start_id", "concept_id": "end_id"},
    },
    # COVERS — Course → Concept
    "rels_covers.csv": {
        "rel_type": "COVERS",
        "start_label": "Course",
        "end_label": "Concept",
        "header_map": {"course_id": "start_id", "concept_id": "end_id", "depth": "depth"},
    },
    # HAS_SKILL — User → Skill
    "rels_has_skill.csv": {
        "rel_type": "HAS_SKILL",
        "start_label": "User",
        "end_label": "Skill",
        "header_map": {
            "user_id": "start_id", "skill_id": "end_id",
            "proficiency": "proficiency", "confidence": "confidence", "credentials": "credentials",
        },
    },
    # TEACHES — Course → Skill
    "rels_teaches.csv": {
        "rel_type": "TEACHES",
        "start_label": "Course",
        "end_label": "Skill",
        "header_map": {"course_id": "start_id", "skill_id": "end_id", "relevance": "relevance"},
    },
}


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
        v = raw_row.get(csv_col)
        if v is not None and str(v).strip() != "":
            out[internal_field] = v
    return out


def transform_rel_row(preset: dict, raw_row: dict) -> dict:
    """Apply header_map for relationship row, đính kèm start_label/end_label cố định."""
    header_map = preset["header_map"]
    out: dict[str, Any] = {
        "start_label": preset["start_label"],
        "end_label": preset["end_label"],
    }
    for csv_col, internal_field in header_map.items():
        v = raw_row.get(csv_col)
        if v is not None and str(v).strip() != "":
            out[internal_field] = v
    return out


def list_all_presets() -> list[dict]:
    """Liệt kê toàn bộ preset cho FE hiển thị."""
    out = []
    for fname, p in NODE_PRESETS.items():
        out.append({
            "filename": fname, "kind": "node", "target": p["label"],
            "expected_header": list(p["header_map"].keys()),
        })
    for fname, p in REL_PRESETS.items():
        out.append({
            "filename": fname, "kind": "rel", "target": p["rel_type"],
            "start_label": p["start_label"], "end_label": p["end_label"],
            "expected_header": list(p["header_map"].keys()),
        })
    return out
