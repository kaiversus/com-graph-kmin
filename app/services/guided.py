"""
Guided build — logic dùng chung để "áp" một cây draft (node + quan hệ) vào graph.

Trước đây nằm trong router recommend.commit_tree. Tách ra để CẢ HAI đường dùng lại:
  - Admin commit trực tiếp (router recommend).
  - Admin duyệt một ChangeRequest của chuyên gia (services.change_request).

Nhận draft dạng dict thuần (không phụ thuộc pydantic):
  nodes: [{"temp_id": str, "label": str, "props": {...}}]
  relationships: [{"rel_type", "start_label", "start", "end_label", "end", "props"}]
      start/end = temp_id (node mới trong cây) HOẶC id thật (node đã tồn tại).

Toàn bộ id được CẤP LẠI mỗi lần áp (không lưu id đã cấp) → 2 request pending
không giành nhau id.
"""
from app.config import NODE_LABELS, primary_key_of
from app.services.importer import run_import
from app.services.recommender import allocate_tree_ids, resolve_ref
from app.services.validator import validate_node_record, validate_relationship_record


class BuildValidationError(Exception):
    """Draft không hợp lệ (trước khi ghi). Mang theo danh sách lỗi + id_map để FE hiện."""

    def __init__(self, errors: list[dict], id_map: dict | None = None):
        super().__init__("Draft không hợp lệ")
        self.errors = errors
        self.id_map = id_map or {}


def prepare_build(nodes: list[dict], relationships: list[dict]) -> tuple[list[dict], list[dict], dict]:
    """
    Cấp id thật cho node mới, resolve tham chiếu trong quan hệ, validate toàn bộ.
    Trả (nodes_to_write, rels_to_write, id_map). Raise BuildValidationError nếu sai.
    KHÔNG ghi DB — dùng được cho cả dry-run (validate lúc chuyên gia gửi).
    """
    if not nodes and not relationships:
        raise BuildValidationError([{"row": -1, "field": "_draft", "message": "Draft rỗng, không có gì để áp"}])

    temp_ids = [n["temp_id"] for n in nodes]
    if len(temp_ids) != len(set(temp_ids)):
        raise BuildValidationError([{"row": -1, "field": "_draft", "message": "temp_id bị trùng trong draft"}])

    try:
        id_map = allocate_tree_ids(nodes)
    except Exception as e:  # noqa: BLE001 — gói lại cho FE
        raise BuildValidationError([{"row": -1, "field": "_id", "message": f"Không cấp được id: {e}"}])

    errors: list[dict] = []
    nodes_to_write: list[dict] = []
    for i, n in enumerate(nodes):
        if n["label"] not in NODE_LABELS:
            errors.append({"row": i, "field": "_label", "message": f"Unknown label '{n['label']}'"})
            continue
        pk = primary_key_of(n["label"])
        props = dict(n.get("props") or {})
        if not props.get(pk):
            props[pk] = id_map[n["temp_id"]]
        clean, errs = validate_node_record(n["label"], props, row_index=i)
        errors.extend(errs)
        if clean:
            nodes_to_write.append({"label": n["label"], "props": clean})

    rels_to_write: list[dict] = []
    for i, r in enumerate(relationships):
        record = {
            "start_label": r["start_label"],
            "start_id": resolve_ref(r["start"], id_map),
            "end_label": r["end_label"],
            "end_id": resolve_ref(r["end"], id_map),
            **(r.get("props") or {}),
        }
        clean, errs = validate_relationship_record(r["rel_type"], record, row_index=i)
        errors.extend(errs)
        if clean:
            rels_to_write.append({"rel_type": r["rel_type"], **clean})

    if errors:
        raise BuildValidationError(errors, id_map)
    return nodes_to_write, rels_to_write, id_map


def apply_guided_build(actor: str, nodes: list[dict], relationships: list[dict], option: str = "recommend_guided_build") -> dict:
    """
    Chuẩn bị (cấp id + validate) rồi ghi trong 1 transaction (run_import enforce
    mọi ràng buộc đồ thị). Raise BuildValidationError nếu draft sai; các lỗi khác
    (vi phạm ràng buộc transaction) để nguyên cho caller bắt.
    """
    nodes_to_write, rels_to_write, id_map = prepare_build(nodes, relationships)
    result = run_import(actor=actor, option=option, nodes=nodes_to_write, relationships=rels_to_write)
    return {"id_map": id_map, **result}
