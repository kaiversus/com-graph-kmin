// ===== Auth (đăng nhập) + quản tài khoản + duyệt đề xuất =====
import { IDENTITY, fetchIdentity, isExpert, isAdmin, isLearner } from './core.js';

let RB_COMMIT_LABEL = 'Commit cả cây';
let onAuthed = null;   // callback nạp dữ liệu app sau khi đăng nhập

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---- Hiện/ẩn app vs màn đăng nhập ----
function showLogin() {
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('identity-bar').style.display = 'none';
  document.querySelector('nav.tabs').style.visibility = 'hidden';
}
function showApp() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('identity-bar').style.display = 'flex';
  document.querySelector('nav.tabs').style.visibility = 'visible';
}

// ---- Áp vai trò lên UI ----
function applyRole() {
  // Hoc vien: chi con dung tab Roadmap. Chan o FE cho gon mat — chan that nam o
  // middleware _auth_gate + allowlist _USER_ALLOWED trong app/main.py.
  if (isLearner()) {
    document.querySelectorAll('nav.tabs .tab').forEach(btn => {
      btn.style.display = btn.dataset.tab === 'roadmap' ? '' : 'none';
    });
    const rm = document.querySelector('.tab[data-tab="roadmap"]');
    if (rm && !rm.classList.contains('active')) rm.click();
    document.querySelectorAll('.expert-note').forEach(el => { el.style.display = 'none'; });
    const bp0 = document.getElementById('batch-panel');
    if (bp0) bp0.style.display = 'none';
    document.getElementById('identity-current').innerHTML =
      `👤 <b>${esc(IDENTITY.name)}</b> <span class="id-email">${esc(IDENTITY.email)}</span>`
      + ' — Học viên · chỉ xem lộ trình của mình';
    document.body.classList.add('role-learner');
    return;
  }

  const expert = isExpert();
  document.querySelectorAll('.tab[data-admin-only]').forEach(btn => { btn.style.display = expert ? 'none' : ''; });
  const active = document.querySelector('.tab.active');
  if (expert && active && active.hasAttribute('data-admin-only')) {
    document.querySelector('.tab[data-tab="build"]').click();
  }
  document.querySelectorAll('.expert-note').forEach(el => { el.style.display = expert ? 'block' : 'none'; });
  const cbtn = document.getElementById('rb-commit');
  if (cbtn) cbtn.textContent = expert ? '📤 Gửi duyệt' : RB_COMMIT_LABEL;

  const cur = document.getElementById('identity-current');
  const roleTxt = expert ? 'Chuyên gia · thao tác sẽ vào <b>lô đề xuất</b>' : 'Admin · ghi trực tiếp';
  cur.innerHTML = `👤 <b>${esc(IDENTITY.name)}</b> <span class="id-email">${esc(IDENTITY.email)}</span> — ${roleTxt}`;
  document.body.classList.toggle('role-expert', expert);

  // Giỏ "Lô đề xuất" chỉ hiện cho chuyên gia
  const bp = document.getElementById('batch-panel');
  if (bp) bp.style.display = expert ? 'block' : 'none';
}

// ---- "Đề xuất của tôi" (chuyên gia xem phản hồi admin) ----
const _KIND_LABEL = {
  build: 'Thêm mới', update_node: 'Sửa node', delete_node: 'Xoá node',
  update_rel: 'Sửa quan hệ', delete_rel: 'Xoá quan hệ', batch: 'Lô thao tác',
};
const _ST = { pending: '⏳ Chờ duyệt', approved: '✅ Đã duyệt', rejected: '❌ Từ chối' };

async function loadMyRequests() {
  const box = document.getElementById('myreq-list');
  if (!box) return;
  box.innerHTML = '<div class="hint">Đang tải…</div>';
  let rows = [];
  try { rows = await (await fetch('/api/my-requests')).json(); }
  catch (e) { box.innerHTML = `<div class="err-text">Lỗi: ${e}</div>`; return; }
  if (!Array.isArray(rows) || !rows.length) {
    box.innerHTML = '<div class="hint">Bạn chưa gửi đề xuất nào. Gom thay đổi ở Guided Build / Manage rồi gửi lô.</div>';
    return;
  }
  box.innerHTML = rows.map(c => {
    const ops = (c.payload && c.payload.operations) ? c.payload.operations : null;
    const opList = ops ? `<ul class="myreq-ops">${ops.map(o => `<li>${esc(o.summary || o.kind)}</li>`).join('')}</ul>` : '';
    const resp = c.status === 'rejected'
      ? `<div class="myreq-resp reject">Admin từ chối${c.review_note ? ': ' + esc(c.review_note) : ''}</div>`
      : c.status === 'approved'
        ? `<div class="myreq-resp ok">Admin đã duyệt & ghi vào graph ✓</div>`
        : (c.last_error ? `<div class="myreq-resp reject">Lần duyệt trước lỗi: ${esc(c.last_error)}</div>` : '');
    return `
      <div class="myreq-item rv-st-${c.status}">
        <div class="rv-item-top">
          <span class="rv-kind">${_KIND_LABEL[c.kind] || c.kind}</span>
          <span class="rv-status">${_ST[c.status] || c.status}</span>
        </div>
        <div class="rv-summary">${esc(c.summary)}</div>
        ${c.note ? `<div class="myreq-note">📝 ${esc(c.note)}</div>` : ''}
        ${opList}
        <div class="rv-meta">Gửi: ${esc((c.created_at || '').replace('T', ' ').slice(0, 16))}`
        + `${c.reviewed_at ? ' · Duyệt: ' + esc((c.reviewed_at || '').replace('T', ' ').slice(0, 16)) : ''}</div>
        ${resp}
      </div>`;
  }).join('');
}

// ---- Đăng nhập / xuất / đổi mật khẩu ----
async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  const btn = document.getElementById('login-submit');
  btn.disabled = true; btn.textContent = 'Đang đăng nhập…';
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) { errEl.textContent = d.detail || 'Đăng nhập thất bại'; return; }
    document.getElementById('login-password').value = '';
    if (d.must_change_pw) alert('Bạn đang dùng mật khẩu tạm. Sau khi vào, bấm "Đổi mật khẩu".');
    // Reload để nạp SẠCH theo danh tính mới (không dính state tài khoản cũ).
    location.reload();
  } catch (err) {
    errEl.textContent = 'Lỗi mạng: ' + err;
  } finally {
    btn.disabled = false; btn.textContent = 'Đăng nhập';
  }
}

async function doLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.reload();   // reload → xoá sạch state trong bộ nhớ (giỏ lô, draft…)
}

async function doChangePw() {
  const pw = prompt('Mật khẩu mới (tối thiểu 6 ký tự):', '');
  if (pw === null) return;
  const r = await fetch('/api/auth/change-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_password: pw }),
  });
  const d = await r.json();
  alert(r.ok ? '✓ Đã đổi mật khẩu.' : 'Lỗi: ' + (d.detail || JSON.stringify(d)));
}

// ---- Quản lý tài khoản chuyên gia + học viên (admin) ----
const ROLE_VI = { admin: 'Admin', expert: 'Chuyên gia', user: 'Học viên' };

async function loadUsers() {
  const box = document.getElementById('rv-users');
  if (!box) return;
  let users = [];
  // Lay ca chuyen gia lan hoc vien; admin goc khong hien (khong xoa duoc).
  try {
    const all = await (await fetch('/api/auth/users')).json();
    users = (all || []).filter(u => u.role !== 'admin');
  } catch { /* ignore */ }
  box.innerHTML = users.length
    ? users.map(u => {
        const bound = u.role === 'user'
          ? (u.account_id
              ? ` → <code>${esc(u.account_id)}</code>`
              : ' <span class="rv-warn">chưa gắn Account</span>')
          : '';
        return `<div class="rv-exp-row"><span><b>${esc(u.name)}</b> <code>${esc(u.email)}</code>`
          + ` <span class="rv-role-tag rv-role-${esc(u.role)}">${esc(ROLE_VI[u.role] || u.role)}</span>${bound}</span>`
          + `<button type="button" class="danger rv-usr-del" data-email="${esc(u.email)}">Xoá</button></div>`;
      }).join('')
    : '<div class="hint">Chưa có tài khoản nào. Tạo ở trên.</div>';
  box.querySelectorAll('.rv-usr-del').forEach(b => b.addEventListener('click', () => deleteUser(b.dataset.email)));
}

// Nap danh sach Account de gan cho hoc vien (dung lai endpoint roadmap sources).
async function loadAccountOptions() {
  const sel = document.getElementById('rv-usr-acc');
  if (!sel || sel.dataset.loaded) return;
  try {
    const d = await (await fetch('/api/roadmap/sources')).json();
    (d.accounts || []).forEach(a => {
      const n = a.skill_count;
      const label = n == null ? a.id : `${a.id} — ${n > 0 ? n + ' kỹ năng' : 'chưa có dữ liệu'}`;
      sel.appendChild(new Option(label, a.id));
    });
    sel.dataset.loaded = '1';
  } catch { /* ignore */ }
}

function syncUserRoleUI() {
  const isLearnerRole = document.getElementById('rv-usr-role').value === 'user';
  document.getElementById('rv-usr-acc').hidden = !isLearnerRole;
  if (isLearnerRole) loadAccountOptions();
}

async function addUser() {
  const role = document.getElementById('rv-usr-role').value;
  const email = document.getElementById('rv-usr-email').value.trim();
  const name = document.getElementById('rv-usr-name').value.trim();
  const pw = document.getElementById('rv-usr-pw').value;
  const accountId = document.getElementById('rv-usr-acc').value;
  if (!email || !name || !pw) { alert('Nhập email, tên và mật khẩu.'); return; }
  if (role === 'user' && !accountId) { alert('Học viên phải được gắn với một Account trong graph.'); return; }
  const r = await fetch('/api/auth/users', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password: pw, role, account_id: accountId || null }),
  });
  const d = await r.json();
  if (!r.ok) { alert('Lỗi: ' + (d.detail || JSON.stringify(d))); return; }
  document.getElementById('rv-usr-email').value = '';
  document.getElementById('rv-usr-name').value = '';
  document.getElementById('rv-usr-pw').value = '';
  document.getElementById('rv-usr-acc').value = '';
  alert(`✓ Đã tạo tài khoản ${ROLE_VI[role]} ${email}. Gửi email + mật khẩu vừa đặt cho họ.`);
  loadUsers();
}

async function deleteUser(email) {
  if (!confirm(`Xoá tài khoản '${email}'? (Đề xuất cũ vẫn giữ lịch sử)`)) return;
  const r = await fetch(`/api/auth/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
  if (!r.ok) { const d = await r.json(); alert('Lỗi: ' + (d.detail || '')); return; }
  loadUsers();
}

// ---- Hàng chờ đề xuất ----
const KIND_LABEL = {
  build: 'Thêm mới', update_node: 'Sửa node', delete_node: 'Xoá node',
  update_rel: 'Sửa quan hệ', delete_rel: 'Xoá quan hệ',
};
const STATUS_LABEL = { pending: '⏳ Chờ duyệt', approved: '✅ Đã duyệt', rejected: '❌ Từ chối' };

async function updateBadge() {
  if (!isAdmin()) return;
  try {
    const pend = await (await fetch('/api/change-request?status=pending')).json();
    const badge = document.getElementById('review-badge');
    const n = Array.isArray(pend) ? pend.length : 0;
    if (badge) { badge.textContent = n; badge.style.display = n ? 'inline-block' : 'none'; }
  } catch { /* ignore */ }
}

async function loadQueue() {
  const status = document.getElementById('rv-filter').value;
  const list = document.getElementById('rv-list');
  list.innerHTML = '<div class="hint">Đang tải…</div>';
  let rows = [];
  try {
    const qs = status ? `?status=${status}` : '';
    rows = await (await fetch('/api/change-request' + qs)).json();
  } catch (e) { list.innerHTML = `<div class="err-text">Lỗi tải: ${e}</div>`; return; }

  if (!Array.isArray(rows) || !rows.length) { list.innerHTML = '<div class="hint">Không có đề xuất nào.</div>'; }
  else {
    list.innerHTML = rows.map(c => `
      <div class="rv-item rv-st-${c.status}" data-id="${esc(c.id)}">
        <div class="rv-item-top">
          <span class="rv-kind">${KIND_LABEL[c.kind] || c.kind}</span>
          <span class="rv-status">${STATUS_LABEL[c.status] || c.status}</span>
        </div>
        <div class="rv-summary">${esc(c.summary)}</div>
        <div class="rv-meta">👤 ${esc(c.expert_name)} · ${esc((c.created_at || '').replace('T', ' ').slice(0, 16))}</div>
      </div>`).join('');
    list.querySelectorAll('.rv-item').forEach(el => el.addEventListener('click', () => showDetail(el.dataset.id)));
  }
  updateBadge();
}

function _kv(obj) {
  const e = Object.entries(obj || {}).filter(([k]) => k !== 'id' || true);
  if (!e.length) return '<span class="hint">(trống)</span>';
  return e.map(([k, v]) => `<code>${esc(k)}</code>=${esc(_fv(v))}`).join(', ');
}
function _fv(v) { return Array.isArray(v) ? '[' + v.join(', ') + ']' : (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)); }

function opCard(op) {
  const icon = { add: '➕', edit: '✏️', delete: '🗑' }[op.action] || '•';
  let body = '';
  if (op.action === 'add') {
    const nodes = (op.add_nodes || []).map(n => `<li><b>${esc(n.label)}</b> — ${_kv(n.props)}</li>`).join('');
    const rels = (op.add_rels || []).map(r =>
      `<li>${esc(r.start)} —[<b>${esc(r.rel_type)}</b>]→ ${esc(r.end)}${r.props && Object.keys(r.props).length ? ' · ' + _kv(r.props) : ''}</li>`).join('');
    body = (nodes ? `<div class="op-sub">Node thêm mới:</div><ul>${nodes}</ul>` : '')
         + (rels ? `<div class="op-sub">Quan hệ thêm mới:</div><ul>${rels}</ul>` : '');
  } else if (op.action === 'edit') {
    const d = op.diff || {};
    const rows = [
      ...(d.changed || []).map(c => `<tr><td>${esc(c.field)}</td><td class="old">${esc(_fv(c.old))}</td><td class="new">${esc(_fv(c.new))}</td></tr>`),
      ...(d.added || []).map(c => `<tr><td>${esc(c.field)}</td><td class="old">—</td><td class="new">${esc(_fv(c.new))}</td></tr>`),
      ...(d.removed || []).map(c => `<tr><td>${esc(c.field)}</td><td class="old">${esc(_fv(c.old))}</td><td class="new del">(bỏ)</td></tr>`),
    ].join('');
    if (!op.exists) body = '<div class="err-text">⚠ Không tìm thấy đối tượng — có thể đã bị xoá/đổi.</div>';
    body += rows ? `<table class="op-diff"><tr><th>Trường</th><th>Hiện tại</th><th>Đề xuất</th></tr>${rows}</table>`
                 : '<div class="hint">Không có trường nào thay đổi.</div>';
  } else if (op.action === 'delete') {
    body = !op.exists ? '<div class="hint">Đối tượng không còn tồn tại.</div>'
      : `<div class="op-del">Sẽ xoá: ${_kv(op.current)}${op.rels_deleted ? ` <b>· kèm ${op.rels_deleted} quan hệ</b>` : ''}</div>`;
  }
  return `<div class="op-card op-${op.action}"><div class="op-title">${icon} ${esc(op.title)}</div>${body}</div>`;
}

function renderPayload(cr) {
  if (Array.isArray(cr.operations)) {
    return `<div class="op-list">${cr.operations.map(opCard).join('')}</div>`;
  }
  return `<pre class="rv-pl-json">${esc(JSON.stringify(cr.payload || {}, null, 2))}</pre>`;
}

async function showDetail(id) {
  const box = document.getElementById('rv-detail');
  box.innerHTML = '<div class="hint">Đang tải…</div>';
  let cr;
  try { cr = await (await fetch(`/api/change-request/${encodeURIComponent(id)}`)).json(); }
  catch (e) { box.innerHTML = `<div class="err-text">Lỗi: ${e}</div>`; return; }
  if (cr.detail) { box.innerHTML = `<div class="err-text">${esc(cr.detail.message || 'Lỗi')}</div>`; return; }

  const isPending = cr.status === 'pending';
  box.innerHTML = `
    <div class="rv-detail-head">
      <span class="rv-kind">${KIND_LABEL[cr.kind] || cr.kind}</span>
      <span class="rv-status">${STATUS_LABEL[cr.status] || cr.status}</span>
    </div>
    <div class="rv-detail-sum">${esc(cr.summary)}</div>
    <div class="rv-meta">👤 ${esc(cr.expert_name)} <code>${esc(cr.expert_id)}</code></div>
    ${cr.note ? `<div class="rv-note">📝 ${esc(cr.note)}</div>` : ''}
    ${renderPayload(cr)}
    ${cr.last_error ? `<div class="err-text">Lần thử trước lỗi: ${esc(cr.last_error)}</div>` : ''}
    ${cr.audit_id ? `<div class="ok-text">audit: ${esc(cr.audit_id)} (Restore ở tab Audit)</div>` : ''}
    ${cr.review_note ? `<div class="rv-note">Lý do từ chối: ${esc(cr.review_note)}</div>` : ''}
    ${isPending ? `
      <div class="rv-actions">
        <button id="rv-approve" type="button" class="rv-approve-btn">✅ Duyệt &amp; ghi</button>
        <button id="rv-reject" type="button" class="danger">❌ Từ chối</button>
      </div>` : ''}`;
  if (isPending) {
    document.getElementById('rv-approve').addEventListener('click', () => approve(id));
    document.getElementById('rv-reject').addEventListener('click', () => reject(id));
  }
}

async function approve(id) {
  if (!confirm('Duyệt và GHI đề xuất này vào graph?')) return;
  const btn = document.getElementById('rv-approve');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang ghi…'; }
  const r = await fetch(`/api/change-request/${encodeURIComponent(id)}/approve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
  const d = await r.json();
  if (!r.ok) {
    const det = d.detail || d;
    alert('Không ghi được (đã rollback):\n' + (det.message || JSON.stringify(det)));
    if (btn) { btn.disabled = false; btn.textContent = '✅ Duyệt & ghi'; }
    showDetail(id); return;
  }
  await loadQueue(); showDetail(id);
}

async function reject(id) {
  const reason = prompt('Lý do từ chối (tùy chọn):', '');
  if (reason === null) return;
  const r = await fetch(`/api/change-request/${encodeURIComponent(id)}/reject`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!r.ok) { const d = await r.json(); alert('Lỗi: ' + (d.detail?.message || d.detail || '')); return; }
  await loadQueue(); showDetail(id);
}

// ---- Init auth (gọi đầu tiên từ main.js) ----
async function initAuth(onAuthedCb) {
  onAuthed = onAuthedCb;
  const cbtn = document.getElementById('rb-commit');
  if (cbtn) RB_COMMIT_LABEL = cbtn.textContent;

  document.getElementById('login-form').addEventListener('submit', doLogin);
  document.getElementById('btn-logout').addEventListener('click', doLogout);
  document.getElementById('btn-change-pw').addEventListener('click', doChangePw);
  document.getElementById('rv-refresh').addEventListener('click', loadQueue);
  document.getElementById('rv-filter').addEventListener('change', loadQueue);
  document.getElementById('rv-usr-add').addEventListener('click', addUser);
  document.getElementById('rv-usr-role').addEventListener('change', syncUserRoleUI);

  const logged = await fetchIdentity();
  if (logged) {
    showApp(); applyRole();
    if (onAuthed) await onAuthed();
  } else {
    showLogin();
  }
}

// Gọi khi mở tab Review
function onReviewTab() {
  if (!isAdmin()) return;
  loadQueue();
  loadUsers();
}

export { initAuth, applyRole, onReviewTab, updateBadge, loadMyRequests };
