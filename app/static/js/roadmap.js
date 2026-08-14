// ===== Roadmap — lo trinh hoc dang "track": hero + cac chang + panel chi tiet =====
// Khong dung vis-network o tab nay nua: card la DOM that (hover/keyboard/animation),
// duong tien quyet ve bang SVG overlay dat DUOI card.
//
// Quy uoc du lieu tu API (xem app/routers/roadmap.py):
//   - data.groups[]  : cac CHANG, moi chang co node_ids + tien do rieng.
//   - node.level     : tang layout (int) — KHONG dung o day.
//   - node.difficulty: do kho (string) — cai nay moi la do kho.
//   - edge.style === 'dashed' : tien quyet, LUON from = tien quyet -> to = muc phu thuoc.

const TYPE_VI = { Skill: 'Kỹ năng', Knowledge: 'Kiến thức', JobRole: 'Vai trò', KnowledgeArea: 'Lĩnh vực' };
const IMP_BADGE = {
  essential: { cls: 'imp-essential', label: 'Bắt buộc', star: '⭐' },
  important: { cls: 'imp-important', label: 'Quan trọng', star: '' },
  optional:  { cls: 'imp-optional', label: 'Nên có', star: '' },
};
// Fallback khi server chua tra summary.level_label (nguon that nam o roadmap.py).
const LEVEL_VI_FALLBACK = { beginner: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao', expert: 'Chuyên sâu' };
const STATUS_CLASS = { done: 'is-done', in_progress: 'is-prog', not_started: 'is-todo' };
// Chi dung ky tu co san o moi font. "Dang hoc" ve bang CSS (::after), khong dung glyph
// nua vi mot so ky tu khoi hinh hoc (U+25D0...) bi lech baseline tren Windows.
const STATUS_ICON = { done: '✓', in_progress: '', not_started: '' };

const RM = {
  data: null,
  byId: new Map(),        // node.id  -> node
  byRef: new Map(),       // ref_id   -> node (uu tien node chinh, khong phai prereq_)
  prereqOf: new Map(),    // node.id  -> [id cac tien quyet]
  unlocks: new Map(),     // node.id  -> [id cac muc phu thuoc no]
  filters: { q: '', status: 'all', essentialOnly: false },
  showLinks: true,
  collapsed: new Set(),   // key chang bi thu gon THU CONG
  selected: null,
  sourcesLoaded: false,
  deepLinkDone: false,
  viewer: {},             // { role, email, locked_account } tu /api/roadmap/sources
};

/* ---------------------------------------------------------------- helpers */

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Tim kiem khong dau: "co ban" khop "Cơ bản".
function deaccent(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd').toLowerCase();
}

function levelVi(key) {
  const map = (RM.data && RM.data.summary && RM.data.summary.level_label) || LEVEL_VI_FALLBACK;
  return map[key] || key || '';
}

const $ = id => document.getElementById(id);

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function isLeaf(n) { return n.type === 'Skill' || n.type === 'Knowledge'; }

/* ------------------------------------------------------------ nap dropdown */

async function loadRoadmapSources() {
  syncKindUI();
  if (RM.sourcesLoaded) { applyDeepLink(); return; }
  try {
    const r = await fetch('/api/roadmap/sources');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();

    fillSelect($('rm-role-sel'), data.roles, '-- Chọn vai trò --');
    fillSelect($('rm-area-sel'), data.areas, '-- Chọn lĩnh vực --');
    // Ghi ro hoc vien nao co du lieu — chon nham account rong thi ca lo trinh xam het.
    fillSelect($('rm-account-sel'), data.accounts, 'Bản chung (chưa cá nhân hoá)', x => {
      const name = x.name || x.id;
      if (x.skill_count == null) return name;
      return x.skill_count > 0 ? `${name} — ${x.skill_count} kỹ năng` : `${name} — chưa có dữ liệu`;
    });

    applyViewer(data.viewer);
    RM.sourcesLoaded = true;
    applyDeepLink();
  } catch (e) {
    console.warn('[roadmap] Failed to load sources:', e);
    setHint('Không nạp được danh sách. Kiểm tra kết nối Neo4j rồi mở lại tab này.');
  }
}

// Giu nguyen lua chon cu khi nap lai (tab bi bam nhieu lan).
function fillSelect(sel, rows, placeholder, label) {
  const keep = sel.value;
  sel.innerHTML = '';
  sel.appendChild(new Option(placeholder, ''));
  (rows || []).forEach(x => sel.appendChild(new Option(label ? label(x) : (x.name || x.id), x.id)));
  if (keep && [...sel.options].some(o => o.value === keep)) sel.value = keep;
}

// Hoc vien khong duoc chon hoc vien khac -> giau han o chon di, khoi gay hieu nham.
// Day chi la lop trang tri: server da ep account_id theo phien dang nhap roi.
function applyViewer(viewer) {
  RM.viewer = viewer || {};
  if (RM.viewer.role !== 'user') return;
  const field = $('rm-account-sel').closest('.rm-field');
  const sel = $('rm-account-sel');
  if (RM.viewer.locked_account) {
    sel.value = RM.viewer.locked_account;
    if (field) field.hidden = true;
  } else if (field) {
    // Tai khoan hoc vien chua duoc gan Account nao -> noi thang, dung de man hinh trong tron.
    field.hidden = true;
    setHint('Tài khoản của bạn chưa được gắn với hồ sơ học tập nào trong hệ thống. '
      + 'Liên hệ quản trị viên để được gắn Account.');
  }
}

function currentKind() { return $('rm-kind-sel').value === 'area' ? 'area' : 'role'; }
function targetSelect() { return currentKind() === 'area' ? $('rm-area-sel') : $('rm-role-sel'); }

function syncKindUI() {
  const area = currentKind() === 'area';
  $('rm-role-sel').hidden = area;
  $('rm-area-sel').hidden = !area;
  $('rm-target-label').textContent = area ? 'Lĩnh vực' : 'Vai trò';
  $('rm-target-label').setAttribute('for', area ? 'rm-area-sel' : 'rm-role-sel');
}

function setHint(msg) {
  const el = $('rm-setup-hint');
  el.textContent = msg || '';
  el.hidden = !msg;
}

/* ------------------------------------------------------------- deep-link */

function writeDeepLink(kind, id, acc) {
  const u = new URL(location.href);
  u.searchParams.set('rm_kind', kind);
  u.searchParams.set('rm_id', id);
  if (acc) u.searchParams.set('rm_acc', acc); else u.searchParams.delete('rm_acc');
  history.replaceState({}, '', u);
}

function applyDeepLink() {
  if (RM.deepLinkDone) return;
  const p = new URLSearchParams(location.search);
  const id = p.get('rm_id');
  if (!id) return;
  RM.deepLinkDone = true;
  const kind = p.get('rm_kind') === 'area' ? 'area' : 'role';
  $('rm-kind-sel').value = kind;
  syncKindUI();
  const sel = targetSelect();
  if (![...sel.options].some(o => o.value === id)) {
    setHint('Liên kết trỏ tới một mục không còn tồn tại.');
    return;
  }
  sel.value = id;
  const acc = p.get('rm_acc');
  if (acc && [...$('rm-account-sel').options].some(o => o.value === acc)) $('rm-account-sel').value = acc;
  generate();
}

/* ---------------------------------------------------------------- fetch */

async function generate() {
  const kind = currentKind();
  const id = targetSelect().value;
  if (!id) {
    setHint(kind === 'area' ? 'Hãy chọn một lĩnh vực trước khi tạo lộ trình.' : 'Hãy chọn một vai trò trước khi tạo lộ trình.');
    targetSelect().focus();
    return;
  }
  setHint('');
  const acc = $('rm-account-sel').value;
  showSkeleton();
  try {
    const qs = acc ? `?account_id=${encodeURIComponent(acc)}` : '';
    const r = await fetch(`/api/roadmap/by-${kind}/${encodeURIComponent(id)}${qs}`);
    if (r.status === 404) throw new Error(kind === 'area' ? 'Không tìm thấy lĩnh vực này.' : 'Không tìm thấy vai trò này.');
    if (!r.ok) throw new Error(`Máy chủ trả về HTTP ${r.status}`);
    writeDeepLink(kind, id, acc);
    renderAll(await r.json());
  } catch (e) {
    showError(e.message);
  }
}

function showSkeleton() {
  $('rm-hero').innerHTML = '';
  $('rm-toolbar').innerHTML = '';
  $('rm-panel').hidden = true;
  $('rm-canvas').innerHTML = [0, 1, 2].map(() => `
    <div class="rm-skel-stage">
      <div class="rm-skel-line"></div>
      <div class="rm-skel-cards">${'<div class="rm-skel-card"></div>'.repeat(3)}</div>
    </div>`).join('');
}

function showError(msg) {
  $('rm-hero').innerHTML = '';
  $('rm-toolbar').innerHTML = '';
  $('rm-panel').hidden = true;
  $('rm-canvas').innerHTML =
    `<div class="rm-error"><div class="res-icon">⚠️</div><strong>Không tạo được lộ trình</strong>
     <p>${escapeHtml(msg)}</p><button type="button" id="rm-retry">Thử lại</button></div>`;
  const btn = $('rm-retry');
  if (btn) btn.addEventListener('click', generate);
}

/* ---------------------------------------------------------------- render */

function renderAll(data) {
  RM.data = data;
  RM.selected = null;
  RM.collapsed = new Set();
  RM.filters = { q: '', status: 'all', essentialOnly: false };

  RM.byId = new Map(data.nodes.map(n => [n.id, n]));
  RM.byRef = new Map();
  data.nodes.forEach(n => {
    if (!n.ref_id) return;
    const primary = n.id.startsWith('skill_') || n.id.startsWith('knowledge_');
    if (primary || !RM.byRef.has(n.ref_id)) RM.byRef.set(n.ref_id, n);
  });

  RM.prereqOf = new Map();
  RM.unlocks = new Map();
  (data.edges || []).filter(e => e.style === 'dashed').forEach(e => {
    if (!RM.byId.has(e.from) || !RM.byId.has(e.to)) return;
    if (!RM.prereqOf.has(e.to)) RM.prereqOf.set(e.to, []);
    RM.prereqOf.get(e.to).push(e.from);
    if (!RM.unlocks.has(e.from)) RM.unlocks.set(e.from, []);
    RM.unlocks.get(e.from).push(e.to);
  });

  const leaves = data.nodes.filter(isLeaf);
  if (!leaves.length) {
    $('rm-hero').innerHTML = '';
    $('rm-toolbar').innerHTML = '';
    $('rm-panel').hidden = true;
    $('rm-canvas').innerHTML =
      `<div class="roadmap-empty-state"><div class="res-icon">📭</div>
       <h3>Lộ trình này chưa có nội dung</h3>
       <p>${escapeHtml(data.root.name)} chưa được gắn kỹ năng hoặc kiến thức nào trong graph.</p></div>`;
    return;
  }

  RM.showLinks = countPrereqEdges() > 0 && countPrereqEdges() <= 40;
  renderHero();
  renderToolbar();
  renderTrack();
  renderPanel();
  requestAnimationFrame(drawLinks);
}

function countPrereqEdges() {
  return (RM.data.edges || []).filter(e => e.style === 'dashed').length;
}

/* ---- Hero ---- */

function renderHero() {
  const d = RM.data, s = d.summary, pers = !!d.personalized;
  const kindLabel = TYPE_VI[d.root.type] || d.root.type;

  const who = pers
    ? `<div class="rm-hero-who">👤 Học viên: ${escapeHtml(d.account.name)}</div>`
    : '';

  const ring = pers ? ringHtml(s.percent) : '';

  const stats = pers
    ? `<div class="rm-hero-stats">
         <span class="rm-stat"><i class="done"></i><b>${s.done}</b> đã đạt</span>
         <span class="rm-stat"><i class="prog"></i><b>${s.in_progress}</b> đang học</span>
         <span class="rm-stat"><i class="todo"></i><b>${s.not_started}</b> chưa học</span>
         <span class="rm-stat">Tổng <b>${s.total}</b> mục</span>
       </div>`
    : `<div class="rm-hero-stats"><span class="rm-stat">Lộ trình gồm <b>${s.total}</b> mục</span></div>`;

  // Hoc vien khong co o chon nao de bam -> khong moc CTA nay ra.
  const learner = RM.viewer.role === 'user';
  const cta = (pers || learner) ? '' : `
    <div class="rm-hero-cta">
      Đây là <strong>bản chung</strong> — chưa biết bạn đang ở đâu.
      Chọn một học viên để lộ trình tự đánh dấu đã đạt / đang học / còn thiếu.
      <button type="button" id="rm-pick-acc">Chọn học viên</button>
    </div>`;

  // Xam toan bo co 2 nguyen nhan khac han nhau — phai noi ro la nguyen nhan nao.
  let notice = '';
  if (pers && s.done === 0 && s.in_progress === 0 && s.total > 0) {
    const sc = d.account.skill_count;
    if (sc === 0) {
      notice = `<div class="rm-notice">Học viên <b>${escapeHtml(d.account.name)}</b> chưa có kỹ năng nào
        được ghi nhận trong graph (không có quan hệ <code>HAS_SKILL</code>), nên mọi mục đều hiện “chưa học”.
        Hãy chọn học viên khác — dropdown có ghi số kỹ năng của từng người.</div>`;
    } else if (sc > 0) {
      notice = `<div class="rm-notice">Học viên có <b>${sc} kỹ năng</b> trong hồ sơ, nhưng
        <b>không kỹ năng nào thuộc lộ trình này</b> — nên toàn bộ vẫn là “chưa học”.
        Thử một vai trò hoặc lĩnh vực khác.</div>`;
    }
  }

  $('rm-hero').innerHTML = `
    <div class="rm-hero">
      <div class="rm-hero-id">
        <span class="rm-hero-kind">${escapeHtml(kindLabel)}</span>
        <h3 class="rm-hero-name">${escapeHtml(d.root.name)}</h3>
        ${who}
        <div class="rm-hero-line">${escapeHtml(s.headline)}
          ${s.sub ? `<div class="rm-hero-sub">${escapeHtml(s.sub)}</div>` : ''}
        </div>
        ${stats}
        ${notice}
      </div>
      ${ring}
      ${cta}
    </div>`;

  const pick = $('rm-pick-acc');
  if (pick) pick.addEventListener('click', () => {
    const sel = $('rm-account-sel');
    sel.focus();
    sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function ringHtml(percent) {
  const r = 44, c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return `
    <div class="rm-ring" role="img" aria-label="Hoàn thành ${percent} phần trăm">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <defs>
          <linearGradient id="rmRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#22c55e"/>
          </linearGradient>
        </defs>
        <circle class="rm-ring-track" cx="52" cy="52" r="${r}" fill="none" stroke-width="9"/>
        <circle class="rm-ring-fill" cx="52" cy="52" r="${r}" fill="none" stroke-width="9"
                stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
      </svg>
      <div class="rm-ring-text"><span class="rm-ring-pct">${percent}%</span><span class="rm-ring-cap">HOÀN THÀNH</span></div>
    </div>`;
}

/* ---- Toolbar ---- */

function renderToolbar() {
  const pers = !!RM.data.personalized;
  const hasLinks = countPrereqEdges() > 0;

  const chips = pers ? `
    <button type="button" class="rm-chip" data-status="all" aria-pressed="true">Tất cả</button>
    <button type="button" class="rm-chip" data-status="todo" aria-pressed="false">Cần làm</button>
    <button type="button" class="rm-chip" data-status="prog" aria-pressed="false">Đang học</button>
    <button type="button" class="rm-chip" data-status="done" aria-pressed="false">Đã đạt</button>` : '';

  $('rm-toolbar').innerHTML = `
    <div class="rm-tools">
      <div class="rm-tools-left">
        <input type="search" id="rm-q" class="rm-search" placeholder="Tìm trong lộ trình…" aria-label="Tìm trong lộ trình">
        ${chips}
        <button type="button" class="rm-chip" id="rm-ess" aria-pressed="false">⭐ Chỉ bắt buộc</button>
      </div>
      <div class="rm-tools-right">
        <span class="rm-tools-note" id="rm-count"></span>
        ${hasLinks ? `<button type="button" class="rm-tool-btn ${RM.showLinks ? 'is-on' : ''}" id="rm-links-btn"
           aria-pressed="${RM.showLinks}"
           title="Bật/tắt các đường nét đứt nối mục học trước với mục phụ thuộc">🔗 Đường tiên quyết</button>` : ''}
        ${pers ? `<button type="button" class="rm-tool-btn" id="rm-here-btn"
           title="Cuộn tới chặng bạn đang học dở">📍 Chặng hiện tại</button>` : ''}
        <button type="button" class="rm-tool-btn" id="rm-fold-btn"
          title="Thu gọn hoặc mở tất cả các chặng">Thu gọn hết</button>
        <button type="button" class="rm-tool-btn" id="rm-copy-btn"
          title="Chép URL của đúng lộ trình này để gửi cho người khác">🔗 Chép liên kết</button>
      </div>
    </div>
    ${guideHtml(pers)}`;

  wireGuide();

  $('rm-q').addEventListener('input', debounce(e => {
    RM.filters.q = deaccent(e.target.value.trim());
    applyFilters();
  }, 160));

  $('rm-toolbar').querySelectorAll('.rm-chip[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      RM.filters.status = btn.dataset.status;
      $('rm-toolbar').querySelectorAll('.rm-chip[data-status]').forEach(b =>
        b.setAttribute('aria-pressed', String(b === btn)));
      applyFilters();
    });
  });

  $('rm-ess').addEventListener('click', () => {
    RM.filters.essentialOnly = !RM.filters.essentialOnly;
    $('rm-ess').setAttribute('aria-pressed', String(RM.filters.essentialOnly));
    applyFilters();
  });

  const linkBtn = $('rm-links-btn');
  if (linkBtn) linkBtn.addEventListener('click', () => {
    RM.showLinks = !RM.showLinks;
    linkBtn.classList.toggle('is-on', RM.showLinks);
    linkBtn.setAttribute('aria-pressed', String(RM.showLinks));
    drawLinks();
  });

  const hereBtn = $('rm-here-btn');
  if (hereBtn) hereBtn.addEventListener('click', () => {
    const key = RM.data.summary.current_group;
    const el = key && document.querySelector(`.rm-stage[data-key="${CSS.escape(key)}"]`);
    (el || document.querySelector('.rm-track')).scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('rm-fold-btn').addEventListener('click', () => {
    const stages = [...document.querySelectorAll('.rm-stage')];
    const anyOpen = stages.some(s => s.getAttribute('aria-expanded') === 'true');
    stages.forEach(s => {
      if (anyOpen) RM.collapsed.add(s.dataset.key); else RM.collapsed.delete(s.dataset.key);
    });
    $('rm-fold-btn').textContent = anyOpen ? 'Mở hết' : 'Thu gọn hết';
    applyFilters();
  });

  $('rm-copy-btn').addEventListener('click', async () => {
    const btn = $('rm-copy-btn');
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = '✓ Đã chép';
    } catch {
      btn.textContent = 'Ctrl+C để chép URL';
    }
    setTimeout(() => { btn.textContent = '🔗 Chép liên kết'; }, 2000);
  });
}

/* ---- Huong dan doc lo trinh ----
   Dung <details> de co san toggle + ban phim. Mo san lan dau, sau do nho lua chon
   cua nguoi dung trong localStorage — huong dan khong nen lam phien mai. */

const GUIDE_KEY = 'rm-guide-open';

function guideHtml(personalized) {
  const open = localStorage.getItem(GUIDE_KEY) !== '0';
  const colors = personalized
    ? `<li><span class="rm-gd-sw done"></span><b>Xanh</b> đã đạt ·
        <span class="rm-gd-sw prog"></span><b>Cam</b> đang học ·
        <span class="rm-gd-sw todo"></span><b>Xám</b> chưa học ·
        <span class="rm-gd-sw lock"></span><b>Đỏ 🔒</b> chưa mở khoá vì còn thiếu mục phải học trước.</li>
       <li>Dải <b>📍 BẠN ĐANG Ở ĐÂY</b> nằm ngay trước chặng bạn còn dang dở. Chặng nào xong 100% sẽ <b>tự thu gọn</b>.</li>`
    : `<li>Đây là <b>bản chung</b> nên chưa có màu tiến độ. Chọn một học viên ở trên rồi bấm
        <b>Tạo lộ trình</b> để mỗi ô tự đánh dấu đã đạt / đang học / chưa học.</li>`;

  return `
    <details class="rm-guide" id="rm-guide" ${open ? 'open' : ''}>
      <summary>Đọc lộ trình này thế nào?</summary>
      <ul>
        <li><b>Đọc từ trên xuống.</b> Mỗi khối là một <b>chặng</b>; trong chặng là các mục cần học.
            Cuối cùng là 🏁 vạch đích.</li>
        ${colors}
        <li><b>Nét đứt</b> nối hai ô nghĩa là phải xong ô đầu mới học được ô sau.
            Rê chuột vào một ô để làm nổi chuỗi liên quan tới nó.</li>
        <li><b>Bấm vào một ô</b> → cột bên phải hiện mô tả, cần học trước những gì, và nó mở khoá cho cái gì.</li>
        <li><b>Bấm tên chặng</b> để thu gọn hoặc mở lại. Ô tìm kiếm gõ <b>không cần dấu</b> cũng ra.</li>
      </ul>
    </details>`;
}

function wireGuide() {
  const g = $('rm-guide');
  if (g) g.addEventListener('toggle', () => localStorage.setItem(GUIDE_KEY, g.open ? '1' : '0'));
}

/* ---- Track ---- */

// Thu tu chang do BACKEND quyet dinh (nen tang da duoc xep dau tu ben do).
// Van loc lai mot lan de phong response cu con cache trong tab dang mo.
function orderedGroups() {
  const gs = RM.data.groups || fallbackGroups();
  return [...gs.filter(g => g.kind === 'support'), ...gs.filter(g => g.kind !== 'support')];
}

// Phong khi backend cu chua tra `groups`: gom tam theo do kho.
function fallbackGroups() {
  const by = new Map();
  RM.data.nodes.filter(isLeaf).forEach(n => {
    const k = n.difficulty || 'beginner';
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(n.id);
  });
  return [...by.entries()].map(([k, ids]) => ({
    key: k, label: levelVi(k), kind: 'level', node_ids: ids,
    total: ids.length, done: 0, in_progress: 0, not_started: ids.length, percent: 0, current: false,
  }));
}

function renderTrack() {
  const pers = !!RM.data.personalized;
  const groups = orderedGroups();
  let idx = 0;
  // Hai marker rieng vi mui ten khong ke thua duoc mau stroke cua path.
  const arrow = (id, fill) =>
    `<marker id="${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">` +
    `<path d="M0,1 L7,4 L0,7 z" fill="${fill}"/></marker>`;
  const parts = [`<svg class="rm-links" aria-hidden="true"><defs>${arrow('rmArrow', '#cbd5e1')}${arrow('rmArrowHot', '#e11d48')}</defs></svg>`];

  groups.forEach(g => {
    if (g.current) parts.push('<div class="rm-here"><span>📍 BẠN ĐANG Ở ĐÂY</span></div>');
    const support = g.kind === 'support';
    const num = support ? '0' : String(++idx);
    const complete = pers && g.total > 0 && g.done === g.total;
    // Chang da xong thi thu gon san — bot nhieu, tap trung vao viec con lai.
    if (complete) RM.collapsed.add(g.key);

    const cls = ['rm-stage', complete ? 'is-complete' : '', g.current ? 'is-current' : ''].filter(Boolean).join(' ');
    // Chang nen tang gio CO thanh tien do nhu moi chang khac — no la viec phai hoc that,
    // truoc day de trong nen nhin nhu chu thich va bi bo qua.
    const bar = (pers && g.total)
      ? `<span class="rm-stage-bar"><i style="width:${g.percent}%"></i></span>
         <span class="rm-stage-count">${g.done}/${g.total} xong</span>`
      : `<span class="rm-stage-count">${g.total} mục</span>`;

    // by-role tra ve `branches` (cay con: kien thuc nen -> ky nang chot).
    // by-area khong co -> ve luoi the phang nhu cu.
    const body = (g.branches && g.branches.length)
      ? g.branches.map(branchHtml).join('')
      : cardsHtml(g.node_ids);

    const tierChip = g.tier ? `<span class="rm-stage-kind">Bậc ${g.tier}</span>` : '';

    parts.push(`
      <section class="${cls}" data-key="${escapeHtml(g.key)}" aria-expanded="true">
        <button type="button" class="rm-stage-head" aria-controls="rm-body-${escapeHtml(g.key)}">
          <span class="rm-stage-idx">${complete ? '✓' : num}</span>
          <span class="rm-stage-name">${escapeHtml(g.label)}</span>
          ${tierChip}${support ? '<span class="rm-stage-kind">bổ trợ</span>' : ''}
          ${bar}
          <span class="rm-stage-caret" aria-hidden="true"></span>
        </button>
        <div class="rm-stage-body" id="rm-body-${escapeHtml(g.key)}">
          ${body || '<div class="rm-stage-empty">Chặng này chưa có mục nào.</div>'}
        </div>
      </section>`);
  });

  parts.push(finishHtml());
  parts.push('<div class="rm-nomatch" hidden id="rm-nomatch">Không có mục nào khớp bộ lọc. Thử xoá từ khoá hoặc chọn “Tất cả”.</div>');

  const canvas = $('rm-canvas');
  canvas.innerHTML = `<div class="rm-track" id="rm-track">${parts.join('')}</div>`;
  wireTrack(canvas.querySelector('#rm-track'));
  applyFilters();
}

function cardsHtml(ids) {
  const cards = (ids || []).map(id => RM.byId.get(id)).filter(Boolean).map(cardHtml).join('');
  return cards ? `<div class="rm-cards">${cards}</div>` : '';
}

// Mot NHANH = mot nang luc: kien thuc nen xep TRUOC, ky nang chot xep SAU.
// Doc tu tren xuong chinh la thu tu hoc, khong con kieu "tang skill / tang knowledge".
function branchHtml(b) {
  const dep = (b.depends_on || []).length
    ? `<span class="rm-branch-dep">cần xong trước: ${escapeHtml(b.depends_on.join(', '))}</span>` : '';

  const prereqs = (b.prereq_ids || []).map(id => RM.byId.get(id)).filter(Boolean);
  const shared = (b.shared_ids || []).map(id => RM.byId.get(id)).filter(Boolean);
  const target = RM.byId.get(b.target_id);

  const steps = [];
  prereqs.forEach(n => steps.push(`<li class="rm-step-node">${cardHtml(n)}</li>`));
  // Muc dung chung da hien o bac som hon — nhac lai bang mot dong tro nguoc, khong nhan doi the.
  shared.forEach(n => steps.push(
    `<li class="rm-step-node is-ref"><button type="button" class="rm-refchip" data-node="${escapeHtml(n.id)}">
       ↑ ${escapeHtml(n.label)} <span>đã có ở bậc trước</span></button></li>`));
  if (target) steps.push(`<li class="rm-step-node is-target">${cardHtml(target)}</li>`);

  return `
    <div class="rm-branch">
      <div class="rm-branch-head">
        <span class="rm-branch-name">${escapeHtml(b.label)}</span>
        ${dep}
      </div>
      <ol class="rm-branch-steps">${steps.join('')}</ol>
    </div>`;
}

function finishHtml() {
  const d = RM.data, s = d.summary;
  if (d.personalized && s.total > 0 && s.done === s.total) {
    return `<div class="rm-finish is-reached"><span class="rm-finish-idx">🏁</span>
      Bạn đã hoàn thành toàn bộ lộ trình <strong>${escapeHtml(d.root.name)}</strong>.</div>`;
  }
  const left = d.personalized ? s.total - s.done : s.total;
  return `<div class="rm-finish"><span class="rm-finish-idx">🏁</span>
    Đích đến: làm chủ <strong>${escapeHtml(d.root.name)}</strong> — còn ${left} mục nữa.</div>`;
}

function cardHtml(n) {
  const pers = !!RM.data.personalized;
  const status = pers ? (n.status || 'not_started') : null;
  const locked = pers && n.ready === false && status !== 'done';
  // Phan biet KY NANG / KIEN THUC ngay tren the: khac mau vien, khac huy hieu.
  // Truoc day chi khac nhau o dong chu nho, nhin luot khong tach duoc hai loai.
  const isSkill = n.type === 'Skill';
  const cls = ['rm-card', isSkill ? 'is-skill' : 'is-know',
    pers ? STATUS_CLASS[status] : 'is-todo', locked ? 'is-locked' : ''].filter(Boolean).join(' ');
  const icon = locked ? '🔒' : (pers ? (STATUS_ICON[status] || '') : '');

  const imp = IMP_BADGE[n.importance] || IMP_BADGE.optional;
  const tags = [
    `<span class="rm-badge type ${isSkill ? 'is-skill' : 'is-know'}">${isSkill ? '◆ Kỹ năng' : '○ Kiến thức'}</span>`,
    `<span class="rm-badge ${imp.cls}">${imp.star}${imp.label}</span>`,
  ];
  if (n.type === 'Knowledge' && n.kind) tags.push(`<span class="rm-badge kind">${escapeHtml(n.kind)}</span>`);

  // Hien con SO % ben canh thanh: "hoan thanh" gio la 100%, nen nguoi hoc phai thay ro
  // minh dang o 70% chu khong chi mot thanh mau doan chung.
  const pct = (pers && n.proficiency != null && n.proficiency > 0)
    ? Math.round(n.proficiency * 100) : null;
  const prof = pct === null ? ''
    : `<span class="rm-card-prog"><span class="rm-card-bar"><i style="width:${pct}%"></i></span>
       <span class="rm-card-pct">${pct}%</span></span>`;

  const lock = locked && (n.locked_by || []).length
    ? `<span class="rm-card-lock">🔒 Cần trước: ${escapeHtml(n.locked_by.slice(0, 2).join(', '))}${n.locked_by.length > 2 ? ` +${n.locked_by.length - 2}` : ''}</span>`
    : '';

  const r = n.resources || {};
  const bits = [];
  if (r.contents) bits.push(`📚 ${r.contents}`);
  if (r.quizzes) bits.push(`📝 ${r.quizzes}`);
  if (r.mentors) bits.push(`🎓 ${r.mentors}`);
  const res = bits.length ? `<span class="rm-card-res">${bits.join(' · ')}</span>` : '';

  // Loai da nam o huy hieu phia duoi -> dong nay chi con do kho, khong lap lai.
  const sub = n.difficulty ? levelVi(n.difficulty) : '';

  return `
    <button type="button" class="${cls}" data-node="${escapeHtml(n.id)}" data-ref="${escapeHtml(n.ref_id || '')}">
      <span class="rm-card-ico" aria-hidden="true">${icon}</span>
      <span class="rm-card-main">
        <span class="rm-card-title">${escapeHtml(n.label)}</span>
        <span class="rm-card-sub">${escapeHtml(sub)}</span>
        ${prof}
        <span class="rm-card-tags">${tags.join('')}</span>
        ${lock}
        ${res}
      </span>
    </button>`;
}

function wireTrack(track) {
  track.addEventListener('click', e => {
    const head = e.target.closest('.rm-stage-head');
    if (head) {
      const stage = head.closest('.rm-stage');
      const key = stage.dataset.key;
      if (RM.collapsed.has(key)) RM.collapsed.delete(key); else RM.collapsed.add(key);
      applyFilters();
      return;
    }
    // Chip "↑ ... đã có ở bậc trước" -> nhay ve dung the goc o bac som hon.
    const ref = e.target.closest('.rm-refchip');
    if (ref) { selectNode(ref.dataset.node); return; }
    const card = e.target.closest('.rm-card');
    if (card) selectNode(card.dataset.node);
  });

  // Hover / focus lam noi chuoi tien quyet lien quan.
  track.addEventListener('mouseover', e => {
    const card = e.target.closest('.rm-card');
    if (card) setFocus(card.dataset.node);
  });
  track.addEventListener('mouseout', e => {
    if (e.target.closest('.rm-card')) setFocus(RM.selected);
  });
  track.addEventListener('focusin', e => {
    const card = e.target.closest('.rm-card');
    if (card) setFocus(card.dataset.node);
  });
}

/* ---- loc + dem ---- */

function filterActive() {
  const f = RM.filters;
  return !!f.q || f.status !== 'all' || f.essentialOnly;
}

function nodeMatches(n) {
  const f = RM.filters;
  if (f.essentialOnly && n.importance !== 'essential') return false;
  if (f.status === 'done' && n.status !== 'done') return false;
  if (f.status === 'prog' && n.status !== 'in_progress') return false;
  if (f.status === 'todo' && n.status === 'done') return false;
  if (f.q) {
    const hay = deaccent(`${n.label} ${n.meta || ''} ${n.description || ''} ${n.kind || ''}`);
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function applyFilters() {
  const track = $('rm-track');
  if (!track) return;
  const active = filterActive();
  let shown = 0;

  track.querySelectorAll('.rm-stage').forEach(stage => {
    let visible = 0;
    stage.querySelectorAll('.rm-card').forEach(card => {
      const n = RM.byId.get(card.dataset.node);
      const ok = !n || nodeMatches(n);
      card.hidden = !ok;
      // an ca <li> bao ngoai, khong thi cay con con lai o trong danh so
      const li = card.closest('.rm-step-node');
      if (li) li.hidden = !ok;
      if (ok) visible++;
    });
    // Nhanh khong con the nao khop thi an luon ca dau nhanh.
    stage.querySelectorAll('.rm-branch').forEach(br => {
      br.hidden = active && !br.querySelector('.rm-card:not([hidden])');
    });
    shown += visible;
    stage.hidden = active && visible === 0;
    // Khi dang loc thi mo het chang co ket qua, khoi phai bam tung cai.
    const expanded = active ? true : !RM.collapsed.has(stage.dataset.key);
    stage.setAttribute('aria-expanded', String(expanded));
    stage.querySelector('.rm-stage-head').setAttribute('aria-expanded', String(expanded));
    stage.querySelector('.rm-stage-body').hidden = !expanded;
  });

  const marker = track.querySelector('.rm-here');
  if (marker) marker.hidden = active;
  const finish = track.querySelector('.rm-finish');
  if (finish) finish.hidden = active;
  const none = $('rm-nomatch');
  if (none) none.hidden = shown > 0;

  const count = $('rm-count');
  if (count) count.textContent = active ? `Hiện ${shown}/${RM.data.summary.total} mục` : '';

  drawLinks();
}

/* ---- duong tien quyet (SVG) ---- */

function drawLinks() {
  const track = $('rm-track');
  if (!track) return;
  const svg = track.querySelector('.rm-links');
  if (!svg) return;
  [...svg.querySelectorAll('path.rm-link')].forEach(p => p.remove());
  if (!RM.showLinks) return;

  const base = track.getBoundingClientRect();
  const shown = el => el && el.offsetParent !== null;

  (RM.data.edges || []).filter(e => e.style === 'dashed').forEach(e => {
    const a = track.querySelector(`.rm-card[data-node="${CSS.escape(e.from)}"]`);
    const b = track.querySelector(`.rm-card[data-node="${CSS.escape(e.to)}"]`);
    if (!shown(a) || !shown(b)) return;

    const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
    const ax = ar.left - base.left, ay = ar.top - base.top;
    const bx = br.left - base.left, by = br.top - base.top;
    let d;
    if (br.top - ar.bottom > 12) {
      // muc phu thuoc nam duoi: day A -> dinh B
      const x1 = ax + ar.width / 2, y1 = ay + ar.height;
      const x2 = bx + br.width / 2, y2 = by;
      const k = Math.max(22, (y2 - y1) * 0.45);
      d = `M${x1},${y1} C${x1},${y1 + k} ${x2},${y2 - k} ${x2},${y2}`;
    } else {
      // cung hang hoac nam tren: di canh ben
      const right = br.left >= ar.left;
      const x1 = right ? ax + ar.width : ax;
      const x2 = right ? bx : bx + br.width;
      const y1 = ay + ar.height / 2, y2 = by + br.height / 2;
      const k = Math.max(26, Math.abs(x2 - x1) * 0.5) * (right ? 1 : -1);
      d = `M${x1},${y1} C${x1 + k},${y1} ${x2 - k},${y2} ${x2},${y2}`;
    }
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('class', 'rm-link');
    p.setAttribute('d', d);
    p.setAttribute('marker-end', 'url(#rmArrow)');
    p.dataset.from = e.from;
    p.dataset.to = e.to;
    svg.appendChild(p);
  });

  if (RM.selected) setFocus(RM.selected);
}

function setFocus(nodeId) {
  const track = $('rm-track');
  if (!track) return;
  track.classList.toggle('is-focused', !!nodeId);
  const hot = new Set(nodeId
    ? [nodeId, ...(RM.prereqOf.get(nodeId) || []), ...(RM.unlocks.get(nodeId) || [])]
    : []);
  track.querySelectorAll('.rm-card').forEach(c => c.classList.toggle('is-hot', hot.has(c.dataset.node)));
  track.querySelectorAll('path.rm-link').forEach(p => {
    const on = p.dataset.from === nodeId || p.dataset.to === nodeId;
    p.classList.toggle('is-hot', on);
    p.setAttribute('marker-end', on ? 'url(#rmArrowHot)' : 'url(#rmArrow)');
  });
}

/* ---- chon 1 muc ---- */

function selectNode(nodeId) {
  const n = RM.byId.get(nodeId);
  if (!n) return;
  RM.selected = RM.selected === nodeId ? null : nodeId;
  document.querySelectorAll('.rm-card').forEach(c =>
    c.classList.toggle('is-sel', c.dataset.node === RM.selected));
  setFocus(RM.selected);
  renderPanel();
}

function focusNodeCard(nodeId) {
  const card = document.querySelector(`.rm-card[data-node="${CSS.escape(nodeId)}"]`);
  if (!card) return;
  const stage = card.closest('.rm-stage');
  if (stage && stage.getAttribute('aria-expanded') === 'false') {
    RM.collapsed.delete(stage.dataset.key);
    applyFilters();
  }
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('rm-card-flash');
  void card.offsetWidth;              // ep trinh duyet chay lai animation
  card.classList.add('rm-card-flash');
  card.focus({ preventScroll: true });
}

/* ---- Panel ben phai ---- */

function renderPanel() {
  const panel = $('rm-panel');
  panel.hidden = false;
  if (RM.selected && RM.byId.has(RM.selected)) renderPanelDetail(panel, RM.byId.get(RM.selected));
  else renderPanelOverview(panel);
}

function renderPanelOverview(panel) {
  const d = RM.data, s = d.summary, pers = !!d.personalized;

  const title = pers ? '📌 Học tiếp theo' : '⭐ Nên bắt đầu từ đây';
  let steps;
  if (s.next_steps.length) {
    steps = s.next_steps.map((it, i) => {
      const imp = IMP_BADGE[it.importance] || IMP_BADGE.optional;
      const flag = pers
        ? (it.status === 'in_progress'
            ? '<span class="rm-badge ready">Đang học dở</span>'
            : (it.ready ? '<span class="rm-badge ready">Sẵn sàng</span>' : '<span class="rm-badge locked">🔒 Chưa mở khoá</span>'))
        : '';
      return `
        <button type="button" class="rm-step" data-ref="${escapeHtml(it.ref_id)}">
          <span class="rm-step-num">${i + 1}</span>
          <span class="rm-step-body">
            <span class="rm-step-title">${escapeHtml(it.name)}
              <span class="rm-type-tag ${it.type === 'Skill' ? 'skill' : 'know'}">${it.type === 'Skill' ? 'Kỹ năng' : 'Kiến thức'}</span>
            </span>
            <span class="rm-step-badges">
              <span class="rm-badge ${imp.cls}">${imp.star}${imp.label}</span>
              ${flag}
              ${it.difficulty ? `<span class="rm-badge diff">${escapeHtml(levelVi(it.difficulty))}</span>` : ''}
            </span>
            <span class="rm-step-why">${escapeHtml(it.why)}</span>
          </span>
        </button>`;
    }).join('');
  } else {
    steps = '<div class="rm-all-done">🎉 Không còn mục nào cần học — đã hoàn thành hết!</div>';
  }

  const nav = orderedGroups().map(g =>
    `<button type="button" class="rm-linkbtn" data-stage="${escapeHtml(g.key)}">${escapeHtml(g.label)}${
      pers && g.total ? ` <span style="opacity:.6">${g.done}/${g.total}</span>` : ''}</button>`
  ).join('');

  panel.innerHTML = `
    <div class="rm-panel-who">${pers ? '👤 ' + escapeHtml(d.account.name) + ' · ' : ''}🎯 ${escapeHtml(d.root.name)}</div>
    <div class="rm-section"><h4>${title}</h4>${steps}</div>
    <div class="rm-section"><h4>🧭 Đi tới chặng</h4><div>${nav}</div></div>`;

  panel.querySelectorAll('.rm-step').forEach(btn => btn.addEventListener('click', () => {
    const node = RM.byRef.get(btn.dataset.ref);
    if (node) focusNodeCard(node.id);
  }));
  panel.querySelectorAll('.rm-linkbtn[data-stage]').forEach(btn => btn.addEventListener('click', () => {
    const stage = document.querySelector(`.rm-stage[data-key="${CSS.escape(btn.dataset.stage)}"]`);
    if (!stage) return;
    RM.collapsed.delete(btn.dataset.stage);
    applyFilters();
    stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderPanelDetail(panel, n) {
  const pers = !!RM.data.personalized;
  const status = n.status || 'not_started';
  const locked = pers && n.ready === false && status !== 'done';

  const badges = [];
  if (pers) {
    const cls = { done: 'st-done', in_progress: 'st-prog', not_started: 'st-todo' }[status];
    const pct = n.proficiency != null ? ` · ${Math.round(n.proficiency * 100)}%` : '';
    badges.push(`<span class="rm-badge ${cls}">${escapeHtml(RM.data.summary.status_label[status])}${pct}</span>`);
  }
  if (n.importance) {
    const imp = IMP_BADGE[n.importance] || IMP_BADGE.optional;
    badges.push(`<span class="rm-badge ${imp.cls}">${imp.star}${imp.label}</span>`);
  }
  if (n.difficulty) badges.push(`<span class="rm-badge diff">${escapeHtml(levelVi(n.difficulty))}</span>`);
  if (pers && !locked && status !== 'done') badges.push('<span class="rm-badge ready">Bắt đầu được ngay</span>');
  if (locked) badges.push('<span class="rm-badge locked">🔒 Chưa mở khoá</span>');

  const desc = n.description
    ? `<div class="rm-detail-desc">${escapeHtml(n.description)}</div>`
    : `<div class="rm-detail-desc muted">Mục này chưa có mô tả trong graph.</div>`;

  const chips = ids => (ids || []).map(id => {
    const t = RM.byId.get(id);
    if (!t) return '';
    const bad = pers && t.status && t.status !== 'done';
    return `<button type="button" class="rm-linkbtn ${bad ? 'locked' : ''}" data-goto="${escapeHtml(id)}">${escapeHtml(t.label)}</button>`;
  }).join('');

  const prereqs = chips(RM.prereqOf.get(n.id));
  const unlocks = chips(RM.unlocks.get(n.id));

  const r = n.resources || {};
  const bits = [];
  if (r.contents) bits.push(`📚 ${r.contents} học liệu`);
  if (r.quizzes) bits.push(`📝 ${r.quizzes} quiz`);
  if (r.mentors) bits.push(`🎓 ${r.mentors} mentor`);
  // Content chi COVERS Knowledge nen Skill khong bao gio co hoc lieu — noi ro thay vi de trong.
  const resFallback = n.type === 'Skill'
    ? 'Chưa có quiz hoặc mentor gắn kèm (học liệu chỉ gắn vào Kiến thức).'
    : 'Chưa có học liệu gắn kèm.';

  panel.innerHTML = `
    <button type="button" class="rm-back" id="rm-back">← Quay lại tổng quan</button>
    <h3 class="rm-detail-title">${escapeHtml(n.label)}</h3>
    <div class="rm-detail-kind">${escapeHtml(TYPE_VI[n.type] || n.type)}${n.kind ? ' · ' + escapeHtml(n.kind) : ''}</div>
    <div class="rm-detail-badges">${badges.join('')}</div>
    ${desc}
    ${prereqs ? `<div class="rm-detail-row"><span class="rm-detail-k">Cần học trước</span><span class="rm-detail-v">${prereqs}</span></div>` : ''}
    ${unlocks ? `<div class="rm-detail-row"><span class="rm-detail-k">Mở khoá cho</span><span class="rm-detail-v">${unlocks}</span></div>` : ''}
    <div class="rm-detail-row"><span class="rm-detail-k">Tài nguyên</span>
      <span class="rm-detail-v ${bits.length ? '' : 'muted'}">${bits.length ? bits.join(' · ') : resFallback}</span></div>`;

  $('rm-back').addEventListener('click', () => selectNode(n.id));
  panel.querySelectorAll('.rm-linkbtn[data-goto]').forEach(btn => btn.addEventListener('click', () => {
    focusNodeCard(btn.dataset.goto);
    selectNode(btn.dataset.goto);
  }));
}

/* ---------------------------------------------------------------- wiring */

$('rm-gen').addEventListener('click', generate);
$('rm-kind-sel').addEventListener('change', () => { syncKindUI(); setHint(''); });
[$('rm-role-sel'), $('rm-area-sel'), $('rm-account-sel')].forEach(sel =>
  sel.addEventListener('change', () => setHint('')));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && RM.selected) selectNode(RM.selected);
});

window.addEventListener('resize', debounce(drawLinks, 140));

// Mo thang tab Roadmap khi vao bang deep-link (doi qua man hinh dang nhap neu can).
(function autoOpenFromLink() {
  if (!new URLSearchParams(location.search).get('rm_id')) return;
  const btn = document.querySelector('.tab[data-tab="roadmap"]');
  const overlay = $('login-overlay');
  if (!btn) return;
  const open = () => { if (!btn.classList.contains('active')) btn.click(); };
  if (!overlay || overlay.style.display === 'none') { open(); return; }
  const obs = new MutationObserver(() => {
    if (overlay.style.display === 'none') { obs.disconnect(); open(); }
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ['style'] });
})();

export { loadRoadmapSources };
