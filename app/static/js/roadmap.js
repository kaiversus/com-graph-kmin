// ===== Roadmap — dashboard lo trinh CA NHAN HOA (JobRole / KnowledgeArea + Account) =====

// Mau theo LOAI node (khi khong ca nhan hoa, hoac cho root/level/area)
const RM_TYPE_STYLES = {
  JobRole:       { bg: '#4f46e5', border: '#3730a3' },
  KnowledgeArea: { bg: '#7c3aed', border: '#5b21b6' },
  Level:         { bg: '#f59e0b', border: '#d97706' },
  Skill:         { bg: '#3b82f6', border: '#2563eb' },
  Knowledge:     { bg: '#10b981', border: '#059669' },
};
// Mau theo TRANG THAI hoc (khi da chon Account)
const RM_STATUS_STYLES = {
  done:        { bg: '#22c55e', border: '#15803d', icon: '✓' },
  in_progress: { bg: '#f59e0b', border: '#b45309', icon: '◐' },
  not_started: { bg: '#94a3b8', border: '#64748b', icon: '○' },
};
const IMP_BADGE = {
  essential: { cls: 'imp-essential', label: 'Bắt buộc', star: '⭐' },
  important: { cls: 'imp-important', label: 'Quan trọng', star: '' },
  optional:  { cls: 'imp-optional', label: 'Nên có', star: '' },
};
const LEVEL_VI = { beginner: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao', expert: 'Chuyên sâu' };

let rmNetwork = null;

async function loadRoadmapSources() {
  try {
    const r = await fetch('/api/roadmap/sources');
    const data = await r.json();
    const rSel = document.getElementById('rm-role-sel');
    rSel.innerHTML = '<option value="">-- Chọn JobRole --</option>';
    (data.roles || []).forEach(x => rSel.appendChild(new Option(x.name || x.id, x.id)));

    const aSel = document.getElementById('rm-area-sel');
    aSel.innerHTML = '<option value="">-- Chọn KnowledgeArea --</option>';
    (data.areas || []).forEach(x => aSel.appendChild(new Option(x.name || x.id, x.id)));

    const accSel = document.getElementById('rm-account-sel');
    accSel.innerHTML = '<option value="">-- Không chọn (bản chung) --</option>';
    (data.accounts || []).forEach(x => accSel.appendChild(new Option(x.name || x.id, x.id)));
  } catch (e) {
    console.warn('[roadmap] Failed to load sources:', e);
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function nodeVisual(n, personalized) {
  // Root/Level/KnowledgeArea container: luon theo loai. Skill/Knowledge: theo trang thai neu ca nhan hoa.
  const isLeaf = n.type === 'Skill' || n.type === 'Knowledge';
  if (personalized && isLeaf && n.status) {
    const st = RM_STATUS_STYLES[n.status] || RM_STATUS_STYLES.not_started;
    const locked = n.ready === false && n.status !== 'done';
    return { bg: st.bg, border: locked ? '#dc2626' : st.border, icon: locked ? '🔒' : st.icon, locked };
  }
  const ts = RM_TYPE_STYLES[n.type] || RM_TYPE_STYLES.Skill;
  return { bg: ts.bg, border: ts.border, icon: '', locked: false };
}

function renderRoadmap(data) {
  const canvas = document.getElementById('rm-canvas');
  document.getElementById('rm-legend').style.display = 'flex';
  canvas.innerHTML = '<div id="rm-tree"></div>';

  const panel = document.getElementById('rm-panel');
  const personalized = !!data.personalized;
  // Legend trạng thái chỉ có nghĩa khi tô màu theo tiến độ (đã chọn học viên)
  document.getElementById('rm-legend-status').style.display = personalized ? 'inline-flex' : 'none';

  if (!data.nodes.length) {
    canvas.innerHTML = '<div class="roadmap-empty-state"><div class="res-icon">📭</div><h3>Không có dữ liệu</h3><p>Vai trò/lĩnh vực này chưa có skills hoặc knowledge nào.</p></div>';
    panel.style.display = 'none';
    return;
  }

  const nodes = data.nodes.map(n => {
    const vis = nodeVisual(n, personalized);
    const iconPrefix = vis.icon ? vis.icon + ' ' : '';
    const metaLine = n.meta ? `\n${n.meta}` : '';
    return {
      id: n.id,
      label: iconPrefix + n.label + metaLine,
      shape: 'box',
      color: {
        background: vis.bg,
        border: vis.border,
        highlight: { background: vis.border, border: vis.bg },
        hover:     { background: vis.border, border: vis.bg },
      },
      font: { color: '#fff', face: 'sans-serif', size: n.type === 'JobRole' || n.type === 'KnowledgeArea' ? 16 : 13, multi: 'md' },
      borderWidth: vis.locked ? 3 : 2,
      shapeProperties: { borderRadius: 8, borderDashes: vis.locked ? [5, 4] : false },
      margin: { top: 10, bottom: 10, left: 14, right: 14 },
      shadow: { enabled: true, color: 'rgba(0,0,0,0.1)', size: 6, x: 1, y: 3 },
      widthConstraint: { minimum: 120, maximum: 220 },
      _rm: n,
    };
  });

  const edges = data.edges.map((e, i) => ({
    id: 'rme_' + i,
    from: e.from,
    to: e.to,
    arrows: { to: { enabled: true, scaleFactor: 0.6, type: 'arrow' } },
    color: { color: e.style === 'dashed' ? '#f87171' : '#94a3b8', highlight: '#4f46e5', hover: '#6366f1' },
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
    layout: { hierarchical: { enabled: true, direction: 'UD', sortMethod: 'directed',
      levelSeparation: 100, nodeSpacing: 160, treeSpacing: 200,
      blockShifting: true, edgeMinimization: true, parentCentralization: true } },
    physics: { enabled: false },
    interaction: { hover: true, tooltipDelay: 100, navigationButtons: true,
      keyboard: { enabled: true }, zoomView: true, dragView: true },
    nodes: { shape: 'box', borderWidth: 2 },
    edges: { smooth: { enabled: true, type: 'cubicBezier' } },
  });

  // Click node → hiện popover chi tiết CHẶNG đó (chỉ khi bấm vào node).
  rmNetwork.on('click', (params) => {
    document.querySelectorAll('.rm-popover').forEach(el => el.remove());
    if (params.nodes.length !== 1) return;      // bấm nền trống → chỉ đóng popover
    const nd = nodes.find(n => n.id === params.nodes[0]);
    if (nd && nd._rm) showNodeDetail(nd._rm, params.pointer.DOM, treeEl, personalized);
  });

  renderPanel(data);
}

function showNodeDetail(n, domPos, treeEl, personalized) {
  const isLeaf = n.type === 'Skill' || n.type === 'Knowledge';
  const typeLabel = { JobRole: 'Vai trò', KnowledgeArea: 'Lĩnh vực', Skill: 'Kỹ năng', Knowledge: 'Kiến thức' }[n.type] || n.type;
  const tv = RM_TYPE_STYLES[n.type] || RM_TYPE_STYLES.Skill;

  let rows = '';
  if (personalized && isLeaf && n.status) {
    const stLabel = { done: 'Đã đạt', in_progress: 'Đang học', not_started: 'Chưa học' }[n.status];
    const stCls = { done: 'st-done', in_progress: 'st-prog', not_started: 'st-todo' }[n.status];
    const pct = (n.proficiency != null) ? ` · ${Math.round(n.proficiency * 100)}%` : '';
    rows += `<div class="rm-pop-row"><span class="rm-pop-k">Trạng thái</span><span class="rm-badge ${stCls}">${stLabel}${pct}</span></div>`;
  }
  if (isLeaf && n.importance) {
    const imp = IMP_BADGE[n.importance] || IMP_BADGE.optional;
    rows += `<div class="rm-pop-row"><span class="rm-pop-k">Độ quan trọng</span><span class="rm-badge ${imp.cls}">${imp.star}${imp.label}</span></div>`;
  }
  if (isLeaf && n.difficulty) {
    rows += `<div class="rm-pop-row"><span class="rm-pop-k">Độ khó</span><span class="rm-badge diff">${LEVEL_VI[n.difficulty] || n.difficulty}</span></div>`;
  }
  if (personalized && isLeaf) {
    if (n.ready === false && n.status !== 'done') {
      rows += `<div class="rm-pop-row"><span class="rm-pop-k">🔒 Cần học trước</span><span class="rm-pop-v">${escapeHtml((n.locked_by || []).join(', ') || '—')}</span></div>`;
    } else if (n.status !== 'done') {
      rows += `<div class="rm-pop-row"><span class="rm-pop-k">Sẵn sàng</span><span class="rm-badge ready">Bắt đầu được ngay</span></div>`;
    }
  }
  if (isLeaf) {
    const r = n.resources || {};
    const bits = [];
    if (r.contents) bits.push(`📚 ${r.contents} học liệu`);
    if (r.quizzes) bits.push(`📝 ${r.quizzes} quiz`);
    if (r.mentors) bits.push(`🧑‍🏫 ${r.mentors} mentor`);
    rows += `<div class="rm-pop-row"><span class="rm-pop-k">Tài nguyên</span><span class="rm-pop-v ${bits.length ? '' : 'muted'}">${bits.join(' · ') || 'Chưa có học liệu gắn kèm'}</span></div>`;
  }
  if (!rows) rows = `<div class="rm-pop-row"><span class="rm-pop-v muted">Điểm bắt đầu của lộ trình.</span></div>`;

  const pop = document.createElement('div');
  pop.className = 'rm-popover';
  pop.style.left = Math.min(domPos.x + 16, treeEl.clientWidth - 280) + 'px';
  pop.style.top = Math.max(domPos.y - 10, 8) + 'px';
  pop.innerHTML =
    `<button class="rm-pop-close" aria-label="Đóng">×</button>` +
    `<span class="rm-pop-type" style="background:${tv.bg}">${typeLabel}</span>` +
    `<h4>${escapeHtml(n.label)}</h4>` + rows;
  treeEl.style.position = 'relative';
  treeEl.appendChild(pop);
  pop.querySelector('.rm-pop-close').addEventListener('click', (e) => { e.stopPropagation(); pop.remove(); });
}

function renderPanel(data) {
  const panel = document.getElementById('rm-panel');
  const s = data.summary;
  const personalized = !!data.personalized;
  panel.style.display = 'block';

  const rootName = escapeHtml(data.root.name);
  const accLine = personalized
    ? `<div class="rm-panel-who">👤 ${escapeHtml(data.account.name)} &nbsp;·&nbsp; 🎯 ${rootName}</div>`
    : `<div class="rm-panel-who">🎯 ${rootName}</div>`;

  // --- Progress block ---
  let progressBlock = '';
  if (personalized) {
    progressBlock = `
      <div class="rm-progress">
        <div class="rm-progress-top">
          <span class="rm-progress-pct">${s.percent}%</span>
          <span class="rm-progress-count">${s.done}/${s.total} hoàn thành</span>
        </div>
        <div class="rm-progress-bar"><div class="rm-progress-fill" style="width:${s.percent}%"></div></div>
        <div class="rm-dist">
          <span class="rm-dist-item"><i class="rm-swatch done"></i>${s.done} đã đạt</span>
          <span class="rm-dist-item"><i class="rm-swatch prog"></i>${s.in_progress} đang học</span>
          <span class="rm-dist-item"><i class="rm-swatch todo"></i>${s.not_started} chưa học</span>
        </div>
      </div>`;
  }

  // --- Headline ---
  const headline = `<div class="rm-headline">${escapeHtml(s.headline)}${s.sub ? `<div class="rm-headline-sub">${escapeHtml(s.sub)}</div>` : ''}</div>`;

  // --- Milestones ---
  let milestonesBlock = '';
  if (personalized && s.milestones.length) {
    const rows = s.milestones.map(m => `
      <div class="rm-ms">
        <div class="rm-ms-head"><span>${LEVEL_VI[m.level] || m.level}</span><span>${m.done}/${m.total}</span></div>
        <div class="rm-ms-bar"><div class="rm-ms-fill ${m.percent === 100 ? 'full' : ''}" style="width:${m.percent}%"></div></div>
      </div>`).join('');
    milestonesBlock = `<div class="rm-section"><h4>🏁 Chặng theo cấp độ</h4>${rows}</div>`;
  }

  // --- Next steps ---
  const stepsTitle = personalized ? '▶ Học tiếp theo' : '⭐ Mục quan trọng nhất';
  let stepsBlock = '';
  if (s.next_steps.length) {
    const cards = s.next_steps.map((it, idx) => {
      const imp = IMP_BADGE[it.importance] || IMP_BADGE.optional;
      const readyBadge = personalized
        ? (it.status === 'in_progress'
            ? '<span class="rm-badge ready">Đang học dở</span>'
            : (it.ready ? '<span class="rm-badge ready">Sẵn sàng</span>' : '<span class="rm-badge locked">🔒 Chưa mở khóa</span>'))
        : '';
      const res = it.resources || {};
      const resBits = [];
      if (res.contents) resBits.push(`📚 ${res.contents} học liệu`);
      if (res.quizzes) resBits.push(`📝 ${res.quizzes} quiz`);
      if (res.mentors) resBits.push(`🧑‍🏫 ${res.mentors} mentor`);
      const resLine = resBits.length ? `<div class="rm-step-res">${resBits.join(' · ')}</div>` : '<div class="rm-step-res muted">Chưa có học liệu gắn kèm</div>';
      return `
        <div class="rm-step" id="rm-step-${escapeHtml(it.ref_id)}">
          <div class="rm-step-num">${idx + 1}</div>
          <div class="rm-step-body">
            <div class="rm-step-title">${escapeHtml(it.name)}
              <span class="rm-type-tag ${it.type === 'Skill' ? 'skill' : 'know'}">${it.type === 'Skill' ? 'Kỹ năng' : 'Kiến thức'}</span>
            </div>
            <div class="rm-step-badges">
              <span class="rm-badge ${imp.cls}">${imp.star}${imp.label}</span>
              ${readyBadge}
              ${it.difficulty ? `<span class="rm-badge diff">${LEVEL_VI[it.difficulty] || it.difficulty}</span>` : ''}
            </div>
            <div class="rm-step-why">${escapeHtml(it.why)}</div>
            ${resLine}
          </div>
        </div>`;
    }).join('');
    stepsBlock = `<div class="rm-section"><h4>${stepsTitle}</h4>${cards}</div>`;
  } else if (personalized) {
    stepsBlock = `<div class="rm-section"><div class="rm-all-done">🎉 Không còn mục nào cần học — bạn đã hoàn thành hết!</div></div>`;
  }

  panel.innerHTML = accLine + progressBlock + headline + stepsBlock + milestonesBlock;
}

async function generate(kind) {
  const accId = document.getElementById('rm-account-sel').value;
  const selId = kind === 'role' ? 'rm-role-sel' : 'rm-area-sel';
  const v = document.getElementById(selId).value;
  if (!v) { alert(kind === 'role' ? 'Chọn JobRole trước.' : 'Chọn KnowledgeArea trước.'); return; }
  document.getElementById('rm-canvas').innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;font-size:16px">Đang tạo roadmap...</div>';
  document.getElementById('rm-panel').style.display = 'none';
  const qs = accId ? `?account_id=${encodeURIComponent(accId)}` : '';
  try {
    const r = await fetch(`/api/roadmap/by-${kind}/${encodeURIComponent(v)}${qs}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    renderRoadmap(await r.json());
  } catch (e) {
    document.getElementById('rm-canvas').innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444">Lỗi: ${e.message}</div>`;
  }
}

document.getElementById('rm-gen-role').addEventListener('click', () => generate('role'));
document.getElementById('rm-gen-area').addEventListener('click', () => generate('area'));

export { loadRoadmapSources };
