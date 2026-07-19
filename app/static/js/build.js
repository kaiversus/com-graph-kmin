// ===== Guided Build — checklist theo schema, commit ca cay 1 lan =====
import { SCHEMA, showResult, makeInput, collectProps } from './core.js';

const RB = {
  items: {},    // ref -> { ref, label, name, isNew, props, parentRef, viaRel }
  order: [],    // thứ tự thêm, để render ổn định
  rels: [],     // { rel_type, start_label, start, end_label, end, props }
  focus: null,  // ref của node đang mở checklist
  counter: 0,
  labels: [],
  suggestions: [],  // nhánh schema của node đang focus
  neighbors: [],    // hàng xóm thật trong DB của node đang focus
  network: null,    // vis.Network instance
  gNodes: null,     // vis.DataSet nodes — giữ lại để update tăng dần
  gEdges: null,
  graphFocus: null, // focus mà network hiện tại đang vẽ
  relMode: null,    // { step: 'from'|'to', from } khi đang nối quan hệ bằng click
  dNetwork: null,   // vis.Network cho graph tĩnh toàn cảnh draft (sidebar)
};

const RB_ARROW = { outgoing: '→', incoming: '←', symmetric: '↔' };

function rbPropFields(label) {
  // Shadow node (User/Course) trỏ sang bản quan hệ → admin tự gõ id.
  // Label thường thì bỏ primary key đi vì server tự cấp LABEL-NNN.
  const manual = rbLabelMeta(label)?.manual_id;
  return Object.entries(SCHEMA.nodes[label]).filter(([, spec]) => manual || !spec.primary_key);
}

// Gợi ý id kế tiếp làm placeholder cho ô nhập id của shadow node
async function rbHintNextId(label, container) {
  if (!rbLabelMeta(label)?.manual_id) return;
  const pkInput = container.querySelector('input[data-field="id_user"], input[data-field="id_course"]');
  if (!pkInput) return;
  try {
    const d = await (await fetch(`/api/recommend/next-id/${label}`)).json();
    if (d.next_id) pkInput.placeholder = `gợi ý: ${d.next_id} — hoặc gõ id bên bản quan hệ`;
  } catch (e) { /* placeholder mặc định của makeInput là đủ dùng */ }
}

function rbLabelMeta(label) {
  return RB.labels.find(l => l.label === label);
}

async function rbInit() {
  if (RB.labels.length) return;
  // bootstrap() chạy async lúc load trang; nếu admin bấm tab này ngay thì
  // SCHEMA có thể chưa có → makeInput sẽ nổ. Đợi cho chắc.
  if (!SCHEMA) SCHEMA = await (await fetch('/api/schema')).json();
  RB.labels = await (await fetch('/api/recommend/labels')).json();
  const sel = document.getElementById('rb-root-label');
  sel.innerHTML = '';
  RB.labels.forEach(l => sel.appendChild(new Option(l.label, l.label)));
  sel.addEventListener('change', rbRenderRootForm);
  document.querySelectorAll('input[name="rb-root-mode"]').forEach(r =>
    r.addEventListener('change', rbRenderRootForm));
  rbRenderRootForm();
}

function rbRootMode() {
  return document.querySelector('input[name="rb-root-mode"]:checked').value;
}

function rbRenderRootForm() {
  const label = document.getElementById('rb-root-label').value;
  const newBox = document.getElementById('rb-root-new');
  const exBox = document.getElementById('rb-root-existing');

  const mode = rbRootMode();
  newBox.style.display = mode === 'new' ? '' : 'none';
  exBox.style.display = mode === 'existing' ? '' : 'none';

  if (mode === 'new') {
    newBox.innerHTML = '';
    rbPropFields(label).forEach(([f, spec]) => newBox.appendChild(makeInput(f, spec)));
    rbHintNextId(label, newBox);
  } else {
    rbLoadExisting(label, '', document.getElementById('rb-root-pick'));
  }
}

// Đổ items vào <select>, đánh dấu node đã nối và không cho chọn lại
function rbFillPicker(selectEl, d, label) {
  selectEl.innerHTML = '';
  if (d.needs_search) {
    selectEl.appendChild(new Option(`-- gõ để tìm trong ${d.total} ${label} --`, ''));
    return;
  }
  if (!d.items.length) {
    selectEl.appendChild(new Option(d.total === 0 ? `-- không có ${label} nào --` : '-- không khớp --', ''));
    return;
  }
  selectEl.appendChild(new Option(
    d.truncated ? `-- chọn (${d.items.length}/${d.total}) --` : `-- chọn (${d.total}) --`, ''));
  d.items.forEach(x => {
    const o = new Option(x.linked ? `${x.name} · ${x.id}  (đã nối)` : `${x.name} · ${x.id}`, x.id);
    if (x.linked) o.disabled = true;
    selectEl.appendChild(o);
  });
}

// ctx = { root_label, root_id, rel_type, direction } — để loại node gốc
// và đánh dấu "(đã nối)" ngay cả trong kết quả search
async function rbLoadExisting(label, q, selectEl, ctx) {
  selectEl.innerHTML = '<option value="">-- đang tải… --</option>';
  try {
    const p = new URLSearchParams({ limit: '50' });
    if (q) p.set('q', q);
    if (ctx && ctx.root_id) {
      p.set('root_label', ctx.root_label);
      p.set('root_id', ctx.root_id);
      p.set('rel_type', ctx.rel_type);
      p.set('direction', ctx.direction);
    }
    const d = await (await fetch(`/api/recommend/existing/${label}?${p}`)).json();
    rbFillPicker(selectEl, d, label);
  } catch (e) {
    selectEl.innerHTML = '<option value="">-- lỗi tải --</option>';
  }
}

// debounce chung cho các ô search
function rbDebounce(fn, ms = 300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

document.getElementById('rb-root-search').addEventListener('input', rbDebounce(e => {
  rbLoadExisting(document.getElementById('rb-root-label').value, e.target.value,
    document.getElementById('rb-root-pick'), null);
}));

document.getElementById('rb-start').addEventListener('click', () => {
  const label = document.getElementById('rb-root-label').value;
  let ref, name, props = {}, isNew;

  if (rbRootMode() === 'new') {
    props = collectProps(document.getElementById('rb-root-new'));
    // required check phía client cho nhanh; server vẫn validate lại
    const missing = rbPropFields(label)
      .filter(([f, spec]) => spec.required && !props[f]).map(([f]) => f);
    if (missing.length) {
      showResult('rb-result', `Thiếu field bắt buộc: ${missing.join(', ')}`, 'err');
      return;
    }
    ref = `tmp-${++RB.counter}`;
    // Shadow node không có name → hiển thị bằng chính id admin gõ
    name = props.name || props[rbLabelMeta(label).primary_key];
    isNew = true;
  } else {
    ref = document.getElementById('rb-root-pick').value;
    if (!ref) { showResult('rb-result', 'Chưa chọn node.', 'err'); return; }
    name = document.getElementById('rb-root-pick').selectedOptions[0].text.split(' · ')[0];
    isNew = false;
  }

  RB.items[ref] = { ref, label, name, isNew, props, parentRef: null, viaRel: null };
  RB.order.push(ref);
  showResult('rb-result', '', '');
  rbFocus(ref);
});

async function rbFocus(ref) {
  RB.focus = ref;
  const item = RB.items[ref];
  document.getElementById('rb-checklist-card').style.display = '';
  document.getElementById('rb-focus-name').textContent = `${item.name}`;
  document.getElementById('rb-focus-meta').textContent =
    `${item.label} · ${item.isNew ? 'node mới (id cấp lúc commit)' : 'node có sẵn ' + item.ref}`;
  rbCloseForm();

  const note = document.getElementById('rb-graph-note');
  note.textContent = 'Đang tra schema…';

  try {
    const [sug, nb] = await Promise.all([
      fetch('/api/recommend/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: item.label, id: item.isNew ? null : item.ref }),
      }).then(r => r.json()),
      // node mới chưa có trong DB thì không có hàng xóm để vẽ
      item.isNew
        ? Promise.resolve({ neighbors: [], total: 0, truncated: false })
        : fetch(`/api/recommend/neighborhood/${item.label}/${encodeURIComponent(item.ref)}`)
            .then(r => r.json()),
    ]);
    RB.suggestions = sug.suggestions || [];
    RB.neighbors = nb.neighbors || [];
    rbRenderGraph();
    note.textContent =
      `${RB.suggestions.length} nhánh có thể thêm · ${nb.total} quan hệ đã có trong DB` +
      (nb.truncated ? ` (hiện ${RB.neighbors.length})` : '');
  } catch (e) {
    note.textContent = `Lỗi tải: ${e}`;
  }
  rbRenderTree();
}

// ---- Graph quanh node đang chọn ----
function rbRenderGraph() {
  const item = RB.items[RB.focus];

  const C = {
    root:  { bg: '#4f46e5', border: '#3730a3', font: '#fff' },
    exist: { bg: '#ffffff', border: '#94a3b8', font: '#1e293b' },
    draft: { bg: '#dcfce7', border: '#16a34a', font: '#14532d' },
    ghost: { bg: '#fef3c7', border: '#d97706', font: '#92400e' },
  };

  const pickedRef = RB.relMode && RB.relMode.from ? RB.relMode.from.ref : null;

  // Khoá theo ref của thực thể → 1 node có thật chỉ vẽ đúng 1 lần, dù nó vừa
  // là hàng xóm trong DB vừa được nối vào draft. draft đè lên exist.
  const vn = new Map();
  const put = (ref, kind, label, name) => {
    const prev = vn.get(ref);
    if (prev && prev.kind === 'root') return;
    if (prev && prev.kind === 'draft' && kind === 'exist') return;
    vn.set(ref, { ref, kind, label, name });
  };

  put(item.ref, 'root', item.label, item.name);
  RB.neighbors.forEach(n => put(n.id, 'exist', n.label, n.name));

  // Quan hệ draft: hiện nếu chạm node đang chọn, hoặc nếu cả 2 đầu đều đã
  // hiện trên canvas (nối 2 hàng xóm với nhau).
  const shownRels = [];
  RB.rels.forEach((r, i) => {
    const touches = r.start === item.ref || r.end === item.ref;
    const bothVisible = vn.has(r.start) && vn.has(r.end);
    if (!touches && !bothVisible) return;
    [[r.start, r.start_label], [r.end, r.end_label]].forEach(([ref, lb]) => {
      const it = RB.items[ref];
      put(ref, 'draft', lb, it ? it.name : ref);
    });
    shownRels.push({ r, i });
  });

  const nodes = [];
  vn.forEach(v => {
    const c = C[v.kind];
    nodes.push({
      id: `n::${v.ref}`,
      label: `${v.name}\n(${v.label})`,
      color: { background: c.bg, border: c.border },
      font: { color: c.font, size: v.kind === 'root' ? 14 : 12 },
      shape: 'box', margin: v.kind === 'root' ? 10 : 8, borderWidth: 2,
      _kind: v.kind, _ref: v.ref, _label: v.label, _name: v.name,
      ...(v.ref === pickedRef
        ? { borderWidth: 5, shadow: { enabled: true, color: '#ef4444', size: 12, x: 0, y: 0 } }
        : {}),
    });
  });

  const edges = [];

  // Cạnh đã có trong DB — bỏ qua nếu đầu kia đã chuyển thành draft
  RB.neighbors.forEach((n, i) => {
    const v = vn.get(n.id);
    if (!v || v.kind === 'draft') return;
    const st = { id: `db::${i}`, label: n.rel_type, arrows: 'to',
      color: { color: '#cbd5e1' }, font: { size: 10, color: '#64748b' } };
    edges.push(n.outgoing
      ? { from: `n::${item.ref}`, to: `n::${n.id}`, ...st }
      : { from: `n::${n.id}`, to: `n::${item.ref}`, ...st });
  });

  // Cạnh draft
  shownRels.forEach(({ r, i }) => {
    edges.push({
      id: `dr::${i}`, from: `n::${r.start}`, to: `n::${r.end}`,
      label: r.rel_type, arrows: 'to',
      color: { color: '#16a34a' }, font: { size: 10, color: '#15803d' },
    });
  });

  // Nhánh schema còn trống
  RB.suggestions.forEach((s, i) => {
    const nid = `gh::${i}`;
    nodes.push({
      id: nid, label: `+ ${s.child_label}`, title: s.display_label,
      color: { background: C.ghost.bg, border: C.ghost.border },
      font: { color: C.ghost.font, size: 12 },
      shape: 'box', margin: 8, borderWidth: 2,
      shapeProperties: { borderDashes: [5, 4] },
      _kind: 'ghost', _idx: i,
    });
    const st = { id: `e${nid}`, label: s.rel_type, arrows: 'to', dashes: true,
      color: { color: '#fbbf24' }, font: { size: 10, color: '#b45309' } };
    edges.push(s.direction === 'incoming'
      ? { from: nid, to: `n::${item.ref}`, ...st }
      : { from: `n::${item.ref}`, to: nid, ...st });
  });

  const container = document.getElementById('rb-graph');

  if (RB.network && RB.graphFocus === RB.focus) {
    rbSyncDataSet(RB.gNodes, nodes);
    rbSyncDataSet(RB.gEdges, edges);
    return;
  }

  if (RB.network) { RB.network.destroy(); RB.network = null; }
  RB.gNodes = new vis.DataSet(nodes);
  RB.gEdges = new vis.DataSet(edges);
  RB.graphFocus = RB.focus;

  RB.network = new vis.Network(container, { nodes: RB.gNodes, edges: RB.gEdges }, {
    layout: {
      hierarchical: {
        enabled: true, direction: 'LR', sortMethod: 'directed',
        nodeSpacing: 85, levelSeparation: 210, shakeTowards: 'roots',
      },
    },
    physics: { enabled: false },
    interaction: { hover: true, tooltipDelay: 150, dragNodes: true },
    edges: { smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 },
             font: { strokeWidth: 3, strokeColor: '#fff' } },
    nodes: { widthConstraint: { maximum: 130 } },
  });

  RB.network.on('click', params => {
    if (!params.nodes.length) return;
    const n = RB.gNodes.get(params.nodes[0]);
    if (!n) return;
    if (RB.relMode) { rbRelPick(n); return; }
    // Chỉ node vàng mới mở form. Node xanh/trắng là ngữ cảnh — click không
    // tra lại schema, tránh cắt ngang thao tác đang làm. Muốn mở rộng từ
    // node khác thì bấm trong cây Draft bên phải.
    if (n._kind === 'ghost') rbOpenForm(n._idx);
  });
}
// Đồng bộ DataSet mà giữ nguyên vị trí node cũ: chỉ xoá cái mất, cập nhật cái còn
function rbSyncDataSet(ds, arr) {
  const keep = new Set(arr.map(x => x.id));
  ds.getIds().forEach(id => { if (!keep.has(id)) ds.remove(id); });
  ds.update(arr);
}

// ---- Box nhập, hiện sau khi click 1 nhánh ----
function rbCloseForm() {
  document.getElementById('rb-form-box').style.display = 'none';
  document.getElementById('rb-form-body').innerHTML = '';
}

document.getElementById('rb-form-close').addEventListener('click', rbCloseForm);

function rbOpenForm(idx) {
  const s = RB.suggestions[idx];
  const box = document.getElementById('rb-form-box');
  const body = document.getElementById('rb-form-body');
  box.style.display = '';
  document.getElementById('rb-form-title').textContent = s.display_label;
  document.getElementById('rb-form-sub').textContent =
    `${RB_ARROW[s.direction]} ${s.rel_type} · ${s.child_label}`;
  body.innerHTML = '';

  const gid = `rbm-${idx}`;
  const modeRow = document.createElement('div');
  modeRow.className = 'row';
  modeRow.innerHTML =
    `<label style="min-width:auto"><input type="radio" name="${gid}" value="new" checked /> Tạo mới</label>` +
    `<label style="min-width:auto"><input type="radio" name="${gid}" value="existing" /> Link node có sẵn</label>` +
    (s.manual_id ? ' <span class="hint">(shadow node — tự gõ id cho khớp bản quan hệ)</span>' : '');
  body.appendChild(modeRow);

  const newBox = document.createElement('div');
  newBox.className = 'props-grid rb-new-box';
  rbPropFields(s.child_label).forEach(([f, spec]) => newBox.appendChild(makeInput(f, spec)));
  body.appendChild(newBox);
  rbHintNextId(s.child_label, newBox);

  const exBox = document.createElement('div');
  exBox.className = 'rb-ex-box';
  exBox.style.display = 'none';
  const search = document.createElement('input');
  const pick = document.createElement('select');
  const exRow = document.createElement('div');
  exRow.className = 'row';
  exRow.append(search, pick);
  exBox.appendChild(exRow);
  body.appendChild(exBox);

  const ex = s.existing || { items: [], total: 0, truncated: false, needs_search: false };
  const focusItem = RB.items[RB.focus];
  const ctx = {
    root_label: focusItem.label,
    root_id: focusItem.isNew ? null : focusItem.ref,
    rel_type: s.rel_type,
    direction: s.direction,
  };
  search.placeholder = ex.needs_search
    ? `Gõ để tìm trong ${ex.total} ${s.child_label}…`
    : 'Gõ để lọc…';
  rbFillPicker(pick, ex, s.child_label);
  search.addEventListener('input', rbDebounce(e =>
    rbLoadExisting(s.child_label, e.target.value, pick, ctx)));

  modeRow.querySelectorAll(`input[name="${gid}"]`).forEach(r => r.addEventListener('change', () => {
    const m = modeRow.querySelector(`input[name="${gid}"]:checked`).value;
    newBox.style.display = m === 'new' ? '' : 'none';
    exBox.style.display = m === 'existing' ? '' : 'none';
  }));

  const relSpecs = Object.entries(s.rel_props_spec);
  let relBox = null;
  if (relSpecs.length) {
    relBox = document.createElement('div');
    relBox.className = 'props-grid rb-rel-props';
    const req = relSpecs.filter(([, sp]) => sp.required);
    const opt = relSpecs.filter(([, sp]) => !sp.required);
    if (req.length) {
      const t = document.createElement('div');
      t.className = 'rb-relprop-title';
      t.textContent = 'Thuộc tính quan hệ (bắt buộc)';
      relBox.appendChild(t);
      req.forEach(([f, sp]) => relBox.appendChild(makeInput(f, sp)));
    }
    if (opt.length) {
      const det = document.createElement('details');
      det.innerHTML = '<summary>Thuộc tính quan hệ (tuỳ chọn)</summary>';
      const g = document.createElement('div');
      g.className = 'props-grid';
      opt.forEach(([f, sp]) => g.appendChild(makeInput(f, sp)));
      det.appendChild(g);
      relBox.appendChild(det);
    }
    body.appendChild(relBox);
  }

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = '+ Thêm vào draft';
  addBtn.addEventListener('click', () => {
    const mode = modeRow.querySelector(`input[name="${gid}"]:checked`).value;
    const relProps = relBox ? collectProps(relBox) : {};
    const missingRel = relSpecs.filter(([f, sp]) => sp.required && !relProps[f]).map(([f]) => f);
    if (missingRel.length) {
      showResult('rb-result', `${s.rel_type}: thiếu ${missingRel.join(', ')}`, 'err');
      return;
    }

    let ref, name, props = {}, isNew;
    if (mode === 'new') {
      props = collectProps(newBox);
      const missing = rbPropFields(s.child_label)
        .filter(([f, sp]) => sp.required && !props[f]).map(([f]) => f);
      if (missing.length) {
        showResult('rb-result', `${s.child_label}: thiếu ${missing.join(', ')}`, 'err');
        return;
      }
      ref = `tmp-${++RB.counter}`;
      name = props.name || props[rbLabelMeta(s.child_label).primary_key];
      isNew = true;
    } else {
      ref = pick.value;
      if (!ref) { showResult('rb-result', 'Chưa chọn node để link.', 'err'); return; }
      if (RB.items[ref]) { showResult('rb-result', `${ref} đã có trong draft.`, 'warn'); return; }
      name = pick.selectedOptions[0].text.split(' · ')[0];
      isNew = false;
    }

    const focus = RB.items[RB.focus];
    const rel = s.direction === 'incoming'
      ? { rel_type: s.rel_type, start_label: s.child_label, start: ref, end_label: focus.label, end: focus.ref, props: relProps }
      : { rel_type: s.rel_type, start_label: focus.label, start: focus.ref, end_label: s.child_label, end: ref, props: relProps };

    RB.items[ref] = { ref, label: s.child_label, name, isNew, props, parentRef: focus.ref, viaRel: `${RB_ARROW[s.direction]} ${s.rel_type}` };
    RB.order.push(ref);
    RB.rels.push(rel);
    showResult('rb-result', `Đã thêm ${name} (${s.child_label}).`, 'ok');
    rbCloseForm();
    rbRenderGraph();
    rbRenderTree();
  });
  body.appendChild(addBtn);
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}



// ---- Nối quan hệ bằng cách click thẳng 2 node trên graph ----
// Bấm nút → click node nguồn → click node đích. Nếu schema chỉ cho đúng 1
// quan hệ và quan hệ đó không có prop bắt buộc thì thêm thẳng vào draft,
// không hỏi gì. Còn lại mới hiện form chọn loại quan hệ / nhập prop.
function rbRelHint(msg, kind) {
  const el = document.getElementById('rb-rel-hint');
  el.textContent = msg || '';
  el.className = 'rb-rel-hint' + (kind ? ' ' + kind : '');
  el.style.display = msg ? '' : 'none';
}

function rbSetRelMode(on) {
  RB.relMode = on ? { step: 'from', from: null } : null;
  const btn = document.getElementById('rb-add-rel');
  btn.textContent = on ? '✕ Huỷ nối quan hệ' : '+ Nối quan hệ giữa 2 node trên graph';
  btn.classList.toggle('danger', on);
  document.getElementById('rb-graph').classList.toggle('rb-picking', on);
  if (on) {
    rbCloseForm();
    rbRelHint('Click node NGUỒN trên graph (node vàng không chọn được)');
  } else {
    rbRelHint('');
  }
  rbRenderGraph();
}

document.getElementById('rb-add-rel').addEventListener('click', () => rbSetRelMode(!RB.relMode));

// Đổi node trên canvas thành { ref, label, name } để dựng relationship
function rbNodeRef(n) {
  if (n._kind === 'ghost' || !n._ref) return null;
  // node trong draft lấy tên từ RB.items; node chỉ có trong DB lấy từ chính node
  const it = RB.items[n._ref];
  return it
    ? { ref: it.ref, label: it.label, name: it.name }
    : { ref: n._ref, label: n._label, name: n._name };
}

function rbRelPick(n) {
  if (n._kind === 'ghost') {
    rbRelHint('Node vàng là nhánh chưa tạo — chọn node xanh tím / trắng / xanh lá', 'warn');
    return;
  }
  const picked = rbNodeRef(n);
  if (!picked) return;

  if (RB.relMode.step === 'from') {
    RB.relMode.from = picked;
    RB.relMode.step = 'to';
    rbRelHint(`Nguồn: ${picked.name} — giờ click node ĐÍCH`);
    rbRenderGraph();
    return;
  }

  const from = RB.relMode.from;
  if (picked.ref === from.ref) {
    rbRelHint('Không nối node vào chính nó. Click node khác.', 'warn');
    return;
  }
  rbResolveRel(from, picked);
}

async function rbResolveRel(from, to) {
  rbRelHint(`${from.name} → ${to.name} — đang tra schema…`);
  let types = [];
  try {
    const d = await (await fetch(
      `/api/recommend/rel-types?start_label=${from.label}&end_label=${to.label}`)).json();
    types = d.rel_types || [];
  } catch (e) {
    rbRelHint(`Lỗi tra schema: ${e}`, 'warn');
    return;
  }

  if (!types.length) {
    rbRelHint(`Schema không cho ${from.label} → ${to.label}. Chọn node đích khác.`, 'warn');
    return;
  }

  // Không mập mờ → thêm thẳng, đúng ý "click phát là vào draft"
  const only = types.length === 1 ? types[0] : null;
  if (only && !Object.values(only.props_spec).some(sp => sp.required)) {
    rbAddRel(from, to, only.rel_type, {});
    return;
  }
  rbRelChoiceForm(from, to, types);
}

// Nhiều loại quan hệ hoặc có prop bắt buộc → hỏi thêm
function rbRelChoiceForm(from, to, types) {
  const box = document.getElementById('rb-form-box');
  const body = document.getElementById('rb-form-body');
  box.style.display = '';
  document.getElementById('rb-form-title').textContent = 'Nối quan hệ';
  document.getElementById('rb-form-sub').textContent =
    `${from.name} (${from.label}) → ${to.name} (${to.label})`;
  body.innerHTML = '';

  const relRow = document.createElement('div');
  relRow.className = 'row';
  relRow.innerHTML = '<label>Quan hệ</label>';
  const relSel = document.createElement('select');
  types.forEach(r => relSel.appendChild(new Option(r.rel_type, r.rel_type)));
  relRow.appendChild(relSel);
  body.appendChild(relRow);

  const propBox = document.createElement('div');
  propBox.className = 'props-grid rb-rel-props';
  body.appendChild(propBox);

  function renderProps() {
    propBox.innerHTML = '';
    const r = types.find(x => x.rel_type === relSel.value);
    if (!r) return;
    const specs = Object.entries(r.props_spec);
    const req = specs.filter(([, sp]) => sp.required);
    const opt = specs.filter(([, sp]) => !sp.required);
    if (req.length) {
      const t = document.createElement('div');
      t.className = 'rb-relprop-title';
      t.textContent = 'Thuộc tính quan hệ (bắt buộc)';
      propBox.appendChild(t);
      req.forEach(([f, sp]) => propBox.appendChild(makeInput(f, sp)));
    }
    if (opt.length) {
      const det = document.createElement('details');
      det.innerHTML = '<summary>Thuộc tính quan hệ (tuỳ chọn)</summary>';
      const g = document.createElement('div');
      g.className = 'props-grid';
      opt.forEach(([f, sp]) => g.appendChild(makeInput(f, sp)));
      det.appendChild(g);
      propBox.appendChild(det);
    }
  }
  relSel.addEventListener('change', renderProps);
  renderProps();

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = '+ Thêm quan hệ vào draft';
  addBtn.addEventListener('click', () => {
    const r = types.find(x => x.rel_type === relSel.value);
    const props = collectProps(propBox);
    const missing = Object.entries(r.props_spec)
      .filter(([f, sp]) => sp.required && !props[f]).map(([f]) => f);
    if (missing.length) {
      showResult('rb-result', `${r.rel_type}: thiếu ${missing.join(', ')}`, 'err');
      return;
    }
    rbAddRel(from, to, r.rel_type, props);
  });
  body.appendChild(addBtn);
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function rbAddRel(from, to, relType, props) {
  const dup = RB.rels.some(r =>
    r.rel_type === relType && r.start === from.ref && r.end === to.ref);
  if (dup) {
    rbRelHint('Quan hệ này đã có trong draft.', 'warn');
    return;
  }

  RB.rels.push({
    rel_type: relType,
    start_label: from.label, start: from.ref,
    end_label: to.label, end: to.ref,
    props,
  });

  // Neo node có sẵn vào draft để nó chuyển sang xanh và hiện trên cây
  [from, to].forEach(x => {
    if (!RB.items[x.ref]) {
      RB.items[x.ref] = {
        ref: x.ref, label: x.label, name: x.name, isNew: false,
        props: {}, parentRef: RB.focus === x.ref ? null : RB.focus,
        viaRel: '· node có sẵn',
      };
      RB.order.push(x.ref);
    }
  });

  showResult('rb-result', `Đã thêm ${from.name} -${relType}-> ${to.name}.`, 'ok');
  rbCloseForm();
  rbSetRelMode(false);   // gọi rbRenderGraph bên trong
  rbRenderTree();
}

function rbRemove(ref) {
  // xoá node + toàn bộ con cháu + mọi quan hệ đụng tới chúng
  const doomed = new Set([ref]);
  let grew = true;
  while (grew) {
    grew = false;
    RB.order.forEach(r => {
      const it = RB.items[r];
      if (it.parentRef && doomed.has(it.parentRef) && !doomed.has(r)) { doomed.add(r); grew = true; }
    });
  }
  doomed.forEach(r => delete RB.items[r]);
  RB.order = RB.order.filter(r => !doomed.has(r));
  RB.rels = RB.rels.filter(x => !doomed.has(x.start) && !doomed.has(x.end));
  if (doomed.has(RB.focus)) {
    RB.focus = RB.order[0] || null;
    if (RB.focus) rbFocus(RB.focus);
    else document.getElementById('rb-checklist-card').style.display = 'none';
  } else if (RB.focus) {
    rbRenderGraph();  // node bị xoá phải biến khỏi graph luôn
  }
  rbRenderTree();
}

// ---- Graph tĩnh toàn cảnh draft (sidebar) ----
// Chỉ để nhìn: không click, không kéo node, không tra schema. Vẽ lại mỗi khi
// draft đổi. Khác graph chính ở chỗ nó hiện TOÀN BỘ cây chứ không chỉ 1 hop.
function rbRenderDraftGraph() {
  const el = document.getElementById('rb-draft-graph');
  if (!el) return;

  if (!RB.order.length) {
    if (RB.dNetwork) { RB.dNetwork.destroy(); RB.dNetwork = null; }
    el.innerHTML = '<div class="rb-draft-empty">Chưa có gì trong draft</div>';
    return;
  }
  if (el.firstChild && el.firstChild.className === 'rb-draft-empty') el.innerHTML = '';

  const nodes = RB.order.map(ref => {
    const it = RB.items[ref];
    const isFocus = ref === RB.focus;
    return {
      id: ref,
      label: it.name,
      title: `${it.label} · ${it.isNew ? 'node mới' : it.ref}`,
      color: it.isNew
        ? { background: '#dcfce7', border: isFocus ? '#4f46e5' : '#16a34a' }
        : { background: '#ffffff', border: isFocus ? '#4f46e5' : '#94a3b8' },
      font: { size: 11, color: it.isNew ? '#14532d' : '#1e293b' },
      shape: 'box', margin: 6, borderWidth: isFocus ? 3 : 1,
    };
  });

  const edges = RB.rels.map((r, i) => ({
    id: `d${i}`, from: r.start, to: r.end,
    label: r.rel_type, arrows: 'to',
    color: { color: '#16a34a' },
    font: { size: 9, color: '#15803d', strokeWidth: 3, strokeColor: '#fff' },
  })).filter(e => RB.items[e.from] && RB.items[e.to]);

  const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  if (RB.dNetwork) { RB.dNetwork.destroy(); RB.dNetwork = null; }
  RB.dNetwork = new vis.Network(el, data, {
    layout: {
      hierarchical: {
        enabled: true, direction: 'UD', sortMethod: 'directed',
        nodeSpacing: 70, levelSeparation: 70, shakeTowards: 'roots',
      },
    },
    physics: { enabled: false },
    interaction: {
      dragNodes: false, selectable: false, hover: false,
      zoomView: true, dragView: true,
    },
    edges: { smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 } },
    nodes: { widthConstraint: { maximum: 110 } },
  });
  RB.dNetwork.once('afterDrawing', () => RB.dNetwork && RB.dNetwork.fit());
}

function rbRenderTree() {
  const box = document.getElementById('rb-tree');
  const newCount = RB.order.filter(r => RB.items[r].isNew).length;
  document.getElementById('rb-count').textContent =
    `${newCount} node mới · ${RB.rels.length} quan hệ`;
  document.getElementById('rb-commit').disabled = (newCount === 0 && RB.rels.length === 0);

  rbRenderDraftGraph();

  if (!RB.order.length) {
    box.innerHTML = '<p class="hint">Chưa có gì trong draft.</p>';
    return;
  }

  const childrenOf = {};
  RB.order.forEach(r => {
    const p = RB.items[r].parentRef;
    if (p) (childrenOf[p] = childrenOf[p] || []).push(r);
  });

  box.innerHTML = '';
  const roots = RB.order.filter(r => !RB.items[r].parentRef);
  roots.forEach(r => box.appendChild(rbTreeNode(r, childrenOf, 0)));
}

function rbTreeNode(ref, childrenOf, depth) {
  const it = RB.items[ref];
  const wrap = document.createElement('div');
  wrap.className = 'rb-node-wrap';

  const row = document.createElement('div');
  row.className = 'rb-node' + (ref === RB.focus ? ' focused' : '');
  row.style.marginLeft = `${depth * 14}px`;
  row.innerHTML = `
    ${it.viaRel ? `<span class="rb-via">${it.viaRel}</span>` : ''}
    <span class="rb-node-label">${it.label}</span>
    <span class="rb-node-name">${it.name}</span>
    <span class="rb-node-id">${it.isNew ? 'mới' : it.ref}</span>`;
  row.title = 'Click để mở checklist cho node này';
  row.addEventListener('click', () => rbFocus(ref));

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'rb-del';
  del.textContent = '×';
  del.title = 'Xoá khỏi draft (kèm con cháu)';
  del.addEventListener('click', e => { e.stopPropagation(); rbRemove(ref); });
  row.appendChild(del);

  wrap.appendChild(row);
  (childrenOf[ref] || []).forEach(c => wrap.appendChild(rbTreeNode(c, childrenOf, depth + 1)));
  return wrap;
}

document.getElementById('rb-clear').addEventListener('click', () => {
  if (RB.order.length && !confirm('Xoá toàn bộ draft?')) return;
  RB.items = {}; RB.order = []; RB.rels = []; RB.focus = null; RB.counter = 0;
  RB.suggestions = []; RB.neighbors = [];
  if (RB.network) { RB.network.destroy(); RB.network = null; }
  RB.gNodes = null; RB.gEdges = null; RB.graphFocus = null;
  if (RB.dNetwork) { RB.dNetwork.destroy(); RB.dNetwork = null; }
  document.getElementById('rb-checklist-card').style.display = 'none';
  rbCloseForm();
  showResult('rb-result', '', '');
  rbRenderTree();
});

document.getElementById('rb-commit').addEventListener('click', async () => {
  const btn = document.getElementById('rb-commit');
  const payload = {
    actor: 'admin',
    nodes: RB.order.filter(r => RB.items[r].isNew).map(r => ({
      temp_id: r, label: RB.items[r].label, props: RB.items[r].props,
    })),
    relationships: RB.rels,
  };
  btn.disabled = true;
  showResult('rb-result', 'Đang commit…');
  try {
    const res = await fetch('/api/recommend/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) {
      const det = d.detail || d;
      const msg = det.errors
        ? det.errors.map(e => `• [row ${e.row}] ${e.field}: ${e.message}`).join('\n')
        : (det.error || JSON.stringify(det));
      showResult('rb-result', `Commit thất bại — draft giữ nguyên:\n${msg}`, 'err');
      btn.disabled = false;
      return;
    }
    showResult('rb-result',
      `✓ Commit xong.\naudit_id: ${d.audit_id}\n` +
      `${d.nodes_written} node · ${d.relationships_written} quan hệ\n\n` +
      `ID đã cấp:\n` + Object.entries(d.id_map).map(([t, r]) => `  ${t} → ${r}`).join('\n') +
      `\n\nVào tab Audit · Restore để hoàn tác nếu cần.`, 'ok');
    RB.items = {}; RB.order = []; RB.rels = []; RB.focus = null; RB.counter = 0;
    RB.suggestions = []; RB.neighbors = [];
    if (RB.network) { RB.network.destroy(); RB.network = null; }
    RB.gNodes = null; RB.gEdges = null; RB.graphFocus = null;
    if (RB.dNetwork) { RB.dNetwork.destroy(); RB.dNetwork = null; }
    document.getElementById('rb-checklist-card').style.display = 'none';
    rbCloseForm();
    rbRenderTree();
  } catch (e) {
    showResult('rb-result', `Lỗi mạng: ${e}`, 'err');
    btn.disabled = false;
  }
});


export { rbInit };
