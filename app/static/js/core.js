// ===== Core — state dung chung + helper dung form tu schema =====
//
// Module nay KHONG duoc import bat ky module tab nao — de tranh vong lap.
// Chieu phu thuoc luon la: main.js -> tab -> core.js

// SCHEMA la live binding: main.js goi setSchema() sau khi fetch /api/schema,
// moi module da import deu thay gia tri moi ngay.
export let SCHEMA = null;

export function setSchema(schema) {
  SCHEMA = schema;
}

// ---- Identity từ PHIÊN ĐĂNG NHẬP (cookie). Nguồn chân lý là /api/auth/me ----
// role: 'admin' (ghi trực tiếp) | 'expert' (gửi duyệt) | null (chưa đăng nhập).
export const IDENTITY = { role: null, email: null, name: null };

export async function fetchIdentity() {
  try {
    const u = await (await fetch('/api/auth/me')).json();
    if (u && u.role) {
      IDENTITY.role = u.role; IDENTITY.email = u.email; IDENTITY.name = u.name;
      return true;
    }
  } catch { /* ignore */ }
  IDENTITY.role = null; IDENTITY.email = null; IDENTITY.name = null;
  return false;
}

export function isExpert() { return IDENTITY.role === 'expert'; }
export function isAdmin() { return IDENTITY.role === 'admin'; }
export function isLoggedIn() { return !!IDENTITY.role; }

// ---- Giỏ "lô đề xuất" của chuyên gia: gom nhiều thay đổi rồi gửi 1 lần ----
export const EXPERT_BATCH = [];   // [{ kind, data, summary }]
let _onBatch = null;
export function onBatchChange(fn) { _onBatch = fn; }
export function addToBatch(op) { EXPERT_BATCH.push(op); if (_onBatch) _onBatch(); }
export function removeFromBatch(i) { EXPERT_BATCH.splice(i, 1); if (_onBatch) _onBatch(); }
export function clearBatch() { EXPERT_BATCH.length = 0; if (_onBatch) _onBatch(); }

// Gửi một đề xuất thay đổi. Danh tính lấy từ cookie ở server — không gửi kèm.
export async function submitChangeRequest(kind, data, note = '') {
  const res = await fetch('/api/change-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, data, note }),
  });
  return { ok: res.ok, data: await res.json() };
}

// Gom lỗi từ change-request/commit thành text hiển thị.
export function fmtErrors(detail) {
  if (!detail) return 'Lỗi không rõ';
  if (typeof detail === 'string') return detail;
  if (detail.errors && detail.errors.length) {
    return (detail.message ? detail.message + '\n' : '') +
      detail.errors.map(e => `• [row ${e.row ?? '?'}] ${e.field}: ${e.message}`).join('\n');
  }
  return detail.message || detail.error || JSON.stringify(detail);
}

// ---- Helpers ----
function showResult(elId, content, kind = '') {
  const el = document.getElementById(elId);
  el.className = 'result-box ' + kind;
  el.textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
}

function makeInput(field, spec) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const label = document.createElement('label');
  label.innerHTML = `${field} ${spec.required ? '<span class="req">*</span>' : ''} <small>(${spec.type})</small>`;
  wrap.appendChild(label);
  let input;

  if (spec.type === 'enum_list') {
    // chọn nhiều từ enum (vd quiz_tag) → <select multiple>
    input = document.createElement('select');
    input.multiple = true;
    input.size = Math.min(spec.enum.length, 6);
    spec.enum.forEach(v => input.appendChild(new Option(v, v)));
  } else if (spec.enum) {
    input = document.createElement('select');
    if (!spec.required) input.appendChild(new Option('-- none --', ''));
    spec.enum.forEach(v => input.appendChild(new Option(v, v)));
  } else if (spec.type === 'json') {
    input = document.createElement('textarea');
    input.rows = 4;
    input.placeholder = 'JSON, vd: [{"id":"...","title":"...","url":"..."}]';
  } else if (spec.type === 'string_list') {
    input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'cách nhau bởi dấu phẩy, vd: React, ReactJS';
  } else {
    input = document.createElement('input');
    input.type = (spec.type === 'float' || spec.type === 'int') ? 'number' : 'text';
    if (spec.type === 'float') input.step = '0.01';
    if (spec.max_len) input.maxLength = spec.max_len;
    if ('min' in spec) input.min = spec.min;
    if ('max' in spec) input.max = spec.max;
  }

  input.dataset.field = field;
  input.dataset.type = spec.type;
  // Gợi ý format id: slug có tiền tố theo loại node
  if (spec.primary_key) {
    input.placeholder = 'slug có tiền tố, vd: skill_react, knowledge_javascript';
  }
  wrap.appendChild(input);
  return wrap;
}

function collectProps(container) {
  const out = {};
  container.querySelectorAll('input,select,textarea').forEach(el => {
    const f = el.dataset.field;
    if (!f) return;
    const t = el.dataset.type;

    if (t === 'enum_list' || el.multiple) {
      const vals = Array.from(el.selectedOptions).map(o => o.value).filter(v => v !== '');
      if (vals.length) out[f] = vals;
      return;
    }
    if (t === 'string_list') {
      const vals = el.value.split(',').map(s => s.trim()).filter(s => s !== '');
      if (vals.length) out[f] = vals;
      return;
    }

    const v = el.value.trim();
    if (v === '') return;
    if (t === 'json') { out[f] = v; return; }   // giữ nguyên chuỗi JSON
    out[f] = t === 'float' ? parseFloat(v)
           : t === 'int' ? parseInt(v, 10) : v;
  });
  return out;
}

// ---- Nút phóng to graph ra toàn màn hình ----
// wrap = div .graph-zoom-wrap bọc ngoài container vis. getNetwork() trả
// instance vis.Network hiện tại (truyền hàm vì network hay bị destroy/tạo lại).
function attachGraphZoom(wrap, getNetwork) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'graph-zoom-btn';
  btn.title = 'Phóng to toàn màn hình (Esc để thoát)';
  btn.textContent = '⛶';
  wrap.appendChild(btn);

  const toggle = () => {
    const fs = wrap.classList.toggle('graph-zoom-fs');
    document.body.classList.toggle('graph-zoom-lock', fs);
    btn.textContent = fs ? '✕' : '⛶';
    btn.title = fs ? 'Thu nhỏ lại (Esc)' : 'Phóng to toàn màn hình (Esc để thoát)';
    // vis không tự biết container đổi cỡ khi đổi CSS — phải bảo nó vẽ lại
    setTimeout(() => {
      const net = getNetwork();
      if (net) { net.redraw(); net.fit(); }
    }, 50);
  };
  btn.addEventListener('click', toggle);
  wrap._zoomToggle = toggle;  // cho handler Esc toàn cục bên dưới gọi
}

// 1 listener Esc duy nhất cho mọi graph (core.js chỉ chạy 1 lần, không leak
// dù attachGraphZoom được gọi lại mỗi lần Visualizer render)
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.graph-zoom-fs').forEach(w => w._zoomToggle && w._zoomToggle());
});

export { showResult, makeInput, collectProps, attachGraphZoom };
