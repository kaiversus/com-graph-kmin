// ===== Option 2 — CSV bulk (auto-detect, multi-file) =====
import { SCHEMA, showResult } from './core.js';

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
  const hasNodes = opt2Batch.some(x => x.kind === 'node');
  const hasRels = opt2Batch.some(x => x.kind === 'rel');
  // Cảnh báo nếu chỉ có node mà không có rel: Knowledge sẽ fail ràng buộc tồn tại
  if (hasNodes && !hasRels &&
      !confirm('Chỉ có file NODE, không có file quan hệ.\n' +
               'Nếu có node Knowledge, commit sẽ BỊ CHẶN (Knowledge phải được REQUIRES cùng mẻ).\n' +
               'Vẫn tiếp tục?')) return;
  if (!confirm(`Commit ${opt2Batch.length} file trong MỘT transaction (all-or-nothing)?`)) return;

  const fd = new FormData();
  fd.append('staging_ids', opt2Batch.map(x => x.staging_id).join(','));
  fd.append('actor', 'admin');
  let data, ok;
  try {
    const r = await fetch('/api/option2/commit-batch', { method: 'POST', body: fd });
    data = await r.json();
    ok = r.ok;
  } catch (e) {
    showResult('opt2-result', `Lỗi mạng: ${e}`, 'err');
    return;
  }

  if (ok) {
    showResult('opt2-result',
      `✓ Commit ${data.files} file trong 1 transaction.\n` +
      `nodes=${data.nodes_written} · rels=${data.relationships_written}\n` +
      `audit_id: ${data.audit_id}  (Restore được ở tab Audit)`,
      'ok');
    document.getElementById('opt2-commit').disabled = true;
    opt2Batch = [];
  } else {
    const det = data.detail || data;
    const msg = det.error || (det.errors ? det.errors.map(e => `[row ${e.row}] ${e.field}: ${e.message}`).join('\n') : JSON.stringify(det));
    showResult('opt2-result',
      `✗ Commit thất bại — rollback toàn bộ, staging giữ nguyên để sửa & thử lại:\n${msg}`,
      'err');
  }
});

export { populateOpt2Targets };
