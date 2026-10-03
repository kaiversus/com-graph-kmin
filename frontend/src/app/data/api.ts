import { GraphNode, GraphRel, NodeLabel, RelType, Graph } from './skillGraph';

export async function fetchFullGraph(): Promise<{
  nodes: Record<string, any[]>;
  relationships: Record<string, any[]>;
}> {
  const res = await fetch('/api/export/full');
  if (!res.ok) throw new Error('Failed to fetch full graph from API');
  return res.json();
}

export async function fetchGraphForRole(roleName: string): Promise<Graph> {
  const data = await fetchFullGraph();
  
  // Create nodes array and rels array
  const allNodes: GraphNode[] = [];
  const allRels: GraphRel[] = [];
  
  // In Kmin, primary keys vary by label, let's normalize them to "id"
  const getPk = (label: string, props: any) => props.id || props.id_account || props.id_content || props.id_task || props.id_quiz || props.id_mentor || props.name;

  Object.entries(data.nodes).forEach(([label, nodes]) => {
    nodes.forEach(n => {
      allNodes.push({
        id: getPk(label, n),
        label: label as NodeLabel,
        props: n
      });
    });
  });

  let relIdCounter = 1;
  Object.entries(data.relationships).forEach(([type, rels]) => {
    rels.forEach(r => {
      allRels.push({
        id: `rel_${relIdCounter++}`,
        type: type as RelType,
        from: r.start_id,
        to: r.end_id,
        props: r.properties || {}
      });
    });
  });

  // Find the requested JobRole or fallback to KnowledgeArea
  let roleNode = allNodes.find(n => n.label === 'JobRole' && (n.props.name === roleName || roleName === 'All'));
  if (!roleNode && roleName !== 'All') {
    const shortName = roleName.replace(' Developer', '').replace(' Engineer', '');
    roleNode = allNodes.find(n => n.label === 'KnowledgeArea' && String(n.props.name || '').includes(shortName));
  }
  
  let filteredNodes = allNodes;
  let filteredRels = allRels;

  if (roleNode && roleName !== 'All') {
    const visitedNodes = new Set<string>();
    visitedNodes.add(roleNode.id);
    
    // 1. Collect all KnowledgeAreas in the subtree
    let queue = [roleNode.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      allRels.forEach(r => {
        if (r.from === current && r.type === 'PARENT_OF' && !visitedNodes.has(r.to)) {
          visitedNodes.add(r.to);
          queue.push(r.to);
        }
      });
    }

    // 2. Collect all Skills and Knowledge that are HAS by these areas, or REQUIRES by JobRole
    const areasAndRoles = Array.from(visitedNodes);
    areasAndRoles.forEach(id => {
      allRels.forEach(r => {
        if (r.from === id && (r.type === 'HAS' || r.type === 'REQUIRES')) {
          visitedNodes.add(r.to);
        }
      });
    });

    // 3. Collect any Knowledge that is REQUIRES by these Skills
    const skills = Array.from(visitedNodes).filter(id => allNodes.find(n => n.id === id)?.label === 'Skill');
    skills.forEach(id => {
      allRels.forEach(r => {
        if (r.from === id && r.type === 'REQUIRES') {
          visitedNodes.add(r.to);
        }
      });
    });

    // 4. Include any JobRole that REQUIRES these Skills (to ensure JobRole is visible if we started from Area)
    skills.forEach(id => {
      allRels.forEach(r => {
        if (r.to === id && r.type === 'REQUIRES' && allNodes.find(n => n.id === r.from)?.label === 'JobRole') {
          visitedNodes.add(r.from);
        }
      });
    });
    
    filteredNodes = allNodes.filter(n => visitedNodes.has(n.id));
    filteredRels = allRels.filter(r => visitedNodes.has(r.from) && visitedNodes.has(r.to));
  }
  
  const byId = new Map<string, GraphNode>();
  filteredNodes.forEach(n => byId.set(n.id, n));
  
  const outMap = new Map<string, GraphRel[]>();
  const inMap = new Map<string, GraphRel[]>();
  filteredNodes.forEach(n => {
    outMap.set(n.id, []);
    inMap.set(n.id, []);
  });
  
  filteredRels.forEach(r => {
    if (outMap.has(r.from)) outMap.get(r.from)!.push(r);
    if (inMap.has(r.to)) inMap.get(r.to)!.push(r);
  });
  
  const allDomains = Array.from(new Set(allNodes
    .filter(n => n.label === 'JobRole' || (n.label === 'KnowledgeArea' && !allRels.some(r => r.type === 'PARENT_OF' && r.to === n.id)))
    .map(n => n.props.name as string)
    .filter(Boolean)
  )).sort();

  return {
    role: roleNode || filteredNodes.find(n => n.label === 'JobRole') || filteredNodes[0],
    nodes: filteredNodes,
    rels: filteredRels,
    byId,
    out: outMap,
    in: inMap,
    domains: allDomains
  };
}
