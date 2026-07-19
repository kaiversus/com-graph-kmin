// ===== Option 1 — nhap tung entity =====
import { SCHEMA, showResult, makeInput, collectProps } from './core.js';

let opt1RelCounter = 0;

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

export { populateOpt1Labels };
