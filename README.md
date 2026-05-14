# COM Platform — Graph DB Admin (Demo)

Tool admin để nhập data lên Neo4j theo schema **Knowledge & Skill Graph** đã thiết kế.

```
Admin UI / CSV Upload
       ↓
Data Validation Layer (format + schema + duplicate detection)
       ↓
Data Review & Confirmation (FE preview, admin click Confirm)
       ↓
Data Processing (snapshot existing affected nodes/rels)
       ↓
Neo4j Transaction (MERGE inside single tx)
       ↓
Neo4j Database (instance của bạn)
       ↓
Audit log (snapshot lưu vào AuditLog node) → Restore endpoint
```

## Schema được hỗ trợ

**6 nodes** (4 taxonomy + 2 shadow):
- `Skill { id, name, description, level }` (level enum)
- `Concept { id, name, description }`
- `Topic { id, name, description }`
- `Task { id, name, description }`
- `User { id_user }` (shadow — chỉ ref id từ relational)
- `Course { id_course }` (shadow)

**9 relationships:**
- Intra-tax: `PARENT_OF`, `INCLUDES`, `REQUIRES (weight)`, `RELATED_TO (weight, relational_type)`, `PRACTICES`, `APPLIES`
- Cross-domain: `COVERS (depth)`, `HAS_SKILL (proficiency, confidence, credentials)`, `TEACHES (relevance)`

---

## Setup nhanh (3 bước)

### 1. Connect Neo4j instance của bạn

Copy file mẫu rồi sửa:

```bash
cp .env.example .env
```

Mở `.env` và sửa 4 dòng cho khớp với instance của bạn. Ví dụ:

**Neo4j Aura (cloud):**
```
NEO4J_URI=neo4j+s://abcd1234.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password Aura cấp>
NEO4J_DATABASE=neo4j
```

**Neo4j Desktop / local:**
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password bạn đặt>
NEO4J_DATABASE=neo4j
```

**VPS / server riêng:**
```
NEO4J_URI=bolt://<ip>:<bolt_port>
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>
NEO4J_DATABASE=neo4j
```

> Aura: dùng scheme `neo4j+s://` (TLS), không phải `bolt://`.

> Visualizer: neovis.js trong browser kết nối **trực tiếp** từ máy bạn tới
> Neo4j qua Bolt. Aura và Desktop đều OK. Nếu instance chỉ accept connect
> từ trong mạng nội bộ thì viz không render được — chỉ tab visualizer ảnh
> hưởng, còn import vẫn chạy bình thường vì nó qua FastAPI server-side.

### 2. Cài Python deps trong venv riêng

```bash
# macOS / Linux
python -m venv .venv && source .venv/bin/activate

# Windows PowerShell
python -m venv .venv ; .\.venv\Scripts\Activate.ps1

# Cả hai
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Chạy

```bash
uvicorn app.main:app --reload --port 8000
```

Mở `http://localhost:8000`.

Lúc start, app sẽ tự `CREATE CONSTRAINT IF NOT EXISTS` cho primary key của
6 label trên instance của bạn — đảm bảo unique và tăng tốc lookup.

---

## CSV bulk import — auto-detect

Hệ thống nhận diện file theo **tên file** và tự map header. Không cần đổi format CSV của bạn.

| Filename | → Kind | → Target |
|---|---|---|
| `nodes_skills.csv` | node | Skill |
| `nodes_concepts.csv` | node | Concept |
| `nodes_topics.csv` | node | Topic |
| `nodes_tasks.csv` | node | Task |
| `nodes_users.csv` | node | User (shadow) |
| `nodes_courses.csv` | node | Course (shadow) |
| `rels_parent_of_topic.csv` | rel | PARENT_OF (Topic→Topic) |
| `rels_parent_of_concept.csv` | rel | PARENT_OF (Concept→Concept) |
| `rels_includes_topic_skill.csv` | rel | INCLUDES (Topic→Skill) |
| `rels_includes_topic_concept.csv` | rel | INCLUDES (Topic→Concept) |
| `rels_requires_skill_skill.csv` | rel | REQUIRES (Skill→Skill) |
| `rels_requires_skill_concept.csv` | rel | REQUIRES (Skill→Concept) |
| `rels_related_to_skill.csv` | rel | RELATED_TO (Skill↔Skill) |
| `rels_related_to_concept.csv` | rel | RELATED_TO (Concept↔Concept) |
| `rels_related_to_topic.csv` | rel | RELATED_TO (Topic↔Topic) |
| `rels_practices.csv` | rel | PRACTICES (Task→Skill) |
| `rels_applies.csv` | rel | APPLIES (Task→Concept) |
| `rels_covers.csv` | rel | COVERS (Course→Concept) |
| `rels_has_skill.csv` | rel | HAS_SKILL (User→Skill) |
| `rels_teaches.csv` | rel | TEACHES (Course→Skill) |

Header CSV expected cho từng preset xem ở `GET /api/option2/presets` hoặc
trực tiếp trong `app/services/csv_mapping.py`.

Nếu file của bạn tên khác, chọn **Manual override** trong UI hoặc đổi tên file.

---

## Demo flow (dùng seed có sẵn)

Folder `samples/` chứa 20 file CSV của bạn (đã verify pass validation 128/128 records).

1. Mở UI tại `http://localhost:8000`
2. Sang tab **Visualizer** → bấm **Render** → graph trống (assuming instance trống)
3. Tab **Option 2 · CSV bulk** → bấm **Choose Files** → chọn cả 6 file `nodes_*.csv` cùng lúc → **Validate** → thấy 6/6 ✓ → **Commit batch**
4. Lặp lại với các file `rels_*.csv` (chọn cả 14 file một lúc cũng được)
5. Quay lại **Visualizer** → **Render** → thấy full Knowledge Graph
6. Sang **Audit · Restore** → **Refresh** → thấy AuditLog dòng status `committed`
7. Thử **Restore** dòng REQUIRES → quay lại Visualizer Render → các edge REQUIRES biến mất

**Quan trọng:** import nodes **trước** rels — rels validate chặt, endpoint chưa
tồn tại trong DB thì transaction fail và rollback toàn bộ batch.

---

## Snapshot & Restore (rollback)

Mỗi commit tạo 1 `(:AuditLog)` node với:
- `snapshot_nodes`: JSON properties các node tồn tại trước import (sẽ bị overwrite)
- `snapshot_rels`: JSON properties các rel tồn tại
- `payload_summary`: danh sách node/rel mà import này tạo/sửa
- `status`: `pending` → `committed` (hoặc `failed` nếu tx fail)

Restore logic: với node có snapshot → restore properties cũ; node không có
snapshot (tức import vừa tạo mới) → DETACH DELETE. Tương tự cho rel.

---

## Anti-injection / Anti-conflict

- **Cypher injection:** label và rel_type không param hoá được trong Cypher.
  Code white-list cứng `NODE_LABELS` và `RELATIONSHIP_SCHEMA` keys; mọi input
  lạ bị reject. Mọi `value` đi qua `$params`.
- **DB-level uniqueness:** `CREATE CONSTRAINT … IS UNIQUE` trên primary key
  mỗi label → Neo4j tự fail nếu race condition.
- **Tx isolation:** mọi import dùng `session.execute_write` (managed
  transaction, retry tự động cho transient error).
- **CSV pre-flight duplicate:** check trùng id trong file trước khi push.
- **Re-validate trên commit:** không tin client; validate lại toàn bộ.
- **Conflict policy:** dùng `MERGE` + `SET n += $props` (overwrite).

---

## Cấu trúc thư mục

```
com_graph_admin/
├── .env.example              # copy thành .env và sửa connection
├── requirements.txt
├── README.md
├── app/
│   ├── main.py               # FastAPI entry, lifespan tạo CONSTRAINT
│   ├── config.py             # Schema, .env loader, Neo4j driver
│   ├── routers/
│   │   ├── option1.py        # /api/option1/{validate,commit}
│   │   ├── option2.py        # /api/option2/{presets,template,validate,commit}
│   │   └── meta.py           # /api/{schema,audit,graph,neovis-config}
│   ├── services/
│   │   ├── validator.py      # Validation Layer
│   │   ├── csv_io.py         # CSV parser & generic template
│   │   ├── csv_mapping.py    # Preset mapping (filename → label/rel_type)
│   │   ├── snapshot.py       # Snapshot & AuditLog writer
│   │   └── importer.py       # Cypher gen + tx + restore
│   ├── templates/index.html
│   └── static/{app.js,style.css}
└── samples/                  # 20 CSV (verify 128/128 records valid)
```

---

## Troubleshooting

| Lỗi | Cách xử |
|---|---|
| `ServiceUnavailable` | Sai URI hoặc instance đang stop. Test `cypher-shell -a <URI> -u <user> -p <pass>` trước. |
| `AuthError` | Sai user/pass. Aura cấp file `Neo4j-xxxx-Created-yyyy.txt` lúc tạo, password chỉ hiện 1 lần. |
| Visualizer trống dù DB có data | DevTools console (F12). Aura cần `neo4j+s://`. |
| Rel commit fail vì endpoint missing | Import nodes trước rồi mới rels. |
| Filename không khớp preset | Đổi tên file theo bảng, hoặc Manual override trong UI. |
| `pip install` báo lỗi build wheel | `pip install --upgrade pip`. Python >= 3.10. |
