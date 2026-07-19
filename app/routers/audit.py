"""
Audit log & restore — lich su moi lan import va nut hoan tac.

Snapshot duoc ghi kem trong AuditLog luc import (xem services/snapshot.py),
o day chi doc ra va goi run_restore().
"""
import json

from fastapi import APIRouter, HTTPException

from app.config import get_driver, NEO4J_DATABASE
from app.services.importer import run_restore

router = APIRouter(prefix="/api", tags=["audit"])


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
