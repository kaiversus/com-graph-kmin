"""
Auth — đăng nhập bằng email + mật khẩu, phiên giữ bằng cookie ký HMAC.

Tài khoản lưu ở node `AppUser` (node HỆ THỐNG, tách hẳn Account nghiệp vụ):
    { email (khóa chính, lowercase), name, role: 'admin'|'expert',
      password_hash, created_at, must_change_pw }

Bảo mật:
  - Mật khẩu băm PBKDF2-HMAC-SHA256 + salt riêng (không lưu mật khẩu thô).
  - Cookie phiên là token tự chứa {email, role, name, exp} ký HMAC-SHA256 bằng
    APP_SECRET → stateless, sống qua reload, không sửa được nếu không có secret.
"""
import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import HTTPException, Request

from app.config import (
    get_driver,
    NEO4J_DATABASE,
    APP_SECRET,
    SESSION_TTL_HOURS,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
)

COOKIE_NAME = "gdb_session"
_PBKDF2_ROUNDS = 200_000


# ---- Mật khẩu ----
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ROUNDS)
    return f"{salt.hex()}:{dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, dk_hex = stored.split(":", 1)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), _PBKDF2_ROUNDS)
        return hmac.compare_digest(dk.hex(), dk_hex)
    except Exception:
        return False


# ---- Token phiên (ký HMAC) ----
def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sign(body: str) -> str:
    return _b64e(hmac.new(APP_SECRET.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest())


def create_token(email: str, role: str, name: str) -> str:
    payload = {"email": email, "role": role, "name": name, "exp": int(time.time()) + SESSION_TTL_HOURS * 3600}
    body = _b64e(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{body}.{_sign(body)}"


def verify_token(token: str | None) -> dict | None:
    if not token or "." not in token:
        return None
    body, sig = token.rsplit(".", 1)
    if not hmac.compare_digest(sig, _sign(body)):
        return None
    try:
        payload = json.loads(_b64d(body))
    except Exception:
        return None
    if payload.get("exp", 0) < time.time():
        return None
    return payload


# ---- AppUser CRUD ----
def _norm(email: str) -> str:
    return (email or "").strip().lower()


def get_user(email: str) -> dict | None:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        rec = s.run(
            "MATCH (u:AppUser {email: $e}) RETURN u.email AS email, u.name AS name, "
            "u.role AS role, u.password_hash AS password_hash, "
            "coalesce(u.must_change_pw, false) AS must_change_pw",
            e=_norm(email),
        ).single()
    return dict(rec) if rec else None


def list_users(role: str | None = None) -> list[dict]:
    driver = get_driver()
    where = "WHERE u.role = $role " if role else ""
    with driver.session(database=NEO4J_DATABASE) as s:
        return s.run(
            f"MATCH (u:AppUser) {where}RETURN u.email AS email, u.name AS name, "
            "u.role AS role, toString(u.created_at) AS created_at ORDER BY u.role, u.email",
            role=role,
        ).data()


def create_user(email: str, name: str, password: str, role: str = "expert") -> dict:
    email = _norm(email)
    name = (name or "").strip()
    if not email or "@" not in email:
        raise HTTPException(400, "Email không hợp lệ")
    if not name:
        raise HTTPException(400, "Cần tên hiển thị")
    if not password or len(password) < 6:
        raise HTTPException(400, "Mật khẩu tối thiểu 6 ký tự")
    if role not in ("admin", "expert"):
        raise HTTPException(400, "role phải là admin hoặc expert")
    if get_user(email):
        raise HTTPException(409, f"Email '{email}' đã tồn tại")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        s.run(
            "CREATE (u:AppUser {email: $e, name: $n, role: $r, password_hash: $ph, "
            "created_at: datetime(), must_change_pw: false})",
            e=email, n=name, r=role, ph=hash_password(password),
        )
    return {"email": email, "name": name, "role": role}


def delete_user(email: str) -> dict:
    email = _norm(email)
    if email == ADMIN_EMAIL:
        raise HTTPException(400, "Không thể xoá admin gốc")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        rec = s.run("MATCH (u:AppUser {email: $e}) DELETE u RETURN count(u) AS c", e=email).single()
    if not rec or rec["c"] == 0:
        raise HTTPException(404, f"Không tìm thấy '{email}'")
    return {"deleted": email}


def set_password(email: str, new_password: str) -> dict:
    if not new_password or len(new_password) < 6:
        raise HTTPException(400, "Mật khẩu tối thiểu 6 ký tự")
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        rec = s.run(
            "MATCH (u:AppUser {email: $e}) SET u.password_hash = $ph, u.must_change_pw = false "
            "RETURN u.email AS email",
            e=_norm(email), ph=hash_password(new_password),
        ).single()
    if not rec:
        raise HTTPException(404, "Không tìm thấy tài khoản")
    return {"email": rec["email"]}


def authenticate(email: str, password: str) -> dict:
    user = get_user(email)
    if not user or not verify_password(password, user.get("password_hash") or ""):
        raise HTTPException(401, "Sai email hoặc mật khẩu")
    return {"email": user["email"], "name": user["name"], "role": user["role"]}


def seed_admin() -> None:
    """Tạo admin gốc nếu chưa có tài khoản admin nào."""
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as s:
        existing = s.run("MATCH (u:AppUser {role: 'admin'}) RETURN count(u) AS c").single()["c"]
        if existing:
            return
        s.run(
            "MERGE (u:AppUser {email: $e}) SET u.name = 'Admin', u.role = 'admin', "
            "u.password_hash = $ph, u.created_at = datetime(), u.must_change_pw = true",
            e=ADMIN_EMAIL, ph=hash_password(ADMIN_PASSWORD),
        )
    print(f"[startup] [OK] Seeded admin gốc: {ADMIN_EMAIL} (mật khẩu = ADMIN_PASSWORD, ĐỔI NGAY)")
    if APP_SECRET == "dev-insecure-secret-change-me":
        print("[startup] [WARN] APP_SECRET đang là mặc định — đặt APP_SECRET trong .env cho production")


# ---- FastAPI dependencies ----
def get_current_user(request: Request) -> dict | None:
    return verify_token(request.cookies.get(COOKIE_NAME))


def require_user(request: Request) -> dict:
    u = get_current_user(request)
    if not u:
        raise HTTPException(401, "Cần đăng nhập")
    return u


def require_admin(request: Request) -> dict:
    u = require_user(request)
    if u.get("role") != "admin":
        raise HTTPException(403, "Chỉ admin được thao tác này")
    return u
