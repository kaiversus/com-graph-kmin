// ===== Audit log & Restore =====
import { showResult } from './core.js';

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

export { refreshAudit };
