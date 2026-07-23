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
  if (spec.enum) {
    input = document.createElement('select');
    if (!spec.required) input.appendChild(new Option('-- none --', ''));
    spec.enum.forEach(v => input.appendChild(new Option(v, v)));
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
  // Add placeholder hints for id fields
  if (spec.primary_key) {
    input.placeholder = 'VD: USER-001, SKILL-003, COURSE-001';
  }
  wrap.appendChild(input);
  return wrap;
}

function collectProps(container) {
  const out = {};
  container.querySelectorAll('input,select').forEach(el => {
    const v = el.value.trim();
    if (v === '') return;
    const f = el.dataset.field;
    if (!f) return;
    out[f] = el.dataset.type === 'float' ? parseFloat(v)
           : el.dataset.type === 'int' ? parseInt(v, 10) : v;
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
