"""
Auth API — đăng nhập/đăng xuất, thông tin phiên, và quản lý tài khoản (admin).
"""
from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel

from app.config import SESSION_TTL_HOURS
from app.services import auth

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginIn(BaseModel):
    email: str
    password: str


class NewUserIn(BaseModel):
    email: str
    name: str
    password: str
    role: str = "expert"


class PasswordIn(BaseModel):
    new_password: str


@router.post("/login")
def login(body: LoginIn, response: Response):
    user = auth.authenticate(body.email, body.password)
    token = auth.create_token(user["email"], user["role"], user["name"])
    response.set_cookie(
        key=auth.COOKIE_NAME, value=token,
        httponly=True, samesite="lax", path="/",
        max_age=SESSION_TTL_HOURS * 3600,
    )
    # báo FE nếu là mật khẩu tạm cần đổi
    full = auth.get_user(user["email"]) or {}
    return {**user, "must_change_pw": bool(full.get("must_change_pw"))}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(auth.COOKIE_NAME, path="/")
    return {"success": True}


@router.get("/me")
def me(request: Request):
    """Trả identity hiện tại (null nếu chưa đăng nhập). FE gọi lúc load để gate UI."""
    return auth.get_current_user(request)


@router.post("/change-password")
def change_password(body: PasswordIn, user: dict = Depends(auth.require_user)):
    return auth.set_password(user["email"], body.new_password)


# ---- Quản lý tài khoản (admin) ----
@router.get("/users")
def list_users(role: str | None = None, _admin: dict = Depends(auth.require_admin)):
    return auth.list_users(role)


@router.post("/users")
def create_user(body: NewUserIn, _admin: dict = Depends(auth.require_admin)):
    return auth.create_user(body.email, body.name, body.password, body.role)


@router.delete("/users/{email}")
def delete_user(email: str, _admin: dict = Depends(auth.require_admin)):
    return auth.delete_user(email)
