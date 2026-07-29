"""
Importer.

Builds parameterized Cypher (whitelisted label/type) and runs MERGE inside
a single Neo4j transaction with full snapshot + rollback on error.
"""
import json
from neo4j import ManagedTransaction
from app.config import (
    get_driver,
    NEO4J_DATABASE,
    NODE_LABELS,
    NODE_REQUIRES_INCOMING,
    RELATIONSHIP_SCHEMA,
    primary_key_of,
)
from app.services.snapshot import (
    snapshot_nodes,
    snapshot_relationships,
    snapshot_node_rels,
    write_audit_log,
    update_audit_status,
)


def _auto_ts_sets(rel_type: str) -> str:
    """Cac clause `SET r.<prop> = datetime()` cho auto-timestamp props cua rel."""
    return "".join(
        f"SET r.`{p}` = datetime() "
        for p, ps in RELATIONSHIP_SCHEMA[rel_type].get("props", {}).items()
        if ps.get("auto") == "timestamp"
    )


def _leaf_constraint_pairs() -> list[tuple[str, str]]:
    """(has_rel, parent_rel) cho moi rel co co `start_leaf_of` — vd (HAS, PARENT_OF)."""
    return [
        (rt, spec["start_leaf_of"])
        for rt, spec in RELATIONSHIP_SCHEMA.items()
        if spec.get("start_leaf_of")
    ]


def _check_leaf_constraints(tx, relationships: list[dict]) -> None:
    """
    Rang buoc la: node vua co con (parent_rel) vua HAS toi Knowledge la sai.
    Chi KnowledgeArea LA (khong con qua PARENT_OF) moi duoc HAS. Chay sau khi
    merge xong; vi pham → raise → rollback ca transaction.
    """
    for has_rt, parent_rt in _leaf_constraint_pairs():
        candidates: set[tuple[str, str]] = set()
        for r in relationships:
            if r["rel_type"] in (has_rt, parent_rt):
                candidates.add((r["start_label"], r["start_id"]))
        for lbl, nid in candidates:
            pk = primary_key_of(lbl)
            rec = tx.run(
                f"MATCH (n:`{lbl}` {{`{pk}`: $id}}) "
                f"RETURN EXISTS {{ (n)-[:`{has_rt}`]->() }} AS has_has, "
                f"EXISTS {{ (n)-[:`{parent_rt}`]->() }} AS has_children",
                id=nid,
            ).single()
            if rec and rec["has_has"] and rec["has_children"]:
                raise ValueError(
                    f"Rang buoc la vi pham: {lbl}:{nid} vua co con ({parent_rt}) "
                    f"vua {has_rt} toi Knowledge. Chi KnowledgeArea la moi duoc {has_rt}."
                )


def _check_required_incoming(tx, nodes: list[dict]) -> None:
    """
    Rang buoc ton tai: node vua duoc tao (trong `nodes`) thuoc label co trong
    NODE_REQUIRES_INCOMING phai co it nhat 1 quan he loai do TRO TOI. Vd Knowledge
    phai duoc 1 REQUIRES tro toi moi duoc ton tai. Chay sau khi merge node + rel;
    vi pham → raise → rollback (khong tao node mo coi).
    """
    for n in nodes:
        rt = NODE_REQUIRES_INCOMING.get(n["label"])
        if not rt:
            continue
        label = n["label"]
        pk = primary_key_of(label)
        node_id = n["props"][pk]
        rec = tx.run(
            f"MATCH (n:`{label}` {{`{pk}`: $id}}) "
            f"RETURN EXISTS {{ ()-[:`{rt}`]->(n) }} AS ok",
            id=node_id,
        ).single()
        if rec and not rec["ok"]:
            raise ValueError(
                f"Rang buoc ton tai: {label}:{node_id} phai duoc it nhat 1 quan he "
                f"{rt} tro toi moi duoc ton tai (khong tao {label} mo coi). "
                f"Hay tao kem quan he {rt} toi node nay trong cung thao tac."
            )


def _check_not_orphaned_after_rel_delete(tx, rel_type, e_label, e_id) -> None:
    """
    Chan viec xoa quan he lam node dau END tro thanh mo coi. Vd xoa REQUIRES cuoi
    cung tro toi mot Knowledge → Knowledge do het duoc REQUIRES → vi pham rang
    buoc ton tai → raise → rollback.
    """
    if NODE_REQUIRES_INCOMING.get(e_label) != rel_type:
        return
    pk = primary_key_of(e_label)
    rec = tx.run(
        f"MATCH (n:`{e_label}` {{`{pk}`: $id}}) "
        f"RETURN EXISTS {{ ()-[:`{rel_type}`]->(n) }} AS ok",
        id=e_id,
    ).single()
    if rec is not None and not rec["ok"]:
        raise ValueError(
            f"Rang buoc ton tai: khong the xoa {rel_type} cuoi cung tro toi "
            f"{e_label}:{e_id} — se lam node nay mo coi. Xoa han node truoc, hoac "
            f"noi {rel_type} khac toi no truoc khi xoa quan he nay."
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
    # auto props (vd lastUpdatedAt) → set bằng datetime() của Neo4j = giờ server
    # tại thời điểm ghi, không lấy từ input. Chạy sau `SET r += row.props`.
    return (
        f"UNWIND $rows AS row "
        f"MATCH (s:`{start_label}` {{`{s_pk}`: row.start_id}}) "
        f"MATCH (e:`{end_label}` {{`{e_pk}`: row.end_id}}) "
        f"MERGE (s)-[r:`{rel_type}`]->(e) "
        f"SET r += row.props "
        f"{_auto_ts_sets(rel_type)}"
        f"RETURN count(r) AS cnt"
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

    # 3b. Rang buoc la (KnowledgeArea HAS Knowledge chi khi la node la) ----------
    _check_leaf_constraints(tx, relationships)

    # 3c. Rang buoc ton tai (Knowledge phai duoc REQUIRES tro toi) ---------------
    _check_required_incoming(tx, nodes)

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


# ---- CRUD: Update / Delete (transactional + snapshot + audit + rollback) -----
#
# Moi op deu: 1) snapshot trang thai truoc, 2) ghi AuditLog (pending),
# 3) thuc thi, 4) danh dau committed. Loi bat ky → rollback ca transaction.
# Restore (_do_restore) dua entity ve dung snapshot → undo duoc ca xoa.


def _rel_summary(rel_type, s_label, s_id, e_label, e_id) -> dict:
    return {"type": rel_type, "start": f"{s_label}:{s_id}", "end": f"{e_label}:{e_id}"}


def _do_update_node(tx, actor, label, node_id, props) -> dict:
    snap_nodes = snapshot_nodes(tx, [(label, node_id)])
    if not snap_nodes:
        raise ValueError(f"{label}:{node_id} không tồn tại")
    payload = {"nodes": [{"label": label, "id": node_id}], "relationships": []}
    audit_id = write_audit_log(tx, actor, "update_node", "crud", payload, snap_nodes, [], status="pending")
    pk = primary_key_of(label)
    # full-replace các prop đã khai (props đã gồm pk = node_id, validated)
    tx.run(f"MERGE (n:`{label}` {{`{pk}`: $id}}) SET n = $props", id=node_id, props=props)
    update_audit_status(tx, audit_id, "committed")
    return {"audit_id": audit_id, "updated": f"{label}:{node_id}"}


def _do_delete_node(tx, actor, label, node_id) -> dict:
    snap_nodes = snapshot_nodes(tx, [(label, node_id)])
    if not snap_nodes:
        raise ValueError(f"{label}:{node_id} không tồn tại")
    snap_rels = snapshot_node_rels(tx, label, node_id)
    payload = {
        "nodes": [{"label": label, "id": node_id}],
        "relationships": [
            _rel_summary(r["rel_type"], r["start_label"], r["start_id"], r["end_label"], r["end_id"])
            for r in snap_rels
        ],
    }
    audit_id = write_audit_log(tx, actor, "delete_node", "crud", payload, snap_nodes, snap_rels, status="pending")
    pk = primary_key_of(label)
    tx.run(f"MATCH (n:`{label}` {{`{pk}`: $id}}) DETACH DELETE n", id=node_id)
    update_audit_status(tx, audit_id, "committed")
    return {"audit_id": audit_id, "deleted": f"{label}:{node_id}", "rels_deleted": len(snap_rels)}


def _do_update_rel(tx, actor, rel_type, s_label, s_id, e_label, e_id, props) -> dict:
    target = {"rel_type": rel_type, "start_label": s_label, "start_id": s_id,
              "end_label": e_label, "end_id": e_id}
    snap_rels = snapshot_relationships(tx, [target])
    if not snap_rels:
        raise ValueError(f"Quan hệ {rel_type} {s_label}:{s_id}->{e_label}:{e_id} không tồn tại")
    payload = {"nodes": [], "relationships": [_rel_summary(rel_type, s_label, s_id, e_label, e_id)]}
    audit_id = write_audit_log(tx, actor, "update_rel", "crud", payload, [], snap_rels, status="pending")
    s_pk = primary_key_of(s_label)
    e_pk = primary_key_of(e_label)
    # full-replace props; auto-timestamp (lastUpdatedAt) làm mới sau khi replace
    tx.run(
        f"MATCH (s:`{s_label}` {{`{s_pk}`: $s_id}})-[r:`{rel_type}`]->"
        f"(e:`{e_label}` {{`{e_pk}`: $e_id}}) SET r = $props {_auto_ts_sets(rel_type)}",
        s_id=s_id, e_id=e_id, props=props,
    )
    update_audit_status(tx, audit_id, "committed")
    return {"audit_id": audit_id, "updated_rel": f"{rel_type} {s_label}:{s_id}->{e_label}:{e_id}"}


def _do_delete_rel(tx, actor, rel_type, s_label, s_id, e_label, e_id) -> dict:
    target = {"rel_type": rel_type, "start_label": s_label, "start_id": s_id,
              "end_label": e_label, "end_id": e_id}
    snap_rels = snapshot_relationships(tx, [target])
    if not snap_rels:
        raise ValueError(f"Quan hệ {rel_type} {s_label}:{s_id}->{e_label}:{e_id} không tồn tại")
    payload = {"nodes": [], "relationships": [_rel_summary(rel_type, s_label, s_id, e_label, e_id)]}
    audit_id = write_audit_log(tx, actor, "delete_rel", "crud", payload, [], snap_rels, status="pending")
    s_pk = primary_key_of(s_label)
    e_pk = primary_key_of(e_label)
    tx.run(
        f"MATCH (s:`{s_label}` {{`{s_pk}`: $s_id}})-[r:`{rel_type}`]->"
        f"(e:`{e_label}` {{`{e_pk}`: $e_id}}) DELETE r",
        s_id=s_id, e_id=e_id,
    )
    # chan lam node END mo coi (vd xoa REQUIRES cuoi cung toi 1 Knowledge)
    _check_not_orphaned_after_rel_delete(tx, rel_type, e_label, e_id)
    update_audit_status(tx, audit_id, "committed")
    return {"audit_id": audit_id, "deleted_rel": f"{rel_type} {s_label}:{s_id}->{e_label}:{e_id}"}


def run_update_node(actor, label, node_id, props) -> dict:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_write(_do_update_node, actor, label, node_id, props)


def run_delete_node(actor, label, node_id) -> dict:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_write(_do_delete_node, actor, label, node_id)


def run_update_rel(actor, rel_type, s_label, s_id, e_label, e_id, props) -> dict:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_write(_do_update_rel, actor, rel_type, s_label, s_id, e_label, e_id, props)


def run_delete_rel(actor, rel_type, s_label, s_id, e_label, e_id) -> dict:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_write(_do_delete_rel, actor, rel_type, s_label, s_id, e_label, e_id)


# ---- Restore from snapshot --------------------------------------------------


def _do_restore(tx: ManagedTransaction, audit_id: str) -> dict:
    """Read snapshot from AuditLog and restore nodes/rels to their pre-import state."""
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

    # Strategy (universal — dung cho ca import, update va delete):
    # dua moi entity BI DONG TOI ve dung trang thai truoc thao tac (snapshot).
    #   - entity CO trong snapshot  → phai TON TAI voi props cu  (MERGE + SET =)
    #   - entity KHONG trong snapshot → phai VANG MAT             (DELETE)
    # Thu tu de khong pham rang buoc: tao lai node → tao lai rel → xoa rel → xoa node.
    # Nho vay rollback duoc ca thao tac DELETE (node/rel bi xoa se duoc tao lai).
    snapshot_node_props = {(s["label"], s["primary_value"]): s["properties"] for s in snap_nodes}
    snapshot_rel_props = {
        (s["rel_type"], s["start_label"], s["start_id"], s["end_label"], s["end_id"]): s["properties"]
        for s in snap_rels
    }

    def _split_rel(rsum):
        # rsum: {"type": "COVERS", "start": "Content:c1", "end": "Knowledge:k1"}
        s_label, s_id = rsum["start"].split(":", 1)
        e_label, e_id = rsum["end"].split(":", 1)
        return rsum["type"], s_label, s_id, e_label, e_id

    nodes_restored = nodes_deleted = rels_restored = rels_deleted = 0

    # 1. Node co trong snapshot → tao lai / phuc hoi props (MERGE truoc rel)
    for nsum in payload.get("nodes", []):
        key = (nsum["label"], nsum["id"])
        if key in snapshot_node_props:
            pk = primary_key_of(nsum["label"])
            tx.run(
                f"MERGE (n:`{nsum['label']}` {{`{pk}`: $pk_val}}) SET n = $props",
                pk_val=nsum["id"], props=snapshot_node_props[key],
            )
            nodes_restored += 1

    # 2. Rel co trong snapshot → tao lai / phuc hoi props (endpoint da co tu buoc 1)
    for rsum in payload.get("relationships", []):
        rt, s_label, s_id, e_label, e_id = _split_rel(rsum)
        key = (rt, s_label, s_id, e_label, e_id)
        if key in snapshot_rel_props:
            s_pk = primary_key_of(s_label)
            e_pk = primary_key_of(e_label)
            tx.run(
                f"MATCH (s:`{s_label}` {{`{s_pk}`: $s_id}}) "
                f"MATCH (e:`{e_label}` {{`{e_pk}`: $e_id}}) "
                f"MERGE (s)-[r:`{rt}`]->(e) SET r = $props",
                s_id=s_id, e_id=e_id, props=snapshot_rel_props[key],
            )
            rels_restored += 1

    # 3. Rel KHONG co trong snapshot (do thao tac tao ra) → xoa (truoc khi xoa node)
    for rsum in payload.get("relationships", []):
        rt, s_label, s_id, e_label, e_id = _split_rel(rsum)
        if (rt, s_label, s_id, e_label, e_id) not in snapshot_rel_props:
            s_pk = primary_key_of(s_label)
            e_pk = primary_key_of(e_label)
            tx.run(
                f"MATCH (s:`{s_label}` {{`{s_pk}`: $s_id}})-[r:`{rt}`]->"
                f"(e:`{e_label}` {{`{e_pk}`: $e_id}}) DELETE r",
                s_id=s_id, e_id=e_id,
            )
            rels_deleted += 1

    # 4. Node KHONG co trong snapshot (do thao tac tao ra) → detach delete
    for nsum in payload.get("nodes", []):
        if (nsum["label"], nsum["id"]) not in snapshot_node_props:
            pk = primary_key_of(nsum["label"])
            tx.run(
                f"MATCH (n:`{nsum['label']}` {{`{pk}`: $pk_val}}) DETACH DELETE n",
                pk_val=nsum["id"],
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
