// ===== Visualizer — vis-network, du lieu qua /api/graph =====
// `vis` la bien global do vis-network.min.js (UMD) tao ra trong index.html.
import { attachGraphZoom } from './core.js';

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

  // Wrap tạo lại mỗi lần render nên gắn lại nút zoom bên dưới cũng không leak
  container.innerHTML = legendHTML + '<div class="graph-zoom-wrap"><div id="viz-net"></div></div>';

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
    // Xếp xong tắt hẳn physics: kéo node nào chỉ node đó chạy, không lôi cả
    // chùm theo, sắp tay xong node đứng yên chỗ đó.
    vizNetwork.on('stabilizationIterationsDone', () => {
      vizNetwork.setOptions({ physics: false });
    });
    attachGraphZoom(netEl.parentElement, () => vizNetwork);

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

export { renderViz, loadQuickQueryOptions };
