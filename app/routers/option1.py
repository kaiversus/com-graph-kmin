"""
Option 1 — Direct Driver: nhập từng entity (1 node + nhiều relationships) qua form.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.validator import validate_node_record, validate_relationship_record
from app.services.importer import run_import

router = APIRouter(prefix="/api/option1", tags=["option1"])


class NodePayload(BaseModel):
    label: str
    properties: dict


class RelPayload(BaseModel):
    rel_type: str
    start_label: str
    start_id: str
    end_label: str
    end_id: str
    properties: dict = Field(default_factory=dict)


class SingleEntityPayload(BaseModel):
    actor: str = "admin"
    node: NodePayload
    relationships: list[RelPayload] = Field(default_factory=list)


@router.post("/validate")
def validate_payload(payload: SingleEntityPayload):
    """Step 1: Data Validation Layer."""
    errors: list[dict] = []

    clean_node, n_errs = validate_node_record(payload.node.label, payload.node.properties, row_index=0)
    errors.extend(n_errs)

    clean_rels: list[dict] = []
    for i, r in enumerate(payload.relationships):
        record = {
            "start_label": r.start_label,
            "start_id": r.start_id,
            "end_label": r.end_label,
            "end_id": r.end_id,
            **r.properties,
        }
        clean, errs = validate_relationship_record(r.rel_type, record, row_index=i)
        errors.extend(errs)
        if clean:
            clean_rels.append({"rel_type": r.rel_type, **clean})

    if errors:
        return {"valid": False, "errors": errors}

    return {
        "valid": True,
        "preview": {
            "node": {"label": payload.node.label, "props": clean_node},
            "relationships": clean_rels,
        },
    }


@router.post("/commit")
def commit_payload(payload: SingleEntityPayload):
    """Step 2..4: Data Review confirmed → Snapshot → MERGE inside transaction."""
    # Re-validate (defense-in-depth: never trust client-confirmed payload)
    clean_node, n_errs = validate_node_record(payload.node.label, payload.node.properties)
    if n_errs:
        raise HTTPException(status_code=400, detail={"errors": n_errs})

    clean_rels: list[dict] = []
    for i, r in enumerate(payload.relationships):
        record = {
            "start_label": r.start_label,
            "start_id": r.start_id,
            "end_label": r.end_label,
            "end_id": r.end_id,
            **r.properties,
        }
        clean, errs = validate_relationship_record(r.rel_type, record, row_index=i)
        if errs:
            raise HTTPException(status_code=400, detail={"errors": errs})
        clean_rels.append({"rel_type": r.rel_type, **clean})

    nodes_to_write = [{"label": payload.node.label, "props": clean_node}]
    try:
        result = run_import(
            actor=payload.actor,
            option="option1_direct_driver",
            nodes=nodes_to_write,
            relationships=clean_rels,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "phase": "transaction"})

    return {"success": True, **result}
