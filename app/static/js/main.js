// ===== Entry point — noi wiring tat ca cac tab =====
//
// index.html chi nap dung file nay (type="module"). Import cua no keo theo
// cac module tab, moi module tu dang ky listener cua rieng no luc load.
import { setSchema } from './core.js';
import { populateOpt1Labels } from './option1.js';
import { populateOpt2Targets } from './option2.js';
import { refreshAudit } from './audit.js';
import { renderViz, loadQuickQueryOptions } from './viz.js';
import { loadRoadmapSources } from './roadmap.js';
import { loadExportStats } from './export.js';
import { rbInit } from './build.js';
import { populateManageLabels } from './manage.js';
import { initAuth, applyRole, onReviewTab, loadMyRequests } from './review.js';
import { initBatch } from './batch.js';

// ---- Tabs ----
let graphReturnTab = 'viz';
let graphCanGoBack = false;
const tabButton = id => document.querySelector(`.tab[data-tab="${id}"]`);

function activateTab(btn, recordHistory = true) {
  if (!btn || !document.getElementById(btn.dataset.tab)) return;
  const current = document.querySelector('.tab.active')?.dataset.tab;
  if (current === btn.dataset.tab) return;
  if (btn.dataset.tab === 'react-viz' && current) {
    graphReturnTab = current;
    graphCanGoBack = recordHistory;
  }
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
  if (recordHistory) {
    const url = new URL(location.href);
    url.hash = btn.dataset.tab;
    history.pushState({ tab: btn.dataset.tab }, '', url);
  }
  if (btn.dataset.tab === 'react-viz') {
    const back = document.getElementById('react-viz-back');
    const label = tabButton(graphReturnTab)?.textContent?.trim() || 'Visualizer';
    back.textContent = `← Quay lại ${label}`;
  }
  if (btn.dataset.tab === 'audit') refreshAudit();
  if (btn.dataset.tab === 'viz') renderViz();
  if (btn.dataset.tab === 'roadmap') loadRoadmapSources();
  if (btn.dataset.tab === 'build') rbInit();
  if (btn.dataset.tab === 'review') onReviewTab();
  if (btn.dataset.tab === 'myreq') loadMyRequests();
  if (btn.dataset.tab === 'export') loadExportStats();
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn));
});
document.getElementById('react-viz-back').addEventListener('click', () => {
  if (graphCanGoBack) history.back();
  else activateTab(tabButton('viz'));
});
window.addEventListener('popstate', event => {
  const id = event.state?.tab || location.hash.slice(1) || 'opt1';
  activateTab(tabButton(id) || tabButton('opt1'), false);
});

// Nạp dữ liệu app — chỉ chạy SAU khi đã đăng nhập (các API này cần phiên).
async function loadAppData() {
  const r = await fetch('/api/schema');
  setSchema(await r.json());
  populateOpt1Labels();
  populateOpt2Targets();
  populateManageLabels();
  loadQuickQueryOptions();
  applyRole();
}

// ---- Bootstrap: health check (mở) → auth gate → nạp app ----
async function bootstrap() {
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

  initBatch();
  document.getElementById('myreq-refresh').addEventListener('click', loadMyRequests);
  // initAuth: nếu đã đăng nhập → loadAppData(); nếu chưa → hiện màn đăng nhập.
  await initAuth(loadAppData);
  const requestedTab = tabButton(location.hash.slice(1));
  if (requestedTab) activateTab(requestedTab, false);
}

bootstrap();
