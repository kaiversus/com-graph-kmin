"""
Option 2 — Bulk CSV Import.

Hỗ trợ 2 chế độ:
  1. AUTO PRESET (default): user chỉ cần upload, system nhìn filename
     (vd 'rels_teaches.csv') để biết kind/target và cách map header.
  2. MANUAL (advanced): user khai báo kind+target và file phải dùng
     header chuẩn nội bộ (start_label, start_id, end_label, end_id, ...).
"""
import csv
import io
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import PlainTextResponse
from app.config import NODE_PROP_SCHEMA, RELATIONSHIP_SCHEMA
from app.services.csv_io import (
    parse_node_csv,
    parse_relationship_csv,
    node_template_csv,
    relationship_template_csv,
)
from app.services.csv_mapping import (
    detect_preset,
    transform_node_row,
    transform_rel_row,
    list_all_presets,
)
from app.services.validator import (
    validate_node_record,
    validate_relationship_record,
    detect_csv_duplicates,
)
from app.services.importer import run_import

router = APIRouter(prefix="/api/option2", tags=["option2"])

# Server-side staging keyed by upload session (in-memory; demo-grade)
_STAGING: dict[str, dict] = {}


@router.get("/presets")
def get_presets():
    """List all known CSV presets so FE can show user."""
    return list_all_presets()


@router.get("/template/node/{label}", response_class=PlainTextResponse)
def get_node_template(label: str):
    if label not in NODE_PROP_SCHEMA:
        raise HTTPException(status_code=404, detail=f"Unknown label '{label}'")
    return node_template_csv(label)


@router.get("/template/rel/{rel_type}", response_class=PlainTextResponse)
def get_rel_template(rel_type: str):
    if rel_type not in RELATIONSHIP_SCHEMA:
        raise HTTPException(status_code=404, detail=f"Unknown rel_type '{rel_type}'")
    return relationship_template_csv(rel_type)


def _parse_csv_bytes(content: bytes) -> list[dict]:
    """Common CSV parser tolerating BOM and CRLF."""
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [dict(r) for r in reader]


@router.post("/validate")
async def validate_csv(
    file: UploadFile = File(...),
    kind: str | None = Form(None),
    target: str | None = Form(None),
):
    """
    Validate uploaded CSV.

    Auto-detect mode: filename phải khớp 1 preset (vd nodes_skills.csv, rels_teaches.csv).
    Manual mode: truyền kèm kind ('node'|'rel') và target (label hoặc rel_type),
    file dùng header chuẩn nội bộ.
    """
    content = await file.read()
    errors: list[dict] = []
    clean_records: list[dict] = []
    raw_rows: list[dict] = []
    rows: list[dict] = []

    detected = detect_preset(file.filename or "")
    use_preset = detected is not None and not (kind and target)

    if use_preset:
        kind, preset = detected
        target = preset["label"] if kind == "node" else preset["rel_type"]
        try:
            raw_rows = _parse_csv_bytes(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

        expected_cols = set(preset["header_map"].keys())
        actual_cols = set(raw_rows[0].keys()) if raw_rows else set()
        unknown_cols = actual_cols - expected_cols
        if unknown_cols:
            errors.append({
                "row": -1, "field": "_header",
                "message": f"Unknown columns ignored: {sorted(unknown_cols)}",
            })

        if kind == "node":
            transformed = [transform_node_row(preset, r) for r in raw_rows]
            errors.extend(detect_csv_duplicates(target, transformed))
            for i, t in enumerate(transformed):
                clean, errs = validate_node_record(target, t, row_index=i)
                errors.extend(errs)
                if clean:
                    clean_records.append({"label": target, "props": clean})
        else:
            transformed = [transform_rel_row(preset, r) for r in raw_rows]
            for i, t in enumerate(transformed):
                clean, errs = validate_relationship_record(target, t, row_index=i)
                errors.extend(errs)
                if clean:
                    clean_records.append({"rel_type": target, **clean})

    else:
        if not kind or not target:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Filename '{file.filename}' không khớp preset nào. "
                    f"Hoặc đổi tên file theo convention (xem GET /api/option2/presets), "
                    f"hoặc gửi kèm kind='node'|'rel' và target=<label|rel_type>."
                ),
            )
        if kind == "node":
            if target not in NODE_PROP_SCHEMA:
                raise HTTPException(status_code=400, detail=f"Unknown label '{target}'")
            try:
                rows, _ = parse_node_csv(target, content)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")
            errors.extend(detect_csv_duplicates(target, rows))
            for i, row in enumerate(rows):
                clean, errs = validate_node_record(target, row, row_index=i)
                errors.extend(errs)
                if clean:
                    clean_records.append({"label": target, "props": clean})
        elif kind == "rel":
            if target not in RELATIONSHIP_SCHEMA:
                raise HTTPException(status_code=400, detail=f"Unknown rel_type '{target}'")
            try:
                rows, _ = parse_relationship_csv(target, content)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")
            for i, row in enumerate(rows):
                clean, errs = validate_relationship_record(target, row, row_index=i)
                errors.extend(errs)
                if clean:
                    clean_records.append({"rel_type": target, **clean})
        else:
            raise HTTPException(status_code=400, detail="kind must be 'node' or 'rel'")

    blocking = [e for e in errors if e.get("field") != "_header"]

    staging_id = uuid.uuid4().hex[:12]
    _STAGING[staging_id] = {
        "kind": kind,
        "target": target,
        "records": clean_records,
        "filename": file.filename,
    }

    return {
        "valid": len(blocking) == 0 and len(clean_records) > 0,
        "auto_detected": use_preset,
        "kind": kind,
        "target": target,
        "errors": errors,
        "row_count": len(raw_rows) if use_preset else len(rows),
        "valid_count": len(clean_records),
        "staging_id": staging_id,
        "preview": clean_records[:10],
    }


@router.post("/commit")
def commit_csv(staging_id: str = Form(...), actor: str = Form("admin")):
    if staging_id not in _STAGING:
        raise HTTPException(status_code=404, detail="staging_id not found or already committed")

    staged = _STAGING.pop(staging_id)
    nodes: list[dict] = []
    rels: list[dict] = []
    if staged["kind"] == "node":
        nodes = staged["records"]
    else:
        rels = staged["records"]

    try:
        result = run_import(
            actor=actor,
            option=f"option2_csv_{staged['kind']}_{staged['target']}",
            nodes=nodes,
            relationships=rels,
        )
    except Exception as e:
        _STAGING[staging_id] = staged
        raise HTTPException(status_code=500, detail={"error": str(e), "phase": "transaction"})

    return {"success": True, **result}
