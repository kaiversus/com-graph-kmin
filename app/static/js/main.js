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
    if (btn.dataset.tab === 'build') rbInit();
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
  setSchema(await r.json());
  populateOpt1Labels();
  populateOpt2Targets();
  loadQuickQueryOptions();
}

bootstrap();
