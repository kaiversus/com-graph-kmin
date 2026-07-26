"""
CRUD — sửa / xoá từng node & quan hệ đã tồn tại (bổ sung cho Create ở option1/2).

Mọi thao tác đi qua importer.run_* (snapshot + AuditLog + rollback), nên Restore
ở tab Audit undo được cả update lẫn delete.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import (
    get_driver,
    NEO4J_DATABASE,
    NODE_LABELS,
    NODE_PROP_SCHEMA,
    RELATIONSHIP_SCHEMA,
    primary_key_of,
)
from app.services.validator import validate_node_record, validate_relationship_record
from app.services.importer import (
    run_update_node,
    run_delete_node,
    run_update_rel,
    run_delete_rel,
)

router = APIRouter(prefix="/api/crud", tags=["crud"])


# ---- Read: 1 node + các quan hệ của nó (đổ vào form sửa) --------------------


@router.get("/node/{label}/{node_id}")
def read_node(label: str, node_id: str):
    if label not in NODE_LABELS:
        raise HTTPException(status_code=400, detail=f"Label '{label}' không hợp lệ")
    pk = primary_key_of(label)
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        rec = session.run(
            f"MATCH (n:`{label}` {{`{pk}`: $id}}) RETURN properties(n) AS props", id=node_id
        ).single()
        if not rec:
            raise HTTPException(status_code=404, detail=f"{label}:{node_id} không tồn tại")
        props = dict(rec["props"])

        rels: list[dict] = []
        seen: set[tuple] = set()
        for r in session.run(
            f"MATCH (n:`{label}` {{`{pk}`: $id}})-[r]-(m) "
            "RETURN type(r) AS rt, properties(r) AS rprops, startNode(r) = n AS out, "
            "labels(m) AS mlabels, properties(m) AS mprops",
            id=node_id,
        ):
            rt = r["rt"]
            if rt not in RELATIONSHIP_SCHEMA:
                continue
            mlabel = next((l for l in r["mlabels"] if l in NODE_LABELS), None)
            if not mlabel:
                continue
            m_pk = primary_key_of(mlabel)
            m_id = r["mprops"].get(m_pk)
            m_name = r["mprops"].get("name") or m_id
            if r["out"]:
                s_label, s_id, e_label, e_id = label, node_id, mlabel, m_id
            else:
                s_label, s_id, e_label, e_id = mlabel, m_id, label, node_id
            key = (rt, s_label, s_id, e_label, e_id)
            if key in seen:
                continue
            seen.add(key)
            rels.append({
                "rel_type": rt,
                "direction": "out" if r["out"] else "in",
                "start_label": s_label, "start_id": s_id,
                "end_label": e_label, "end_id": e_id,
                "other_label": mlabel, "other_id": m_id, "other_name": m_name,
                "props": dict(r["rprops"]),
                "props_spec": RELATIONSHIP_SCHEMA[rt].get("props", {}),
            })

    return {
        "label": label,
        "id": node_id,
        "name": props.get("name") or node_id,
        "props": props,
        "props_spec": NODE_PROP_SCHEMA[label],
        "relationships": rels,
    }


# ---- Update / Delete node ---------------------------------------------------


class NodeUpdatePayload(BaseModel):
    actor: str = "admin"
    properties: dict


@router.put("/node/{label}/{node_id}")
def update_node(label: str, node_id: str, payload: NodeUpdatePayload):
    if label not in NODE_PROP_SCHEMA:
        raise HTTPException(status_code=400, detail=f"Label '{label}' không hợp lệ")
    pk = primary_key_of(label)
    # pk bất biến — luôn lấy theo URL, không cho đổi id qua body
    props = {**payload.properties, pk: node_id}
    clean, errs = validate_node_record(label, props)
    if errs:
        raise HTTPException(status_code=400, detail={"errors": errs})
    try:
        return {"success": True, **run_update_node(payload.actor, label, node_id, clean)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "phase": "transaction"})


@router.delete("/node/{label}/{node_id}")
def delete_node(label: str, node_id: str, actor: str = "admin"):
    if label not in NODE_LABELS:
        raise HTTPException(status_code=400, detail=f"Label '{label}' không hợp lệ")
    try:
        return {"success": True, **run_delete_node(actor, label, node_id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "phase": "transaction"})


# ---- Update / Delete relationship -------------------------------------------


class RelRef(BaseModel):
    rel_type: str
    start_label: str
    start_id: str
    end_label: str
    end_id: str


class RelUpdatePayload(RelRef):
    actor: str = "admin"
    properties: dict = Field(default_factory=dict)


class RelDeletePayload(RelRef):
    actor: str = "admin"


@router.put("/relationship")
def update_relationship(payload: RelUpdatePayload):
    record = {
        "start_label": payload.start_label, "start_id": payload.start_id,
        "end_label": payload.end_label, "end_id": payload.end_id,
        **payload.properties,
    }
    clean, errs = validate_relationship_record(payload.rel_type, record)
    if errs:
        raise HTTPException(status_code=400, detail={"errors": errs})
    try:
        return {"success": True, **run_update_rel(
            payload.actor, payload.rel_type, payload.start_label, payload.start_id,
            payload.end_label, payload.end_id, clean["props"],
        )}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "phase": "transaction"})


@router.delete("/relationship")
def delete_relationship(payload: RelDeletePayload):
    if payload.rel_type not in RELATIONSHIP_SCHEMA:
        raise HTTPException(status_code=400, detail=f"Relationship '{payload.rel_type}' không hợp lệ")
    try:
        return {"success": True, **run_delete_rel(
            payload.actor, payload.rel_type, payload.start_label, payload.start_id,
            payload.end_label, payload.end_id,
        )}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "phase": "transaction"})
