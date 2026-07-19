// ===== Export Data — JSON / CSV / Cypher =====

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

export { loadExportStats };
