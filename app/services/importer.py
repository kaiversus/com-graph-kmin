"""
Importer.

Builds parameterized Cypher (whitelisted label/type) and runs MERGE inside
a single Neo4j transaction with full snapshot + rollback on error.
"""
from typing import Any
from neo4j import Transaction, ManagedTransaction
from app.config import (
    get_driver,
    NEO4J_DATABASE,
    NODE_LABELS,
    RELATIONSHIP_SCHEMA,
    primary_key_of,
)
from app.services.snapshot import (
    snapshot_nodes,
    snapshot_relationships,
    write_audit_log,
    update_audit_status,
)


# ---- Cypher generators (label/type whitelisted; properties parameterized) ----


def merge_nodes_unwind_cypher(label: str) -> str:
    """
    UNWIND-batched MERGE for a node label. Receives $rows (list of prop dicts).

    Equivalent to running MERGE many times but in 1 round-trip — significant
    speedup vs Aura cloud where each round-trip is 100-300ms latency.
    """
    if label not in NODE_LABELS:
        raise ValueError(f"Label '{label}' not whitelisted")
    pk = primary_key_of(label)
    return (
        f"UNWIND $rows AS row "
        f"MERGE (n:`{label}` {{`{pk}`: row.`{pk}`}}) "
        f"SET n += row "
        f"RETURN count(n) AS cnt"
    )


def merge_relationships_unwind_cypher(rel_type: str, start_label: str, end_label: str) -> str:
    """
    UNWIND-batched MERGE for a relationship type between fixed (start_label, end_label).

    Each row = { start_id, end_id, props: {...} }
    Returns count of rels merged AND count of rows for endpoint sanity check.
    """
    if rel_type not in RELATIONSHIP_SCHEMA:
        raise ValueError(f"Relationship '{rel_type}' not whitelisted")
    if start_label not in NODE_LABELS or end_label not in NODE_LABELS:
        raise ValueError("Start/end label not whitelisted")
    s_pk = primary_key_of(start_label)
    e_pk = primary_key_of(end_label)
    return (
        f"UNWIND $rows AS row "
        f"MATCH (s:`{start_label}` {{`{s_pk}`: row.start_id}}) "
        f"MATCH (e:`{end_label}` {{`{e_pk}`: row.end_id}}) "
        f"MERGE (s)-[r:`{rel_type}`]->(e) "
        f"SET r += row.props "
        f"RETURN count(r) AS cnt"
    )


# Legacy single-row generators kept for backward compat (validator imports them via tests)
def merge_node_cypher(label: str) -> str:
    if label not in NODE_LABELS:
        raise ValueError(f"Label '{label}' not whitelisted")
    pk = primary_key_of(label)
    return (
        f"MERGE (n:`{label}` {{`{pk}`: $pk_value}}) "
        f"SET n += $props "
        f"RETURN n.`{pk}` AS pk, labels(n) AS labels"
    )


def merge_relationship_cypher(rel_type: str, start_label: str, end_label: str) -> str:
    if rel_type not in RELATIONSHIP_SCHEMA:
        raise ValueError(f"Relationship '{rel_type}' not whitelisted")
    if start_label not in NODE_LABELS or end_label not in NODE_LABELS:
        raise ValueError("Start/end label not whitelisted")
    s_pk = primary_key_of(start_label)
    e_pk = primary_key_of(end_label)
    return (
        f"MATCH (s:`{start_label}` {{`{s_pk}`: $s_id}}), "
        f"(e:`{end_label}` {{`{e_pk}`: $e_id}}) "
        f"MERGE (s)-[r:`{rel_type}`]->(e) "
        f"SET r += $props "
        f"RETURN type(r) AS type"
    )


# ---- Transactional executors ----


def _do_import(
    tx: ManagedTransaction,
    actor: str,
    option: str,
    nodes: list[dict],
    relationships: list[dict],
) -> dict:
    """
    nodes: [{"label": "Skill", "props": {...}}, ...]
    relationships: [{"rel_type": "...", "start_label": "...", "start_id": "...",
                     "end_label": "...", "end_id": "...", "props": {...}}, ...]

    Strategy:
      1. Snapshot existing affected nodes/rels.
      2. Write AuditLog with status='pending'.
      3. Execute MERGE for each node and relationship.
      4. Update AuditLog status='committed'.
    Any exception aborts the transaction → full rollback.
    """
    # 1. Snapshot ----------------------------------------------------------------
    node_targets = [(n["label"], n["props"][primary_key_of(n["label"])]) for n in nodes]
    snap_nodes = snapshot_nodes(tx, node_targets)
    snap_rels = snapshot_relationships(tx, relationships)

    # 2. AuditLog (pending) ------------------------------------------------------
    payload_summary = {
        "nodes": [{"label": n["label"], "id": n["props"][primary_key_of(n["label"])]} for n in nodes],
        "relationships": [
            {
                "type": r["rel_type"],
                "start": f"{r['start_label']}:{r['start_id']}",
                "end": f"{r['end_label']}:{r['end_id']}",
            }
            for r in relationships
        ],
    }
    audit_id = write_audit_log(
        tx, actor, "import", option, payload_summary, snap_nodes, snap_rels, status="pending"
    )

    # 3. Execute MERGEs (UNWIND-batched, group by label / by rel-type+labels) -----
    # Group nodes by label
    nodes_by_label: dict[str, list[dict]] = {}
    for n in nodes:
        nodes_by_label.setdefault(n["label"], []).append(n["props"])

    nodes_written = 0
    for label, rows in nodes_by_label.items():
        cypher = merge_nodes_unwind_cypher(label)
        result = tx.run(cypher, rows=rows).single()
        nodes_written += result["cnt"] if result else 0

    # Group rels by (rel_type, start_label, end_label) — same Cypher template
    rels_grouped: dict[tuple[str, str, str], list[dict]] = {}
    for r in relationships:
        key = (r["rel_type"], r["start_label"], r["end_label"])
        rels_grouped.setdefault(key, []).append({
            "start_id": r["start_id"],
            "end_id": r["end_id"],
            "props": r.get("props", {}),
        })

    rels_written = 0
    for (rel_type, s_label, e_label), rows in rels_grouped.items():
        cypher = merge_relationships_unwind_cypher(rel_type, s_label, e_label)
        result = tx.run(cypher, rows=rows).single()
        actual_count = result["cnt"] if result else 0

        # If fewer rels merged than rows submitted, at least one row's
        # endpoint(s) didn't exist → fail the whole transaction (atomic).
        if actual_count < len(rows):
            # Find which row(s) failed for a useful error message
            s_pk = primary_key_of(s_label)
            e_pk = primary_key_of(e_label)
            missing = []
            for row in rows:
                check = tx.run(
                    f"OPTIONAL MATCH (s:`{s_label}` {{`{s_pk}`: $s_id}}) "
                    f"OPTIONAL MATCH (e:`{e_label}` {{`{e_pk}`: $e_id}}) "
                    "RETURN s IS NOT NULL AS has_s, e IS NOT NULL AS has_e",
                    s_id=row["start_id"], e_id=row["end_id"],
                ).single()
                if not check or not check["has_s"] or not check["has_e"]:
                    missing.append(
                        f"{s_label}:{row['start_id']} -> {e_label}:{row['end_id']}"
                    )
            raise ValueError(
                f"Relationship {rel_type} cannot be created: missing endpoint(s) "
                f"for {len(missing)} row(s): {missing[:5]}"
                + ("..." if len(missing) > 5 else "")
            )
        rels_written += actual_count

    # 4. Mark committed ----------------------------------------------------------
    update_audit_status(tx, audit_id, "committed")

    return {
        "audit_id": audit_id,
        "nodes_written": nodes_written,
        "relationships_written": rels_written,
        "snapshot_nodes": len(snap_nodes),
        "snapshot_rels": len(snap_rels),
    }


def run_import(actor: str, option: str, nodes: list[dict], relationships: list[dict]) -> dict:
    """Public entrypoint. Wraps _do_import in a transaction with retry."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        result = session.execute_write(_do_import, actor, option, nodes, relationships)
    return result


# ---- Restore from snapshot --------------------------------------------------


def _do_restore(tx: ManagedTransaction, audit_id: str) -> dict:
    """Read snapshot from AuditLog and restore nodes/rels to their pre-import state."""
    import json
    record = tx.run(
        "MATCH (a:AuditLog {id: $id}) RETURN a.snapshot_nodes AS sn, "
        "a.snapshot_rels AS sr, a.payload_summary AS ps, a.status AS status",
        id=audit_id,
    ).single()
    if not record:
        raise ValueError(f"AuditLog '{audit_id}' not found")
    if record["status"] == "restored":
        raise ValueError(f"AuditLog '{audit_id}' was already restored")

    snap_nodes = json.loads(record["sn"]) if record["sn"] else []
    snap_rels = json.loads(record["sr"]) if record["sr"] else []
    payload = json.loads(record["ps"]) if record["ps"] else {}

    # Strategy:
    # - For every node touched by the import: if it existed in snapshot → overwrite with snapshot props;
    #                                          if it did NOT exist in snapshot → delete it (and its rels).
    # - For every rel touched: if it existed in snapshot → restore its props;
    #                          if it did NOT exist in snapshot → delete it.
    snapshot_node_keys = {(s["label"], s["primary_value"]) for s in snap_nodes}
    snapshot_rel_keys = {
        (s["rel_type"], s["start_label"], s["start_id"], s["end_label"], s["end_id"])
        for s in snap_rels
    }

    # First, restore/delete relationships (must come before deleting nodes)
    rels_restored = 0
    rels_deleted = 0
    for rsum in payload.get("relationships", []):
        # rsum: {"type": "TEACHES", "start": "Course:c1", "end": "Skill:s1"}
        rt = rsum["type"]
        s_label, s_id = rsum["start"].split(":", 1)
        e_label, e_id = rsum["end"].split(":", 1)
        key = (rt, s_label, s_id, e_label, e_id)
        if key in snapshot_rel_keys:
            # Restore properties
            snap = next(
                s for s in snap_rels
                if (s["rel_type"], s["start_label"], s["start_id"], s["end_label"], s["end_id"]) == key
            )
            s_pk = primary_key_of(s_label)
            e_pk = primary_key_of(e_label)
            tx.run(
                f"MATCH (s:`{s_label}` {{`{s_pk}`: $s_id}})-[r:`{rt}`]->(e:`{e_label}` {{`{e_pk}`: $e_id}}) "
                "SET r = $props",
                s_id=s_id, e_id=e_id, props=snap["properties"],
            )
            rels_restored += 1
        else:
            s_pk = primary_key_of(s_label)
            e_pk = primary_key_of(e_label)
            tx.run(
                f"MATCH (s:`{s_label}` {{`{s_pk}`: $s_id}})-[r:`{rt}`]->(e:`{e_label}` {{`{e_pk}`: $e_id}}) "
                "DELETE r",
                s_id=s_id, e_id=e_id,
            )
            rels_deleted += 1

    # Then nodes
    nodes_restored = 0
    nodes_deleted = 0
    for nsum in payload.get("nodes", []):
        label = nsum["label"]
        pk_val = nsum["id"]
        key = (label, pk_val)
        pk = primary_key_of(label)
        if key in snapshot_node_keys:
            snap = next(s for s in snap_nodes if (s["label"], s["primary_value"]) == key)
            tx.run(
                f"MATCH (n:`{label}` {{`{pk}`: $pk_val}}) SET n = $props",
                pk_val=pk_val, props=snap["properties"],
            )
            nodes_restored += 1
        else:
            # Node didn't exist before; delete (DETACH to also clean any leftover rels)
            tx.run(
                f"MATCH (n:`{label}` {{`{pk}`: $pk_val}}) DETACH DELETE n",
                pk_val=pk_val,
            )
            nodes_deleted += 1

    update_audit_status(tx, audit_id, "restored")

    return {
        "audit_id": audit_id,
        "nodes_restored": nodes_restored,
        "nodes_deleted": nodes_deleted,
        "rels_restored": rels_restored,
        "rels_deleted": rels_deleted,
    }


def run_restore(audit_id: str) -> dict:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_write(_do_restore, audit_id)
