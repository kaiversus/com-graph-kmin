"""
Change Request workflow — chuyên gia gửi đề xuất chỉnh sửa, admin duyệt mới ghi.

Hai loại node hệ thống (giống AuditLog, KHÔNG nằm trong NODE_LABELS của graph nghiệp vụ):
  - Expert:        {id_expert, name, created_at}  — admin quản danh sách chuyên gia.
  - ChangeRequest: đề xuất đang chờ/đã duyệt/đã từ chối, lưu payload dạng JSON.

Luồng:
  chuyên gia submit → validate (dry-run, KHÔNG ghi) → lưu ChangeRequest 'pending'
  admin approve      → chạy đúng đường ghi thật (apply_guided_build / run_update_* /
                       run_delete_*) trong 1 transaction có ràng buộc + snapshot →
                       thành công: 'approved' + gắn audit_id (Restore được như mọi op).
  admin reject       → 'rejected' + lý do.
"""
import json
import uuid

from app.config import (
    get_driver,
    NEO4J_DATABASE,
    NODE_LABELS,
    NODE_PROP_SCHEMA,
    RELATIONSHIP_SCHEMA,
    primary_key_of,
)
from app.services.guided import apply_guided_build, prepare_build, BuildValidationError
from app.services.validator import validate_node_record, validate_relationship_record
from app.services.importer import (
    run_update_node,
    run_delete_node,
    run_update_rel,
    run_delete_rel,
    run_restore,
)

# Thao tác đơn + "batch" (gom nhiều thao tác đơn thành 1 đề xuất).
_SINGLE_KINDS = {"build", "update_node", "delete_node", "update_rel", "delete_rel"}
CR_KINDS = _SINGLE_KINDS | {"batch"}


class ChangeRequestError(Exception):
    """Lỗi nghiệp vụ change-request (không tìm thấy, sai trạng thái, validate...)."""

    def __init__(self, message: str, errors: list | None = None, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.errors = errors or []
        self.status_code = status_code


# ---------------------------------------------------------------------------
# SUBMIT (chuyên gia)
# ---------------------------------------------------------------------------
def _summarize(kind: str, data: dict) -> str:
    if kind == "batch":
        ops = data.get("operations") or []
        return f"Lô {len(ops)} thao tác"
    if kind == "build":
        n = len(data.get("nodes") or [])
        m = len(data.get("relationships") or [])
        labels = sorted({x.get("label") for x in (data.get("nodes") or []) if x.get("label")})
        tail = f" ({', '.join(labels)})" if labels else ""
        return f"Thêm {n} node, {m} quan hệ{tail}"
    if kind == "update_node":
        return f"Sửa {data['label']}: {data['node_id']}"
    if kind == "delete_node":
        return f"Xoá {data['label']}: {data['node_id']}"
    if kind == "update_rel":
        return f"Sửa quan hệ {data['rel_type']}: {data['start_id']} → {data['end_id']}"
    if kind == "delete_rel":
        return f"Xoá quan hệ {data['rel_type']}: {data['start_id']} → {data['end_id']}"
    return kind


def _validate_submit(kind: str, data: dict) -> dict:
    """Dry-run validate theo loại; trả về data ĐÃ CHUẨN HÓA để lưu. Raise nếu sai."""
    if kind == "batch":
        ops = data.get("operations") or []
        if not ops:
            raise ChangeRequestError("Lô rỗng — chưa có thao tác nào")
        clean_ops = []
        for i, op in enumerate(ops):
            k = op.get("kind")
            if k not in _SINGLE_KINDS:
                raise ChangeRequestError(f"Thao tác #{i + 1}: kind '{k}' không hợp lệ")
            try:
                cd = _validate_submit(k, op.get("data") or {})
            except ChangeRequestError as e:
                raise ChangeRequestError(f"Thao tác #{i + 1}: {e.message}", errors=e.errors)
            clean_ops.append({"kind": k, "data": cd, "summary": (op.get("summary") or _summarize(k, cd))})
        return {"operations": clean_ops}

    if kind == "build":
        # prepare_build cấp id thử + validate; KHÔNG ghi. Ném BuildValidationError nếu sai.
        try:
            prepare_build(list(data.get("nodes") or []), list(data.get("relationships") or []))
        except BuildValidationError as e:
            raise ChangeRequestError("Draft không hợp lệ", errors=e.errors)
        # Lưu nguyên draft thô (temp_id) — approve sẽ cấp id lại để tránh giành id.
        return {"nodes": data.get("nodes") or [], "relationships": data.get("relationships") or []}

    if kind in ("update_node", "delete_node"):
        label, node_id = data.get("label"), data.get("node_id")
        if label not in NODE_LABELS:
            raise ChangeRequestError(f"Label '{label}' không hợp lệ")
        if not node_id:
            raise ChangeRequestError("Thiếu node_id")
        if kind == "delete_node":
            return {"label": label, "node_id": node_id}
        pk = primary_key_of(label)
        props = {**(data.get("properties") or {}), pk: node_id}
        clean, errs = validate_node_record(label, props)
        if errs:
            raise ChangeRequestError("Thuộc tính node không hợp lệ", errors=errs)
        return {"label": label, "node_id": node_id, "properties": clean}

    if kind in ("update_rel", "delete_rel"):
        rt = data.get("rel_type")
        if rt not in RELATIONSHIP_SCHEMA:
            raise ChangeRequestError(f"Quan hệ '{rt}' không hợp lệ")
        base = {
            "rel_type": rt,
            "start_label": data.get("start_label"), "start_id": data.get("start_id"),
            "end_label": data.get("end_label"), "end_id": data.get("end_id"),
        }
        if kind == "delete_rel":
            return base
        record = {
            "start_label": base["start_label"], "start_id": base["start_id"],
            "end_label": base["end_label"], "end_id": base["end_id"],
            **(data.get("properties") or {}),
        }
        clean, errs = validate_relationship_record(rt, record)
        if errs:
            raise ChangeRequestError("Thuộc tính quan hệ không hợp lệ", errors=errs)
        return {**base, "properties": clean["props"]}

    raise ChangeRequestError(f"kind '{kind}' không hợp lệ")


def create_change_request(expert_email: str, expert_name: str, kind: str, data: dict, note: str = "") -> dict:
    """expert_email / expert_name lấy từ PHIÊN ĐĂNG NHẬP (đã xác thực), không tin client."""
    if kind not in CR_KINDS:
        raise ChangeRequestError(f"kind '{kind}' không hợp lệ")
    clean_data = _validate_submit(kind, data)
    summary = _summarize(kind, clean_data)

    cr_id = f"cr-{uuid.uuid4().hex[:12]}"
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        s.run(
            """
            CREATE (c:ChangeRequest {
                id: $id, expert_id: $eid, expert_name: $ename,
                kind: $kind, note: $note, summary: $summary,
                payload: $payload, status: 'pending', created_at: datetime()
            })
            """,
            id=cr_id, eid=expert_email, ename=expert_name,
            kind=kind, note=(note or "").strip(), summary=summary,
            payload=json.dumps(clean_data, ensure_ascii=False, default=str),
        )
    return {"id": cr_id, "kind": kind, "summary": summary, "status": "pending"}


# ---------------------------------------------------------------------------
# LIST / GET (admin)
# ---------------------------------------------------------------------------
def _row_to_cr(rec, include_payload=False) -> dict:
    out = {
        "id": rec["id"], "expert_id": rec["expert_id"], "expert_name": rec["expert_name"],
        "kind": rec["kind"], "note": rec["note"], "summary": rec["summary"],
        "status": rec["status"], "created_at": rec["created_at"],
        "reviewed_by": rec.get("reviewed_by"), "reviewed_at": rec.get("reviewed_at"),
        "review_note": rec.get("review_note"), "audit_id": rec.get("audit_id"),
        "audit_ids": json.loads(rec["audit_ids"]) if rec.get("audit_ids") else None,
        "last_error": rec.get("last_error"),
    }
    if include_payload:
        out["payload"] = json.loads(rec["payload"]) if rec.get("payload") else None
    return out


_CR_RETURN = (
    "RETURN c.id AS id, c.expert_id AS expert_id, c.expert_name AS expert_name, "
    "c.kind AS kind, c.note AS note, c.summary AS summary, c.status AS status, "
    "toString(c.created_at) AS created_at, c.reviewed_by AS reviewed_by, "
    "toString(c.reviewed_at) AS reviewed_at, c.review_note AS review_note, "
    "c.audit_id AS audit_id, c.audit_ids AS audit_ids, "
    "c.last_error AS last_error, c.payload AS payload"
)


def list_my_requests(email: str) -> list[dict]:
    """Đề xuất của CHÍNH người đang đăng nhập (chuyên gia xem phản hồi của mình)."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        rows = s.run(
            f"MATCH (c:ChangeRequest) WHERE c.expert_id = $email {_CR_RETURN} "
            "ORDER BY c.created_at DESC",
            email=email,
        )
        return [_row_to_cr(r, include_payload=True) for r in rows]


def list_change_requests(status: str | None = None) -> list[dict]:
    driver = get_driver()
    where = "WHERE c.status = $status " if status else ""
    with driver.session(database=NEO4J_DATABASE) as s:
        rows = s.run(
            f"MATCH (c:ChangeRequest) {where}{_CR_RETURN} ORDER BY c.created_at DESC",
            status=status,
        )
        return [_row_to_cr(r) for r in rows]


def get_change_request(cr_id: str, include_payload=True) -> dict:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        rec = s.run(f"MATCH (c:ChangeRequest {{id: $id}}) {_CR_RETURN}", id=cr_id).single()
    if not rec:
        raise ChangeRequestError(f"Không tìm thấy đề xuất '{cr_id}'", status_code=404)
    cr = _row_to_cr(rec, include_payload=include_payload)
    if include_payload:
        # Diễn giải dễ đọc (so với trạng thái HIỆN TẠI trong DB): thêm/sửa/xoá gì.
        cr["operations"] = describe_operations(cr)
    return cr


# ---------------------------------------------------------------------------
# DIỄN GIẢI THAY ĐỔI (cho admin xem: thêm/sửa/xoá cái gì, cũ → mới)
# ---------------------------------------------------------------------------
def _read_node(label: str, node_id: str) -> dict | None:
    pk = primary_key_of(label)
    with get_driver().session(database=NEO4J_DATABASE) as s:
        rec = s.run(f"MATCH (n:`{label}` {{`{pk}`: $id}}) RETURN properties(n) AS p", id=node_id).single()
    return dict(rec["p"]) if rec else None


def _count_node_rels(label: str, node_id: str) -> int:
    pk = primary_key_of(label)
    with get_driver().session(database=NEO4J_DATABASE) as s:
        rec = s.run(f"MATCH (n:`{label}` {{`{pk}`: $id}})-[r]-() RETURN count(r) AS c", id=node_id).single()
    return rec["c"] if rec else 0


def _read_rel(rt: str, sl: str, sid: str, el: str, eid: str) -> dict | None:
    spk, epk = primary_key_of(sl), primary_key_of(el)
    with get_driver().session(database=NEO4J_DATABASE) as s:
        rec = s.run(
            f"MATCH (s:`{sl}` {{`{spk}`: $sid}})-[r:`{rt}`]->(e:`{el}` {{`{epk}`: $eid}}) "
            "RETURN properties(r) AS p", sid=sid, eid=eid,
        ).single()
    return dict(rec["p"]) if rec else None


def _scalar(v):
    """Đưa giá trị Neo4j về kiểu JSON gọn (DateTime/temporal → chuỗi)."""
    if v is None or isinstance(v, (str, int, float, bool)):
        return v
    if isinstance(v, list):
        return [_scalar(x) for x in v]
    return str(v)


def _clean_props(props: dict | None, spec: dict) -> dict:
    """Bỏ prop TỰ ĐỘNG (vd lastUpdatedAt do server set) + gọn hoá giá trị. spec =
    schema props của node/rel để biết prop nào `auto`."""
    out = {}
    for k, v in (props or {}).items():
        if (spec.get(k) or {}).get("auto"):
            continue
        out[k] = _scalar(v)
    return out


def _diff(old: dict, new: dict) -> dict:
    """So sánh hiện tại (old) với đề xuất (new). Cả hai đã _clean_props."""
    changed = [{"field": k, "old": old[k], "new": v} for k, v in new.items() if k in old and old[k] != v]
    added = [{"field": k, "new": v} for k, v in new.items() if k not in old]
    removed = [{"field": k, "old": v} for k, v in old.items() if k not in new]
    return {"changed": changed, "added": added, "removed": removed}


def _op_view(kind: str, data: dict) -> dict:
    if kind == "build":
        return {
            "action": "add",
            "title": f"Thêm {len(data.get('nodes') or [])} node, {len(data.get('relationships') or [])} quan hệ",
            "add_nodes": [{"label": n["label"], "props": {k: _scalar(v) for k, v in (n.get("props") or {}).items()}}
                          for n in data.get("nodes", [])],
            "add_rels": [{"rel_type": r["rel_type"], "start": r["start"], "end": r["end"],
                          "props": {k: _scalar(v) for k, v in (r.get("props") or {}).items()}}
                         for r in data.get("relationships", [])],
        }
    if kind == "update_node":
        nspec = NODE_PROP_SCHEMA.get(data["label"], {})
        cur = _read_node(data["label"], data["node_id"])
        return {"action": "edit", "title": f"Sửa {data['label']}: {data['node_id']}", "exists": cur is not None,
                "diff": _diff(_clean_props(cur, nspec), _clean_props(data["properties"], nspec))}
    if kind == "delete_node":
        nspec = NODE_PROP_SCHEMA.get(data["label"], {})
        cur = _read_node(data["label"], data["node_id"])
        return {"action": "delete", "title": f"Xoá {data['label']}: {data['node_id']}",
                "exists": cur is not None, "current": _clean_props(cur, nspec) if cur else None,
                "rels_deleted": _count_node_rels(data["label"], data["node_id"]) if cur else 0}
    if kind == "update_rel":
        rspec = (RELATIONSHIP_SCHEMA.get(data["rel_type"], {}) or {}).get("props", {})
        cur = _read_rel(data["rel_type"], data["start_label"], data["start_id"], data["end_label"], data["end_id"])
        return {"action": "edit",
                "title": f"Sửa quan hệ {data['rel_type']}: {data['start_id']} → {data['end_id']}", "exists": cur is not None,
                "diff": _diff(_clean_props(cur, rspec), _clean_props(data["properties"], rspec))}
    if kind == "delete_rel":
        rspec = (RELATIONSHIP_SCHEMA.get(data["rel_type"], {}) or {}).get("props", {})
        cur = _read_rel(data["rel_type"], data["start_label"], data["start_id"], data["end_label"], data["end_id"])
        return {"action": "delete",
                "title": f"Xoá quan hệ {data['rel_type']}: {data['start_id']} → {data['end_id']}",
                "exists": cur is not None, "current": _clean_props(cur, rspec) if cur else None}
    return {"action": "?", "title": kind}


def describe_operations(cr: dict) -> list[dict]:
    payload = cr.get("payload") or {}
    if cr["kind"] == "batch":
        return [_op_view(op["kind"], op["data"]) for op in payload.get("operations", [])]
    return [_op_view(cr["kind"], payload)]


def _set_cr_status(cr_id, status, admin, review_note=None, audit_id=None, last_error=None, audit_ids=None):
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        s.run(
            "MATCH (c:ChangeRequest {id: $id}) "
            "SET c.status = $status, c.reviewed_by = $admin, c.reviewed_at = datetime(), "
            "    c.review_note = $note, c.audit_id = $audit, c.last_error = $err, "
            "    c.audit_ids = $audit_ids",
            id=cr_id, status=status, admin=admin, note=review_note,
            audit=audit_id, err=last_error,
            audit_ids=json.dumps(audit_ids) if audit_ids else None,
        )


# ---------------------------------------------------------------------------
# APPROVE / REJECT (admin)
# ---------------------------------------------------------------------------
def _apply(kind: str, data: dict, actor: str, cr_id: str) -> dict:
    """Chạy đường GHI THẬT tương ứng loại. Raise nếu vi phạm ràng buộc."""
    option = f"change_request:{cr_id}"
    if kind == "batch":
        # Áp tuần tự. Nếu 1 thao tác lỗi → RESTORE bù các thao tác đã áp (đảo ngược)
        # để không để lại trạng thái nửa vời (atomic kiểu compensation).
        applied: list[str] = []
        try:
            for i, op in enumerate(data["operations"]):
                res = _apply(op["kind"], op["data"], actor, cr_id)
                if res.get("audit_id"):
                    applied.append(res["audit_id"])
        except Exception as e:
            for aid in reversed(applied):
                try:
                    run_restore(aid)
                except Exception:
                    pass
            raise ValueError(f"Thao tác #{i + 1} lỗi ({e}) — đã hoàn tác {len(applied)} thao tác trước đó")
        return {"audit_ids": applied, "audit_id": applied[0] if applied else None,
                "op_count": len(data["operations"])}
    if kind == "build":
        return apply_guided_build(actor, data["nodes"], data["relationships"], option=option)
    if kind == "update_node":
        return run_update_node(actor, data["label"], data["node_id"], data["properties"])
    if kind == "delete_node":
        return run_delete_node(actor, data["label"], data["node_id"])
    if kind == "update_rel":
        return run_update_rel(actor, data["rel_type"], data["start_label"], data["start_id"],
                              data["end_label"], data["end_id"], data["properties"])
    if kind == "delete_rel":
        return run_delete_rel(actor, data["rel_type"], data["start_label"], data["start_id"],
                              data["end_label"], data["end_id"])
    raise ChangeRequestError(f"kind '{kind}' không hợp lệ")


def approve_change_request(cr_id: str, admin: str = "admin") -> dict:
    cr = get_change_request(cr_id, include_payload=True)
    if cr["status"] != "pending":
        raise ChangeRequestError(f"Đề xuất đã ở trạng thái '{cr['status']}', không duyệt lại được")

    # actor = chuyên gia (truy vết provenance); ai duyệt lưu ở reviewed_by.
    actor = cr["expert_id"]
    try:
        result = _apply(cr["kind"], cr["payload"], actor, cr_id)
    except BuildValidationError as e:
        _set_cr_status(cr_id, "pending", admin, last_error="; ".join(
            f"{x.get('field')}: {x.get('message')}" for x in e.errors) or "validate lỗi")
        raise ChangeRequestError("Draft không còn hợp lệ (dữ liệu đã đổi?)", errors=e.errors, status_code=409)
    except Exception as e:  # noqa: BLE001 — vi phạm ràng buộc / lỗi ghi
        _set_cr_status(cr_id, "pending", admin, last_error=str(e))
        raise ChangeRequestError(f"Không ghi được (đã rollback): {e}", status_code=409)

    audit_id = result.get("audit_id")
    audit_ids = result.get("audit_ids") or ([audit_id] if audit_id else None)
    _set_cr_status(cr_id, "approved", admin, audit_id=audit_id, audit_ids=audit_ids)
    return {"success": True, "id": cr_id, "status": "approved", "audit_id": audit_id, "result": result}


def reject_change_request(cr_id: str, admin: str = "admin", reason: str = "") -> dict:
    cr = get_change_request(cr_id, include_payload=False)
    if cr["status"] != "pending":
        raise ChangeRequestError(f"Đề xuất đã ở trạng thái '{cr['status']}', không từ chối được")
    _set_cr_status(cr_id, "rejected", admin, review_note=(reason or "").strip())
    return {"success": True, "id": cr_id, "status": "rejected"}
