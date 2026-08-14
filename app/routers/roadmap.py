"""
Roadmap — lộ trình học CÁ NHÂN HÓA từ 1 JobRole hoặc 1 KnowledgeArea.

Khác bản cũ (chỉ vẽ cây tĩnh), bản này overlay hồ sơ của 1 Account để trả lời:
  - "Tôi đang ở đâu": mỗi skill/knowledge → done / in_progress / not_started
    (suy từ Account -HAS_SKILL-> Skill {proficiency}).
  - "Cái gì quan trọng": importance suy từ REQUIRES.weight (essential/important/optional).
  - "Học gì trước / đã sẵn sàng chưa": readiness suy từ tiên quyết (Skill->Skill,
    Knowledge PREREQUISITE Knowledge).
  - "Học ở đâu, chứng minh sao": resources = số Content/Quiz/Mentor gắn vào.
  - Tiến độ %, "Học tiếp theo", milestone, câu headline tạo động lực → gói trong `summary`.

Cả by-role và by-area quy về cùng cấu trúc { root, account, nodes, edges, groups, summary }.
Node vẫn giữ id/label/type/level/meta để FE vẽ cây; kèm thêm status/importance/... để
FE tô màu và dựng panel bên phải. account_id là query param TÙY CHỌN — bỏ trống thì
roadmap về chế độ "bản chung" (không có tiến độ cá nhân).

`groups` là các CHẶNG của lộ trình — FE dựng track từ đây thay vì tự suy từ edges:
  - by-role: mỗi cấp độ khó là 1 chặng (beginner→expert), cộng chặng "support" cuối
    chứa các tiên quyết không nằm trong danh sách skill của vai trò.
  - by-area: mỗi lĩnh vực con là 1 chặng, chặng đầu là knowledge thuộc thẳng area gốc.

Quy ước cạnh nét đứt (`style: "dashed"`): LUÔN là `from` = tiên quyết, `to` = mục phụ
thuộc. Cả hai chế độ tuân theo quy ước này để FE vẽ mũi tên một chiều nhất quán.
"""
from fastapi import APIRouter, HTTPException, Request

from app.config import get_driver, NEO4J_DATABASE
from app.services import auth

router = APIRouter(prefix="/api", tags=["roadmap"])


def _viewer(request: Request) -> dict:
    """Ai đang xem + họ được phép xem hồ sơ nào.

    Với role 'user' (học viên), `account_id` LUÔN lấy từ AppUser.account_id trong DB,
    không bao giờ lấy từ query param — nếu không họ chỉ cần sửa URL là xem được hồ sơ
    người khác.
    """
    u = auth.get_current_user(request) or {}
    role = u.get("role")
    return {
        "role": role,
        "email": u.get("email"),
        "locked_account": auth.account_id_of(u.get("email")) if role == "user" else None,
    }


def _effective_account(viewer: dict, account_id: str | None) -> str | None:
    """account_id thực sự được dùng để truy vấn tiến độ."""
    if viewer["role"] == "user":
        return viewer["locked_account"]      # bỏ qua hoàn toàn giá trị client gửi lên
    return account_id

SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"]
_LEVEL_RANK = {lvl: i for i, lvl in enumerate(SKILL_LEVELS)}

# HAI ngưỡng khác nhau, đừng gộp lại:
#
#   DONE_THRESHOLD  — "hoàn thành". Phải ĐẦY ĐỦ 100%. Một skill 0.9 vẫn là "đang học".
#     Trước đây để 0.6 nên CSS 0.7 / JS 0.6 hiện dấu ✓ và chặng báo 100% dù chưa xong —
#     thanh tiến độ nói dối. Tiến độ là thứ người học tin, không được rộng tay.
#
#   READY_THRESHOLD — "đủ nền để BẮT ĐẦU mục phụ thuộc". Thấp hơn hẳn, vì bắt buộc thành
#     thạo tuyệt đối mới cho học tiếp thì không mục nào mở khoá được (không ai đạt 1.0),
#     cả lộ trình sẽ khoá cứng 🔒 và mất luôn tác dụng gợi ý.
#
# Nói gọn: hoàn thành là 100%, nhưng đi tiếp thì chỉ cần vững (>=60%).
DONE_THRESHOLD = 1.0
READY_THRESHOLD = 0.6


def _status_of(prof) -> str:
    """proficiency (hoặc None) → 'done' | 'in_progress' | 'not_started'."""
    if prof is None:
        return "not_started"
    if prof >= DONE_THRESHOLD:
        return "done"
    if prof > 0:
        return "in_progress"
    return "not_started"


def _unlocked(prof) -> bool:
    """Tiên quyết này đã đủ vững để cho phép học mục phụ thuộc chưa?"""
    return prof is not None and prof >= READY_THRESHOLD


def _importance_of(weight) -> str:
    """REQUIRES.weight / HAS.weight → nhãn độ quan trọng."""
    w = 1.0 if weight is None else float(weight)
    if w >= 0.8:
        return "essential"
    if w >= 0.5:
        return "important"
    return "optional"


IMPORTANCE_LABEL = {
    "essential": "Bắt buộc",
    "important": "Quan trọng",
    "optional": "Nên có",
}
STATUS_LABEL = {
    "done": "Đã đạt",
    "in_progress": "Đang học",
    "not_started": "Chưa học",
}
# Nhãn cấp độ khó. Trả kèm trong summary để FE dùng lại, khỏi giữ bản sao thứ hai.
LEVEL_LABEL = {
    "beginner": "Cơ bản",
    "intermediate": "Trung cấp",
    "advanced": "Nâng cao",
    "expert": "Chuyên sâu",
}


def _skill_depths(prereq_map: dict) -> dict:
    """skill_id -> bậc (0 = học được ngay, không phụ thuộc skill nào khác trong vai trò).

    Bậc = đường đi DÀI NHẤT tới nó trong DAG tiên quyết, nên một skill luôn nằm sau
    MỌI thứ nó cần, không chỉ sau cái gần nhất.

    Chu trình trong data (A cần B, B cần A) sẽ không bao giờ hội tụ. Thay vì treo vòng
    lặp, chạy tối đa len(nodes) vòng rồi dừng — các node trong chu trình giữ bậc cuối
    tính được, roadmap vẫn vẽ ra thay vì sập. (Chặn chu trình từ tầng import là việc
    khác, xem 04-backlog.md mục 4.)
    """
    depth = {sid: 0 for sid in prereq_map}
    for _ in range(len(depth)):
        changed = False
        for sid, prereqs in prereq_map.items():
            want = max((depth[p] + 1 for p in prereqs if p in depth), default=0)
            if want > depth[sid]:
                depth[sid] = want
                changed = True
        if not changed:
            break
    return depth


def _make_group(key, label, kind, node_ids, status_by_id, personalized):
    """Gom 1 chặng + đếm tiến độ của chặng đó."""
    done = in_progress = 0
    if personalized:
        for nid in node_ids:
            st = status_by_id.get(nid)
            if st == "done":
                done += 1
            elif st == "in_progress":
                in_progress += 1
    total = len(node_ids)
    return {
        "key": key, "label": label, "kind": kind, "node_ids": node_ids,
        "total": total, "done": done, "in_progress": in_progress,
        "not_started": total - done - in_progress,
        "percent": round(done / total * 100) if total else 0,
    }


def _mark_current(groups, personalized):
    """Chặng "bạn đang ở đây" = chặng đầu tiên chưa xong, theo đúng thứ tự học.

    Chặng "nền tảng cần có" KHÔNG còn được bỏ qua: nó là tiên quyết, nằm đầu danh sách,
    nên chưa xong nền thì "bạn đang ở đây" phải dừng ở đó chứ không nhảy sang Cơ bản.
    """
    for g in groups:
        g["current"] = False
    if not personalized:
        return None
    for g in groups:
        if g["total"] and g["done"] < g["total"]:
            g["current"] = True
            return g["key"]
    return None


@router.get("/roadmap/sources")
def roadmap_sources(request: Request):
    """Điểm bắt đầu roadmap: job roles, knowledge areas, và accounts (để cá nhân hóa).

    Học viên chỉ nhận về đúng account của mình — danh sách học viên khác không rời server.
    """
    viewer = _viewer(request)
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        roles = session.run(
            "MATCH (r:JobRole) RETURN r.id AS id, r.name AS name ORDER BY name"
        ).data()
        areas = session.run(
            "MATCH (a:KnowledgeArea) RETURN a.id AS id, a.name AS name ORDER BY name"
        ).data()
        # Kem so ky nang da ghi nhan, va day account CO du lieu len dau danh sach.
        # Truoc day sap theo id nen account rong hay nam tren cung -> nguoi dung chon
        # phai no thi ca lo trinh xam het ma khong hieu vi sao.
        if viewer["role"] == "user":
            accounts = session.run(
                "MATCH (a:Account {id_account: $aid}) "
                "OPTIONAL MATCH (a)-[h:HAS_SKILL]->(:Skill) "
                "RETURN a.id_account AS id, count(h) AS skill_count",
                aid=viewer["locked_account"],
            ).data()
        else:
            accounts = session.run(
                "MATCH (a:Account) "
                "OPTIONAL MATCH (a)-[h:HAS_SKILL]->(:Skill) "
                "RETURN a.id_account AS id, count(h) AS skill_count "
                "ORDER BY skill_count DESC, a.id_account"
            ).data()
    return {"roles": roles, "areas": areas, "accounts": accounts, "viewer": viewer}


def _account_skill_map(session, account_id: str | None) -> dict:
    """skill_id -> proficiency cho 1 account. {} nếu không truyền account."""
    if not account_id:
        return {}
    rows = session.run(
        "MATCH (a:Account {id_account: $aid})-[hs:HAS_SKILL]->(s:Skill) "
        "RETURN s.id AS id, hs.proficiency AS prof",
        aid=account_id,
    ).data()
    return {r["id"]: r["prof"] for r in rows}


def _knowledge_prof_map(session, account_id: str | None, know_ids: list) -> dict:
    """knowledge_id -> proficiency (proxy).

    Schema không có cạnh Account -> Knowledge, nên "học viên nắm kiến thức này chưa"
    phải suy gián tiếp: lấy proficiency CAO NHẤT trong các Skill mà học viên có và
    Skill đó REQUIRES kiến thức này. Sai số đã biết (xem 04-backlog.md mục 1) — nhưng
    cả by-role và by-area đều dùng chung hàm này để ít nhất còn NHẤT QUÁN với nhau.
    """
    if not account_id or not know_ids:
        return {}
    rows = session.run(
        "MATCH (a:Account {id_account: $aid})-[hs:HAS_SKILL]->(s:Skill)"
        "-[:REQUIRES]->(k:Knowledge) "
        "WHERE k.id IN $ids "
        "RETURN k.id AS id, max(hs.proficiency) AS prof",
        aid=account_id, ids=know_ids,
    ).data()
    return {r["id"]: r["prof"] for r in rows}


def _skill_resources(session, skill_ids: list) -> dict:
    """skill_id -> {quizzes, mentors} (Content chỉ cover Knowledge nên skill không có)."""
    if not skill_ids:
        return {}
    rows = session.run(
        "MATCH (s:Skill) WHERE s.id IN $ids "
        "OPTIONAL MATCH (q:Quiz)-[:ASSESSES]->(s) "
        "OPTIONAL MATCH (m:Mentor)-[:COACHES]->(s) "
        "RETURN s.id AS id, count(DISTINCT q) AS quizzes, count(DISTINCT m) AS mentors",
        ids=skill_ids,
    ).data()
    return {r["id"]: {"contents": 0, "quizzes": r["quizzes"], "mentors": r["mentors"]} for r in rows}


def _knowledge_resources(session, knowledge_ids: list) -> dict:
    """knowledge_id -> {contents, quizzes, mentors}."""
    if not knowledge_ids:
        return {}
    rows = session.run(
        "MATCH (k:Knowledge) WHERE k.id IN $ids "
        "OPTIONAL MATCH (c:Content)-[:COVERS]->(k) "
        "OPTIONAL MATCH (q:Quiz)-[:ASSESSES]->(k) "
        "OPTIONAL MATCH (m:Mentor)-[:COACHES]->(k) "
        "RETURN k.id AS id, count(DISTINCT c) AS contents, "
        "       count(DISTINCT q) AS quizzes, count(DISTINCT m) AS mentors",
        ids=knowledge_ids,
    ).data()
    return {r["id"]: {"contents": r["contents"], "quizzes": r["quizzes"], "mentors": r["mentors"]} for r in rows}


def _account_name(session, account_id: str | None):
    if not account_id:
        return None
    # skill_count = tong so HAS_SKILL cua account TREN TOAN GRAPH (khong gioi han lo trinh
    # nay). FE dung no de phan biet "hoc vien chua co du lieu" voi "co du lieu nhung khong
    # dinh gi toi lo trinh dang xem" — hai truong hop nay nhin giong het nhau: xam toan bo.
    rec = session.run(
        "MATCH (a:Account {id_account: $aid}) "
        "OPTIONAL MATCH (a)-[h:HAS_SKILL]->(:Skill) "
        "RETURN a.id_account AS id, count(h) AS skill_count",
        aid=account_id,
    ).single()
    return {"id": rec["id"], "name": rec["id"], "skill_count": rec["skill_count"]} if rec else None


# ---------------------------------------------------------------------------
# BY ROLE
# ---------------------------------------------------------------------------
@router.get("/roadmap/by-role/{role_id}")
def roadmap_by_role(request: Request, role_id: str, account_id: str | None = None):
    account_id = _effective_account(_viewer(request), account_id)
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        role_rec = session.run(
            "MATCH (r:JobRole {id: $rid}) RETURN r.id AS id, r.name AS name, r.level AS level",
            rid=role_id,
        ).single()
        if not role_rec:
            raise HTTPException(404, "JobRole not found")

        skills = session.run(
            "MATCH (r:JobRole {id: $rid})-[req:REQUIRES]->(s:Skill) "
            "RETURN s.id AS id, s.name AS name, s.level AS level, "
            "       s.description AS description, req.weight AS weight "
            "ORDER BY s.level, s.name",
            rid=role_id,
        ).data()

        # tiên quyết của các skill cần: Skill -REQUIRES-> Skill/Knowledge
        prereqs = session.run(
            "MATCH (r:JobRole {id: $rid})-[:REQUIRES]->(s:Skill)-[pr:REQUIRES]->(p) "
            "WHERE p:Skill OR p:Knowledge "
            "RETURN s.id AS skill_id, p.id AS prereq_id, p.name AS prereq_name, "
            "       head(labels(p)) AS prereq_type, "
            "       coalesce(p.level, p.difficulty) AS prereq_level, "
            "       p.description AS prereq_description, pr.weight AS weight",
            rid=role_id,
        ).data()

        acc_map = _account_skill_map(session, account_id)
        skill_ids = [s["id"] for s in skills]
        prereq_skill_ids = [p["prereq_id"] for p in prereqs if p["prereq_type"] == "Skill"]
        prereq_know_ids = [p["prereq_id"] for p in prereqs if p["prereq_type"] == "Knowledge"]
        # Tiến độ Knowledge nền tảng — CÙNG proxy với by-area (không có cạnh
        # Account->Knowledge). Trước đây by-role bỏ trắng chỗ này nên chặng "nền tảng
        # cần có" không có trạng thái, không đếm được, và không chặn nổi ai.
        know_prof = _knowledge_prof_map(session, account_id, prereq_know_ids)
        res_skill = _skill_resources(session, list(set(skill_ids + prereq_skill_ids)))
        res_know = _knowledge_resources(session, prereq_know_ids)
        account = _account_name(session, account_id)

    return _build_role_tree(
        root={"id": role_rec["id"], "name": role_rec["name"],
               "type": "JobRole", "level": role_rec.get("level")},
        skills=skills,
        prereqs=prereqs,
        acc_map=acc_map,
        know_prof=know_prof,
        res_skill=res_skill,
        res_know=res_know,
        account=account,
        personalized=account is not None,
    )


def _build_role_tree(root, skills, prereqs, acc_map, know_prof, res_skill, res_know,
                     account, personalized):
    """
    Cây phẳng, KHÔNG còn node "Level" trung gian (bỏ theo yêu cầu — trùng nghĩa
    với màu vàng "đang học"). Thay vào đó:
      - root nối thẳng tới từng Skill; Skill được xếp TẦNG theo độ khó (beginner
        ở trên → expert ở dưới) để vẫn đọc được thứ tự học.
      - Tiên quyết mà cũng là Skill của vai trò → KHÔNG nhân đôi node, chỉ vẽ 1
        cạnh phụ thuộc (nét đứt) giữa 2 skill (skill nền → skill phụ thuộc).
      - Tiên quyết kiểu Knowledge → node riêng, gom vào chặng "nền tảng cần có"
        và chặng đó đứng ĐẦU danh sách groups (học nền trước).
    """
    root_id = f"root_{root['id']}"
    nodes = [{"id": root_id, "label": root["name"], "type": root["type"], "level": 0,
              "meta": (root.get("level") or ""), "status": None}]
    edges = []
    seen = {root_id}

    prereq_by_skill: dict[str, list] = {}
    for p in prereqs:
        prereq_by_skill.setdefault(p["skill_id"], []).append(p)

    def _prereq_prof(p):
        """proficiency của 1 tiên quyết, bất kể nó là Skill hay Knowledge."""
        ref = p["prereq_id"]
        return know_prof.get(ref) if p["prereq_type"] == "Knowledge" else acc_map.get(ref)

    # ---- Tính toán per-skill ----
    skill_items = []
    for s in skills:
        sid = s["id"]
        prof = acc_map.get(sid)
        # Khoá theo MỌI tiên quyết — cả Skill lẫn Knowledge. Trước đây chỉ xét Skill nên
        # một skill có nền tảng Knowledge chưa nắm vẫn báo "bắt đầu được ngay".
        locked_by = [
            p["prereq_name"] for p in prereq_by_skill.get(sid, [])
            if not _unlocked(_prereq_prof(p))
        ]
        skill_items.append({
            "ref_id": sid, "name": s["name"], "type": "Skill",
            "level": s.get("level") or "beginner",
            "description": s.get("description"),
            "prof": prof, "status": _status_of(prof),
            "importance": _importance_of(s.get("weight")), "weight": s.get("weight"),
            "ready": len(locked_by) == 0, "locked_by": locked_by,
            "resources": res_skill.get(sid, {"contents": 0, "quizzes": 0, "mentors": 0}),
        })
    skill_id_set = {it["ref_id"] for it in skill_items}

    # ---- BẬC phụ thuộc ----
    # Bậc suy từ chính dữ liệu tiên quyết Skill->Skill, KHÔNG phải từ độ khó tự khai.
    # Độ khó chỉ còn là nhãn trên thẻ; thứ tự học do graph quyết định.
    prereq_skill_map = {
        it["ref_id"]: [p["prereq_id"] for p in prereq_by_skill.get(it["ref_id"], [])
                       if p["prereq_id"] in skill_id_set and p["prereq_id"] != it["ref_id"]]
        for it in skill_items
    }
    depth = _skill_depths(prereq_skill_map)

    status_by_id: dict[str, str | None] = {}
    item_by_ref = {it["ref_id"]: it for it in skill_items}
    for it in skill_items:
        nid = f"skill_{it['ref_id']}"
        nodes.append({
            "id": nid, "label": it["name"], "type": "Skill",
            "level": 1 + depth.get(it["ref_id"], 0),
            "meta": IMPORTANCE_LABEL[it["importance"]],
            "status": it["status"] if personalized else None,
            "ref_id": it["ref_id"], "importance": it["importance"],
            "ready": it["ready"], "locked_by": it["locked_by"],
            "difficulty": it["level"], "proficiency": it["prof"],
            "description": it["description"], "resources": it["resources"],
        })
        seen.add(nid)
        status_by_id[nid] = it["status"] if personalized else None
        edges.append({"from": root_id, "to": nid})

    # ---- NHÁNH: mỗi skill là 1 nhánh, knowledge tiên quyết nằm NGAY TRONG nhánh đó ----
    # Duyệt theo (bậc, thứ tự Cypher) để mục dùng chung rơi vào nhánh SỚM NHẤT cần nó —
    # hiện đúng một lần, các nhánh sau chỉ còn cạnh nét đứt trỏ ngược về.
    # Cạnh dashed vẫn giữ quy ước: from = tiên quyết, to = mục phụ thuộc.
    support_items = []
    branches = []
    for idx in sorted(range(len(skill_items)),
                      key=lambda i: (depth.get(skill_items[i]["ref_id"], 0), i)):
        it = skill_items[idx]
        ref_id = it["ref_id"]
        sid = f"skill_{ref_id}"
        tier = depth.get(ref_id, 0)
        prereq_ids, shared_ids, depends_on = [], [], []
        for p in prereq_by_skill.get(ref_id, []):
            ref = p["prereq_id"]
            if ref in skill_id_set:
                # tiên quyết là skill khác của vai trò → nó có nhánh riêng ở bậc trước
                edges.append({"from": f"skill_{ref}", "to": sid, "style": "dashed"})
                depends_on.append(item_by_ref[ref]["name"])
                continue
            pid = f"prereq_{ref}"
            ptype = p.get("prereq_type") or "Knowledge"
            if pid in seen:
                # đã thuộc về một nhánh sớm hơn — chỉ nối cạnh, không nhân đôi thẻ
                shared_ids.append(pid)
            else:
                pprof = _prereq_prof(p)
                pstatus = _status_of(pprof)
                pres = (res_know if ptype == "Knowledge" else res_skill).get(
                    ref, {"contents": 0, "quizzes": 0, "mentors": 0})
                nodes.append({
                    "id": pid, "label": p["prereq_name"], "type": ptype,
                    "level": 1 + tier,
                    "meta": "", "status": pstatus if personalized else None,
                    "ref_id": ref, "importance": _importance_of(p.get("weight")),
                    # Knowledge nằm ở đáy chuỗi tiên quyết — không ai chặn nó.
                    "ready": True, "locked_by": [],
                    "difficulty": p.get("prereq_level"),
                    "proficiency": pprof,
                    "description": p.get("prereq_description"),
                    "resources": pres,
                })
                seen.add(pid)
                status_by_id[pid] = pstatus if personalized else None
                prereq_ids.append(pid)
                support_items.append({
                    "ref_id": ref, "name": p["prereq_name"], "type": ptype,
                    "level": p.get("prereq_level") or "beginner",
                    "prof": pprof, "status": pstatus,
                    "importance": _importance_of(p.get("weight")), "weight": p.get("weight"),
                    "ready": True, "locked_by": [], "resources": pres,
                })
            edges.append({"from": pid, "to": sid, "style": "dashed"})

        branches.append({
            "tier": tier,
            "key": sid,
            "label": it["name"],
            "target_id": sid,
            # Học từ trên xuống: kiến thức nền trước, rồi mới chốt kỹ năng.
            "prereq_ids": prereq_ids,
            "shared_ids": shared_ids,
            "depends_on": depends_on,
            "node_ids": prereq_ids + [sid],
        })

    # ---- Chặng = BẬC. Mỗi bậc chứa các nhánh học song song được. ----
    groups = []
    for tier in sorted({b["tier"] for b in branches}):
        bs = [b for b in branches if b["tier"] == tier]
        ids = [nid for b in bs for nid in b["node_ids"]]
        # label = tên các năng lực chốt được ở bậc này, để đọc lướt là biết bậc này về gì.
        # Số bậc để riêng ở `tier` — FE hiện thành huy hiệu, khỏi lặp chữ trong label.
        g = _make_group(f"tier_{tier + 1}", " · ".join(b["label"] for b in bs), "tier",
                        ids, status_by_id, personalized)
        g["tier"] = tier + 1
        g["branches"] = [{k: v for k, v in b.items() if k != "tier"} for b in bs]
        groups.append(g)
    current = _mark_current(groups, personalized)

    # Nền tảng tính vào tiến độ chung — nó là việc phải học thật, không phải chú thích.
    # Khi có nền tảng thì đơn vị đếm là "mục" vì danh sách trộn cả Skill lẫn Knowledge.
    all_items = support_items + skill_items
    unit_vi = "mục" if support_items else "kỹ năng"
    summary = _summarize(all_items, root, unit_vi, personalized, unit_label="skill")
    summary["current_group"] = current
    return {"root": root, "account": account, "personalized": personalized,
            "nodes": nodes, "edges": edges, "groups": groups, "summary": summary}


# ---------------------------------------------------------------------------
# BY AREA
# ---------------------------------------------------------------------------
@router.get("/roadmap/by-area/{area_id}")
def roadmap_by_area(request: Request, area_id: str, account_id: str | None = None):
    account_id = _effective_account(_viewer(request), account_id)
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        area_rec = session.run(
            "MATCH (a:KnowledgeArea {id: $aid}) RETURN a.id AS id, a.name AS name",
            aid=area_id,
        ).single()
        if not area_rec:
            raise HTTPException(404, "KnowledgeArea not found")

        subareas = session.run(
            "MATCH (a:KnowledgeArea {id: $aid})-[r:PARENT_OF]->(c:KnowledgeArea) "
            "RETURN c.id AS id, c.name AS name, r.order AS ord "
            "ORDER BY coalesce(r.order, 9999), c.name",
            aid=area_id,
        ).data()

        knowledge = session.run(
            "MATCH (a:KnowledgeArea {id: $aid}) "
            "MATCH (owner:KnowledgeArea)-[h:HAS]->(k:Knowledge) "
            "WHERE owner = a OR (a)-[:PARENT_OF]->(owner) "
            "RETURN owner.id AS area_id, owner.name AS area_name, "
            "       k.id AS id, k.name AS name, k.kind AS kind, "
            "       k.description AS description, "
            "       k.difficulty AS difficulty, h.weight AS weight "
            "ORDER BY k.name",
            aid=area_id,
        ).data()

        know_ids = [k["id"] for k in knowledge]

        # "Tôi đang ở đâu" cho Knowledge — proxy dùng chung với by-role.
        know_prof = _knowledge_prof_map(session, account_id, know_ids)

        # tiên quyết giữa knowledge trong phạm vi (để tính readiness/thứ tự)
        prereq_pairs = []
        if know_ids:
            prereq_pairs = session.run(
                "MATCH (k1:Knowledge)-[:PREREQUISITE]->(k2:Knowledge) "
                "WHERE k1.id IN $ids AND k2.id IN $ids "
                "RETURN k1.id AS before, k2.id AS after",
                ids=know_ids,
            ).data()

        res_know = _knowledge_resources(session, know_ids)
        account = _account_name(session, account_id)

    return _build_area_tree(
        root={"id": area_rec["id"], "name": area_rec["name"], "type": "KnowledgeArea"},
        subareas=subareas, knowledge=knowledge, know_prof=know_prof,
        prereq_pairs=prereq_pairs, res_know=res_know,
        account=account, personalized=account is not None,
    )


def _build_area_tree(root, subareas, knowledge, know_prof, prereq_pairs, res_know,
                     account, personalized):
    root_id = f"root_{root['id']}"
    nodes = [{"id": root_id, "label": root["name"], "type": root["type"], "level": 0,
              "meta": "", "status": None}]
    edges = []
    seen = {root_id}

    for a in subareas:
        aid = f"area_{a['id']}"
        if aid not in seen:
            nodes.append({"id": aid, "label": a["name"], "type": "KnowledgeArea",
                          "level": 1, "meta": "lĩnh vực con", "status": None})
            seen.add(aid)
        edges.append({"from": root_id, "to": aid})

    # readiness: k sẵn sàng nếu mọi tiên quyết (before) đã done
    prereq_before: dict[str, list] = {}
    for pp in prereq_pairs:
        prereq_before.setdefault(pp["after"], []).append(pp["before"])

    def kstatus(kid):
        return _status_of(know_prof.get(kid))

    know_items = []
    for k in knowledge:
        kid = k["id"]
        status = kstatus(kid)
        importance = _importance_of(k.get("weight"))
        # Mở khoá dùng READY_THRESHOLD, không dùng mốc "hoàn thành" — cùng quy tắc by-role.
        locked_by = [b for b in prereq_before.get(kid, []) if not _unlocked(know_prof.get(b))]
        # map id tiên quyết -> tên để hiển thị
        locked_names = [nk["name"] for nk in knowledge if nk["id"] in locked_by]
        know_items.append({
            "ref_id": kid, "name": k["name"], "type": "Knowledge",
            "level": k.get("difficulty") or "beginner",
            "description": k.get("description"),
            "prof": know_prof.get(kid), "status": status,
            "importance": importance, "weight": k.get("weight"),
            "ready": len(locked_by) == 0, "locked_by": locked_names,
            "area_id": k["area_id"], "kind": k.get("kind"),
            "resources": res_know.get(kid, {"contents": 0, "quizzes": 0, "mentors": 0}),
        })

    status_by_id: dict[str, str | None] = {}
    by_area: dict[str, list] = {}
    for it in know_items:
        kid = f"knowledge_{it['ref_id']}"
        owner = it["area_id"]
        parent_id = root_id if owner == root["id"] else f"area_{owner}"
        if parent_id not in seen:
            parent_id = root_id
            owner = root["id"]
        if kid not in seen:
            nodes.append({
                "id": kid, "label": it["name"], "type": "Knowledge", "level": 2,
                "meta": IMPORTANCE_LABEL[it["importance"]] if personalized else (it["kind"] or ""),
                "status": it["status"] if personalized else None,
                "ref_id": it["ref_id"], "importance": it["importance"],
                "ready": it["ready"], "locked_by": it["locked_by"],
                "difficulty": it["level"], "proficiency": it["prof"],
                "kind": it["kind"], "description": it["description"],
                "resources": it["resources"],
            })
            seen.add(kid)
            status_by_id[kid] = it["status"] if personalized else None
            by_area.setdefault(owner, []).append(kid)
        edges.append({"from": parent_id, "to": kid})

    # Tiên quyết giữa knowledge: cùng quy ước tiên quyết -> mục phụ thuộc như by-role.
    for pp in prereq_pairs:
        a, b = f"knowledge_{pp['before']}", f"knowledge_{pp['after']}"
        if a in seen and b in seen:
            edges.append({"from": a, "to": b, "style": "dashed"})

    # ---- Chặng: knowledge của chính area trước, rồi tới từng lĩnh vực con ----
    groups = []
    if root["id"] in by_area:
        groups.append(_make_group(f"area_{root['id']}", root["name"], "area",
                                  by_area[root["id"]], status_by_id, personalized))
    for a in subareas:
        groups.append(_make_group(f"area_{a['id']}", a["name"], "area",
                                  by_area.get(a["id"], []), status_by_id, personalized))
    current = _mark_current(groups, personalized)

    summary = _summarize(know_items, root, "kiến thức", personalized, unit_label="knowledge")
    summary["current_group"] = current
    return {"root": root, "account": account, "personalized": personalized,
            "nodes": nodes, "edges": edges, "groups": groups, "summary": summary}


# ---------------------------------------------------------------------------
# SUMMARY (panel bên phải)
# ---------------------------------------------------------------------------
def _summarize(items, root, unit_vi, personalized, unit_label):
    """
    items: list dict có status/importance/weight/ready/level/name/locked_by/resources.
    Trả về summary cho panel: tiến độ %, phân bố, next_steps, milestones, headline.
    """
    total = len(items)
    done = sum(1 for it in items if it["status"] == "done")
    in_progress = sum(1 for it in items if it["status"] == "in_progress")
    not_started = total - done - in_progress

    # % theo trọng số quan trọng (weight); fallback đếm nếu tổng weight = 0
    def w(it):
        return 1.0 if it.get("weight") is None else float(it["weight"])
    total_w = sum(w(it) for it in items)
    done_w = sum(w(it) for it in items if it["status"] == "done")
    percent = round(done_w / total_w * 100) if total_w else 0
    percent_count = round(done / total * 100) if total else 0

    # Từ khi "hoàn thành" = 100%, `percent` đứng 0 rất lâu — đúng nhưng nhìn như chưa
    # làm gì cả. `mastery` đo công sức THẬT đã bỏ ra (trung bình proficiency có trọng số),
    # nên vẫn nhúc nhích sau mỗi buổi học. Hai số này bổ sung nhau, không thay thế nhau:
    # mastery để tạo động lực, percent để nói sự thật về việc đã xong hay chưa.
    mastery_w = sum(w(it) * (it.get("prof") or 0) for it in items)
    mastery = round(mastery_w / total_w * 100) if total_w else 0
    # Số mục đã đủ vững để đi tiếp — cột mốc trung gian giữa "chưa học" và "100%".
    on_track = sum(1 for it in items if _unlocked(it.get("prof")))

    # Milestone theo cấp độ (beginner→expert)
    ms_map: dict[str, dict] = {}
    for it in items:
        lvl = it["level"] if it["level"] in _LEVEL_RANK else "beginner"
        m = ms_map.setdefault(lvl, {"level": lvl, "total": 0, "done": 0})
        m["total"] += 1
        if it["status"] == "done":
            m["done"] += 1
    milestones = [
        {**ms_map[lvl], "percent": round(ms_map[lvl]["done"] / ms_map[lvl]["total"] * 100)}
        for lvl in SKILL_LEVELS if lvl in ms_map
    ]

    # "Học tiếp theo": các mục CHƯA done, ưu tiên sẵn sàng + quan trọng + dễ trước.
    imp_rank = {"essential": 0, "important": 1, "optional": 2}

    def sort_key(it):
        return (
            0 if it["ready"] else 1,                         # sẵn sàng trước
            0 if it["status"] == "in_progress" else 1,       # đang học dở → xong nốt
            imp_rank.get(it["importance"], 3),               # quan trọng hơn trước
            _LEVEL_RANK.get(it["level"], 9),                 # dễ hơn trước
            it["name"],
        )

    pending = [it for it in items if it["status"] != "done"]
    pending.sort(key=sort_key)
    next_steps = []
    for it in pending[:6]:
        if not it["ready"]:
            why = "Cần học trước: " + ", ".join(it["locked_by"][:3])
        elif it["status"] == "in_progress":
            pct = round((it["prof"] or 0) * 100)
            why = f"Đang ở {pct}% — còn {100 - pct}% nữa là hoàn thành"
        else:
            why = "Đã đủ điều kiện, bắt đầu được ngay"
        next_steps.append({
            "ref_id": it["ref_id"], "name": it["name"], "type": it["type"],
            "importance": it["importance"], "importance_label": IMPORTANCE_LABEL[it["importance"]],
            "ready": it["ready"], "status": it["status"], "why": why,
            "difficulty": it["level"], "resources": it["resources"],
        })

    # Headline tạo động lực
    if not personalized:
        headline = f"Lộ trình gồm {total} {unit_vi}. Chọn một học viên để xem bạn đang ở đâu."
        sub = None
    elif total == 0:
        headline = "Lộ trình này chưa có nội dung."
        sub = None
    elif done == total:
        headline = f"🎉 Xuất sắc! Bạn đã hoàn thành toàn bộ {total} {unit_vi} của lộ trình."
        sub = "Sẵn sàng cho thử thách tiếp theo!"
    elif done == 0 and in_progress > 0:
        # Chưa mục nào ĐỦ 100% nhưng đang dở nhiều — đừng nói "chưa bắt đầu", sai và nản.
        # "Gần nhất" phải là mục có proficiency CAO NHẤT, không phải next_steps[0] (mục đó
        # sắp theo độ ưu tiên học, không theo mức độ gần đích).
        headline = f"💪 Đang học {in_progress}/{total} {unit_vi} — chưa mục nào đủ 100%."
        closest = max((it for it in items if it["status"] == "in_progress"),
                      key=lambda it: it["prof"] or 0, default=None)
        sub = (f"Gần nhất: {closest['name']} — {round((closest['prof'] or 0) * 100)}%, "
               f"hoàn thiện nốt để tính là xong." if closest else None)
    elif done == 0:
        headline = f"🚀 Bắt đầu hành trình! {total} {unit_vi} đang chờ bạn chinh phục."
        sub = f"Ưu tiên: {next_steps[0]['name']}" if next_steps else None
    else:
        remaining = total - done
        headline = f"💪 Bạn đã đi được {percent}% — còn {remaining} {unit_vi} nữa là hoàn thành!"
        # milestone chưa xong gần nhất
        nxt_ms = next((m for m in milestones if m["done"] < m["total"]), None)
        if nxt_ms:
            left = nxt_ms["total"] - nxt_ms["done"]
            sub = f"Còn {left} {unit_vi} cấp {nxt_ms['level'].title()} để hoàn tất chặng này."
        else:
            sub = None

    return {
        "total": total, "done": done, "in_progress": in_progress, "not_started": not_started,
        "percent": percent, "percent_count": percent_count,
        "mastery": mastery, "on_track": on_track,
        "milestones": milestones, "next_steps": next_steps,
        "headline": headline, "sub": sub,
        "status_label": STATUS_LABEL, "importance_label": IMPORTANCE_LABEL,
        "level_label": LEVEL_LABEL,
    }
