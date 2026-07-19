// ===== Roadmap — cay lo trinh tu Course/Topic =====

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

export { loadRoadmapSources };
