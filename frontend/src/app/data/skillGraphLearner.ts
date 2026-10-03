// Learner-facing reading of the Skill Graph.
//
// The admin view speaks the schema (labels, relationship types, property
// names, ids). Students and visitors get the same graph in plain language:
// friendly names instead of REQUIRES/PREREQUISITE, "Essential" instead of
// weight 1.0, and shadow nodes (Content, Task, Quiz, Mentor) turned into things
// to go and learn from rather than nodes to inspect.

import {
  NODE_META, SOURCE_RECORDS, nodeName
} from './skillGraph';
import type { Graph, NodeLabel, RelType, GraphRel } from './skillGraph';

export const FRIENDLY_LABEL: Record<NodeLabel, string> = {
  JobRole: 'Job role',
  Skill: 'Skill',
  Knowledge: 'Knowledge',
  KnowledgeArea: 'Topic area',
  Account: 'Learner',
  Task: 'Project',
  Content: 'Lesson',
  Quiz: 'Quiz',
  Mentor: 'Mentor'
};

// name = filter/legend label, verb = "A <verb> B" in sentences and on edges
export const FRIENDLY_REL: Record<RelType, { name: string; verb: string }> = {
  REQUIRES: { name: 'Needs', verb: 'needs' },
  PREREQUISITE: { name: 'Learn before', verb: 'comes before' },
  IS_A: { name: 'Is a type of', verb: 'is a type of' },
  RELATED_TO: { name: 'Related to', verb: 'is related to' },
  PARENT_OF: { name: 'Contains', verb: 'contains' },
  HAS: { name: 'Includes', verb: 'includes' },
  HAS_SKILL: { name: 'Your progress', verb: 'has' },
  PRACTICES: { name: 'Practised by', verb: 'practises' },
  APPLIES: { name: 'Applied in', verb: 'applies' },
  COVERS: { name: 'Taught in', verb: 'teaches' },
  ASSESSES: { name: 'Tested by', verb: 'tests' },
  COACHES: { name: 'Coached by', verb: 'coaches on' }
};

// RELATED_TO.relation_type as a sentence fragment: "React is an alternative to Vue"
export const RELATION_PHRASE: Record<string, string> = {
  similar: 'is similar to',
  alternative: 'is an alternative to',
  complements: 'goes well with',
  uses: 'uses',
  related: 'is related to'
};

// REQUIRES / HAS / PRACTICES weight → how much it matters, in words
export function importance(weight: number | undefined): string {
  const w = weight ?? 1;
  if (w >= 0.9) return 'Essential';
  if (w >= 0.7) return 'Important';
  if (w >= 0.5) return 'Useful';
  return 'Nice to have';
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const kindLabel = (kind: unknown) => cap(String(kind ?? 'concept').replace(/-/g, ' '));
export const levelLabel = (level: unknown) => (level ? cap(String(level)) : '');

export const DEPTH_LABEL: Record<string, string> = { overview: 'Overview', applied: 'Hands-on', deep_dive: 'Deep dive' };

export const QUIZ_TAG_LABEL: Record<string, string> = {
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  true_false: 'True / false',
  fill_in_blank: 'Fill in the blank',
  matching: 'Matching',
  drag_drop: 'Drag & drop'
};

// HAS_SKILL.source → how the progress figure was measured
export const EVIDENCE_SOURCE_LABEL: Record<string, string> = {
  quiz: 'Quiz result',
  task: 'Project review',
  mentor: 'Mentor assessment',
  'self-report': 'Self-assessed'
};

export function confidenceLabel(c: number | undefined): string {
  if (c === undefined) return '';
  return c >= 0.8 ? 'High confidence' : c >= 0.6 ? 'Medium confidence' : 'Low confidence';
}

// practice_resource / learning_resource are JSON strings like {"url": "..."}
export function resourceUrl(json: unknown): string | null {
  if (typeof json !== 'string') return null;
  try {
    const url = JSON.parse(json)?.url;
    return typeof url === 'string' ? url : null;
  } catch {
    return null;
  }
}

export const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

// ─── Where to go and learn ────────────────────────────────────────────────────
// Shadow nodes become destinations. Each resolves its title from the source
// system record and links to the platform page that hosts that kind of item.

export type ResourceKind = 'lesson' | 'project' | 'quiz' | 'mentor';

export interface LearningResource {
  id: string;
  kind: ResourceKind;
  title: string;
  detail?: string;
  notes: string[];   // what it covers / why it's relevant, already in words
  to: string;        // in-app route
  core?: boolean;    // a project whose core skill this is
}

const ROUTE: Record<ResourceKind, string> = {
  lesson: '/courses',
  project: '/projects',
  quiz: '/assessment',
  mentor: '/mentors'
};

// For a Skill: resources pointing at the skill itself or at any Knowledge it
// REQUIRES. For a Knowledge: resources pointing at that Knowledge.
export function learningResourcesFor(g: Graph, id: string): Record<ResourceKind, LearningResource[]> {
  const node = g.byId.get(id)!;
  const knowledge = node.label === 'Skill'
    ? g.out.get(id)!.filter(r => r.type === 'REQUIRES' && g.byId.get(r.to)!.label === 'Knowledge').map(r => r.to)
    : node.label === 'Knowledge' ? [id] : [];
  const targets = new Set([id, ...knowledge]);

  // One resource can point at several targets (a quiz assessing the skill and
  // two of its concepts). Gather everything per resource first, then write a
  // single description, so nothing is repeated.
  interface Acc { rels: GraphRel[] }
  const collect = (kind: ResourceKind, types: RelType[], describe: (rels: GraphRel[]) => { notes: string[]; core?: boolean }) => {
    const byRes = new Map<string, Acc>();
    g.rels.filter(r => types.includes(r.type) && targets.has(r.to)).forEach(r => {
      const acc = byRes.get(r.from) ?? { rels: [] };
      acc.rels.push(r);
      byRes.set(r.from, acc);
    });
    return [...byRes.entries()].map(([resId, { rels }]): LearningResource => {
      const src = SOURCE_RECORDS[resId];
      const { notes, core } = describe(rels);
      return { id: resId, kind, title: src?.title ?? resId, detail: src?.detail, notes: notes.filter(Boolean), to: ROUTE[kind], core };
    }).sort((a, b) => Number(!!b.core) - Number(!!a.core));
  };

  const onSkill = node.label === 'Skill';
  const uniq = <T,>(xs: T[]) => [...new Set(xs)];
  // Parts of this skill a resource touches (on a Knowledge panel it's always the Knowledge itself)
  const parts = (rels: GraphRel[]) => uniq(rels.filter(r => r.to !== id).map(r => nodeName(g.byId.get(r.to)!)));
  const list = (xs: string[]) => xs.join(', ');

  return {
    lesson: collect('lesson', ['COVERS'], rels => ({
      notes: onSkill
        ? [list(rels.map(r => `${nodeName(g.byId.get(r.to)!)} (${(DEPTH_LABEL[String(r.props.depth)] ?? '').toLowerCase()})`))]
        : [DEPTH_LABEL[String(rels[0].props.depth)] ?? '']
    })),
    project: collect('project', ['PRACTICES', 'APPLIES'], rels => {
      const practise = rels.find(r => r.type === 'PRACTICES');
      const uses = rels.filter(r => r.type === 'APPLIES').map(r => nodeName(g.byId.get(r.to)!));
      return {
        core: !!practise?.props.is_core,
        notes: [
          practise ? (practise.props.is_core ? 'Core project for this skill' : 'Practises this skill') : '',
          onSkill && uses.length ? `uses ${list(uses)}` : ''
        ]
      };
    }),
    quiz: collect('quiz', ['ASSESSES'], rels => {
      const levels = uniq(rels.map(r => levelLabel(r.props.level)));
      const tags = uniq(rels.flatMap(r => (Array.isArray(r.props.quiz_tag) ? r.props.quiz_tag : [])).map(t => QUIZ_TAG_LABEL[t] ?? t));
      const covers = onSkill ? parts(rels) : [];
      return { notes: [levels.join(' / '), list(tags), covers.length ? `also on ${list(covers)}` : ''] };
    }),
    mentor: collect('mentor', ['COACHES'], rels => {
      const covers = onSkill ? parts(rels) : [];
      return { notes: [covers.length ? `also coaches ${list(covers)}` : ''] };
    })
  };
}

export const isShadowLabel = (l: NodeLabel) => NODE_META[l].group === 'shadow';
