"""
Snapshot service.

Trước mỗi import, query toàn bộ node và relationship sẽ bị overwrite/touched
theo (label, id), serialize ra JSON và lưu vào audit log.
"""
import json
from typing import Any
from neo4j import Transaction
from app.config import NODE_LABELS, RELATIONSHIP_SCHEMA, primary_key_of


def snapshot_nodes(tx: Transaction, targets: list[tuple[str, str]]) -> list[dict]:
    """
    Snapshot existing nodes by (label, id).

    `targets`: list of (label, id) tuples. id refers to the primary key value.
    Returns list of { label, primary_key, primary_value, properties } for nodes that exist.
    """
    snap: list[dict] = []
    # Group by label so we use one query per label
    by_label: dict[str, list[str]] = {}
    for label, pk_val in targets:
        by_label.setdefault(label, []).append(pk_val)

    for label, ids in by_label.items():
        if label not in NODE_LABELS:
            continue
        pk = primary_key_of(label)
        # Label cannot be parameterized in Cypher — we whitelist via NODE_LABELS
        query = f"MATCH (n:`{label}`) WHERE n.`{pk}` IN $ids RETURN n.`{pk}` AS pk_val, properties(n) AS props"
        result = tx.run(query, ids=ids)
        for record in result:
            snap.append({
                "label": label,
                "primary_key": pk,
                "primary_value": record["pk_val"],
                "properties": dict(record["props"]),
            })
    return snap


def snapshot_relationships(tx: Transaction, targets: list[dict]) -> list[dict]:
    """
    Snapshot existing relationships that match (rel_type, start_label, start_id, end_label, end_id).

    `targets`: list of dicts with keys rel_type, start_label, start_id, end_label, end_id.
    """
    snap: list[dict] = []
    for t in targets:
        rt = t["rel_type"]
        if rt not in RELATIONSHIP_SCHEMA:
            continue
        s_label = t["start_label"]
        e_label = t["end_label"]
        if s_label not in NODE_LABELS or e_label not in NODE_LABELS:
            continue
        s_pk = primary_key_of(s_label)
        e_pk = primary_key_of(e_label)
        query = (
            f"MATCH (s:`{s_label}` {{`{s_pk}`: $s_id}})-[r:`{rt}`]->(e:`{e_label}` {{`{e_pk}`: $e_id}}) "
            "RETURN properties(r) AS props"
        )
        result = tx.run(query, s_id=t["start_id"], e_id=t["end_id"])
        for record in result:
            snap.append({
                "rel_type": rt,
                "start_label": s_label,
                "start_id": t["start_id"],
                "end_label": e_label,
                "end_id": t["end_id"],
                "properties": dict(record["props"]),
            })
    return snap


def write_audit_log(
    tx: Transaction,
    actor: str,
    operation: str,
    option: str,
    payload_summary: dict,
    snapshot_nodes_data: list[dict],
    snapshot_rels_data: list[dict],
    status: str = "pending",
) -> str:
    """
    Create an AuditLog node with snapshot data.
    Returns the audit log id.
    """
    import uuid
    audit_id = f"audit-{uuid.uuid4().hex[:12]}"
    query = """
    CREATE (a:AuditLog {
        id: $id,
        timestamp: datetime(),
        actor: $actor,
        operation: $operation,
        option: $option,
        payload_summary: $payload_summary,
        snapshot_nodes: $snapshot_nodes,
        snapshot_rels: $snapshot_rels,
        status: $status,
        affected_nodes_count: $nc,
        affected_rels_count: $rc
    })
    RETURN a.id AS id
    """
    tx.run(
        query,
        id=audit_id,
        actor=actor,
        operation=operation,
        option=option,
        payload_summary=json.dumps(payload_summary, ensure_ascii=False, default=str),
        snapshot_nodes=json.dumps(snapshot_nodes_data, ensure_ascii=False, default=str),
        snapshot_rels=json.dumps(snapshot_rels_data, ensure_ascii=False, default=str),
        status=status,
        nc=len(snapshot_nodes_data),
        rc=len(snapshot_rels_data),
    )
    return audit_id


def update_audit_status(tx: Transaction, audit_id: str, status: str, error: str | None = None):
    query = "MATCH (a:AuditLog {id: $id}) SET a.status = $status"
    params: dict[str, Any] = {"id": audit_id, "status": status}
    if error:
        query += ", a.error = $error"
        params["error"] = error
    tx.run(query, **params)
