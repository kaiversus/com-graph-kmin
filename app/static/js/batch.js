// ===== Giỏ "Lô đề xuất" cho chuyên gia — gom nhiều thay đổi, gửi 1 lần =====
import { EXPERT_BATCH, onBatchChange, removeFromBatch, clearBatch, fmtErrors } from './core.js';

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderBatch() {
  const panel = document.getElementById('batch-panel');
  if (!panel) return;
  const n = EXPERT_BATCH.length;
  document.getElementById('batch-count').textContent = n;
  const list = document.getElementById('batch-list');
  list.innerHTML = n
    ? EXPERT_BATCH.map((op, i) =>
        `<div class="batch-op"><span>${i + 1}. ${esc(op.summary)}</span>`
        + `<button type="button" class="batch-rm" data-i="${i}" title="Bỏ">✕</button></div>`).join('')
    : '<div class="hint">Lô trống. Thêm thay đổi từ tab Guided Build hoặc Manage.</div>';
  list.querySelectorAll('.batch-rm').forEach(b => b.addEventListener('click', () => removeFromBatch(+b.dataset.i)));
  document.getElementById('batch-submit').disabled = n === 0;
}

async function submitBatch() {
  if (!EXPERT_BATCH.length) return;
  const noteEl = document.getElementById('batch-note');
  const note = noteEl.value.trim();
  if (!note && !confirm('Chưa nhập mô tả cho lô. Vẫn gửi?')) return;
  const btn = document.getElementById('batch-submit');
  btn.disabled = true; btn.textContent = 'Đang gửi…';
  const operations = EXPERT_BATCH.map(o => ({ kind: o.kind, data: o.data, summary: o.summary }));
  try {
    const r = await fetch('/api/change-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'batch', data: { operations }, note }),
    });
    const d = await r.json();
    if (!r.ok) { alert('Gửi lô thất bại:\n' + fmtErrors(d.detail || d)); return; }
    alert(`✓ Đã gửi lô ${operations.length} thao tác chờ admin duyệt.\nMã: ${d.id}\n\n`
      + 'Xem trạng thái & phản hồi ở tab "Đề xuất của tôi".');
    clearBatch();
    noteEl.value = '';
  } catch (e) {
    alert('Lỗi mạng: ' + e);
  } finally {
    btn.disabled = false; btn.textContent = '📤 Gửi lô duyệt';
  }
}

function initBatch() {
  onBatchChange(renderBatch);
  document.getElementById('batch-submit').addEventListener('click', submitBatch);
  document.getElementById('batch-clear').addEventListener('click', () => { if (confirm('Xoá cả lô?')) clearBatch(); });
  document.getElementById('batch-head').addEventListener('click', () =>
    document.getElementById('batch-panel').classList.toggle('collapsed'));
  renderBatch();
}

export { initBatch, renderBatch };
