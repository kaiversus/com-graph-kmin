"""
Data Validation Layer.

Trả về (valid_records, errors). errors là list dict { row_index, field, message }.
"""
import re
from typing import Any
from app.config import NODE_PROP_SCHEMA, RELATIONSHIP_SCHEMA, primary_key_of

# id format: slug — allow alphanumeric, dash, underscore, dot
_ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


def _validate_value(value: Any, spec: dict, field: str) -> tuple[Any, str | None]:
    """Validate single value against a property spec; return (coerced, error_or_None)."""
    if value is None or (isinstance(value, str) and value.strip() == ""):
        if spec.get("required"):
            return None, f"'{field}' is required"
        return None, None

    typ = spec["type"]
    if typ == "string":
        v = str(value).strip()
        if "max_len" in spec and len(v) > spec["max_len"]:
            return None, f"'{field}' exceeds max length {spec['max_len']}"
        if "enum" in spec and v not in spec["enum"]:
            return None, f"'{field}' must be one of {spec['enum']}, got '{v}'"
        return v, None

    if typ == "float":
        try:
            v = float(value)
        except (TypeError, ValueError):
            return None, f"'{field}' must be a number"
        if "min" in spec and v < spec["min"]:
            return None, f"'{field}' must be >= {spec['min']}"
        if "max" in spec and v > spec["max"]:
            return None, f"'{field}' must be <= {spec['max']}"
        return v, None

    if typ == "int":
        try:
            v = int(value)
        except (TypeError, ValueError):
            return None, f"'{field}' must be an integer"
        return v, None

    return value, None


def validate_node_record(label: str, record: dict, row_index: int = 0) -> tuple[dict | None, list[dict]]:
    """Validate a single node record. Returns (clean_record_or_None, errors)."""
    errors: list[dict] = []
    if label not in NODE_PROP_SCHEMA:
        return None, [{"row": row_index, "field": "_label", "message": f"Unknown label '{label}'"}]

    schema = NODE_PROP_SCHEMA[label]
    clean: dict = {}

    # Check primary key id format
    pk = primary_key_of(label)
    pk_value = record.get(pk)
    if not pk_value or not _ID_RE.match(str(pk_value)):
        errors.append({
            "row": row_index,
            "field": pk,
            "message": f"'{pk}' must match pattern [A-Za-z0-9._-]{{1,64}}",
        })

    # Validate each known property; reject unknown properties (strict)
    for field, spec in schema.items():
        coerced, err = _validate_value(record.get(field), spec, field)
        if err:
            errors.append({"row": row_index, "field": field, "message": err})
        elif coerced is not None:
            clean[field] = coerced

    # Detect unknown fields (warn, but don't fail)
    unknown = set(record.keys()) - set(schema.keys())
    for u in unknown:
        if record[u] not in (None, "", "null"):
            errors.append({
                "row": row_index,
                "field": u,
                "message": f"Unknown field '{u}' for label '{label}' (rejected)",
            })

    if errors:
        return None, errors
    return clean, []


def validate_relationship_record(rel_type: str, record: dict, row_index: int = 0) -> tuple[dict | None, list[dict]]:
    """
    Validate a single relationship record.

    Expected record shape:
      {
        "start_label": "Skill", "start_id": "skill-1",
        "end_label": "Skill",   "end_id": "skill-2",
        "<prop1>": ..., "<prop2>": ...
      }
    """
    errors: list[dict] = []
    if rel_type not in RELATIONSHIP_SCHEMA:
        return None, [{"row": row_index, "field": "_type", "message": f"Unknown relationship type '{rel_type}'"}]

    rel_spec = RELATIONSHIP_SCHEMA[rel_type]
    start_label = record.get("start_label")
    end_label = record.get("end_label")
    start_id = record.get("start_id")
    end_id = record.get("end_id")

    if not start_label or start_label not in rel_spec["starts"]:
        errors.append({
            "row": row_index,
            "field": "start_label",
            "message": f"start_label must be one of {sorted(rel_spec['starts'])}, got '{start_label}'",
        })
    if not end_label or end_label not in rel_spec["ends"]:
        errors.append({
            "row": row_index,
            "field": "end_label",
            "message": f"end_label must be one of {sorted(rel_spec['ends'])}, got '{end_label}'",
        })

    if rel_spec.get("same_label") and start_label and end_label and start_label != end_label:
        errors.append({
            "row": row_index,
            "field": "_labels",
            "message": f"{rel_type} requires same start_label and end_label (got {start_label}/{end_label})",
        })

    if not start_id or not _ID_RE.match(str(start_id)):
        errors.append({"row": row_index, "field": "start_id", "message": "Invalid start_id format"})
    if not end_id or not _ID_RE.match(str(end_id)):
        errors.append({"row": row_index, "field": "end_id", "message": "Invalid end_id format"})

    # Validate props
    clean_props: dict = {}
    prop_specs = rel_spec.get("props", {})
    for field, spec in prop_specs.items():
        coerced, err = _validate_value(record.get(field), spec, field)
        if err:
            errors.append({"row": row_index, "field": field, "message": err})
        elif coerced is not None:
            clean_props[field] = coerced

    # Reject unknown rel props (excluding the 4 routing fields)
    routing = {"start_label", "end_label", "start_id", "end_id"}
    unknown = set(record.keys()) - set(prop_specs.keys()) - routing
    for u in unknown:
        if record[u] not in (None, "", "null"):
            errors.append({
                "row": row_index,
                "field": u,
                "message": f"Unknown property '{u}' for relationship '{rel_type}'",
            })

    if errors:
        return None, errors

    return {
        "start_label": start_label,
        "start_id": start_id,
        "end_label": end_label,
        "end_id": end_id,
        "props": clean_props,
    }, []


def detect_csv_duplicates(label: str, rows: list[dict]) -> list[dict]:
    """Find duplicate primary keys within a single CSV file (Option 2 pre-flight)."""
    pk = primary_key_of(label)
    seen: dict[str, int] = {}
    errors: list[dict] = []
    for i, row in enumerate(rows):
        v = row.get(pk)
        if v is None:
            continue
        if v in seen:
            errors.append({
                "row": i,
                "field": pk,
                "message": f"Duplicate '{v}' (also at row {seen[v]})",
            })
        else:
            seen[v] = i
    return errors
