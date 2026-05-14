"""
Config & Neo4j driver singleton.
"""
import os
from pathlib import Path
from neo4j import GraphDatabase, Driver


def _load_dotenv():
    """Lightweight .env loader (no extra dependency).
    Đọc file .env ở project root và set os.environ nếu key chưa có.
    """
    # config.py is in app/, .env is in project root → parent.parent
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        # don't override if already set (so shell env wins)
        os.environ.setdefault(key, value)


_load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
# Accept both NEO4J_USER (our convention) and NEO4J_USERNAME (Aura's file)
NEO4J_USER = os.getenv("NEO4J_USER") or os.getenv("NEO4J_USERNAME") or "neo4j"
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "complatform2026")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

# Allowed node labels and relationship types (white-list to prevent Cypher injection
# via label/type parameter — Cypher does not parameterize these)
NODE_LABELS = {"Skill", "Concept", "Topic", "Task", "User", "Course"}

# Schema definition: relationship_type -> (allowed_start_labels, allowed_end_labels, properties_spec)
# properties_spec = { name: (type, required, allowed_values_or_None) }
RELATIONSHIP_SCHEMA = {
    # Intra-taxonomy (6)
    "PARENT_OF": {
        "starts": {"Topic", "Concept"},
        "ends": {"Topic", "Concept"},
        "same_label": True,  # Topic->Topic OR Concept->Concept
        "props": {},
    },
    "INCLUDES": {
        "starts": {"Topic"},
        "ends": {"Skill", "Concept"},
        "props": {},
    },
    "REQUIRES": {
        "starts": {"Skill"},
        "ends": {"Skill", "Concept"},
        "props": {
            "weight": {"type": "float", "required": False, "min": 0.0, "max": 1.0},
        },
    },
    "RELATED_TO": {
        "starts": {"Skill", "Concept", "Topic", "Task"},
        "ends": {"Skill", "Concept", "Topic", "Task"},
        "same_label": True,
        "props": {
            "weight": {"type": "float", "required": False, "min": 0.0, "max": 1.0},
            "relational_type": {
                "type": "string",
                "required": True,
                "enum": ["similar", "complementary", "alternative"],
            },
        },
    },
    "PRACTICES": {
        "starts": {"Task"},
        "ends": {"Skill"},
        "props": {},
    },
    "APPLIES": {
        "starts": {"Task"},
        "ends": {"Concept"},
        "props": {},
    },
    # Cross-domain (3)
    "COVERS": {
        "starts": {"Course"},
        "ends": {"Concept"},
        "props": {
            "depth": {
                "type": "string",
                "required": True,
                "enum": ["overview", "applied", "deep_dive"],
            },
        },
    },
    "HAS_SKILL": {
        "starts": {"User"},
        "ends": {"Skill"},
        "props": {
            "proficiency": {
                "type": "string",
                "required": True,
                "enum": ["foundational", "beginner", "intermediate", "advance", "expert"],
            },
            "confidence": {"type": "float", "required": False, "min": 0.0, "max": 1.0},
            "credentials": {"type": "string", "required": False},
        },
    },
    "TEACHES": {
        "starts": {"Course"},
        "ends": {"Skill"},
        "props": {
            "relevance": {"type": "float", "required": False, "min": 0.0, "max": 1.0},
        },
    },
}

# Node property specifications
# id, name, description are conventions; level on Skill is the enum
NODE_PROP_SCHEMA = {
    "Skill": {
        "id": {"type": "string", "required": True, "primary_key": True},
        "name": {"type": "string", "required": True, "max_len": 200},
        "description": {"type": "string", "required": False, "max_len": 2000},
        "level": {
            "type": "string",
            "required": True,
            "enum": ["foundational", "beginner", "intermediate", "advance", "expert"],
        },
    },
    "Concept": {
        "id": {"type": "string", "required": True, "primary_key": True},
        "name": {"type": "string", "required": True, "max_len": 200},
        "description": {"type": "string", "required": False, "max_len": 2000},
    },
    "Topic": {
        "id": {"type": "string", "required": True, "primary_key": True},
        "name": {"type": "string", "required": True, "max_len": 200},
        "description": {"type": "string", "required": False, "max_len": 2000},
    },
    "Task": {
        "id": {"type": "string", "required": True, "primary_key": True},
        "name": {"type": "string", "required": True, "max_len": 200},
        "description": {"type": "string", "required": False, "max_len": 2000},
    },
    # Shadow nodes — only ref id from relational DB
    "User": {
        "id_user": {"type": "string", "required": True, "primary_key": True},
    },
    "Course": {
        "id_course": {"type": "string", "required": True, "primary_key": True},
    },
}


def primary_key_of(label: str) -> str:
    """Return the primary-key property name for a node label."""
    schema = NODE_PROP_SCHEMA[label]
    for prop, spec in schema.items():
        if spec.get("primary_key"):
            return prop
    raise ValueError(f"No primary key defined for {label}")


_driver: Driver | None = None


def get_driver() -> Driver:
    global _driver
    if _driver is None:
        # Aura-friendly config:
        # - max_connection_lifetime: rotate connections to handle Aura's idle timeout
        # - connection_timeout: 30s lets a paused Aura instance wake up (Free tier
        #   pauses after 3 days idle; first connect can take ~20-30s)
        # - keep_alive: True maintains TCP keepalive for VN networks behind NAT
        # - max_transaction_retry_time: 30s; managed transactions retry transient
        #   errors (lost connection, leader election) inside this window
        _driver = GraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD),
            max_connection_lifetime=3600,
            connection_timeout=30.0,
            keep_alive=True,
            max_transaction_retry_time=30.0,
        )
    return _driver


def verify_connectivity() -> tuple[bool, str | None]:
    """
    Quick health check. Returns (ok, error_message).
    Runs at app startup so user sees clear error early instead of cryptic
    failures in the middle of an import.
    """
    try:
        d = get_driver()
        d.verify_connectivity()
        return True, None
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


def close_driver():
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None
