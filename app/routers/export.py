"""
Export — do du lieu ra JSON / CSV / Cypher.

Chi doc, khong ghi. File Cypher sinh ra chay lai duoc tren instance trong
(MERGE node truoc, MATCH+MERGE rel sau).
"""
import csv
import io

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.config import (
    get_driver,
    NEO4J_DATABASE,
    NODE_LABELS,
    RELATIONSHIP_SCHEMA,
    primary_key_of,
)

router = APIRouter(prefix="/api", tags=["export"])


def _pk_or_default(label: str) -> str:
    """Primary key cua label; node la (khong nam trong schema) thi doan la 'id'."""
    return primary_key_of(label) if label in NODE_LABELS else "id"


@router.get("/export/stats")
def export_stats():
    """Return counts per label and per relationship type for the export UI."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        node_counts = {}
        for label in NODE_LABELS:
            rec = session.run(f"MATCH (n:`{label}`) RETURN count(n) AS c").single()
            node_counts[label] = rec["c"] if rec else 0
        rel_counts = {}
        for rtype in RELATIONSHIP_SCHEMA:
            rec = session.run(
                f"MATCH ()-[r:`{rtype}`]->() RETURN count(r) AS c"
            ).single()
            rel_counts[rtype] = rec["c"] if rec else 0
    return {"nodes": node_counts, "relationships": rel_counts}


@router.get("/export/nodes/{label}")
def export_nodes(
    label: str,
    fmt: str = Query("json", pattern="^(json|csv)$"),
):
    """Export all nodes of a label as JSON or CSV."""
    if label not in NODE_LABELS:
        raise HTTPException(400, f"Unknown label: {label}")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            f"MATCH (n:`{label}`) RETURN properties(n) AS props ORDER BY n.`{primary_key_of(label)}`"
        ).data()
    rows = [r["props"] for r in records]

    if fmt == "csv":
        return _to_csv_response(rows, f"nodes_{label}.csv")
    return rows


@router.get("/export/relationships/{rel_type}")
def export_relationships(
    rel_type: str,
    fmt: str = Query("json", pattern="^(json|csv)$"),
):
    """Export all relationships of a type as JSON or CSV."""
    if rel_type not in RELATIONSHIP_SCHEMA:
        raise HTTPException(400, f"Unknown relationship type: {rel_type}")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        records = session.run(
            f"MATCH (s)-[r:`{rel_type}`]->(e) "
            "RETURN labels(s)[0] AS start_label, properties(s) AS start_props, "
            "       labels(e)[0] AS end_label, properties(e) AS end_props, "
            "       properties(r) AS rel_props"
        ).data()

    rows = []
    for rec in records:
        sl = rec["start_label"]
        el = rec["end_label"]
        rows.append({
            "start_label": sl,
            "start_id": rec["start_props"].get(_pk_or_default(sl), ""),
            "end_label": el,
            "end_id": rec["end_props"].get(_pk_or_default(el), ""),
            **rec["rel_props"],
        })

    if fmt == "csv":
        return _to_csv_response(rows, f"rels_{rel_type}.csv")
    return rows


@router.get("/export/full")
def export_full_json():
    """Export entire graph (nodes + relationships) as a single JSON structure."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        nodes_out = {}
        for label in NODE_LABELS:
            pk = primary_key_of(label)
            records = session.run(
                f"MATCH (n:`{label}`) RETURN properties(n) AS props ORDER BY n.`{pk}`"
            ).data()
            nodes_out[label] = [r["props"] for r in records]

        rels_out = {}
        for rtype in RELATIONSHIP_SCHEMA:
            records = session.run(
                f"MATCH (s)-[r:`{rtype}`]->(e) "
                "RETURN labels(s)[0] AS sl, properties(s) AS sp, "
                "       labels(e)[0] AS el, properties(e) AS ep, "
                "       properties(r) AS rp"
            ).data()
            rows = []
            for rec in records:
                sl = rec["sl"]
                el = rec["el"]
                rows.append({
                    "start_label": sl,
                    "start_id": rec["sp"].get(_pk_or_default(sl), ""),
                    "end_label": el,
                    "end_id": rec["ep"].get(_pk_or_default(el), ""),
                    "properties": rec["rp"],
                })
            if rows:
                rels_out[rtype] = rows

    return {"nodes": nodes_out, "relationships": rels_out}


@router.get("/export/cypher")
def export_cypher():
    """Export graph as re-importable Cypher statements."""
    driver = get_driver()
    statements: list[str] = []
    with driver.session(database=NEO4J_DATABASE) as session:
        for label in NODE_LABELS:
            pk = primary_key_of(label)
            records = session.run(
                f"MATCH (n:`{label}`) RETURN properties(n) AS props ORDER BY n.`{pk}`"
            ).data()
            for rec in records:
                props_str = ", ".join(
                    f"{k}: {_cypher_val(v)}" for k, v in rec["props"].items()
                )
                statements.append(f"MERGE (n:`{label}` {{{props_str}}});")

        for rtype in RELATIONSHIP_SCHEMA:
            records = session.run(
                f"MATCH (s)-[r:`{rtype}`]->(e) "
                "RETURN labels(s)[0] AS sl, properties(s) AS sp, "
                "       labels(e)[0] AS el, properties(e) AS ep, "
                "       properties(r) AS rp"
            ).data()
            for rec in records:
                sl, el = rec["sl"], rec["el"]
                spk = _pk_or_default(sl)
                epk = _pk_or_default(el)
                sid = _cypher_val(rec["sp"].get(spk, ""))
                eid = _cypher_val(rec["ep"].get(epk, ""))
                rp = rec["rp"]
                rp_str = ""
                if rp:
                    rp_str = " {" + ", ".join(
                        f"{k}: {_cypher_val(v)}" for k, v in rp.items()
                    ) + "}"
                statements.append(
                    f"MATCH (s:`{sl}` {{{spk}: {sid}}}), (e:`{el}` {{{epk}: {eid}}}) "
                    f"MERGE (s)-[:`{rtype}`{rp_str}]->(e);"
                )

    text = "\n".join(statements)
    return StreamingResponse(
        io.StringIO(text),
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=graph_export.cypher"},
    )


@router.get("/export/node/{label}/{node_id}")
def export_single_node(label: str, node_id: str):
    """Return all properties + connected relationships of a single node."""
    if label not in NODE_LABELS:
        raise HTTPException(400, f"Unknown label: {label}")
    pk = primary_key_of(label)
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        rec = session.run(
            f"MATCH (n:`{label}` {{{pk}: $nid}}) RETURN properties(n) AS props",
            nid=node_id,
        ).single()
        if not rec:
            raise HTTPException(404, "Node not found")
        props = rec["props"]

        rels_out = session.run(
            f"MATCH (n:`{label}` {{{pk}: $nid}})-[r]-(m) "
            "WHERE NOT m:AuditLog "
            "RETURN type(r) AS rtype, properties(r) AS rprops, "
            "       startNode(r) = n AS is_outgoing, "
            "       labels(m)[0] AS other_label, properties(m) AS other_props",
            nid=node_id,
        ).data()

        connections = []
        for rel in rels_out:
            ol = rel["other_label"]
            opk = _pk_or_default(ol)
            connections.append({
                "rel_type": rel["rtype"],
                "direction": "outgoing" if rel["is_outgoing"] else "incoming",
                "rel_props": rel["rprops"],
                "other_label": ol,
                "other_id": rel["other_props"].get(opk, ""),
                "other_name": rel["other_props"].get("name", rel["other_props"].get(opk, "")),
            })

    return {"label": label, "properties": props, "connections": connections}


# ---- Helpers ----------------------------------------------------------------


def _cypher_val(v) -> str:
    if isinstance(v, str):
        return "'" + v.replace("\\", "\\\\").replace("'", "\\'") + "'"
    if isinstance(v, bool):
        return "true" if v else "false"
    if v is None:
        return "null"
    return str(v)


def _to_csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        return StreamingResponse(
            io.StringIO(""),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    buf = io.StringIO()
    all_keys = list(dict.fromkeys(k for row in rows for k in row))
    writer = csv.DictWriter(buf, fieldnames=all_keys)
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
