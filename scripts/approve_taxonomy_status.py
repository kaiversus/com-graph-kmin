"""Duyệt hàng loạt taxonomy graph-owned sang status=approved.

Mặc định là dry-run. Chỉ ghi Neo4j khi truyền --apply.

Vi du:
  python scripts/approve_taxonomy_status.py
  python scripts/approve_taxonomy_status.py --apply --actor "thienbao"
"""

import argparse
from collections import Counter
from pathlib import Path
import sys


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import NEO4J_DATABASE, get_driver, primary_key_of
from app.services.snapshot import snapshot_nodes, update_audit_status, write_audit_log


TAXONOMY_LABELS = ("Knowledge", "KnowledgeArea", "JobRole")


def find_pending_targets(tx):
    targets = []
    for label in TAXONOMY_LABELS:
        primary_key = primary_key_of(label)
        query = (
            f"MATCH (n:`{label}`) "
            "WHERE coalesce(n.status, 'draft') <> 'approved' "
            f"RETURN n.`{primary_key}` AS id"
        )
        targets.extend((label, record["id"]) for record in tx.run(query))
    return targets


def counts_by_label(targets):
    counts = Counter(label for label, _ in targets)
    return {label: counts[label] for label in TAXONOMY_LABELS}


def apply_approval(tx, actor):
    targets = find_pending_targets(tx)
    counts = counts_by_label(targets)
    if not targets:
        return {"changed": counts, "audit_id": None}

    snapshots = snapshot_nodes(tx, targets)
    audit_id = write_audit_log(
        tx,
        actor,
        "approve_taxonomy_status",
        "maintenance",
        {"labels": TAXONOMY_LABELS, "status": "approved", "changed": counts},
        snapshots,
        [],
        status="pending",
    )
    for label in TAXONOMY_LABELS:
        primary_key = primary_key_of(label)
        ids = [node_id for target_label, node_id in targets if target_label == label]
        if not ids:
            continue
        tx.run(
            f"MATCH (n:`{label}`) WHERE n.`{primary_key}` IN $ids SET n.status = 'approved'",
            ids=ids,
        )
    update_audit_status(tx, audit_id, "committed")
    return {"changed": counts, "audit_id": audit_id}


def parse_args():
    parser = argparse.ArgumentParser(description="Duyệt Knowledge, KnowledgeArea và JobRole trong Neo4j.")
    parser.add_argument("--apply", action="store_true", help="Ghi thay đổi. Bỏ qua cờ này thì chỉ dry-run.")
    parser.add_argument("--actor", default="admin", help="Người thực hiện, lưu trong AuditLog khi --apply.")
    return parser.parse_args()


def main():
    args = parse_args()
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        if not args.apply:
            targets = session.execute_read(find_pending_targets)
            print({"mode": "dry-run", "would_change": counts_by_label(targets)})
            return
        result = session.execute_write(apply_approval, args.actor)
    print({"mode": "apply", **result})


if __name__ == "__main__":
    main()
