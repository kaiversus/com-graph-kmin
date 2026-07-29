// ===== Manage — sửa / xoá node & quan hệ đã tồn tại =====
//
// Layout 2 cột: trái = tìm kiếm + graph (chỉ để nhìn), phải = property + quan hệ.
// Tìm qua /api/recommend/existing, đọc/sửa/xoá qua /api/crud/*.
// Mọi thao tác đi qua importer (snapshot + AuditLog) → Restore được ở tab Audit.
import { SCHEMA, showResult, makeInput, collectProps } from './core.js';

let MNG = { label: null, node: null, selectedId: null, network: null };

function mngDebounce(fn, ms = 250) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// Điền value hiện tại vào các input/select/textarea đã dựng bằng makeInput
function prefill(container, props) {
  container.querySelectorAll('input,select,textarea').forEach(el => {
    const f = el.dataset.field;
    if (!f || props[f] === undefined || props[f] === null) return;
    const val = props[f];
    if (el.multiple) {
      // enum_list: chọn các option khớp giá trị mảng
      const set = new Set(Array.isArray(val) ? val : [val]);
      Array.from(el.options).forEach(o => { o.selected = set.has(o.value); });
    } else if (Array.isArray(val)) {
      // string_list: hiển thị dạng "a, b, c"
      el.value = val.join(', ');
    } else {
      el.value = val;
    }
  });
}

// Nút Save chỉ sáng khi giá trị khác baseline (lúc vừa nạp). Không sửa → mờ.
function watchDirty(grid, saveBtn) {
  const baseline = JSON.stringify(collectProps(grid));
  const check = () => { saveBtn.disabled = JSON.stringify(collectProps(grid)) === baseline; };
  grid.addEventListener('input', check);
  grid.addEventListener('change', check);
  saveBtn.disabled = true;
}

function populateManageLabels() {
  const sel = document.getElementById('mng-label');
  sel.innerHTML = '';
  Object.keys(SCHEMA.nodes).forEach(l => sel.appendChild(new Option(l, l)));
  sel.addEventListener('change', () => { mngResetDetail(); mngSearch(); });
  document.getElementById('mng-search').addEventListener('input', mngDebounce(mngSearch));
  mngSearch();
}

// ---- Tìm kiếm → list click được ---------------------------------------------

async function mngSearch() {
  const label = document.getElementById('mng-label').value;
  if (!label) return;
  const q = document.getElementById('mng-search').value.trim();
  const list = document.getElementById('mng-list');
  list.innerHTML = '<div class="mng-list-empty">Đang tải…</div>';
  try {
    const url = `/api/recommend/existing/${encodeURIComponent(label)}?limit=50`
      + (q ? `&q=${encodeURIComponent(q)}` : '');
    const d = await (await fetch(url)).json();
    list.innerHTML = '';
    if (d.needs_search) {
      list.innerHTML = `<div class="mng-list-empty">Gõ để tìm trong ${d.total} ${label}…</div>`;
      return;
    }
    if (!d.items.length) {
      list.innerHTML = '<div class="mng-list-empty">(không có kết quả)</div>';
      return;
    }
    d.items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'mng-list-item' + (it.id === MNG.selectedId ? ' active' : '');
      row.innerHTML = `<span>${it.name}</span><span class="mid">${it.id}</span>`;
      row.addEventListener('click', () => {
        MNG.selectedId = it.id;
        list.querySelectorAll('.mng-list-item').forEach(e => e.classList.remove('active'));
        row.classList.add('active');
        mngLoadNode(label, it.id);
      });
      list.appendChild(row);
    });
  } catch (e) { showResult('mng-result', `Lỗi tìm: ${e}`, 'err'); }
}

function mngResetDetail() {
  MNG.node = null;
  MNG.selectedId = null;
  document.getElementById('mng-detail').innerHTML =
    '<div class="mng-empty">← Chọn 1 node bên trái để xem &amp; sửa.</div>';
  mngClearGraph();
}

async function mngLoadNode(label, id) {
  try {
    const r = await fetch(`/api/crud/node/${encodeURIComponent(label)}/${encodeURIComponent(id)}`);
    const data = await r.json();
    if (!r.ok) { showResult('mng-result', '✗ ' + JSON.stringify(data.detail), 'err'); return; }
    MNG = { ...MNG, label, node: data };
    mngRenderRight(data);
    mngRenderGraph(data);
  } catch (e) { showResult('mng-result', `Lỗi tải node: ${e}`, 'err'); }
}

// ---- Panel phải: property + quan hệ -----------------------------------------

function mngRenderRight(data) {
  const box = document.getElementById('mng-detail');
  box.innerHTML = '';

  const head = document.createElement('div');
  head.className = 'mng-node-head';
  head.innerHTML = `<span class="badge">${data.label}</span> <strong>${data.name}</strong> <span class="hint">${data.id}</span>`;
  box.appendChild(head);

  const pk = Object.keys(data.props_spec).find(k => data.props_spec[k].primary_key);
  const editable = Object.entries(data.props_spec).filter(([k]) => k !== pk);

  let grid = null;
  if (editable.length) {
    grid = document.createElement('div');
    grid.className = 'props-grid';
    editable.forEach(([f, sp]) => grid.appendChild(makeInput(f, sp)));
    box.appendChild(grid);
    prefill(grid, data.props);
  } else {
    const n = document.createElement('p');
    n.className = 'hint';
    n.textContent = 'Shadow node — chỉ có id, không có property để sửa (vẫn xoá được).';
    box.appendChild(n);
  }

  const actions = document.createElement('div');
  actions.className = 'actions';
  if (grid) {
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = '💾 Lưu property';
    save.addEventListener('click', () => mngSaveNode(grid));
    actions.appendChild(save);
    watchDirty(grid, save);
  }
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'danger';
  del.textContent = '🗑 Xoá node';
  del.addEventListener('click', mngDeleteNode);
  actions.appendChild(del);
  box.appendChild(actions);

  const rh = document.createElement('h3');
  rh.textContent = `Quan hệ (${data.relationships.length})`;
  box.appendChild(rh);
  if (!data.relationships.length) {
    const n = document.createElement('p');
    n.className = 'hint';
    n.textContent = 'Node này chưa có quan hệ nào.';
    box.appendChild(n);
  }
  data.relationships.forEach(r => box.appendChild(mngRelRow(r)));
}

async function mngSaveNode(grid) {
  const props = collectProps(grid);
  try {
    const r = await fetch(`/api/crud/node/${encodeURIComponent(MNG.label)}/${encodeURIComponent(MNG.node.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor: 'admin', properties: props }),
    });
    const d = await r.json();
    if (r.ok) { showResult('mng-result', `✓ Đã lưu ${d.updated}. audit=${d.audit_id}`, 'ok'); mngLoadNode(MNG.label, MNG.node.id); }
    else showResult('mng-result', '✗ ' + JSON.stringify(d.detail), 'err');
  } catch (e) { showResult('mng-result', `Lỗi: ${e}`, 'err'); }
}

async function mngDeleteNode() {
  const id = MNG.node.id;
  if (!confirm(`Xoá ${MNG.label}:${id} và mọi quan hệ của nó?\n(Restore được ở tab Audit)`)) return;
  try {
    const r = await fetch(`/api/crud/node/${encodeURIComponent(MNG.label)}/${encodeURIComponent(id)}?actor=admin`,
      { method: 'DELETE' });
    const d = await r.json();
    if (r.ok) {
      showResult('mng-result', `✓ Đã xoá ${d.deleted} (rels: ${d.rels_deleted}). audit=${d.audit_id}`, 'ok');
      mngResetDetail();
      mngSearch();
    } else showResult('mng-result', '✗ ' + JSON.stringify(d.detail), 'err');
  } catch (e) { showResult('mng-result', `Lỗi: ${e}`, 'err'); }
}

function mngRelRow(r) {
  const wrap = document.createElement('div');
  wrap.className = 'rel-block';
  const arrow = r.direction === 'out' ? '→' : '←';

  const headEl = document.createElement('div');
  headEl.className = 'row';
  headEl.innerHTML = `<strong>${r.rel_type}</strong> ${arrow} `
    + `<span class="rb-node-label">${r.other_label}</span> ${r.other_id} `
    + `<span class="hint">${r.other_name}</span>`;
  wrap.appendChild(headEl);

  const specs = Object.entries(r.props_spec).filter(([, sp]) => !sp.auto);
  let grid = null;
  if (specs.length) {
    grid = document.createElement('div');
    grid.className = 'props-grid';
    specs.forEach(([f, sp]) => grid.appendChild(makeInput(f, sp)));
    wrap.appendChild(grid);
    prefill(grid, r.props);
  }

  const actions = document.createElement('div');
  actions.className = 'actions';
  if (grid) {
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = '💾 Lưu';
    save.addEventListener('click', () => mngSaveRel(r, grid));
    actions.appendChild(save);
    watchDirty(grid, save);
  }
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'danger';
  del.textContent = '🗑 Xoá quan hệ';
  del.addEventListener('click', () => mngDeleteRel(r));
  actions.appendChild(del);
  wrap.appendChild(actions);
  return wrap;
}

function relBody(r, extra = {}) {
  return JSON.stringify({
    actor: 'admin',
    rel_type: r.rel_type,
    start_label: r.start_label, start_id: r.start_id,
    end_label: r.end_label, end_id: r.end_id,
    ...extra,
  });
}

async function mngSaveRel(r, grid) {
  const props = collectProps(grid);
  try {
    const res = await fetch('/api/crud/relationship', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: relBody(r, { properties: props }),
    });
    const d = await res.json();
    if (res.ok) { showResult('mng-result', `✓ Đã lưu quan hệ. audit=${d.audit_id}`, 'ok'); mngLoadNode(MNG.label, MNG.node.id); }
    else showResult('mng-result', '✗ ' + JSON.stringify(d.detail), 'err');
  } catch (e) { showResult('mng-result', `Lỗi: ${e}`, 'err'); }
}

async function mngDeleteRel(r) {
  if (!confirm(`Xoá quan hệ ${r.rel_type} ${r.start_label}:${r.start_id} → ${r.end_label}:${r.end_id}?`)) return;
  try {
    const res = await fetch('/api/crud/relationship', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: relBody(r),
    });
    const d = await res.json();
    if (res.ok) { showResult('mng-result', `✓ Đã xoá quan hệ. audit=${d.audit_id}`, 'ok'); mngLoadNode(MNG.label, MNG.node.id); }
    else showResult('mng-result', '✗ ' + JSON.stringify(d.detail), 'err');
  } catch (e) { showResult('mng-result', `Lỗi: ${e}`, 'err'); }
}

// ---- Graph (chỉ để nhìn — không tương tác) ----------------------------------

function mngClearGraph() {
  if (MNG.network) { MNG.network.destroy(); MNG.network = null; }
  const c = document.getElementById('mng-graph');
  if (c) c.innerHTML = '';
}

function mngRenderGraph(data) {
  const container = document.getElementById('mng-graph');
  const centerId = `${data.label}::${data.id}`;
  const nodes = [{
    id: centerId, label: `${data.name}\n(${data.label})`,
    shape: 'box', margin: 10, borderWidth: 3,
    color: { background: '#ede9fe', border: '#4f46e5' },
    font: { size: 14, color: '#1e293b' },
  }];
  const edges = [];
  const seen = new Set([centerId]);
  data.relationships.forEach((r, i) => {
    const oId = `${r.other_label}::${r.other_id}`;
    if (!seen.has(oId)) {
      seen.add(oId);
      nodes.push({
        id: oId, label: `${r.other_name}\n(${r.other_label})`,
        shape: 'box', margin: 8, borderWidth: 2,
        color: { background: '#f1f5f9', border: '#94a3b8' },
        font: { size: 12, color: '#334155' },
      });
    }
    const from = r.direction === 'out' ? centerId : oId;
    const to = r.direction === 'out' ? oId : centerId;
    edges.push({
      id: `e${i}`, from, to, label: r.rel_type, arrows: 'to',
      color: { color: '#cbd5e1' },
      font: { size: 10, color: '#64748b', strokeWidth: 3, strokeColor: '#fff' },
    });
  });

  mngClearGraph();
  MNG.network = new vis.Network(
    container,
    { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) },
    {
      physics: {
        stabilization: { enabled: true, iterations: 150, updateInterval: 25 },
        barnesHut: { gravitationalConstant: -6000, centralGravity: 0.4, springLength: 130, avoidOverlap: 0.5 },
      },
      // Không tương tác: không chọn, không kéo node — chỉ pan/zoom để nhìn.
      interaction: { dragNodes: false, dragView: true, zoomView: true, selectable: false, hover: false },
      edges: { smooth: { type: 'continuous' } },
      nodes: { widthConstraint: { maximum: 140 } },
    },
  );
  MNG.network.on('stabilizationIterationsDone', () => MNG.network.setOptions({ physics: false }));
}

export { populateManageLabels };
