"""
Meta — thong tin ve he thong, khong dong vao du lieu.

Audit/restore o audit.py, graph feed o graph.py, roadmap o roadmap.py,
export o export.py.
"""
from fastapi import APIRouter

from app.config import (
    NEO4J_DATABASE,
    NEO4J_PASSWORD,
    NEO4J_URI,
    NEO4J_USER,
    NODE_PROP_SCHEMA,
    RELATIONSHIP_SCHEMA,
)

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/neovis-config")
def get_neovis_config():
    """
    Return Neo4j connection details for the browser-side neovis.js.

    Note: neovis.js connects directly from browser to Neo4j via Bolt, so the
    URI/credentials must be reachable from the user's browser. For Aura cloud,
    keep using neo4j+s://. For local dev, bolt://localhost:7687 is fine.
    Treat this as demo-grade — in prod, prefer a server-side proxy and
    short-lived credentials.
    """
    return {
        "uri": NEO4J_URI,
        "user": NEO4J_USER,
        "password": NEO4J_PASSWORD,
        "database": NEO4J_DATABASE,
    }


@router.get("/schema")
def get_schema():
    """Return the full schema definition so the frontend can render forms dynamically."""
    return {
        "nodes": NODE_PROP_SCHEMA,
        "relationships": RELATIONSHIP_SCHEMA,
    }
