"""
COM Platform Graph DB — Admin Import Service.
"""
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from app.config import (
    get_driver,
    close_driver,
    verify_connectivity,
    NEO4J_URI,
    NEO4J_USER,
    NEO4J_DATABASE,
    NODE_LABELS,
    primary_key_of,
)
from app.routers import audit, crud, export, graph, meta, option1, option2, recommend, roadmap, review, auth as auth_router
from app.services.auth import get_current_user, seed_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: health check first, then ensure constraints
    print(f"[startup] Connecting to Neo4j at {NEO4J_URI} (user={NEO4J_USER}, db={NEO4J_DATABASE})")
    ok, err = verify_connectivity()
    if not ok:
        print(f"[startup] [FAIL] Neo4j connectivity check FAILED: {err}", file=sys.stderr)
        print("[startup] Common causes:", file=sys.stderr)
        print("  - Aura: scheme phai la neo4j+s:// (khong phai bolt://)", file=sys.stderr)
        print("  - Aura Free: instance co the dang paused (3 ngay idle) -- vao console Resume", file=sys.stderr)
        print("  - Sai username: Aura username luon la 'neo4j', KHONG phai instance ID", file=sys.stderr)
        print("    (instance ID la subdomain trong URI, dung de dinh danh instance, khong phai user)", file=sys.stderr)
        print("  - Sai password (Aura cap 1 lan luc tao, mat phai Reset trong console)", file=sys.stderr)
        print("  - Mang chan port 7687 outbound (firewall cong ty/truong)", file=sys.stderr)
        print("[startup] App van start nhung cac thao tac Neo4j se fail. Sua .env roi reload.", file=sys.stderr)
    else:
        print("[startup] [OK] Neo4j connectivity OK")
        # Create constraints (safe to run repeatedly)
        try:
            driver = get_driver()
            with driver.session(database=NEO4J_DATABASE) as session:
                for label in NODE_LABELS:
                    pk = primary_key_of(label)
                    session.run(
                        f"CREATE CONSTRAINT `unique_{label}_{pk}` IF NOT EXISTS "
                        f"FOR (n:`{label}`) REQUIRE n.`{pk}` IS UNIQUE"
                    )
                session.run(
                    "CREATE CONSTRAINT unique_AuditLog_id IF NOT EXISTS "
                    "FOR (a:AuditLog) REQUIRE a.id IS UNIQUE"
                )
                session.run(
                    "CREATE CONSTRAINT unique_ChangeRequest_id IF NOT EXISTS "
                    "FOR (c:ChangeRequest) REQUIRE c.id IS UNIQUE"
                )
                session.run(
                    "CREATE CONSTRAINT unique_AppUser_email IF NOT EXISTS "
                    "FOR (u:AppUser) REQUIRE u.email IS UNIQUE"
                )
            print(f"[startup] [OK] Constraints ensured for {len(NODE_LABELS)} labels + AuditLog + ChangeRequest + AppUser")
            # Seed admin gốc (idempotent)
            try:
                seed_admin()
            except Exception as e:
                print(f"[startup] [WARN] Could not seed admin: {e}", file=sys.stderr)
        except Exception as e:
            print(f"[startup] [WARN] Could not create constraints: {e}", file=sys.stderr)
    yield
    close_driver()


app = FastAPI(title="COM Platform Graph Admin", lifespan=lifespan)


@app.middleware("http")
async def _no_cache_static(request: Request, call_next):
    """Admin tool đang phát triển → ép browser revalidate JS/CSS, tránh chạy bản cũ do cache."""
    response = await call_next(request)
    if request.url.path.startswith("/static"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


# Endpoint mở (không cần đăng nhập): trang login gọi được lúc chưa có phiên.
_AUTH_OPEN = {"/api/auth/login", "/api/auth/me", "/api/health"}
# Học viên (role 'user') CHỈ được gọi đúng những path này. Mọi /api/* khác → 403.
# Đây là allowlist chứ không phải blocklist: thêm router mới thì mặc định học viên
# KHÔNG với tới được, phải chủ động mở ở đây. An toàn hơn là quên chặn.
_USER_ALLOWED = (
    "/api/roadmap/",
    "/api/auth/me", "/api/auth/logout", "/api/auth/change-password",
    "/api/health",
)
# (method, path-prefix) chỉ ADMIN được gọi — chặn chuyên gia ghi thẳng, bỏ qua duyệt.
_ADMIN_ONLY = (
    ("POST", "/api/option1"), ("POST", "/api/option2"),
    ("PUT", "/api/crud"), ("DELETE", "/api/crud"),
    ("POST", "/api/recommend/commit"),
    ("POST", "/api/audit"),   # restore
    ("GET", "/api/export"), ("POST", "/api/export"),
)


@app.middleware("http")
async def _auth_gate(request: Request, call_next):
    """Chặn mọi /api/* khi chưa đăng nhập; các endpoint ghi trực tiếp chỉ cho admin."""
    path = request.url.path
    if path.startswith("/api/") and path not in _AUTH_OPEN:
        user = get_current_user(request)
        if not user:
            return JSONResponse({"detail": "Cần đăng nhập"}, status_code=401)
        if user.get("role") == "user" and not any(path.startswith(p) for p in _USER_ALLOWED):
            return JSONResponse(
                {"detail": "Tài khoản học viên chỉ xem được lộ trình của mình"},
                status_code=403,
            )
        for m, p in _ADMIN_ONLY:
            if request.method == m and path.startswith(p) and user.get("role") != "admin":
                return JSONResponse({"detail": "Chỉ admin được thao tác này"}, status_code=403)
    return await call_next(request)


_BASE = Path(__file__).parent
app.mount("/static", StaticFiles(directory=str(_BASE / "static")), name="static")
templates = Jinja2Templates(directory=str(_BASE / "templates"))

app.include_router(option1.router)
app.include_router(option2.router)
app.include_router(crud.router)
app.include_router(recommend.router)
app.include_router(meta.router)
app.include_router(audit.router)
app.include_router(graph.router)
app.include_router(roadmap.router)
app.include_router(export.router)
app.include_router(review.router)
app.include_router(auth_router.router)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/health")
def health():
    """Quick health endpoint for the FE to show connection status."""
    ok, err = verify_connectivity()
    return {
        "neo4j_connected": ok,
        "uri": NEO4J_URI,
        "database": NEO4J_DATABASE,
        "error": err,
    }
