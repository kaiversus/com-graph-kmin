// ===== COM Graph Admin frontend =====
let SCHEMA = null;
let opt1RelCounter = 0;

// ---- Tabs ----
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'audit') refreshAudit();
    if (btn.dataset.tab === 'viz') renderViz();
    if (btn.dataset.tab === 'roadmap') loadRoadmapSources();
    if (btn.dataset.tab === 'export') loadExportStats();
  });
});

// ---- Bootstrap: load schema + health check ----
async function bootstrap() {
  // Health check
  try {
    const h = await (await fetch('/api/health')).json();
    const badge = document.getElementById('health-badge');
    if (h.neo4j_connected) {
      badge.className = 'health-badge ok';
      badge.textContent = `✓ ${h.uri} (db: ${h.database})`;
      badge.title = 'Connected to Neo4j';
    } else {
      badge.className = 'health-badge fail';
      badge.textContent = `✗ Neo4j connect FAILED — xem terminal`;
      badge.title = h.error || 'Unknown error';
    }
  } catch (e) {
    document.getElementById('health-badge').textContent = '? health check error';
  }

  const r = await fetch('/api/schema');
  SCHEMA = await r.json();
  populateOpt1Labels();
  populateOpt2Targets();
  loadQuickQueryOptions();
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

// ===========================================================
// OPTION 1
// ===========================================================
function populateOpt1Labels() {
  const sel = document.getElementById('opt1-label');
  sel.innerHTML = '';
  Object.keys(SCHEMA.nodes).forEach(l => sel.appendChild(new Option(l, l)));
  sel.addEventListener('change', renderOpt1Props);
  renderOpt1Props();
}

function renderOpt1Props() {
  const label = document.getElementById('opt1-label').value;
  const grid = document.getElementById('opt1-props');
  grid.innerHTML = '';
  Object.entries(SCHEMA.nodes[label]).forEach(([f, spec]) => {
    grid.appendChild(makeInput(f, spec));
  });
}

document.getElementById('opt1-add-rel').addEventListener('click', () => addRelBlock());

function addRelBlock() {
  const id = 'rel_' + (opt1RelCounter++);
  const block = document.createElement('div');
  block.className = 'rel-block';
  block.id = id;
  block.innerHTML = `
    <div class="row">
      <label>Type</label>
      <select class="rel-type"></select>
      <label>start_label</label>
      <select class="rel-start-label"></select>
      <label>start_id</label>
      <input class="rel-start-id" placeholder="tự lấy từ node nếu trống" />
      <label>end_label</label>
      <select class="rel-end-label"></select>
      <label>end_id</label>
      <input class="rel-end-id" placeholder="tự lấy từ node nếu trống" />
      <button type="button" class="remove">×</button>
    </div>
    <div class="rel-props props-grid"></div>
  `;
  document.getElementById('opt1-rels').appendChild(block);

  const typeSel = block.querySelector('.rel-type');
  Object.keys(SCHEMA.relationships).forEach(t => typeSel.appendChild(new Option(t, t)));

  const renderRelDetails = () => {
    const rt = typeSel.value;
    const spec = SCHEMA.relationships[rt];
    const sLabel = block.querySelector('.rel-start-label');
    const eLabel = block.querySelector('.rel-end-label');
    sLabel.innerHTML = ''; eLabel.innerHTML = '';
    spec.starts.forEach(l => sLabel.appendChild(new Option(l, l)));
    spec.ends.forEach(l => eLabel.appendChild(new Option(l, l)));

    const propGrid = block.querySelector('.rel-props');
    propGrid.innerHTML = '';
    Object.entries(spec.props || {}).forEach(([f, ps]) => {
      propGrid.appendChild(makeInput(f, ps));
    });
  };
  typeSel.addEventListener('change', renderRelDetails);
  renderRelDetails();

  block.querySelector('.remove').addEventListener('click', () => block.remove());
}

function collectOpt1Payload() {
  const label = document.getElementById('opt1-label').value;
  const props = collectProps(document.getElementById('opt1-props'));
  // Get primary key value of current node for auto-filling relationship start/end
  const pk = Object.keys(SCHEMA.nodes[label]).find(k => SCHEMA.nodes[label][k].primary_key);
  const pkValue = pk ? props[pk] : null;

  const rels = [];
  document.querySelectorAll('#opt1-rels .rel-block').forEach(b => {
    let startId = b.querySelector('.rel-start-id').value.trim();
    let endId = b.querySelector('.rel-end-id').value.trim();
    const startLabel = b.querySelector('.rel-start-label').value;
    const endLabel = b.querySelector('.rel-end-label').value;
    // Auto-fill: nếu start_label hoặc end_label trùng với node đang tạo và id trống → dùng pk
    if (pkValue && startLabel === label && !startId) startId = pkValue;
    if (pkValue && endLabel === label && !endId) endId = pkValue;
    rels.push({
      rel_type: b.querySelector('.rel-type').value,
      start_label: startLabel,
      start_id: startId,
      end_label: endLabel,
      end_id: endId,
      properties: collectProps(b.querySelector('.rel-props')),
    });
  });
  return { actor: 'admin', node: { label, properties: props }, relationships: rels };
}

document.getElementById('opt1-validate').addEventListener('click', async () => {
  const payload = collectOpt1Payload();
  const r = await fetch('/api/option1/validate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (data.valid) {
    showResult('opt1-result', '✓ Valid. Preview:\n\n' + JSON.stringify(data.preview, null, 2), 'ok');
    document.getElementById('opt1-commit').disabled = false;
  } else {
    showResult('opt1-result', '✗ Validation errors:\n\n' + JSON.stringify(data.errors, null, 2), 'err');
    document.getElementById('opt1-commit').disabled = true;
  }
});

document.getElementById('opt1-commit').addEventListener('click', async () => {
  if (!confirm('Confirm commit? Snapshot sẽ được tạo, sau đó MERGE vào DB.')) return;
  const payload = collectOpt1Payload();
  const r = await fetch('/api/option1/commit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (r.ok) {
    showResult('opt1-result', '✓ Committed!\n\n' + JSON.stringify(data, null, 2), 'ok');
    document.getElementById('opt1-commit').disabled = true;
  } else {
    showResult('opt1-result', '✗ Commit failed (transaction rolled back):\n\n' + JSON.stringify(data, null, 2), 'err');
  }
});

// ===========================================================
// OPTION 2 (auto-detect, multi-file)
// ===========================================================
function populateOpt2Targets() {
  const kind = document.getElementById('opt2-kind').value;
  const sel = document.getElementById('opt2-target');
  sel.innerHTML = '<option value="">(auto)</option>';
  if (!kind) return;
  const list = kind === 'node' ? Object.keys(SCHEMA.nodes) : Object.keys(SCHEMA.relationships);
  list.forEach(t => sel.appendChild(new Option(t, t)));
}
document.getElementById('opt2-kind').addEventListener('change', populateOpt2Targets);

document.getElementById('opt2-template').addEventListener('click', () => {
  const kind = document.getElementById('opt2-kind').value;
  const target = document.getElementById('opt2-target').value;
  if (!kind || !target) { alert('Chọn kind và target trước.'); return; }
  const url = kind === 'node' ? `/api/option2/template/node/${target}` : `/api/option2/template/rel/${target}`;
  window.open(url, '_blank');
});

// Track multiple staged files in this batch
let opt2Batch = [];   // [{ file_name, staging_id, kind, target, valid_count }]

document.getElementById('opt2-validate').addEventListener('click', async () => {
  const files = document.getElementById('opt2-file').files;
  if (!files.length) { alert('Chọn ít nhất 1 file CSV.'); return; }
  const kindOverride = document.getElementById('opt2-kind').value;
  const targetOverride = document.getElementById('opt2-target').value;

  opt2Batch = [];
  const results = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    if (kindOverride) fd.append('kind', kindOverride);
    if (targetOverride) fd.append('target', targetOverride);
    const r = await fetch('/api/option2/validate', { method: 'POST', body: fd });
    const data = await r.json();
    results.push({ file: file.name, ...data });
    if (data.valid) {
      opt2Batch.push({
        file_name: file.name,
        staging_id: data.staging_id,
        kind: data.kind,
        target: data.target,
        valid_count: data.valid_count,
      });
    }
  }

  const okCount = opt2Batch.length;
  const summary = results.map(r =>
    `${r.valid ? '✓' : '✗'} ${r.file} → ${r.kind || '?'}/${r.target || '?'} ` +
    `(${r.valid_count || 0}/${r.row_count || 0} valid)` +
    (r.errors && r.errors.length ? `\n   errors: ${JSON.stringify(r.errors.slice(0, 3))}` : '')
  ).join('\n');

  showResult('opt2-result',
    `${okCount}/${files.length} file ready to commit:\n\n${summary}`,
    okCount === files.length ? 'ok' : (okCount > 0 ? 'warn' : 'err')
  );
  document.getElementById('opt2-commit').disabled = okCount === 0;
});

document.getElementById('opt2-commit').addEventListener('click', async () => {
  if (!opt2Batch.length) return;
  if (!confirm(`Commit ${opt2Batch.length} file? Mỗi file là 1 transaction riêng.`)) return;

  const results = [];
  for (const item of opt2Batch) {
    const fd = new FormData();
    fd.append('staging_id', item.staging_id);
    fd.append('actor', 'admin');
    const r = await fetch('/api/option2/commit', { method: 'POST', body: fd });
    const data = await r.json();
    results.push({ file: item.file_name, ok: r.ok, ...data });
  }
  const okCount = results.filter(r => r.ok).length;
  const summary = results.map(r =>
    `${r.ok ? '✓' : '✗'} ${r.file}: ` +
    (r.ok ? `nodes=${r.nodes_written} rels=${r.relationships_written} audit=${r.audit_id}`
          : `failed → ${JSON.stringify(r.detail || r)}`)
  ).join('\n');
  showResult('opt2-result',
    `${okCount}/${opt2Batch.length} commits OK\n\n${summary}`,
    okCount === opt2Batch.length ? 'ok' : 'err');
  document.getElementById('opt2-commit').disabled = true;
  opt2Batch = [];
});

// ===========================================================
// AUDIT
// ===========================================================
async function refreshAudit() {
  const r = await fetch('/api/audit');
  const rows = await r.json();
  const tbody = document.querySelector('#audit-table tbody');
  tbody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${row.id}</code></td>
      <td>${row.timestamp}</td>
      <td>${row.actor}</td>
      <td>${row.operation}<br><small>${row.option || ''}</small></td>
      <td><span class="status-pill status-${row.status}">${row.status}</span></td>
      <td>N=${row.nc} R=${row.rc}</td>
      <td>
        <button data-id="${row.id}" class="audit-detail">Detail</button>
        ${row.status === 'committed' ? `<button data-id="${row.id}" class="audit-restore danger">Restore</button>` : ''}
      </td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.audit-detail').forEach(b => b.addEventListener('click', () => showDetail(b.dataset.id)));
  tbody.querySelectorAll('.audit-restore').forEach(b => b.addEventListener('click', () => doRestore(b.dataset.id)));
}
document.getElementById('audit-refresh').addEventListener('click', refreshAudit);

async function showDetail(id) {
  const r = await fetch('/api/audit/' + id);
  const data = await r.json();
  showResult('audit-detail', data, '');
}

async function doRestore(id) {
  if (!confirm(`Restore audit ${id}? Sẽ revert toàn bộ thay đổi của import này.`)) return;
  const r = await fetch(`/api/audit/${id}/restore`, { method: 'POST' });
  const data = await r.json();
  showResult('audit-detail', data, r.ok ? 'ok' : 'err');
  await refreshAudit();
}

// ===========================================================
// VISUALIZER — vis-network, server-side proxy qua /api/graph
// ===========================================================
let vizNetwork = null;
const LABEL_COLORS = {
  Skill:   { background: '#4c51bf', border: '#667eea', highlight: { background: '#667eea', border: '#a5b4fc' } },
  Concept: { background: '#276749', border: '#48bb78', highlight: { background: '#48bb78', border: '#9ae6b4' } },
  Topic:   { background: '#b7791f', border: '#f6ad55', highlight: { background: '#f6ad55', border: '#fbd38d' } },
  Task:    { background: '#9b2c2c', border: '#fc8181', highlight: { background: '#fc8181', border: '#fed7d7' } },
  User:    { background: '#086f83', border: '#4fd1c5', highlight: { background: '#4fd1c5', border: '#b2f5ea' } },
  Course:  { background: '#6b21a8', border: '#c084fc', highlight: { background: '#c084fc', border: '#e9d5ff' } },
};
const LABEL_NAME_FIELD = {
  Skill: 'name', Concept: 'name', Topic: 'name', Task: 'name',
  User: 'id_user', Course: 'id_course',
};

function buildTooltipEl(label, props) {
  const rows = Object.entries(props)
    .map(([k, v]) => `<tr><td style="color:#a0aec0;padding-right:8px">${k}</td><td style="color:#e2e8f0">${v}</td></tr>`)
    .join('');
  return `<div style="background:#1a202c;border:1px solid #4a5568;border-radius:6px;padding:10px 14px;font-family:monospace;font-size:12px;max-width:280px">
    <div style="color:#63b3ed;font-weight:bold;margin-bottom:6px;font-size:13px">${label}</div>
    <table>${rows}</table>
  </div>`;
}

// ---- Current graph data cache (used by table view + node click) ----
let currentGraphData = null;
let vizMode = 'graph'; // 'graph' | 'table'

// ---- Shared render function (used by Render All + Quick Queries) ----
function renderVizWithData(data) {
  currentGraphData = data;

  if (vizMode === 'table') {
    renderTableView(data);
    return;
  }
  renderGraphView(data);
}

function renderGraphView(data) {
  const container = document.getElementById('viz-canvas');
  const tableView = document.getElementById('viz-table-view');
  container.style.display = '';
  tableView.style.display = 'none';

  if (typeof vis === 'undefined' || !vis.Network || !vis.DataSet) {
    container.innerHTML = '<div style="padding:20px;color:#fc8181;font-family:monospace"><strong>Library error:</strong> vis-network not loaded.</div>';
    return;
  }

  const nodes = data.nodes.map(n => {
    const label = n.labels[0] || 'Unknown';
    const nameField = LABEL_NAME_FIELD[label] || 'name';
    const display = n.props[nameField] || n.props.id || `#${n.internal_id}`;
    const color = LABEL_COLORS[label] || { background: '#4a5568', border: '#718096', highlight: { background: '#718096', border: '#a0aec0' } };
    return {
      id: String(n.internal_id),
      label: display,
      title: buildTooltipEl(label, n.props),
      group: label,
      color,
      shape: 'dot',
      size: 24,
      borderWidth: 2.5,
      font: { size: 13, color: '#e2e8f0', strokeWidth: 3, strokeColor: '#1a202c' },
      _rawLabel: label,
      _rawProps: n.props,
    };
  });

  const edges = data.relationships.map(r => {
    const propsTxt = Object.keys(r.props).length
      ? '<br>' + Object.entries(r.props).map(([k, v]) => `<span style="color:#a0aec0">${k}:</span> ${v}`).join('<br>')
      : '';
    return {
      id: String(r.internal_id),
      from: String(r.start),
      to: String(r.end),
      label: r.type,
      title: `<div style="background:#1a202c;border:1px solid #4a5568;border-radius:4px;padding:6px 10px;font-family:monospace;font-size:12px;color:#68d391">${r.type}${propsTxt}</div>`,
      arrows: { to: { enabled: true, scaleFactor: 0.7 } },
      color: { color: '#4a5568', highlight: '#63b3ed', hover: '#90cdf4' },
      font: { size: 10, color: '#a0aec0', strokeWidth: 2, strokeColor: '#1a202c', align: 'middle' },
      smooth: { type: 'dynamic' },
      width: 1.5,
    };
  });

  const labelCounts = {};
  data.nodes.forEach(n => { const l = n.labels[0] || 'Unknown'; labelCounts[l] = (labelCounts[l] || 0) + 1; });
  const relCounts = {};
  data.relationships.forEach(r => { relCounts[r.type] = (relCounts[r.type] || 0) + 1; });

  const legendHTML = `
    <div class="viz-legend">
      <span class="legend-stat">Nodes: <strong>${data.node_count}</strong></span>
      <span class="legend-stat">Rels: <strong>${data.rel_count}</strong></span>
      <span class="legend-sep">|</span>
      ${Object.entries(labelCounts).map(([l, c]) => {
        const color = LABEL_COLORS[l] || { border: '#718096' };
        return `<span class="legend-pill" style="border-color:${color.border}">${l} <strong>${c}</strong></span>`;
      }).join('')}
      <span class="legend-sep">|</span>
      ${Object.entries(relCounts).map(([t, c]) => `<span class="legend-rel">${t} <strong>${c}</strong></span>`).join('')}
    </div>
  `;

  container.innerHTML = legendHTML + '<div id="viz-net"></div>';

  if (vizNetwork) { vizNetwork.destroy(); vizNetwork = null; }

  try {
    const nodesDS = new vis.DataSet(nodes);
    const netEl = document.getElementById('viz-net');
    vizNetwork = new vis.Network(
      netEl,
      { nodes: nodesDS, edges: new vis.DataSet(edges) },
      {
        physics: {
          stabilization: { enabled: true, iterations: 300, updateInterval: 25 },
          barnesHut: { gravitationalConstant: -12000, centralGravity: 0.3, springLength: 160, springConstant: 0.04, avoidOverlap: 0.5 },
        },
        interaction: { hover: true, tooltipDelay: 150, navigationButtons: true, keyboard: true },
        nodes: { shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 8, x: 2, y: 2 } },
        edges: { shadow: false },
      }
    );
    vizNetwork.on('stabilizationIterationsDone', () => {
      vizNetwork.setOptions({ physics: { stabilization: false } });
    });

    // Node click → show properties in side panel
    vizNetwork.on('click', (params) => {
      if (params.nodes.length === 1) {
        const nodeId = params.nodes[0];
        const nodeData = nodesDS.get(nodeId);
        if (nodeData && nodeData._rawLabel && nodeData._rawProps) {
          showNodeDetailPanel(nodeData._rawLabel, nodeData._rawProps);
        }
      }
    });
  } catch (e) {
    console.error('[viz] Network creation failed:', e);
    container.innerHTML += `<div style="padding:20px;color:#fc8181;font-family:monospace"><strong>Render error:</strong> ${e.message}</div>`;
  }
}

// ---- Table view ----
function renderTableView(data) {
  const canvas = document.getElementById('viz-canvas');
  const tableView = document.getElementById('viz-table-view');
  canvas.style.display = 'none';
  tableView.style.display = '';

  // Nodes table
  const allNodeKeys = new Set();
  data.nodes.forEach(n => {
    allNodeKeys.add('_label');
    Object.keys(n.props).forEach(k => allNodeKeys.add(k));
  });
  const nodeKeys = Array.from(allNodeKeys);

  const ntHead = document.querySelector('#viz-nodes-table thead tr');
  ntHead.innerHTML = nodeKeys.map(k => `<th>${k === '_label' ? 'Label' : k}</th>`).join('');
  const ntBody = document.querySelector('#viz-nodes-table tbody');
  ntBody.innerHTML = data.nodes.map(n => {
    const label = n.labels[0] || '';
    return `<tr class="table-row-clickable" data-label="${label}" data-props='${JSON.stringify(n.props).replace(/'/g, "&#39;")}'>` +
      nodeKeys.map(k => {
        if (k === '_label') return `<td><span class="legend-pill" style="border-color:${(LABEL_COLORS[label] || {border:'#718096'}).border};font-size:11px;padding:1px 6px">${label}</span></td>`;
        return `<td title="${String(n.props[k] ?? '')}">${n.props[k] ?? ''}</td>`;
      }).join('') + '</tr>';
  }).join('');

  // Click row → show detail panel
  ntBody.querySelectorAll('.table-row-clickable').forEach(tr => {
    tr.addEventListener('click', () => {
      const label = tr.dataset.label;
      const props = JSON.parse(tr.dataset.props);
      showNodeDetailPanel(label, props);
    });
  });

  // Rels table
  const allRelKeys = ['type', 'start', 'end'];
  const extraRelKeys = new Set();
  data.relationships.forEach(r => Object.keys(r.props).forEach(k => extraRelKeys.add(k)));
  const relKeys = [...allRelKeys, ...Array.from(extraRelKeys)];

  const rtHead = document.querySelector('#viz-rels-table thead tr');
  rtHead.innerHTML = relKeys.map(k => `<th>${k}</th>`).join('');
  const rtBody = document.querySelector('#viz-rels-table tbody');
  rtBody.innerHTML = data.relationships.map(r => {
    return '<tr>' + relKeys.map(k => {
      if (k === 'type') return `<td style="color:var(--success);font-weight:600">${r.type}</td>`;
      if (k === 'start' || k === 'end') return `<td>${r[k]}</td>`;
      return `<td>${r.props[k] ?? ''}</td>`;
    }).join('') + '</tr>';
  }).join('');
}

// ---- Graph/Table toggle ----
document.getElementById('viz-mode-graph').addEventListener('click', () => {
  vizMode = 'graph';
  document.getElementById('viz-mode-graph').classList.add('active');
  document.getElementById('viz-mode-table').classList.remove('active');
  if (currentGraphData) renderVizWithData(currentGraphData);
});
document.getElementById('viz-mode-table').addEventListener('click', () => {
  vizMode = 'table';
  document.getElementById('viz-mode-table').classList.add('active');
  document.getElementById('viz-mode-graph').classList.remove('active');
  if (currentGraphData) renderVizWithData(currentGraphData);
});

// ---- Node Detail Panel ----
function showNodeDetailPanel(label, props) {
  const panel = document.getElementById('node-detail-panel');
  const title = document.getElementById('ndp-title');
  const content = document.getElementById('ndp-content');
  panel.classList.remove('hidden');

  const color = LABEL_COLORS[label] || { background: '#4a5568', border: '#718096' };
  title.textContent = label;

  const pk = props.id || props.id_user || props.id_course || Object.values(props)[0] || '';

  let html = `<span class="ndp-label-badge" style="background:${color.background};color:#fff;border:1px solid ${color.border}">${label}</span>`;

  // Properties section
  html += '<div class="ndp-section"><h4>Properties</h4><table class="ndp-prop-table">';
  for (const [k, v] of Object.entries(props)) {
    html += `<tr><td>${k}</td><td>${v}</td></tr>`;
  }
  html += '</table></div>';

  // Connections section — fetch from API
  content.innerHTML = html + '<div class="ndp-section"><h4>Connections</h4><div id="ndp-conn-loading" style="color:#718096">Loading...</div></div>';

  fetch(`/api/export/node/${label}/${encodeURIComponent(pk)}`)
    .then(r => r.ok ? r.json() : Promise.reject('Not found'))
    .then(data => {
      const connEl = document.getElementById('ndp-conn-loading');
      if (!connEl) return;
      if (!data.connections || data.connections.length === 0) {
        connEl.textContent = 'No connections.';
        return;
      }
      connEl.innerHTML = data.connections.map(c => {
        const arrow = c.direction === 'outgoing' ? '→' : '←';
        const rpHtml = Object.keys(c.rel_props).length
          ? `<div class="ndp-conn-props">${Object.entries(c.rel_props).map(([k,v]) => `${k}: ${v}`).join(', ')}</div>` : '';
        return `<div class="ndp-conn">
          <span class="conn-type">${c.rel_type}</span>
          <span class="conn-dir">${arrow} ${c.direction}</span>
          <span class="conn-target">${c.other_label}: ${c.other_name}</span>
          ${rpHtml}
        </div>`;
      }).join('');
    })
    .catch(() => {
      const connEl = document.getElementById('ndp-conn-loading');
      if (connEl) connEl.textContent = 'Could not load connections.';
    });
}

document.getElementById('ndp-close').addEventListener('click', () => {
  document.getElementById('node-detail-panel').classList.add('hidden');
});

// ---- Render All (fetch full graph then render) ----
async function renderViz() {
  const container = document.getElementById('viz-canvas');
  container.innerHTML = '<div style="padding:20px;color:#718096;font-family:monospace">Loading graph…</div>';
  try {
    const r = await fetch('/api/graph');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (data.node_count === 0) {
      container.innerHTML = '<div style="padding:20px;color:#718096;font-family:monospace">Graph trống — chưa có nodes nào.</div>';
      return;
    }
    renderVizWithData(data);
  } catch (e) {
    container.innerHTML = `<div style="padding:20px;color:#fc8181;font-family:monospace"><strong>Lỗi:</strong> ${e.message}</div>`;
  }
}
document.getElementById('viz-render').addEventListener('click', renderViz);

// ===========================================================
// QUICK QUERIES
// ===========================================================
async function loadQuickQueryOptions() {
  for (const [label, selId] of [['Skill', 'qq-skill'], ['Concept', 'qq-concept'], ['Course', 'qq-course']]) {
    try {
      const r = await fetch(`/api/graph/options/${label}`);
      const items = await r.json();
      const sel = document.getElementById(selId);
      items.forEach(item => {
        const opt = new Option(item.name || item.id, item.id);
        sel.appendChild(opt);
      });
    } catch (e) {
      console.warn(`[qq] failed to load ${label} options:`, e);
    }
  }
}

async function runQuickQuery(url, emptyMsg) {
  const container = document.getElementById('viz-canvas');
  container.innerHTML = '<div style="padding:20px;color:#718096;font-family:monospace">Running query…</div>';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (data.node_count === 0) {
      container.innerHTML = `<div style="padding:20px;color:#718096;font-family:monospace">${emptyMsg}</div>`;
      return;
    }
    renderVizWithData(data);
  } catch (e) {
    container.innerHTML = `<div style="padding:20px;color:#fc8181;font-family:monospace"><strong>Query error:</strong> ${e.message}</div>`;
  }
}

document.getElementById('qq-btn-users-by-skill').addEventListener('click', () => {
  const v = document.getElementById('qq-skill').value;
  if (!v) { alert('Chọn Skill trước.'); return; }
  runQuickQuery(`/api/graph/query/users-by-skill/${encodeURIComponent(v)}`, 'Không có User nào có Skill này.');
});

document.getElementById('qq-btn-courses-by-concept').addEventListener('click', () => {
  const v = document.getElementById('qq-concept').value;
  if (!v) { alert('Chọn Concept trước.'); return; }
  runQuickQuery(`/api/graph/query/courses-by-concept/${encodeURIComponent(v)}`, 'Không có Course nào covers Concept này.');
});

document.getElementById('qq-btn-skills-by-course').addEventListener('click', () => {
  const v = document.getElementById('qq-course').value;
  if (!v) { alert('Chọn Course trước.'); return; }
  runQuickQuery(`/api/graph/query/skills-by-course/${encodeURIComponent(v)}`, 'Không có Skill nào trong Course này.');
});

document.getElementById('viz-wipe').addEventListener('click', async () => {
  if (!confirm('⚠ Xoá toàn bộ data graph (giữ AuditLog)?')) return;
  const r = await fetch('/api/graph/wipe?confirm=YES', { method: 'DELETE' });
  alert(r.ok ? 'Wiped.' : 'Failed.');
  if (vizNetwork) renderViz();
});

// ===========================================================
// ROADMAP
// ===========================================================
const RM_NODE_STYLES = {
  Course:       { bg: '#4f46e5', border: '#3730a3', shape: 'box',     size: 30, fontColor: '#fff', fontFace: 'sans-serif', fontSize: 16 },
  Topic:        { bg: '#7c3aed', border: '#5b21b6', shape: 'box',     size: 28, fontColor: '#fff', fontFace: 'sans-serif', fontSize: 16 },
  Level:        { bg: '#f59e0b', border: '#d97706', shape: 'box',     size: 22, fontColor: '#fff', fontFace: 'sans-serif', fontSize: 14 },
  Skill:        { bg: '#3b82f6', border: '#2563eb', shape: 'box',     size: 20, fontColor: '#fff', fontFace: 'sans-serif', fontSize: 13 },
  Concept:      { bg: '#10b981', border: '#059669', shape: 'box',     size: 18, fontColor: '#fff', fontFace: 'sans-serif', fontSize: 13 },
  ConceptGroup: { bg: '#10b981', border: '#047857', shape: 'box',     size: 22, fontColor: '#fff', fontFace: 'sans-serif', fontSize: 14 },
  Prerequisite: { bg: '#ef4444', border: '#dc2626', shape: 'box',     size: 16, fontColor: '#fff', fontFace: 'sans-serif', fontSize: 12 },
};

let rmNetwork = null;

async function loadRoadmapSources() {
  try {
    const r = await fetch('/api/roadmap/sources');
    const data = await r.json();
    const cSel = document.getElementById('rm-course-sel');
    cSel.innerHTML = '<option value="">-- Chọn Course --</option>';
    data.courses.forEach(c => cSel.appendChild(new Option(c.name || c.id, c.id)));

    const tSel = document.getElementById('rm-topic-sel');
    tSel.innerHTML = '<option value="">-- Chọn Topic --</option>';
    data.topics.forEach(t => tSel.appendChild(new Option(t.name || t.id, t.id)));
  } catch (e) {
    console.warn('[roadmap] Failed to load sources:', e);
  }
}

function renderRoadmap(data) {
  const canvas = document.getElementById('rm-canvas');
  document.getElementById('rm-legend').style.display = 'flex';

  canvas.innerHTML = '<div id="rm-tree"></div>';

  if (!data.nodes.length) {
    canvas.innerHTML = '<div class="roadmap-empty-state"><div class="res-icon">📭</div><h3>Không có dữ liệu</h3><p>Khóa học/chủ đề này chưa có skills hoặc concepts nào.</p></div>';
    return;
  }

  const nodes = data.nodes.map(n => {
    const style = RM_NODE_STYLES[n.type] || RM_NODE_STYLES.Skill;
    const metaLine = n.meta ? `\n${n.meta}` : '';
    return {
      id: n.id,
      label: n.label + metaLine,
      shape: style.shape,
      size: style.size,
      color: {
        background: style.bg,
        border: style.border,
        highlight: { background: style.border, border: style.bg },
        hover:     { background: style.border, border: style.bg },
      },
      font: {
        color: style.fontColor,
        face: style.fontFace,
        size: style.fontSize,
        multi: 'md',
        bold: { color: style.fontColor, size: style.fontSize + 2 },
      },
      borderWidth: 2,
      margin: { top: 10, bottom: 10, left: 14, right: 14 },
      shadow: { enabled: true, color: 'rgba(0,0,0,0.1)', size: 6, x: 1, y: 3 },
      widthConstraint: { minimum: 120, maximum: 220 },
      _rmType: n.type,
      _rmMeta: n.meta,
    };
  });

  const edges = data.edges.map((e, i) => ({
    id: 'rme_' + i,
    from: e.from,
    to: e.to,
    arrows: { to: { enabled: true, scaleFactor: 0.6, type: 'arrow' } },
    color: {
      color: e.style === 'dashed' ? '#f87171' : '#94a3b8',
      highlight: '#4f46e5',
      hover: '#6366f1',
    },
    dashes: e.style === 'dashed' ? [6, 4] : false,
    width: e.style === 'dashed' ? 1.5 : 2,
    smooth: { enabled: true, type: 'cubicBezier', roundness: 0.4 },
  }));

  if (rmNetwork) { rmNetwork.destroy(); rmNetwork = null; }

  const treeEl = document.getElementById('rm-tree');
  rmNetwork = new vis.Network(treeEl, {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  }, {
    layout: {
      hierarchical: {
        enabled: true,
        direction: 'UD',
        sortMethod: 'directed',
        levelSeparation: 100,
        nodeSpacing: 160,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
      },
    },
    physics: {
      enabled: false,
    },
    interaction: {
      hover: true,
      tooltipDelay: 100,
      navigationButtons: true,
      keyboard: { enabled: true },
      zoomView: true,
      dragView: true,
    },
    nodes: {
      shape: 'box',
      borderWidth: 2,
    },
    edges: {
      smooth: { enabled: true, type: 'cubicBezier' },
    },
  });

  // Click node → show popover
  rmNetwork.on('click', (params) => {
    // Remove existing popover
    document.querySelectorAll('.rm-popover').forEach(el => el.remove());

    if (params.nodes.length === 1) {
      const nodeId = params.nodes[0];
      const nodeData = nodes.find(n => n.id === nodeId);
      if (!nodeData) return;

      const type = nodeData._rmType;
      const style = RM_NODE_STYLES[type] || RM_NODE_STYLES.Skill;
      const canvasRect = treeEl.getBoundingClientRect();
      const domPos = params.pointer.DOM;

      const pop = document.createElement('div');
      pop.className = 'rm-popover';
      pop.style.left = (domPos.x + 16) + 'px';
      pop.style.top = (domPos.y - 10) + 'px';
      pop.innerHTML = `
        <span class="rm-pop-type" style="background:${style.bg}">${type}</span>
        <h4>${nodeData.label.split('\n')[0]}</h4>
        ${nodeData._rmMeta ? `<div class="rm-pop-meta">${nodeData._rmMeta}</div>` : ''}
      `;
      treeEl.style.position = 'relative';
      treeEl.appendChild(pop);

      // Auto-remove on next click anywhere
      setTimeout(() => {
        const remover = () => { pop.remove(); document.removeEventListener('click', remover); };
        document.addEventListener('click', remover);
      }, 50);
    }
  });
}

document.getElementById('rm-gen-course').addEventListener('click', async () => {
  const v = document.getElementById('rm-course-sel').value;
  if (!v) { alert('Chọn Course trước.'); return; }
  document.getElementById('rm-canvas').innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;font-size:16px">Đang tạo roadmap...</div>';
  try {
    const r = await fetch(`/api/roadmap/by-course/${encodeURIComponent(v)}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    renderRoadmap(await r.json());
  } catch (e) {
    document.getElementById('rm-canvas').innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444">Lỗi: ${e.message}</div>`;
  }
});

document.getElementById('rm-gen-topic').addEventListener('click', async () => {
  const v = document.getElementById('rm-topic-sel').value;
  if (!v) { alert('Chọn Topic trước.'); return; }
  document.getElementById('rm-canvas').innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;font-size:16px">Đang tạo roadmap...</div>';
  try {
    const r = await fetch(`/api/roadmap/by-topic/${encodeURIComponent(v)}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    renderRoadmap(await r.json());
  } catch (e) {
    document.getElementById('rm-canvas').innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444">Lỗi: ${e.message}</div>`;
  }
});

// ===========================================================
// EXPORT DATA
// ===========================================================
function setExportOutput(text) {
  document.getElementById('exp-output').textContent = text;
}

async function loadExportStats() {
  try {
    const r = await fetch('/api/export/stats');
    const stats = await r.json();

    // Populate node checklist
    const nodeList = document.getElementById('exp-node-list');
    nodeList.innerHTML = '';
    for (const [label, count] of Object.entries(stats.nodes)) {
      const item = document.createElement('label');
      item.className = 'export-check-item';
      item.innerHTML = `<input type="checkbox" value="${label}" /> ${label} <span class="count">(${count})</span>`;
      nodeList.appendChild(item);
    }

    // Populate relationship checklist
    const relList = document.getElementById('exp-rel-list');
    relList.innerHTML = '';
    for (const [rtype, count] of Object.entries(stats.relationships)) {
      const item = document.createElement('label');
      item.className = 'export-check-item';
      item.innerHTML = `<input type="checkbox" value="${rtype}" /> ${rtype} <span class="count">(${count})</span>`;
      relList.appendChild(item);
    }

    // Populate single node label dropdown
    const sel = document.getElementById('exp-single-label');
    sel.innerHTML = '';
    for (const label of Object.keys(stats.nodes)) {
      sel.appendChild(new Option(label, label));
    }
  } catch (e) {
    console.warn('[export] Failed to load stats:', e);
  }
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Full JSON export
document.getElementById('exp-full-json').addEventListener('click', async () => {
  setExportOutput('Exporting full graph as JSON...');
  try {
    const r = await fetch('/api/export/full');
    const data = await r.json();
    const text = JSON.stringify(data, null, 2);
    setExportOutput(text);
    downloadBlob(text, 'graph_full_export.json', 'application/json');
  } catch (e) {
    setExportOutput('Error: ' + e.message);
  }
});

// Full Cypher export
document.getElementById('exp-full-cypher').addEventListener('click', async () => {
  setExportOutput('Exporting as Cypher statements...');
  try {
    const r = await fetch('/api/export/cypher');
    const text = await r.text();
    setExportOutput(text || '(no data)');
    downloadBlob(text, 'graph_export.cypher', 'text/plain');
  } catch (e) {
    setExportOutput('Error: ' + e.message);
  }
});

// Export selected nodes
document.getElementById('exp-nodes-go').addEventListener('click', async () => {
  const checked = Array.from(document.querySelectorAll('#exp-node-list input:checked')).map(cb => cb.value);
  if (!checked.length) { alert('Chọn ít nhất 1 label.'); return; }
  const fmt = document.getElementById('exp-node-fmt').value;
  setExportOutput(`Exporting ${checked.length} label(s) as ${fmt.toUpperCase()}...`);

  try {
    if (fmt === 'json') {
      const allData = {};
      for (const label of checked) {
        const r = await fetch(`/api/export/nodes/${label}?fmt=json`);
        allData[label] = await r.json();
      }
      const text = JSON.stringify(allData, null, 2);
      setExportOutput(text);
      downloadBlob(text, 'nodes_export.json', 'application/json');
    } else if (fmt === 'csv') {
      let allCsv = '';
      for (const label of checked) {
        const r = await fetch(`/api/export/nodes/${label}?fmt=csv`);
        const text = await r.text();
        allCsv += `── nodes_${label}.csv ──\n${text}\n\n`;
        downloadBlob(text, `nodes_${label}.csv`, 'text/csv');
      }
      setExportOutput(allCsv.trim());
    } else {
      // cypher
      const allData = {};
      for (const label of checked) {
        const r = await fetch(`/api/export/nodes/${label}?fmt=json`);
        allData[label] = await r.json();
      }
      const lines = [];
      for (const [label, rows] of Object.entries(allData)) {
        for (const row of rows) {
          const props = Object.entries(row).map(([k, v]) => `${k}: ${typeof v === 'string' ? "'" + v.replace(/'/g, "\\'") + "'" : v}`).join(', ');
          lines.push(`MERGE (n:\`${label}\` {${props}});`);
        }
      }
      const text = lines.join('\n');
      setExportOutput(text || '(no data)');
      downloadBlob(text, 'nodes_export.cypher', 'text/plain');
    }
  } catch (e) {
    setExportOutput('Error: ' + e.message);
  }
});

// Export selected relationships
document.getElementById('exp-rels-go').addEventListener('click', async () => {
  const checked = Array.from(document.querySelectorAll('#exp-rel-list input:checked')).map(cb => cb.value);
  if (!checked.length) { alert('Chọn ít nhất 1 relationship type.'); return; }
  const fmt = document.getElementById('exp-rel-fmt').value;
  setExportOutput(`Exporting ${checked.length} rel type(s) as ${fmt.toUpperCase()}...`);

  try {
    if (fmt === 'json') {
      const allData = {};
      for (const rtype of checked) {
        const r = await fetch(`/api/export/relationships/${rtype}?fmt=json`);
        allData[rtype] = await r.json();
      }
      const text = JSON.stringify(allData, null, 2);
      setExportOutput(text);
      downloadBlob(text, 'rels_export.json', 'application/json');
    } else if (fmt === 'csv') {
      let allCsv = '';
      for (const rtype of checked) {
        const r = await fetch(`/api/export/relationships/${rtype}?fmt=csv`);
        const text = await r.text();
        allCsv += `── rels_${rtype}.csv ──\n${text}\n\n`;
        downloadBlob(text, `rels_${rtype}.csv`, 'text/csv');
      }
      setExportOutput(allCsv.trim());
    } else {
      // cypher
      const allData = {};
      for (const rtype of checked) {
        const r = await fetch(`/api/export/relationships/${rtype}?fmt=json`);
        allData[rtype] = await r.json();
      }
      const lines = [];
      for (const [rtype, rows] of Object.entries(allData)) {
        for (const row of rows) {
          const { start_label, start_id, end_label, end_id, ...relProps } = row;
          const rpStr = Object.keys(relProps).length
            ? ' {' + Object.entries(relProps).map(([k, v]) => `${k}: ${typeof v === 'string' ? "'" + v.replace(/'/g, "\\'") + "'" : v}`).join(', ') + '}'
            : '';
          lines.push(`MATCH (s:\`${start_label}\`), (e:\`${end_label}\`) WHERE s.id = '${start_id}' AND e.id = '${end_id}' MERGE (s)-[:\`${rtype}\`${rpStr}]->(e);`);
        }
      }
      const text = lines.join('\n');
      setExportOutput(text || '(no data)');
      downloadBlob(text, 'rels_export.cypher', 'text/plain');
    }
  } catch (e) {
    setExportOutput('Error: ' + e.message);
  }
});

// Single node dump
document.getElementById('exp-single-go').addEventListener('click', async () => {
  const label = document.getElementById('exp-single-label').value;
  const nodeId = document.getElementById('exp-single-id').value.trim();
  if (!label || !nodeId) { alert('Chọn label và nhập ID.'); return; }
  setExportOutput('Loading...');
  try {
    const r = await fetch(`/api/export/node/${label}/${encodeURIComponent(nodeId)}`);
    if (!r.ok) {
      const err = await r.json();
      setExportOutput('Error: ' + (err.detail || r.statusText));
      return;
    }
    const data = await r.json();
    setExportOutput(JSON.stringify(data, null, 2));
  } catch (e) {
    setExportOutput('Error: ' + e.message);
  }
});

// Copy button
document.getElementById('exp-copy').addEventListener('click', () => {
  const text = document.getElementById('exp-output').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('exp-copy');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
});

bootstrap();
