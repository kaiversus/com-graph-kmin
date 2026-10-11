import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminAtlas, atlasDegrees, atlasLayout, atlasRadius, areaOverview, areaScope, areaSummaryLinks, clusterLayout, knowledgeGroups, normalizeSearch } from './graphPresentation.ts';
import { fetchGraphForRole } from './api.ts';

function fixture() {
  const nodes = [['role', 'JobRole'], ['skill', 'Skill'], ['root', 'KnowledgeArea'], ['a', 'KnowledgeArea'], ['b', 'KnowledgeArea'], ['k1', 'Knowledge'], ['k2', 'Knowledge'], ['orphan', 'Knowledge']]
    .map(([id, label]) => ({ id, label, props: { name: id } }));
  const rels = [['role', 'skill', 'REQUIRES'], ['skill', 'k1', 'REQUIRES'], ['skill', 'k2', 'REQUIRES'], ['root', 'a', 'PARENT_OF'], ['a', 'k1', 'HAS'], ['b', 'k1', 'HAS'], ['b', 'k2', 'HAS']]
    .map(([from, to, type], i) => ({ id: `r${i}`, from, to, type, props: {} }));
  return { nodes, rels, role: nodes[0], byId: new Map(nodes.map(n => [n.id, n])),
    in: new Map(nodes.map(n => [n.id, rels.filter(r => r.to === n.id)])),
    out: new Map(nodes.map(n => [n.id, rels.filter(r => r.from === n.id)])) };
}

test('search supports Vietnamese accents and đ', () => {
  assert.equal(normalizeSearch('Đồ thị Kỹ Năng'), 'do thi ky nang');
});
test('grouping keeps every concept exactly once and preserves learning order', () => {
  assert.deepEqual([...knowledgeGroups(fixture(), ['k2', 'k1', 'orphan'])], [['b', ['k2']], ['a', ['k1']], ['', ['orphan']]]);
});
test('area scope includes descendants and requiring skills without unrelated knowledge', () => {
  const g = fixture();
  assert.deepEqual([...areaScope(g, 'root')].sort(), ['a', 'k1', 'role', 'root', 'skill']);
  g.out.get('a').push({ type: 'PARENT_OF', to: 'root' });
  assert.equal(areaScope(g, 'root').size, 5, 'cycles terminate');
});
test('summary edges count hidden concepts and never change source relationships', () => {
  const g = fixture();
  const before = JSON.stringify(g.rels);
  const edges = areaSummaryLinks(g, g.nodes.filter(n => n.label !== 'Knowledge'));
  assert.equal(edges.find(r => r.to === 'b').props.concept_count, 2);
  assert.equal(edges.find(r => r.to === 'a').props.derived, true);
  assert.equal(areaSummaryLinks(g, g.nodes).length, 0);
  assert.equal(JSON.stringify(g.rels), before);
});

test('admin atlas clusters only role-linked areas and scales node size with links', () => {
  const g = fixture();
  const atlas = adminAtlas(g);
  assert.deepEqual(atlas.nodes.map(n => n.id).sort(), ['a', 'b', 'role', 'skill']);
  assert.equal(atlas.rels.filter(r => r.props.derived).length, 2);
  const degrees = atlasDegrees(atlas.nodes, atlas.rels);
  assert.equal(degrees.get('b'), 2);
  assert.ok(atlasRadius('KnowledgeArea', degrees.get('b')) > atlasRadius('KnowledgeArea', 0));
  const positions = atlasLayout(g, atlas.nodes, atlas.rels);
  assert.equal(positions.size, atlas.nodes.length);
  assert.deepEqual(atlasLayout(g, [...atlas.nodes].reverse(), atlas.rels), positions);
});

test('admin atlas limits dense overviews but keeps a selected area reachable', () => {
  const g = fixture();
  const compact = adminAtlas(g, '', '', false, 1);
  assert.equal(compact.totalAreas, 2);
  assert.deepEqual([...compact.areaIds], ['b']);
  const selected = adminAtlas(g, '', 'a', false, 1);
  assert.ok(selected.areaIds.has('a'));
  assert.equal(adminAtlas(g, '', '', false, Infinity).areaIds.size, 2);
});

test('drilling into an area can reveal its real knowledge and relationships', () => {
  const g = fixture();
  const atlas = adminAtlas(g, 'a', '', true);
  assert.ok(atlas.nodes.some(n => n.id === 'k1'));
  assert.ok(!atlas.nodes.some(n => n.id === 'k2'));
  assert.ok(atlas.rels.some(r => r.type === 'HAS' && r.from === 'a' && r.to === 'k1'));
  assert.ok(atlas.rels.some(r => r.type === 'REQUIRES' && r.from === 'skill' && r.to === 'k1'));
});
test('layout handles empty, filtered, and dense graphs with stable finite positions', () => {
  const g = fixture();
  for (let i = 0; i < 1000; i++) g.nodes.push({ id: `extra${i}`, label: 'Knowledge', props: {} });
  assert.equal(clusterLayout(g, []).size, 0);
  const positions = clusterLayout(g, g.nodes);
  assert.equal(positions.size, g.nodes.length);
  for (const p of positions.values()) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  assert.deepEqual(clusterLayout(g, [...g.nodes].reverse()), positions);
  assert.equal(clusterLayout(g, [g.nodes[1]]).size, 1);
});

test('role API keeps knowledge areas and ancestors without leaking unrelated concepts', async t => {
  const g = fixture();
  const nodes = {};
  const relationships = {};
  for (const n of g.nodes) (nodes[n.label] ||= []).push({ id: n.id, ...n.props });
  for (const r of g.rels) (relationships[r.type] ||= []).push({ start_id: r.from, end_id: r.to, properties: r.props });
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ nodes, relationships }) }));
  const result = await fetchGraphForRole('role');
  assert.ok(result.byId.has('root'));
  assert.ok(result.byId.has('a'));
  assert.ok(result.byId.has('b'));
  assert.ok(!result.byId.has('orphan'));
  assert.equal(result.in.get('k1').filter(r => r.type === 'HAS').length, 2);
  assert.deepEqual(areaOverview(result).map(a => [a.id, a.concepts, a.skills]), [['b', 2, 1], ['a', 1, 1]]);
});

test('role id deep link selects the exact role and excludes other roles sharing skills', async t => {
  const g = fixture();
  g.nodes[0].id = 'role_cpp_software_engineer';
  g.nodes[0].props.name = 'C++ Software Engineer';
  g.rels[0].from = g.nodes[0].id;
  g.nodes.push({ id: 'other', label: 'JobRole', props: { name: 'Other role' } });
  g.rels.push({ id: 'shared', from: 'other', to: 'skill', type: 'REQUIRES', props: {} });
  const nodes = {};
  const relationships = {};
  for (const n of g.nodes) (nodes[n.label] ||= []).push({ id: n.id, ...n.props });
  for (const r of g.rels) (relationships[r.type] ||= []).push({ start_id: r.from, end_id: r.to, properties: r.props });
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ nodes, relationships }) }));
  const selected = await fetchGraphForRole('role_cpp_software_engineer');
  assert.equal(selected.role.id, 'role_cpp_software_engineer');
  assert.equal(selected.nodes.filter(n => n.label === 'JobRole').length, 1);
  assert.equal(selected.nodes.some(n => n.id === 'other'), false);
});
