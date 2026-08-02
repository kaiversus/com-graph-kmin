"""
Review workflow API — đề xuất chỉnh sửa (ChangeRequest).

Chuyên gia gửi đề xuất (không ghi thẳng); admin duyệt mới commit. Danh tính lấy từ
PHIÊN ĐĂNG NHẬP (cookie), không tin client. Quản lý tài khoản nằm ở routers.auth.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services import change_request as cr
from app.services.auth import require_user, require_admin

router = APIRouter(prefix="/api", tags=["review"])


def _raise(e: cr.ChangeRequestError):
    raise HTTPException(status_code=e.status_code, detail={"message": e.message, "errors": e.errors})


class ChangeRequestIn(BaseModel):
    kind: str  # build | update_node | delete_node | update_rel | delete_rel
    data: dict = Field(default_factory=dict)
    note: str = ""


class ReviewIn(BaseModel):
    reason: str = ""


@router.post("/change-request")
def api_create_cr(body: ChangeRequestIn, user: dict = Depends(require_user)):
    # Danh tính người gửi lấy từ phiên — chuyên gia hoặc admin đều gửi được.
    try:
        return cr.create_change_request(user["email"], user["name"], body.kind, body.data, body.note)
    except cr.ChangeRequestError as e:
        _raise(e)


@router.get("/my-requests")
def api_my_requests(user: dict = Depends(require_user)):
    """Đề xuất của chính người đang đăng nhập + phản hồi của admin."""
    return cr.list_my_requests(user["email"])


@router.get("/change-request")
def api_list_cr(status: str | None = None, _admin: dict = Depends(require_admin)):
    return cr.list_change_requests(status)


@router.get("/change-request/{cr_id}")
def api_get_cr(cr_id: str, _admin: dict = Depends(require_admin)):
    try:
        return cr.get_change_request(cr_id)
    except cr.ChangeRequestError as e:
        _raise(e)


@router.post("/change-request/{cr_id}/approve")
def api_approve_cr(cr_id: str, admin: dict = Depends(require_admin)):
    try:
        return cr.approve_change_request(cr_id, admin["email"])
    except cr.ChangeRequestError as e:
        _raise(e)


@router.post("/change-request/{cr_id}/reject")
def api_reject_cr(cr_id: str, body: ReviewIn, admin: dict = Depends(require_admin)):
    try:
        return cr.reject_change_request(cr_id, admin["email"], body.reason)
    except cr.ChangeRequestError as e:
        _raise(e)
