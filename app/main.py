"""
COM Platform Graph DB — Admin Import Service.
"""
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
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
from app.routers import option1, option2, meta


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
            print(f"[startup] [OK] Constraints ensured for {len(NODE_LABELS)} labels + AuditLog")
        except Exception as e:
            print(f"[startup] [WARN] Could not create constraints: {e}", file=sys.stderr)
    yield
    close_driver()


app = FastAPI(title="COM Platform Graph Admin", lifespan=lifespan)

_BASE = Path(__file__).parent
app.mount("/static", StaticFiles(directory=str(_BASE / "static")), name="static")
templates = Jinja2Templates(directory=str(_BASE / "templates"))

app.include_router(option1.router)
app.include_router(option2.router)
app.include_router(meta.router)


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
