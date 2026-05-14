"""
CSV parsing for bulk import (Option 2).

Two file types:
  1. Node CSV — header row matches NODE_PROP_SCHEMA[label] keys.
     Filename convention: nodes_<label>.csv  (e.g. nodes_Skill.csv)
  2. Relationship CSV — header includes start_label, start_id, end_label, end_id, plus rel-specific props.
     Filename convention: rels_<REL_TYPE>.csv  (e.g. rels_TEACHES.csv)
"""
import csv
import io
from app.config import NODE_PROP_SCHEMA, RELATIONSHIP_SCHEMA


def parse_node_csv(label: str, content: bytes) -> tuple[list[dict], list[str]]:
    """Parse a node CSV. Returns (rows_as_dicts, header)."""
    if label not in NODE_PROP_SCHEMA:
        raise ValueError(f"Unknown label '{label}'")
    text = content.decode("utf-8-sig")  # tolerate BOM
    reader = csv.DictReader(io.StringIO(text))
    rows = [dict(r) for r in reader]
    header = reader.fieldnames or []
    return rows, header


def parse_relationship_csv(rel_type: str, content: bytes) -> tuple[list[dict], list[str]]:
    if rel_type not in RELATIONSHIP_SCHEMA:
        raise ValueError(f"Unknown relationship type '{rel_type}'")
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    rows = [dict(r) for r in reader]
    header = reader.fieldnames or []
    return rows, header


def node_template_csv(label: str) -> str:
    schema = NODE_PROP_SCHEMA[label]
    headers = list(schema.keys())
    return ",".join(headers) + "\n"


def relationship_template_csv(rel_type: str) -> str:
    spec = RELATIONSHIP_SCHEMA[rel_type]
    headers = ["start_label", "start_id", "end_label", "end_id"] + list(spec.get("props", {}).keys())
    return ",".join(headers) + "\n"
