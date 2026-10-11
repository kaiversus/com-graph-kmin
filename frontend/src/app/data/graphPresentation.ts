import type { Graph, GraphNode, GraphRel } from './skillGraph';

export const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

export function areaOverview(g: Graph) {
  return g.nodes.filter(n => n.label === 'KnowledgeArea').map(area => {
    const concepts = [...new Set((g.out.get(area.id) || [])
      .filter(r => r.type === 'HAS' && g.byId.get(r.to)?.label === 'Knowledge').map(r => r.to))];
    const skills = new Set<string>();
    concepts.forEach(id => (g.in.get(id) || []).forEach(r => {
      if (r.type === 'REQUIRES' && g.byId.get(r.from)?.label === 'Skill') skills.add(r.from);
    }));
    return {
      id: area.id, name: String(area.props.name || area.id), concepts: concepts.length,
      skills: skills.size,
      skillNames: [...skills].map(id => String(g.byId.get(id)?.props.name || id)).sort().slice(0, 3)
    };
  }).filter(a => a.concepts > 0).sort((a, b) => b.concepts - a.concepts || a.name.localeCompare(b.name));
}

// A deterministic primary area prevents duplicating concepts with several memberships.
export function knowledgeGroups(g: Graph, ids: string[]) {
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const area = (g.in.get(id) || []).filter(r => r.type === 'HAS' && g.byId.get(r.from)?.label === 'KnowledgeArea')
      .map(r => r.from).sort()[0] || '';
    groups.set(area, [...(groups.get(area) || []), id]);
  }
  return groups;
}

export function areaScope(g: Graph, area: string): Set<string> {
  const ids = new Set([area]);
  const queue = [area];
  for (let i = 0; i < queue.length; i++) {
    for (const r of g.out.get(queue[i]) || []) {
      if ((r.type === 'HAS' || r.type === 'PARENT_OF') && !ids.has(r.to)) {
        ids.add(r.to);
        queue.push(r.to);
      }
    }
  }
  // Include the skills/roles requiring these concepts without pulling in unrelated concepts.
  for (let i = 0; i < queue.length; i++) {
    for (const r of g.in.get(queue[i]) || []) {
      if (r.type === 'REQUIRES' && !ids.has(r.from)) {
        ids.add(r.from);
        queue.push(r.from);
      }
    }
  }
  return ids;
}

export function clusterLayout(g: Graph, nodes: GraphNode[]) {
  const pos = new Map<string, { x: number; y: number }>();
  const visible = new Set(nodes.map(n => n.id));
  const groups = new Map<string, GraphNode[]>();
  for (const n of [...nodes].sort((a, b) => a.id.localeCompare(b.id))) {
    let area = (g.in.get(n.id) || []).filter(r => r.type === 'HAS' && g.byId.get(r.from)?.label === 'KnowledgeArea')
      .map(r => r.from).sort()[0];
    if (!area && n.label === 'Skill') {
      const weights = new Map<string, number>();
      for (const r of g.out.get(n.id) || []) {
        if (r.type !== 'REQUIRES' || g.byId.get(r.to)?.label !== 'Knowledge') continue;
        for (const membership of g.in.get(r.to) || []) {
          if (membership.type === 'HAS' && g.byId.get(membership.from)?.label === 'KnowledgeArea')
            weights.set(membership.from, (weights.get(membership.from) || 0) + 1);
        }
      }
      area = [...weights].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
    }
    const key = n.label === 'KnowledgeArea' ? n.id : area || n.label;
    groups.set(key, [...(groups.get(key) || []), n]);
  }
  const clusters = [...groups].map(([key, members]) => ({ key, members, radius: Math.max(140, Math.sqrt(members.length) * 120) }));
  // Chord distance keeps neighboring cluster discs apart, including the two-cluster case.
  const ring = clusters.length > 1 ? (Math.max(...clusters.map(c => c.radius)) + 100) / Math.sin(Math.PI / clusters.length) : 0;
  let angle = -Math.PI / 2;
  clusters.forEach(({ key, members, radius }) => {
    const span = 2 * Math.PI / Math.max(1, clusters.length);
    const center = { x: Math.cos(angle + span / 2) * ring, y: Math.sin(angle + span / 2) * ring };
    angle += span;
    const children = members.filter(n => n.id !== key);
    if (visible.has(key)) pos.set(key, center);
    children.forEach((n, i) => {
      // Sunflower distribution fills a disc instead of creating another long row.
      const a = i * Math.PI * (3 - Math.sqrt(5));
      const r = 85 + (radius - 85) * Math.sqrt((i + 1) / children.length);
      pos.set(n.id, { x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r });
    });
  });
  return pos;
}

// Explicitly marked derived links preserve meaning when individual concepts are hidden.
export function areaSummaryLinks(g: Graph, nodes: GraphNode[]): GraphRel[] {
  const visible = new Set(nodes.map(n => n.id));
  const summaries = new Map<string, GraphRel>();
  for (const skill of nodes.filter(n => n.label === 'Skill')) {
    for (const r of g.out.get(skill.id) || []) {
      if (r.type !== 'REQUIRES' || visible.has(r.to) || g.byId.get(r.to)?.label !== 'Knowledge') continue;
      for (const membership of g.in.get(r.to) || []) {
        if (membership.type !== 'HAS' || !visible.has(membership.from) || g.byId.get(membership.from)?.label !== 'KnowledgeArea') continue;
        const id = `summary:${JSON.stringify([skill.id, membership.from])}`;
        const existing = summaries.get(id);
        if (existing) existing.props.concept_count = Number(existing.props.concept_count) + 1;
        else summaries.set(id, { id, from: skill.id, to: membership.from, type: 'REQUIRES', props: { derived: true, concept_count: 1 } });
      }
    }
  }
  return [...summaries.values()];
}

// The admin overview is a projection of real relationships. It never invents
// nodes and marks condensed Skill -> KnowledgeArea links as derived summaries.
export function adminAtlas(g: Graph, areaId = '', focusId = '', includeKnowledge = false, maxAreas = 18) {
  const inArea = areaId ? areaScope(g, areaId) : null;
  const roleId = g.role?.label === 'JobRole' ? g.role.id : '';
  const skills = g.nodes.filter(n => n.label === 'Skill' && (!inArea || inArea.has(n.id)) &&
    (!roleId || (g.in.get(n.id) || []).some(r => r.type === 'REQUIRES' && r.from === roleId)));
  const skillIds = new Set(skills.map(n => n.id));
  const knowledgeIds = new Set<string>();
  for (const skill of skills) for (const r of g.out.get(skill.id) || [])
    if (r.type === 'REQUIRES' && g.byId.get(r.to)?.label === 'Knowledge') knowledgeIds.add(r.to);
  const areaIds = new Set<string>();
  for (const id of knowledgeIds) for (const r of g.in.get(id) || [])
    if (r.type === 'HAS' && g.byId.get(r.from)?.label === 'KnowledgeArea' && (!inArea || inArea.has(r.from))) areaIds.add(r.from);
  if (areaId && g.byId.has(areaId)) areaIds.add(areaId);
  const totalAreas = areaIds.size;
  if (!areaId && areaIds.size > maxAreas) {
    const weights = new Map([...areaIds].map(id => [id, 0]));
    for (const id of knowledgeIds) for (const r of g.in.get(id) || [])
      if (r.type === 'HAS' && weights.has(r.from)) weights.set(r.from, weights.get(r.from)! + 1);
    const ranked = [...areaIds].sort((a, b) => weights.get(b)! - weights.get(a)! || a.localeCompare(b));
    const shown = new Set(ranked.slice(0, maxAreas));
    if (focusId && areaIds.has(focusId)) shown.add(focusId);
    areaIds.clear();
    shown.forEach(id => areaIds.add(id));
  }
  const nodes = [
    ...(roleId ? [g.byId.get(roleId)!] : []),
    ...skills,
    ...[...areaIds].sort().map(id => g.byId.get(id)!),
    ...(includeKnowledge && areaId ? [...knowledgeIds].filter(id => inArea?.has(id)).sort().map(id => g.byId.get(id)!) : [])
  ];
  if (focusId && g.byId.get(focusId)?.label === 'Knowledge' && !nodes.some(n => n.id === focusId)) {
    nodes.push(g.byId.get(focusId)!);
  }
  const ids = new Set(nodes.map(n => n.id));
  const rels = g.rels.filter(r => ids.has(r.from) && ids.has(r.to) &&
    ((r.type === 'REQUIRES' && (r.from === roleId || g.byId.get(r.to)?.label === 'Knowledge')) ||
      (r.type === 'HAS' && g.byId.get(r.to)?.label === 'Knowledge') || r.type === 'PARENT_OF'));
  rels.push(...areaSummaryLinks(g, nodes));
  return { nodes, rels, skillIds, areaIds, totalAreas };
}

export function atlasDegrees(nodes: GraphNode[], rels: GraphRel[]) {
  const degrees = new Map(nodes.map(n => [n.id, 0]));
  for (const r of rels) {
    const weight = r.props.derived ? Math.max(1, Number(r.props.concept_count) || 1) : 1;
    if (degrees.has(r.from)) degrees.set(r.from, degrees.get(r.from)! + weight);
    if (degrees.has(r.to)) degrees.set(r.to, degrees.get(r.to)! + weight);
  }
  return degrees;
}

export function atlasRadius(label: GraphNode['label'], degree: number) {
  const base = label === 'JobRole' ? 17 : label === 'KnowledgeArea' ? 11 : label === 'Skill' ? 8 : 6;
  return Math.min(43, base + Math.sqrt(Math.max(0, degree)) * 2.2);
}

// Golden-angle packing puts area hubs across a disc; skills orbit their
// strongest area. This is deterministic, so filtering never causes jitter.
export function atlasLayout(g: Graph, nodes: GraphNode[], rels: GraphRel[]) {
  const positions = new Map<string, { x: number; y: number }>();
  const areaIds = nodes.filter(n => n.label === 'KnowledgeArea').map(n => n.id).sort();
  const golden = Math.PI * (3 - Math.sqrt(5));
  const spacing = Math.max(175, Math.min(265, 165 + areaIds.length * 2));
  areaIds.forEach((id, i) => {
    const angle = i * golden;
    const radius = i === 0 ? 0 : spacing * Math.sqrt(i);
    positions.set(id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  });
  const role = nodes.find(n => n.label === 'JobRole');
  if (role) positions.set(role.id, { x: 0, y: -spacing * (Math.sqrt(areaIds.length) + 0.7) });
  const areaOfSkill = new Map<string, { area: string; weight: number }>();
  for (const r of rels.filter(r => r.props.derived)) {
    const weight = Number(r.props.concept_count) || 1;
    const previous = areaOfSkill.get(r.from);
    if (!previous || weight > previous.weight || (weight === previous.weight && r.to < previous.area))
      areaOfSkill.set(r.from, { area: r.to, weight });
  }
  const members = new Map<string, string[]>();
  for (const n of nodes.filter(n => n.label === 'Skill').sort((a, b) => a.id.localeCompare(b.id))) {
    const area = areaOfSkill.get(n.id)?.area || '';
    members.set(area, [...(members.get(area) || []), n.id]);
  }
  for (const [area, skillIds] of members) {
    const center = positions.get(area) || { x: 0, y: spacing };
    skillIds.forEach((id, i) => {
      const angle = i * golden;
      const radius = 88 + Math.sqrt(i) * 58;
      positions.set(id, { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
    });
  }
  const conceptIndex = new Map<string, number>();
  nodes.filter(n => n.label === 'Knowledge').sort((a, b) => a.id.localeCompare(b.id)).forEach(n => {
    const area = rels.find(r => r.type === 'HAS' && r.to === n.id)?.from;
    const center = area ? positions.get(area) : undefined;
    const group = area || '';
    const i = conceptIndex.get(group) || 0;
    conceptIndex.set(group, i + 1);
    const angle = i * golden;
    const radius = 65 + Math.sqrt(i) * 34;
    positions.set(n.id, { x: (center?.x || 0) + Math.cos(angle) * radius, y: (center?.y || 0) + Math.sin(angle) * radius });
  });
  return positions;
}
