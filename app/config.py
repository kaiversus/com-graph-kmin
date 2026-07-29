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
NODE_LABELS = {
    "Skill", "Knowledge", "KnowledgeArea", "JobRole",  # graph-owned
    "Account", "Content", "Task", "Quiz", "Mentor",    # shadow (synced from relational/Mongo)
}

# Prop chung áp cho MỌI node (graph-owned lẫn shadow):
#   source — node này tham khảo từ nguồn nào
#   status — draft/reviewed/approved (mặc định draft khi bỏ trống)
_COMMON_NODE_PROPS = {
    "source": {"type": "string", "required": False, "max_len": 500},
    "status": {
        "type": "string",
        "required": False,
        "enum": ["draft", "reviewed", "approved"],
        "default": "draft",
    },
}

# 4 mức độ khó dùng chung cho Skill.level và Knowledge.difficulty
_DIFFICULTY_4 = ["beginner", "intermediate", "advanced", "expert"]

# Ràng buộc tồn tại: node label -> phải có ÍT NHẤT 1 quan hệ loại này TRỎ TỚI
# (incoming) thì mới được tồn tại. Vd Knowledge phải được 1 Skill REQUIRES tới,
# không cho tạo Knowledge "mồ côi". Enforce ở tầng transaction (importer).
NODE_REQUIRES_INCOMING = {
    "Knowledge": "REQUIRES",
}

# Schema definition: relationship_type -> { starts, ends, [restrict], [same_label],
#   [start_leaf_of], props }
# props = { name: {type, required, ...constraints} }
RELATIONSHIP_SCHEMA = {
    # --- Prerequisite / role requirement ---
    "REQUIRES": {
        # JobRole -> Skill (skill vai trò cần). Skill -> Skill/Knowledge (tiên quyết).
        # `restrict` giới hạn JobRole chỉ trỏ tới Skill (không tới Knowledge).
        "starts": {"JobRole", "Skill"},
        "ends": {"Skill", "Knowledge"},
        "restrict": {"JobRole": {"Skill"}},
        "props": {
            "weight": {"type": "float", "required": False, "min": 0.0, "max": 1.0, "default": 1.0},
        },
    },
    "RELATED_TO": {
        # Skill<->Skill hoặc Knowledge<->Knowledge (đối xứng, cùng label).
        "starts": {"Skill", "Knowledge"},
        "ends": {"Skill", "Knowledge"},
        "same_label": True,
        "props": {
            "relation_type": {
                "type": "string",
                "required": True,
                "enum": ["similar", "alternative", "complements", "uses", "related"],
            },
        },
    },
    # --- Knowledge Area taxonomy ---
    "HAS": {
        # KnowledgeArea -> Knowledge. Ràng buộc: chỉ KnowledgeArea LÁ (không có con
        # qua PARENT_OF) mới được HAS tới Knowledge — enforce ở importer.
        "starts": {"KnowledgeArea"},
        "ends": {"Knowledge"},
        "start_leaf_of": "PARENT_OF",
        "props": {
            "weight": {"type": "float", "required": False, "min": 0.0, "max": 1.0, "default": 1.0},
        },
    },
    "PARENT_OF": {
        # KnowledgeArea -> KnowledgeArea (cây phân cấp lĩnh vực).
        "starts": {"KnowledgeArea"},
        "ends": {"KnowledgeArea"},
        "same_label": True,
        "props": {
            "order": {"type": "int", "required": False},
        },
    },
    # --- Knowledge <-> Knowledge ---
    "IS_A": {
        # Kế thừa kiểu OOP: Knowledge con IS_A Knowledge cha.
        "starts": {"Knowledge"},
        "ends": {"Knowledge"},
        "same_label": True,
        "props": {},
    },
    "PREREQUISITE": {
        # Tiên quyết giữa 2 Knowledge.
        "starts": {"Knowledge"},
        "ends": {"Knowledge"},
        "same_label": True,
        "props": {},
    },
    # --- Account / Task / Content / Quiz / Mentor (shadow) tới graph-owned ---
    "HAS_SKILL": {
        "starts": {"Account"},
        "ends": {"Skill"},
        "props": {
            # proficiency: float 0.0–1.0. Ngưỡng map nhãn (frontend map lúc hiển thị):
            #   [0.0, 0.2) = foundational
            #   [0.2, 0.4) = beginner
            #   [0.4, 0.6) = intermediate
            #   [0.6, 0.8) = advanced
            #   [0.8, 1.0] = expert
            "proficiency": {"type": "float", "required": True, "min": 0.0, "max": 1.0},
            "confidence": {"type": "float", "required": False, "min": 0.0, "max": 1.0},
            "credentials": {"type": "string", "required": False},
            "source": {"type": "string", "required": False},
            # auto: server tự set datetime() lúc ghi — admin không nhập.
            "lastUpdatedAt": {"type": "datetime", "required": True, "auto": "timestamp"},
        },
    },
    "PRACTICES": {
        # Task -> Skill
        "starts": {"Task"},
        "ends": {"Skill"},
        "props": {
            "weight": {"type": "float", "required": False, "min": 0.0, "max": 1.0},
            "is_core": {"type": "boolean", "required": False},
        },
    },
    "APPLIES": {
        # Task -> Knowledge
        "starts": {"Task"},
        "ends": {"Knowledge"},
        "props": {},
    },
    "COVERS": {
        # Content -> Knowledge
        "starts": {"Content"},
        "ends": {"Knowledge"},
        "props": {
            "depth": {
                "type": "string",
                "required": True,
                "enum": ["overview", "applied", "deep_dive"],
            },
        },
    },
    "ASSESSES": {
        # Quiz -> Skill / Knowledge (quiz đánh giá skill hoặc knowledge nào).
        "starts": {"Quiz"},
        "ends": {"Skill", "Knowledge"},
        "props": {
            "level": {
                "type": "string",
                "required": True,
                "enum": ["easy", "medium", "hard", "expert"],
            },
            "quiz_tag": {
                "type": "enum_list",
                "required": True,
                "multi": True,
                "enum": [
                    "single_choice", "multiple_choice", "true_false",
                    "fill_in_blank", "matching", "drag_drop",
                ],
            },
            "weight": {"type": "float", "required": False, "min": 0.0, "max": 1.0},
        },
    },
    "COACHES": {
        # Mentor -> Skill / Knowledge (mentor coach cho skill/knowledge nào).
        "starts": {"Mentor"},
        "ends": {"Skill", "Knowledge"},
        "props": {},
    },
}

# Node property specifications.
# id/name/description là convention. `source`+`status` được nối vào mọi node bên dưới.
# Kiểu prop mở rộng: string_list (mảng chuỗi, nhập cách nhau bởi dấu phẩy),
#   enum_list (mảng chọn nhiều từ enum), json (chuỗi JSON hợp lệ).
NODE_PROP_SCHEMA = {
    # ---- Graph-owned ----
    "Skill": {
        "id": {"type": "string", "required": True, "primary_key": True},
        "name": {"type": "string", "required": True, "max_len": 200},
        "description": {"type": "string", "required": False, "max_len": 2000},
        # level = ĐỘ KHÓ của skill (không phải trình độ người học)
        "level": {"type": "string", "required": True, "enum": _DIFFICULTY_4},
        "aliases": {"type": "string_list", "required": False},
        "practice_resource": {"type": "json", "required": False},
    },
    "Knowledge": {
        "id": {"type": "string", "required": True, "primary_key": True},
        "name": {"type": "string", "required": True, "max_len": 200},
        "description": {"type": "string", "required": False, "max_len": 2000},
        "kind": {
            "type": "string",
            "required": True,
            "enum": [
                "concept", "domain", "technique", "data-structure", "algorithm",
                "architecture", "pattern", "principle", "tool", "framework",
                "library", "language", "protocol", "standard", "model",
            ],
        },
        "aliases": {"type": "string_list", "required": False},
        "keywords": {"type": "string_list", "required": False},
        "difficulty": {"type": "string", "required": False, "enum": _DIFFICULTY_4},
        "deprecated": {"type": "boolean", "required": False},
        "learning_resource": {"type": "json", "required": False},
    },
    "KnowledgeArea": {
        "id": {"type": "string", "required": True, "primary_key": True},
        "name": {"type": "string", "required": True, "max_len": 200},
        "description": {"type": "string", "required": False, "max_len": 2000},
        "aliases": {"type": "string_list", "required": False},
    },
    "JobRole": {
        "id": {"type": "string", "required": True, "primary_key": True},
        "name": {"type": "string", "required": True, "max_len": 200},
        "description": {"type": "string", "required": False, "max_len": 2000},
        "level": {"type": "string", "required": False, "enum": ["junior", "middle", "senior"]},
        "aliases": {"type": "string_list", "required": False},
    },
    # ---- Shadow nodes — chỉ ref id (data thật ở relational/Mongo) ----
    "Account": {
        "id_account": {"type": "string", "required": True, "primary_key": True},
    },
    "Content": {
        "id_content": {"type": "string", "required": True, "primary_key": True},
    },
    "Task": {
        "id_task": {"type": "string", "required": True, "primary_key": True},
    },
    "Quiz": {
        "id_quiz": {"type": "string", "required": True, "primary_key": True},
    },
    "Mentor": {
        "id_mentor": {"type": "string", "required": True, "primary_key": True},
    },
}

# Nối source + status vào mọi node (giữ nguyên các prop riêng đã khai ở trên).
for _lbl, _spec in NODE_PROP_SCHEMA.items():
    for _k, _v in _COMMON_NODE_PROPS.items():
        _spec.setdefault(_k, dict(_v))


def allowed_ends(rel_spec: dict, start_label: str | None) -> set:
    """
    End labels hợp lệ cho một relationship khi biết start_label.

    Mặc định là rel_spec["ends"]. Nếu có `restrict` và start_label nằm trong đó
    thì giới hạn theo restrict (vd REQUIRES: JobRole chỉ được trỏ tới Skill, không
    tới Knowledge — dù Skill vẫn được trỏ tới cả Skill lẫn Knowledge).
    """
    restrict = rel_spec.get("restrict")
    if restrict and start_label in restrict:
        return restrict[start_label]
    return rel_spec["ends"]


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
