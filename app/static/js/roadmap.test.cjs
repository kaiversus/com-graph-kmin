const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, 'roadmap.js'), 'utf8')
  .replace(/\nexport \{ loadRoadmapSources \};?\s*$/, '');

function view() {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { addEventListener() {} });
      return elements.get(id);
    },
    addEventListener() {},
    querySelector() { return null; }
  };
  const context = vm.createContext({
    document, window: { addEventListener() {} }, location: { search: '' },
    URLSearchParams, localStorage: { getItem() { return null; } },
    setTimeout, clearTimeout, console
  });
  vm.runInContext(source, context);
  return context;
}

test('a long skill branch starts compact and groups its prerequisites by knowledge area', () => {
  const context = view();
  const target = { id: 'skill_one', label: 'Skill One', type: 'Skill', importance: 'essential' };
  const prerequisites = [
    { id: 'prereq_a', label: 'Concept A', type: 'Knowledge', area_name: 'Data Structures' },
    { id: 'prereq_b', label: 'Concept B', type: 'Knowledge', area_name: 'Algorithms' },
    { id: 'prereq_c', label: 'Concept C', type: 'Knowledge', area_name: 'Data Structures' }
  ];
  context.fixture = { target, prerequisites };
  const html = vm.runInContext(`
    RM.data = { personalized: false, summary: {} };
    RM.byId = new Map([[fixture.target.id, fixture.target], ...fixture.prerequisites.map(n => [n.id, n])]);
    branchHtml({ target_id: fixture.target.id, prereq_ids: fixture.prerequisites.map(n => n.id), shared_ids: [], depends_on: [] });
  `, context);
  assert.match(html, /3 kiến thức cần trước/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /class="rm-branch-needs"[^>]* hidden/);
  assert.match(html, /Data Structures/);
  assert.match(html, /Algorithms/);
  assert.equal((html.match(/class="rm-area-group"/g) || []).length, 2);
  assert.equal((html.match(/data-node="prereq_/g) || []).length, 3);
});
