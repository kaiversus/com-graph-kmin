import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';

import {
  Target, Award, Users, FileText, Lightbulb, ChevronRight, ZoomIn, ZoomOut, Maximize2,
  Star, Play, Briefcase, Map as MapIcon, BarChart3, Search, Layers, X, Network, Shield,
  Calendar, Zap, Folder, User, Hammer, ListChecks, GraduationCap,
  CheckCircle, AlertTriangle, Database, Tag, ArrowRight, ArrowLeft, Palette, Lock, UserPlus,
  Check, RotateCcw, Circle, ChevronDown, ExternalLink, BookOpen, Compass
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BRAND_HEX, BRAND_INK_CLS, BRAND_BAR_CLS, MUTED_TINT_CLS } from './courseStyle';
import {
  buildGraph, validateGraph, nodeName, hasSkillOf, skillState, blockingSkills, requiredKnowledge, proficiencyBand, topoOrder,
  knowledgeStatus, KNOWLEDGE_STATUS_META,
  NODE_META, NODE_LABELS, REL_META, REL_TYPES, REL_GROUPS, SKILL_STATE_META, SKILL_STATES,
  SOURCE_RECORDS, DOMAINS, ME, UNLOCK_AT
} from '../data/skillGraph';
import type {
  Domain, Graph, GraphNode, GraphRel, NodeLabel, RelType, PropValue, Props, SkillState, KnowledgeStatus
} from '../data/skillGraph';
import {
  FRIENDLY_LABEL, FRIENDLY_REL, RELATION_PHRASE, EVIDENCE_SOURCE_LABEL, importance, kindLabel, levelLabel,
  confidenceLabel, resourceUrl, hostOf, learningResourcesFor
} from '../data/skillGraphLearner';
import type { LearningResource, ResourceKind } from '../data/skillGraphLearner';

// ─── Types & constants ────────────────────────────────────────────────────────

type ViewMode = 'graph' | 'schema' | 'roadmap' | 'evidence' | 'skill-gap';
type ColorMode = 'label' | 'proficiency';
interface Pt { x: number; y: number }

// ─── Audience ─────────────────────────────────────────────────────────────────
// One explorer, three pages. Two switches decide what each audience sees:
//   system   — the schema itself: shadow nodes (Account/Task/Content/Quiz/
//              Mentor) and their edges, raw properties, ids, relationship
//              type names, the Schema view and validation.
//   personal — the learner's own evaluation: HAS_SKILL proficiency, skill and
//              Knowledge status, Evidence, Skill Gap, readiness cards.

export type Audience = 'admin' | 'student' | 'public';

interface AudienceConfig {
  title: string;
  subtitle: string;
  views: ViewMode[];
  system: boolean;
  personal: boolean;
  previewNewLearner: boolean;
}

const AUDIENCES: Record<Audience, AudienceConfig> = {
  admin: {
    title: 'Skill Graph · Admin',
    subtitle: 'The full graph — every node label, relationship, property and schema check',
    views: ['graph', 'schema', 'roadmap', 'evidence', 'skill-gap'],
    system: true,
    personal: true,
    previewNewLearner: true
  },
  student: {
    title: 'Skill Graph',
    subtitle: 'Your skills, what they are made of, and what to learn next',
    views: ['graph', 'roadmap', 'evidence', 'skill-gap'],
    system: false,
    personal: true,
    previewNewLearner: false
  },
  public: {
    title: 'Skill Explorer',
    subtitle: 'What each role needs — the skills, the knowledge behind them, and how they connect',
    views: ['graph', 'roadmap'],
    system: false,
    personal: false,
    previewNewLearner: false
  }
};

const AudienceCtx = createContext<AudienceConfig>(AUDIENCES.admin);
const useAudience = () => useContext(AudienceCtx);

// Relationship types a non-system audience can see: the knowledge structure,
// not the shadow → graph edges.
const LEARNER_RELS: RelType[] = ['REQUIRES', 'PREREQUISITE', 'IS_A', 'RELATED_TO', 'PARENT_OF', 'HAS'];

const LABEL_ICON: Record<NodeLabel, LucideIcon> = {
  JobRole: Briefcase,
  Skill: Zap,
  Knowledge: Lightbulb,
  KnowledgeArea: Folder,
  Account: User,
  Task: Hammer,
  Content: FileText,
  Quiz: ListChecks,
  Mentor: GraduationCap
};

// Graph-owned nodes are circles sized by their place in the hierarchy; shadow
// nodes are dashed pills (they only carry an id).
const NODE_R: Record<NodeLabel, number> = {
  JobRole: 24, Skill: 18, Knowledge: 9, KnowledgeArea: 13,
  Account: 0, Task: 0, Content: 0, Quiz: 0, Mentor: 0
};
const PILL = { hw: 17, hh: 11 };
const NEUTRAL = '#94a3b8';

const isShadow = (l: NodeLabel) => NODE_META[l].group === 'shadow';
const pct = (v: number) => `${Math.round(v * 100)}%`;

// Translucent version of any color — hex or a theme var(--…)
const tint = (color: string, amount: number) => `color-mix(in oklab, ${color} ${amount}%, transparent)`;

function formatValue(v: PropValue): string {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '');
  return String(v);
}

function cypherProps(props: Props): string {
  const entries = Object.entries(props);
  if (!entries.length) return '';
  return ` {${entries.map(([k, v]) =>
    `${k}: ${Array.isArray(v) ? `[${v.map(x => `"${x}"`).join(', ')}]` : typeof v === 'string' ? `"${v}"` : v}`
  ).join(', ')}}`;
}

// ─── Derived learner analysis ─────────────────────────────────────────────────

interface SkillRow {
  node: GraphNode;
  weight: number;
  prof: number | null;
  state: SkillState;
  priority: number;
}

function analyze(g: Graph) {
  const rows: SkillRow[] = g.out.get(g.role.id)!
    .filter(r => r.type === 'REQUIRES')
    .map(r => {
      const hs = hasSkillOf(g, r.to);
      const prof = hs ? (hs.props.proficiency as number) : null;
      const weight = (r.props.weight as number) ?? 1;
      return { node: g.byId.get(r.to)!, weight, prof, state: skillState(g, r.to), priority: weight * (1 - (prof ?? 0)) };
    });
  const totalW = rows.reduce((s, r) => s + r.weight, 0);
  const readiness = totalW ? rows.reduce((s, r) => s + r.weight * (r.prof ?? 0), 0) / totalW : 0;
  const owned = g.rels.filter(r => r.type === 'HAS_SKILL' && r.from === ME);
  const strengths = [...owned].sort((a, b) => (b.props.proficiency as number) - (a.props.proficiency as number)).slice(0, 3);
  // Only what the learner can act on now; locked skills wait for their
  // prerequisites. Ties go to the skill that unlocks the most locked ones.
  const unlocks = (id: string) => rows.filter(r => r.state === 'locked' && blockingSkills(g, r.node.id).includes(id)).length;
  const focus = [...rows].filter(r => r.state !== 'locked' && r.priority > 0.05)
    .sort((a, b) => b.priority - a.priority || unlocks(b.node.id) - unlocks(a.node.id));
  const missing = rows.filter(r => r.state === 'missing');
  const locked = rows.filter(r => r.state === 'locked');
  const weak = rows.filter(r => r.state === 'foundational' || r.state === 'beginner');
  return { rows, readiness, owned, strengths, focus, missing, locked, weak };
}

// Resources the graph links to a skill: contents covering its knowledge, tasks
// practicing it, quizzes and mentors pointing at it or its knowledge.
function resourcesFor(g: Graph, id: string) {
  const node = g.byId.get(id)!;
  const knowledge = node.label === 'Skill'
    ? g.out.get(id)!.filter(r => r.type === 'REQUIRES' && g.byId.get(r.to)!.label === 'Knowledge').map(r => r.to)
    : [id];
  const targets = new Set([id, ...knowledge]);
  const from = (type: RelType) => [...new Set(g.rels.filter(r => r.type === type && targets.has(r.to)).map(r => r.from))];
  return {
    contents: from('COVERS'),
    tasks: [...new Set([...from('PRACTICES'), ...from('APPLIES')])],
    quizzes: from('ASSESSES'),
    mentors: from('COACHES')
  };
}

// ─── Layout ───────────────────────────────────────────────────────────────────
// Columns left→right: JobRole · Skill · Knowledge · leaf KnowledgeArea · parent
// areas. Knowledge is grouped by its leaf area, everything else sits at the
// barycenter of what it connects to. Shadow nodes live in a band above (Account,
// Task, Content) or below (Quiz, Mentor) the columns.

const ROW = { role: 0, skill: 220, knowledge: 470, area: 700, areaStep: 130 };

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function spread(items: { id: string; want: number }[], gap: number): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.want - b.want);
  const out: number[] = [];
  sorted.forEach((it, i) => out.push(i === 0 ? it.want : Math.max(it.want, out[i - 1] + gap)));
  const shift = sorted.length ? mean(sorted.map(s => s.want)) - mean(out) : 0;
  return new Map(sorted.map((s, i) => [s.id, out[i] + shift]));
}

function layoutGraph(g: Graph): Map<string, Pt> {
  const pos = new Map<string, Pt>();
  const of = (l: NodeLabel) => g.nodes.filter(n => n.label === l);
  const outTo = (id: string, types: RelType[], label?: NodeLabel) =>
    g.out.get(id)!.filter(r => types.includes(r.type) && (!label || g.byId.get(r.to)!.label === label)).map(r => r.to);

  // Area tree: leaves in depth-first order, heights for the parent rows
  const children = (id: string) => g.out.get(id)!.filter(r => r.type === 'PARENT_OF')
    .sort((a, b) => (a.props.order as number) - (b.props.order as number)).map(r => r.to);
  const height = new Map<string, number>();
  const leaves: string[] = [];
  const walk = (id: string): number => {
    const ch = children(id);
    const h = ch.length ? 1 + Math.max(...ch.map(walk)) : 0;
    if (!ch.length) leaves.push(id);
    height.set(id, h);
    return h;
  };
  of('KnowledgeArea').filter(a => !g.in.get(a.id)!.some(r => r.type === 'PARENT_OF')).forEach(a => walk(a.id));

  // Knowledge row
  let x = 0;
  leaves.forEach((aid, i) => {
    const ks = outTo(aid, ['HAS']).filter(k => !pos.has(k));
    if (i > 0 && ks.length) x += 24;
    ks.forEach(k => { pos.set(k, { x, y: ROW.knowledge }); x += 60; });
  });
  of('Knowledge').filter(k => !pos.has(k.id)).forEach(k => { pos.set(k.id, { x, y: ROW.knowledge }); x += 60; });

  // Skill row: barycenter of required knowledge, else of related skills
  const skills = of('Skill');
  const want = new Map<string, number>();
  skills.forEach(s => {
    const ks = outTo(s.id, ['REQUIRES'], 'Knowledge');
    if (ks.length) want.set(s.id, mean(ks.map(k => pos.get(k)!.x)));
  });
  const midX = x / 2;
  skills.forEach(s => {
    if (want.has(s.id)) return;
    const peers = g.rels.filter(r => (r.from === s.id || r.to === s.id) && g.byId.get(r.from)!.label === 'Skill' && g.byId.get(r.to)!.label === 'Skill')
      .map(r => (r.from === s.id ? r.to : r.from)).filter(p => want.has(p));
    want.set(s.id, peers.length ? mean(peers.map(p => want.get(p)!)) + 1 : midX);
  });
  spread(skills.map(s => ({ id: s.id, want: want.get(s.id)! })), 250)
    .forEach((sx, id) => pos.set(id, { x: sx, y: ROW.skill }));

  // Job roles
  const roles = of('JobRole');
  const roleWant = new Map<string, number>();
  roles.forEach(r => {
    const ss = outTo(r.id, ['REQUIRES']).filter(s => pos.has(s));
    roleWant.set(r.id, ss.length ? mean(ss.map(s => pos.get(s)!.x)) : midX);
  });
  spread(roles.map(r => ({ id: r.id, want: roleWant.get(r.id)! })), 260)
    .forEach((rx, id) => pos.set(id, { x: rx, y: ROW.role }));

  // Area rows, leaves first, then each parent at the barycenter of its children
  const maxH = Math.max(0, ...height.values());
  for (let h = 0; h <= maxH; h++) {
    const row = [...height.entries()].filter(([, hh]) => hh === h).map(([id]) => {
      const targets = h === 0 ? outTo(id, ['HAS']) : children(id);
      const xs = targets.map(t => pos.get(t)?.x).filter((v): v is number => v !== undefined);
      return { id, want: xs.length ? mean(xs) : midX };
    });
    spread(row, 240).forEach((ax, id) => pos.set(id, { x: ax, y: ROW.area + h * ROW.areaStep }));
  }

  // Shadow bands
  const xs = [...pos.values()].map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  // Neighbours in a band alternate between two rows (stagger) so their id
  // labels have room; the outer row sits further from the rows.
  const band = (labels: NodeLabel[], bx: number, dir: -1 | 1) => {
    const items = g.nodes.filter(n => labels.includes(n.label)).map(n => {
      const ys = g.out.get(n.id)!.map(r => pos.get(r.to)?.y).filter((v): v is number => v !== undefined);
      return { id: n.id, want: (ys.length ? mean(ys) : ROW.skill) + labels.indexOf(n.label) * 0.01 };
    });
    const ys = spread(items, 64);
    [...ys.entries()].sort((a, b) => a[1] - b[1]).forEach(([id, ay], i) => {
      pos.set(id, { x: bx + (i % 2) * dir * 120, y: ay });
    });
  };
  // Wait, shadow bands were vertical strips (minY/maxY). Now they should be horizontal strips?
  // Let's place Account, Task, Content ABOVE everything, Quiz, Mentor BELOW everything.
  // Actually, Task and Content usually relate to Skills. So maybe they are on the left and right sides.
  // Let's just put them on the left and right.
  band(['Account', 'Task', 'Content'], minX - 160, -1);
  band(['Quiz', 'Mentor'], maxX + 160, 1);

  return pos;
}

// Distance from a node's center to its outline in direction (ux, uy)
function outlineDist(label: NodeLabel, ux: number, uy: number) {
  if (!isShadow(label)) return NODE_R[label];
  return Math.min(ux ? PILL.hw / Math.abs(ux) : Infinity, uy ? PILL.hh / Math.abs(uy) : Infinity);
}

interface EdgeGeom { rel: GraphRel; d: string; mid: Pt }

function edgeGeometry(g: Graph, rels: GraphRel[], pos: Map<string, Pt>): EdgeGeom[] {
  const pairCount = new Map<string, number>();
  const pairIndex = new Map<string, number>();
  const pairKey = (r: GraphRel) => [r.from, r.to].sort().join('|');
  rels.forEach(r => pairCount.set(pairKey(r), (pairCount.get(pairKey(r)) ?? 0) + 1));

  // Arcs between nodes in the same column bulge left; the lane factor keeps the
  // Knowledge↔Knowledge types from sitting on top of each other.
  const lane: Partial<Record<RelType, number>> = { IS_A: 0.75, PREREQUISITE: 1, RELATED_TO: 1.3, REQUIRES: 1 };

  return rels.map(r => {
    const a = pos.get(r.from)!;
    const b = pos.get(r.to)!;
    const la = g.byId.get(r.from)!.label;
    const lb = g.byId.get(r.to)!.label;
    const key = pairKey(r);
    const idx = pairIndex.get(key) ?? 0;
    pairIndex.set(key, idx + 1);
    const n = pairCount.get(key)!;

    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    let cx = mx;
    let cy = my;
    if (Math.abs(b.y - a.y) < 20) {
      cy = my - Math.min(120, 14 + Math.abs(b.x - a.x) * 0.32) * (lane[r.type] ?? 1) * (1 + idx * 0.4);
    } else if (n > 1) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const off = (idx - (n - 1) / 2) * 26;
      cx += (-dy / len) * off;
      cy += (dx / len) * off;
    }

    const unit = (x: number, y: number) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    let [uax, uay] = unit(cx - a.x, cy - a.y);
    if (cx === a.x && cy === a.y) [uax, uay] = unit(b.x - a.x, b.y - a.y);
    let [ubx, uby] = unit(cx - b.x, cy - b.y);
    if (cx === b.x && cy === b.y) [ubx, uby] = unit(a.x - b.x, a.y - b.y);
    const ra = outlineDist(la, uax, uay) + 1;
    const rb = outlineDist(lb, ubx, uby) + 2;
    const sx = a.x + uax * ra;
    const sy = a.y + uay * ra;
    const ex = b.x + ubx * rb;
    const ey = b.y + uby * rb;
    return {
      rel: r,
      d: `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`,
      mid: { x: 0.25 * sx + 0.5 * cx + 0.25 * ex, y: 0.25 * sy + 0.5 * cy + 0.25 * ey }
    };
  });
}

function relWidth(r: GraphRel): number {
  if (r.type === 'PARENT_OF') return 2;
  if (r.type === 'HAS_SKILL') return 0.8 + (r.props.proficiency as number) * 2.2;
  const w = r.props.weight;
  return typeof w === 'number' ? 0.7 + w * 1.8 : 1.3;
}

// ─── Small visual atoms ───────────────────────────────────────────────────────

function EdgeMarkers({ prefix = 'm' }: { prefix?: string }) {
  return (
    <>
      {REL_TYPES.map(t => {
        const { color, marker } = REL_META[t];
        const style = { fill: color, stroke: color };
        return (
          <g key={t}>
            {marker !== 'none' && marker !== 'triangle' && (
              <marker id={`${prefix}-${t}`} viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7"
                markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0,0.5 L8,4 L0,7.5 z" style={style} />
              </marker>
            )}
            {marker === 'triangle' && (
              <marker id={`${prefix}-${t}`} viewBox="0 0 12 12" refX="11" refY="6" markerWidth="11" markerHeight="11"
                markerUnits="userSpaceOnUse" orient="auto">
                <path d="M1,1 L11,6 L1,11 z" style={{ fill: 'var(--card)', stroke: color, strokeWidth: 1.5 }} />
              </marker>
            )}
            {marker === 'diamond' && (
              <marker id={`${prefix}-${t}-start`} viewBox="0 0 12 8" refX="0.5" refY="4" markerWidth="12" markerHeight="8"
                markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0.5,4 L6,0.5 L11.5,4 L6,7.5 z" style={{ fill: 'var(--card)', stroke: color, strokeWidth: 1.2 }} />
              </marker>
            )}
          </g>
        );
      })}
    </>
  );
}

function edgeMarkerProps(t: RelType, prefix = 'm') {
  const { marker } = REL_META[t];
  return {
    markerEnd: marker === 'none' ? undefined : `url(#${prefix}-${t})`,
    markerStart: marker === 'diamond' ? `url(#${prefix}-${t}-start)` : undefined
  };
}

function RelSwatch({ type, width = 30 }: { type: RelType; width?: number }) {
  const { color, dash } = REL_META[type];
  const id = `sw-${type}`;
  return (
    <svg width={width} height={12} className="shrink-0 overflow-visible" aria-hidden>
      <defs><EdgeMarkers prefix={id} /></defs>
      <line x1={REL_META[type].marker === 'diamond' ? 1 : 2} y1={6} x2={width - 2} y2={6}
        style={{ stroke: color }} strokeWidth={1.6} strokeDasharray={dash} strokeLinecap="round"
        {...edgeMarkerProps(type, id)} />
    </svg>
  );
}

function NodeSwatch({ label, color, size = 14 }: { label: NodeLabel; color?: string; size?: number }) {
  const c = color ?? NODE_META[label].color;
  if (isShadow(label)) {
    return (
      <svg width={size * 1.5} height={size} className="shrink-0" aria-hidden>
        <rect x={1} y={1.5} width={size * 1.5 - 2} height={size - 3} rx={(size - 3) / 2}
          fill={tint(c, 20)} stroke={c} strokeWidth={1.3} strokeDasharray="2.5 1.5" />
      </svg>
    );
  }
  const r = label === 'Knowledge' ? size * 0.3 : label === 'KnowledgeArea' ? size * 0.38 : size / 2 - 1;
  return (
    <svg width={size * 1.5} height={size} className="shrink-0" aria-hidden>
      <circle cx={size * 0.75} cy={size / 2} r={r} fill={tint(c, 20)} stroke={c} strokeWidth={1.5} />
    </svg>
  );
}

// Admin sees the schema label (":Skill"); learners see a plain name ("Topic area")
function LabelChip({ label }: { label: NodeLabel }) {
  const { system } = useAudience();
  const c = NODE_META[label].color;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
      style={{ backgroundColor: tint(c, 12), color: c }}>
      {system ? `:${label}` : FRIENDLY_LABEL[label]}
    </span>
  );
}

// Icon + color for a skill state, so the state never rests on color alone:
// bands are filled dots, missing is a ringed dot, locked is a lock, not
// required is an empty dot.
function StateMark({ state, size = 10 }: { state: SkillState; size?: number }) {
  const { color } = SKILL_STATE_META[state];
  if (state === 'locked') return <Lock size={size + 1} className="shrink-0" style={{ color }} />;
  const r = size / 2;
  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden>
      {state === 'untracked' && <circle cx={r} cy={r} r={r - 1} fill="none" style={{ stroke: color }} strokeWidth={1.5} />}
      {state === 'missing' && (
        <>
          <circle cx={r} cy={r} r={r - 0.75} fill="none" style={{ stroke: color }} strokeWidth={1.5} />
          <circle cx={r} cy={r} r={r * 0.45} style={{ fill: color }} />
        </>
      )}
      {state !== 'untracked' && state !== 'missing' && <circle cx={r} cy={r} r={r} style={{ fill: color }} />}
    </svg>
  );
}

// Text stays in ink colors; the mark carries the state color
function StatePill({ state }: { state: SkillState }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full shrink-0 ${MUTED_TINT_CLS}`}
      title={SKILL_STATE_META[state].hint}>
      <StateMark state={state} size={8} />
      {SKILL_STATE_META[state].label}
    </span>
  );
}

function Bar({ value, color, trackCls = 'bg-background', h = 'h-1.5' }: { value: number; color: string; trackCls?: string; h?: string }) {
  return (
    <div className={`w-full ${h} rounded-full ${trackCls}`}>
      <div className={`${h} rounded-full transition-all duration-500`} style={{ width: `${value * 100}%`, backgroundColor: color }} />
    </div>
  );
}

function PanelHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted-foreground">{icon}</span>
      <h4 className="text-sm">{title}</h4>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

// ─── Graph canvas ─────────────────────────────────────────────────────────────

function nodeColor(g: Graph, n: GraphNode, mode: ColorMode) {
  if (mode === 'label') return NODE_META[n.label].color;
  if (n.label === 'Skill') return SKILL_STATE_META[skillState(g, n.id)].color;
  if (n.label === 'Account' || n.label === 'JobRole') return NODE_META[n.label].color;
  return NEUTRAL;
}

function GraphNodeShape({ g, node, p, colorMode, selected, dimmed, onClick, onHover }: {
  g: Graph;
  node: GraphNode;
  p: Pt;
  colorMode: ColorMode;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
  onHover: (on: boolean) => void;
}) {
  const { personal } = useAudience();
  const { label } = node;
  const color = nodeColor(g, node, colorMode);
  const shadow = isShadow(label);
  const r = NODE_R[label];
  // Progress ring, lock and "ready to start" marks are the learner's own data
  const hs = personal && label === 'Skill' ? hasSkillOf(g, node.id) : undefined;
  const state = personal && label === 'Skill' ? skillState(g, node.id) : null;
  const Icon = state === 'locked' ? Lock : LABEL_ICON[label];
  const deprecated = node.props.deprecated === true;
  // Proficiency mode: only skills the learner has or can start right now keep
  // full strength; "not reached yet" recedes with everything else.
  const muted = colorMode === 'proficiency' && (color === NEUTRAL || state === 'locked' || state === 'untracked');
  const callout = colorMode === 'proficiency' && state === 'missing';
  const opacity = dimmed ? 0.14 : muted ? 0.55 : deprecated ? 0.6 : 1;
  const name = nodeName(node);
  const halo = { paintOrder: 'stroke' as const, stroke: 'var(--card)', strokeWidth: 3.5, strokeLinejoin: 'round' as const };

  let text: React.ReactNode;
  if (label === 'Knowledge' || label === 'KnowledgeArea') {
    text = (
      <text x={r + 5} dy={3.8} fontSize={label === 'KnowledgeArea' ? 11.5 : 11} fill="var(--foreground)"
        fontWeight={label === 'KnowledgeArea' ? 500 : 400} textDecoration={deprecated ? 'line-through' : undefined} style={halo}>
        {name}
      </text>
    );
  } else {
    // Shadow nodes in the top band label upwards, away from the columns
    const above = label === 'Account' || label === 'Task' || label === 'Content';
    const dy = shadow ? (above ? -PILL.hh - 5 : PILL.hh + 12) : r + (hs || callout ? 18 : 14);
    text = (
      <text textAnchor="middle" dy={dy} fontSize={label === 'JobRole' ? 13 : shadow ? 10 : 12}
        fill={shadow ? 'var(--muted-foreground)' : 'var(--foreground)'} fontWeight={label === 'JobRole' ? 600 : label === 'Skill' ? 500 : 400}
        fontFamily={shadow ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined} style={halo}>
        {name}
      </text>
    );
  }

  return (
    <g
      data-node
      transform={`translate(${p.x}, ${p.y})`}
      opacity={opacity}
      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {selected && (shadow
        ? <rect x={-PILL.hw - 5} y={-PILL.hh - 5} width={(PILL.hw + 5) * 2} height={(PILL.hh + 5) * 2} rx={PILL.hh + 5} fill="none" stroke={color} strokeWidth={2} opacity={0.45} />
        : <circle r={r + (hs || callout ? 10 : 7)} fill="none" stroke={color} strokeWidth={2} opacity={0.45} />)}

      {shadow ? (
        <rect x={-PILL.hw} y={-PILL.hh} width={PILL.hw * 2} height={PILL.hh * 2} rx={PILL.hh}
          fill="var(--card)" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      ) : (
        <circle r={r} fill="var(--card)" stroke={color} strokeWidth={label === 'Knowledge' ? 1.5 : 2}
          strokeDasharray={state === 'missing' || state === 'locked' || deprecated ? '4 3' : undefined} />
      )}
      {shadow
        ? <rect x={-PILL.hw} y={-PILL.hh} width={PILL.hw * 2} height={PILL.hh * 2} rx={PILL.hh} fill={tint(color, 15)} />
        : <circle r={r} fill={tint(color, label === 'Knowledge' ? 25 : 15)} />}

      {/* Missing = ready to start: an open ring marks it as the next step */}
      {callout && <circle r={r + 5} fill="none" stroke={color} strokeWidth={2} strokeDasharray="3 3" />}

      {/* HAS_SKILL.proficiency of the current account, as a ring around the Skill */}
      {hs && (() => {
        const rr = r + 5;
        const circ = 2 * Math.PI * rr;
        const prof = hs.props.proficiency as number;
        return (
          <g transform="rotate(-90)">
            <circle r={rr} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={3} />
            <circle r={rr} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={`${prof * circ} ${circ}`} />
          </g>
        );
      })()}

      {label !== 'Knowledge' && (
        <Icon x={-(shadow ? 6 : r * 0.5)} y={-(shadow ? 6 : r * 0.5)} size={shadow ? 12 : r} color={color}
          strokeWidth={2.2} style={{ pointerEvents: 'none' }} />
      )}
      {text}
    </g>
  );
}

function GraphCanvas({
  g, pos, nodes, rels, colorMode, selectedId, hoveredNode, hoveredEdge, searchHits, showEdgeLabels,
  view, onSelect, onHoverNode, onHoverEdge, contentRef
}: {
  g: Graph;
  pos: Map<string, Pt>;
  nodes: GraphNode[];
  rels: GraphRel[];
  colorMode: ColorMode;
  selectedId: string | null;
  hoveredNode: string | null;
  hoveredEdge: string | null;
  searchHits: Set<string> | null;
  showEdgeLabels: boolean;
  view: { x: number; y: number; k: number };
  onSelect: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  onHoverEdge: (id: string | null) => void;
  contentRef: React.RefObject<SVGGElement | null>;
}) {
  const { system } = useAudience();
  const geoms = useMemo(() => edgeGeometry(g, rels, pos), [g, rels, pos]);
  const focus = selectedId ?? hoveredNode;
  const neighbors = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set([selectedId]);
    rels.forEach(r => {
      if (r.from === selectedId) s.add(r.to);
      if (r.to === selectedId) s.add(r.from);
    });
    return s;
  }, [selectedId, rels]);

  return (
    <svg className="relative w-full h-full select-none" onClick={() => onSelect(null)}>
      <defs><EdgeMarkers /></defs>
      <g ref={contentRef} transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
        {geoms.map(({ rel, d }) => {
          const incident = focus !== null && (rel.from === focus || rel.to === focus);
          const hovered = hoveredEdge === rel.id;
          const faded = (selectedId && !incident) || (searchHits && !(searchHits.has(rel.from) && searchHits.has(rel.to)));
          const opacity = hovered || incident ? 1 : faded ? 0.06 : hoveredNode ? 0.25 : 0.5;
          const { color, dash } = REL_META[rel.type];
          return (
            <g key={rel.id} opacity={opacity} style={{ transition: 'opacity 0.2s' }}>
              <path d={d} fill="none" style={{ stroke: color }} strokeWidth={relWidth(rel) + (hovered ? 1 : 0)}
                strokeDasharray={dash} strokeLinecap="round" {...edgeMarkerProps(rel.type)} />
            </g>
          );
        })}

        {/* Wide transparent hit areas so thin edges are easy to hover. Faded
            edges outside the selected neighbourhood don't respond. */}
        {geoms.filter(({ rel }) => !selectedId || rel.from === selectedId || rel.to === selectedId).map(({ rel, d }) => (
          <path key={`hit-${rel.id}`} data-edge d={d} fill="none" stroke="transparent" strokeWidth={9}
            style={{ cursor: 'help', pointerEvents: 'stroke' }}
            onMouseEnter={() => onHoverEdge(rel.id)} onMouseLeave={() => onHoverEdge(null)}
            onClick={e => e.stopPropagation()} />
        ))}

        {nodes.map(n => (
          <GraphNodeShape
            key={n.id}
            g={g}
            node={n}
            p={pos.get(n.id)!}
            colorMode={colorMode}
            selected={selectedId === n.id}
            dimmed={(neighbors !== null && !neighbors.has(n.id)) || (searchHits !== null && !searchHits.has(n.id))}
            onClick={() => onSelect(n.id)}
            onHover={on => onHoverNode(on ? n.id : null)}
          />
        ))}

        {geoms.map(({ rel, mid }) => {
          const incident = focus !== null && (rel.from === focus || rel.to === focus);
          if (!(showEdgeLabels || incident || hoveredEdge === rel.id)) return null;
          if (showEdgeLabels && selectedId && !incident) return null;
          const { color } = REL_META[rel.type];
          return (
            <text key={`lbl-${rel.id}`} x={mid.x} y={mid.y + 3} textAnchor="middle" fontSize={8.5} fontWeight={600}
              letterSpacing={system ? 0.3 : 0} style={{ fill: color, paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 3, pointerEvents: 'none' }}>
              {system ? rel.type : FRIENDLY_REL[rel.type].name.toLowerCase()}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

// Why a skill without evidence is (or isn't) flagged
function stateNote(g: Graph, id: string): string | null {
  const state = skillState(g, id);
  if (state === 'locked') {
    const deps = blockingSkills(g, id).map(d => nodeName(g.byId.get(d)!));
    return `Not reached yet — comes after ${deps.join(' and ')} (once it reaches ${pct(UNLOCK_AT)}).`;
  }
  if (state === 'missing') return 'Every skill it requires is in place — ready to start.';
  return null;
}

// A relationship read as a sentence, for audiences that don't speak the schema
function relSentence(g: Graph, rel: GraphRel): string {
  const a = nodeName(g.byId.get(rel.from)!);
  const b = nodeName(g.byId.get(rel.to)!);
  switch (rel.type) {
    case 'REQUIRES': return `${a} needs ${b}`;
    case 'PREREQUISITE': return `Learn ${a} before ${b}`;
    case 'IS_A': return `${a} is a type of ${b}`;
    case 'RELATED_TO': return `${a} ${RELATION_PHRASE[String(rel.props.relation_type)] ?? 'is related to'} ${b}`;
    case 'PARENT_OF': return `${a} contains the ${b} topic`;
    case 'HAS': return `${b} is part of ${a}`;
    default: return `${a} ${FRIENDLY_REL[rel.type].verb} ${b}`;
  }
}

function LearnerNodeTooltip({ g, node }: { g: Graph; node: GraphNode }) {
  const { personal } = useAudience();
  const facts: string[] = [];
  if (node.label === 'Skill') facts.push(`${levelLabel(node.props.level)} skill`);
  if (node.label === 'Knowledge') facts.push(kindLabel(node.props.kind), levelLabel(node.props.difficulty));
  if (node.label === 'JobRole' && node.props.level) facts.push(`${levelLabel(node.props.level)} level`);
  if (node.label === 'KnowledgeArea') {
    const n = g.out.get(node.id)!.filter(r => r.type === 'HAS').length;
    const sub = g.out.get(node.id)!.filter(r => r.type === 'PARENT_OF').length;
    facts.push(sub ? `${sub} sub-topics` : `${n} concepts`);
  }
  const hs = personal && node.label === 'Skill' ? hasSkillOf(g, node.id) : undefined;
  const kStatus = personal && node.label === 'Knowledge' ? knowledgeStatus(g, node.id) : null;

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-xl p-3 shadow-lg w-64 pointer-events-none">
      <div className="flex items-center gap-2 mb-1.5"><LabelChip label={node.label} /></div>
      <div className="text-sm font-medium truncate">{nodeName(node)}</div>
      {node.props.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{String(node.props.description)}</p>}
      {facts.filter(Boolean).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {facts.filter(Boolean).map(f => <span key={f} className={`text-xs px-1.5 py-0.5 rounded ${MUTED_TINT_CLS}`}>{f}</span>)}
        </div>
      )}
      {personal && node.label === 'Skill' && (() => {
        const state = skillState(g, node.id);
        const note = stateNote(g, node.id);
        return (
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>Your progress</span>
              {hs ? <span>{pct(hs.props.proficiency as number)}</span> : <StatePill state={state} />}
            </div>
            {hs && <Bar value={hs.props.proficiency as number} color={SKILL_STATE_META[state].color} trackCls={MUTED_TINT_CLS} />}
            {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
          </div>
        );
      })()}
      {kStatus && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <KnowledgeStatusIcon status={kStatus.status} />
          <span>{KNOWLEDGE_STATUS_META[kStatus.status].label}</span>
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-2">Click for details</div>
    </div>
  );
}

function LearnerEdgeTooltip({ g, rel }: { g: Graph; rel: GraphRel }) {
  const w = rel.props.weight;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-xl p-3 shadow-lg w-72 pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <RelSwatch type={rel.type} />
        <span className="text-xs font-medium" style={{ color: REL_META[rel.type].color }}>{FRIENDLY_REL[rel.type].name}</span>
      </div>
      <p className="text-sm">{relSentence(g, rel)}</p>
      {typeof w === 'number' && <p className="text-xs text-muted-foreground mt-1">Importance: {importance(w)}</p>}
    </div>
  );
}

function NodeTooltip({ g, node }: { g: Graph; node: GraphNode }) {
  const { system } = useAudience();
  if (!system) return <LearnerNodeTooltip g={g} node={node} />;
  const src = SOURCE_RECORDS[node.id];
  const hs = node.label === 'Skill' ? hasSkillOf(g, node.id) : undefined;
  const facts: [string, string][] = [];
  if (node.label === 'Skill') facts.push(['level', String(node.props.level)]);
  if (node.label === 'Knowledge') {
    facts.push(['kind', String(node.props.kind)]);
    if (node.props.difficulty) facts.push(['difficulty', String(node.props.difficulty)]);
  }
  if (node.label === 'JobRole' && node.props.level) facts.push(['level', String(node.props.level)]);
  if (node.props.status) facts.push(['status', String(node.props.status)]);

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-xl p-3 shadow-lg w-64 pointer-events-none">
      <div className="flex items-center gap-2 mb-1.5">
        <LabelChip label={node.label} />
        {isShadow(node.label) && <span className="text-xs text-muted-foreground">shadow</span>}
      </div>
      <div className="text-sm font-medium truncate">{nodeName(node)}</div>
      {src && <div className="text-xs text-muted-foreground truncate">↳ {src.title} <span className="opacity-70">(from {src.system.split(' · ')[0]})</span></div>}
      {facts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {facts.map(([k, v]) => (
            <span key={k} className={`text-xs px-1.5 py-0.5 rounded ${MUTED_TINT_CLS}`}>
              <span className="text-muted-foreground">{k}</span> {v}
            </span>
          ))}
        </div>
      )}
      {node.label === 'Skill' && (() => {
        const state = skillState(g, node.id);
        const note = stateNote(g, node.id);
        return (
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>Your proficiency</span>
              {hs ? <span>{pct(hs.props.proficiency as number)}</span> : <StatePill state={state} />}
            </div>
            {hs && <Bar value={hs.props.proficiency as number} color={SKILL_STATE_META[state].color} trackCls={MUTED_TINT_CLS} />}
            {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
          </div>
        );
      })()}
      <div className="text-xs text-muted-foreground mt-2">Click to inspect</div>
    </div>
  );
}

function EdgeTooltip({ g, rel }: { g: Graph; rel: GraphRel }) {
  const { system } = useAudience();
  if (!system) return <LearnerEdgeTooltip g={g} rel={rel} />;
  const meta = REL_META[rel.type];
  const a = g.byId.get(rel.from)!;
  const b = g.byId.get(rel.to)!;
  const specs = meta.props;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-xl p-3 shadow-lg w-80 pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <RelSwatch type={rel.type} />
        <span className="text-sm font-medium" style={{ color: meta.color }}>{rel.type}</span>
        <span className="text-xs text-muted-foreground truncate">{meta.reading}</span>
      </div>
      <div className="text-xs mb-2 flex items-center gap-1.5 flex-wrap">
        <span className="font-medium">{nodeName(a)}</span>
        <span className="text-muted-foreground">{meta.symmetric ? '↔' : '→'}</span>
        <span className="font-medium">{nodeName(b)}</span>
      </div>
      {specs.length > 0 ? (
        <div className="space-y-1">
          {specs.map(s => (
            <div key={s.name} className="flex justify-between gap-3 text-xs">
              <span className="font-mono text-muted-foreground">{s.name}{s.required && <span className="text-[#e05992]">*</span>}</span>
              <span className="truncate">{rel.props[s.name] !== undefined ? formatValue(rel.props[s.name]) : '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">No properties</div>
      )}
      <code className={`block mt-2 text-[10.5px] leading-snug p-1.5 rounded break-all ${MUTED_TINT_CLS}`}>
        (:{a.label})-[:{rel.type}{cypherProps(rel.props)}]-&gt;(:{b.label})
      </code>
    </div>
  );
}

// ─── Node detail drawer ───────────────────────────────────────────────────────

function NodeLink({ g, id, onSelect }: { g: Graph; id: string; onSelect: (id: string) => void }) {
  const n = g.byId.get(id)!;
  return (
    <button onClick={() => onSelect(id)} className="flex items-center gap-1.5 min-w-0 hover:underline text-left">
      <NodeSwatch label={n.label} size={11} />
      <span className={`text-sm truncate ${isShadow(n.label) ? 'font-mono text-xs' : ''}`}>{nodeName(n)}</span>
    </button>
  );
}

function NodeDetail({ g, node, onClose, onSelect }: {
  g: Graph;
  node: GraphNode;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<'properties' | 'relationships'>('properties');
  const meta = NODE_META[node.label];
  const src = SOURCE_RECORDS[node.id];
  const hs = node.label === 'Skill' ? hasSkillOf(g, node.id) : undefined;
  const state = node.label === 'Skill' ? skillState(g, node.id) : null;
  const outRels = g.out.get(node.id)!;
  const inRels = g.in.get(node.id)!;
  const res = node.label === 'Skill' || node.label === 'Knowledge' ? resourcesFor(g, node.id) : null;
  const itemCls = `p-2.5 rounded-lg ${MUTED_TINT_CLS}`;

  const groups: { dir: 'out' | 'in'; type: RelType; rels: GraphRel[] }[] = [];
  const push = (dir: 'out' | 'in', rels: GraphRel[]) => REL_TYPES.forEach(t => {
    const rs = rels.filter(r => r.type === t);
    if (rs.length) groups.push({ dir, type: t, rels: rs });
  });
  push('out', outRels);
  push('in', inRels);

  return (
    <div className="bg-card border-2 border-border rounded-2xl flex flex-col overflow-hidden h-full shadow-xl">
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <LabelChip label={node.label} />
            <span className={`text-xs px-2 py-0.5 rounded-full text-muted-foreground ${MUTED_TINT_CLS}`}>
              {meta.group === 'shadow' ? 'Shadow · id only' : 'Graph-owned'}
            </span>
            {node.props.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${MUTED_TINT_CLS}`}>{String(node.props.status)}</span>
            )}
          </div>
          <button onClick={onClose} aria-label="Close details"
            className="p-1.5 -mt-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <h3 className={`leading-snug ${meta.group === 'shadow' ? 'font-mono text-base' : ''}`}>{nodeName(node)}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mt-1">
          {node.props.description ? String(node.props.description) : meta.reading}
        </p>

        {src && (
          <div className={`mt-3 ${itemCls}`}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Database size={11} /> Resolved from {src.system}
            </div>
            <div className="text-sm">{src.title}</div>
            {src.detail && <div className="text-xs text-muted-foreground">{src.detail}</div>}
            <div className="text-xs text-muted-foreground mt-1.5 opacity-80">Not stored in the graph — looked up by {meta.pk}.</div>
          </div>
        )}

        {node.label === 'Skill' && state && (
          <div className={`mt-3 ${itemCls}`}>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-muted-foreground">Your HAS_SKILL.proficiency</span>
              <StatePill state={state} />
            </div>
            {hs ? (
              <>
                <div className="flex items-center gap-2">
                  <Bar value={hs.props.proficiency as number} color={SKILL_STATE_META[state].color} />
                  <span className="text-sm w-10 text-right">{pct(hs.props.proficiency as number)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-xs">
                  <span className="text-muted-foreground">confidence</span><span>{hs.props.confidence !== undefined ? pct(hs.props.confidence as number) : '—'}</span>
                  <span className="text-muted-foreground">source</span><span>{String(hs.props.source ?? '—')}</span>
                  <span className="text-muted-foreground">lastUpdatedAt</span><span>{new Date(String(hs.props.lastUpdatedAt)).toLocaleDateString()}</span>
                  {hs.props.credentials && <><span className="text-muted-foreground">credentials</span><span className="truncate">{String(hs.props.credentials)}</span></>}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                No HAS_SKILL edge from your account yet.{stateNote(g, node.id) && <> {stateNote(g, node.id)}</>}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 opacity-80">
              Skill.level = <span className="text-foreground">{String(node.props.level)}</span> is the difficulty of the skill itself, not your proficiency.
            </p>
          </div>
        )}
      </div>

      <div className="flex border-b border-border">
        {(['properties', 'relationships'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-sm py-2.5 capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}{t === 'relationships' && <span className="text-muted-foreground"> ({outRels.length + inRels.length})</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-thin">
        {tab === 'properties' && (
          <>
            <div className="space-y-1">
              {meta.props.map(spec => {
                const v = node.props[spec.name];
                return (
                  <div key={spec.name} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2 py-1 border-b border-border/60 last:border-0 text-sm">
                    <div className="min-w-0">
                      <div className="font-mono text-xs truncate">
                        {spec.name}{spec.required && <span className="text-[#e05992]">*</span>}
                        {spec.name === meta.pk && <span className="ml-1 text-muted-foreground">PK</span>}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground">{spec.type}</div>
                    </div>
                    <div className={`min-w-0 break-words ${v === undefined ? 'text-muted-foreground' : ''} ${spec.type === 'json' ? 'font-mono text-xs' : ''}`}>
                      {v === undefined ? '—' : Array.isArray(v)
                        ? <div className="flex flex-wrap gap-1">{v.map(x => <span key={x} className={`text-xs px-1.5 py-0.5 rounded ${MUTED_TINT_CLS}`}>{x}</span>)}</div>
                        : formatValue(v)}
                    </div>
                  </div>
                );
              })}
            </div>
            <code className={`block text-[11px] leading-snug p-2 rounded-lg break-all ${MUTED_TINT_CLS}`}>
              (:{node.label} {'{'}{meta.pk}: "{node.id}"{'}'})
            </code>
          </>
        )}

        {tab === 'relationships' && groups.map(({ dir, type, rels }) => (
          <div key={`${dir}-${type}`}>
            <div className="flex items-center gap-2 mb-1.5">
              {dir === 'out' ? <ArrowRight size={12} className="text-muted-foreground" /> : <ArrowLeft size={12} className="text-muted-foreground" />}
              <RelSwatch type={type} width={22} />
              <span className="text-xs font-medium" style={{ color: REL_META[type].color }}>{type}</span>
              <span className="text-xs text-muted-foreground">{dir === 'out' ? 'to' : 'from'} · {rels.length}</span>
            </div>
            <div className="space-y-1">
              {rels.map(r => (
                <div key={r.id} className={`${itemCls} py-1.5`}>
                  <NodeLink g={g} id={dir === 'out' ? r.to : r.from} onSelect={onSelect} />
                  {Object.keys(r.props).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(r.props).map(([k, v]) => (
                        <span key={k} className="text-[11px] px-1.5 py-0.5 rounded bg-background">
                          <span className="text-muted-foreground font-mono">{k}</span> {k === 'lastUpdatedAt' ? new Date(String(v)).toLocaleDateString() : formatValue(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {res && (
        <div className="p-3 border-t border-border grid grid-cols-3 gap-2">
          <button className="flex flex-col items-center gap-1 py-2 rounded-lg text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: BRAND_HEX }}>
            <Play size={14} />
            <span className="text-sm">Learn <span className="opacity-70">{res.contents.length}</span></span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Target size={14} />
            <span className="text-sm">Practice <span className="text-muted-foreground">{res.tasks.length + res.quizzes.length}</span></span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Users size={14} />
            <span className="text-sm">Mentor <span className="text-muted-foreground">{res.mentors.length}</span></span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Learner detail drawer (student / public) ─────────────────────────────────
// Same graph, but answers a learner's questions instead of listing properties:
// where am I, what is this made of, what comes before and after, and where do
// I go to learn it. No ids, aliases, review status or relationship type names.

const RESOURCE_META: Record<ResourceKind, { title: string; icon: LucideIcon; empty: string }> = {
  lesson: { title: 'Lessons', icon: BookOpen, empty: 'No lessons yet' },
  project: { title: 'Projects & exercises', icon: Hammer, empty: 'No projects yet' },
  quiz: { title: 'Quizzes', icon: ListChecks, empty: 'No quizzes yet' },
  mentor: { title: 'Mentors', icon: GraduationCap, empty: 'No mentors yet' }
};

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">{title}</h4>
      {children}
    </section>
  );
}

// Clickable graph nodes (skills, roles, areas) with an optional trailing note
function NodeRows({ g, items, onSelect }: { g: Graph; items: { id: string; note?: React.ReactNode }[]; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-1">
      {items.map(({ id, note }) => {
        const n = g.byId.get(id)!;
        return (
          <button key={id} onClick={() => onSelect(id)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:ring-1 hover:ring-border ${MUTED_TINT_CLS}`}>
            <NodeSwatch label={n.label} size={11} />
            <span className="text-sm flex-1 min-w-0 truncate">{nodeName(n)}</span>
            {note && <span className="text-xs text-muted-foreground shrink-0">{note}</span>}
          </button>
        );
      })}
    </div>
  );
}

function ResourceList({ kind, items }: { kind: ResourceKind; items: LearningResource[] }) {
  const { icon: Icon } = RESOURCE_META[kind];
  return (
    <div className="space-y-1">
      {items.map(r => (
        <a key={r.id} href={r.to}
          className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:ring-1 hover:ring-border transition-shadow ${MUTED_TINT_CLS}`}>
          <Icon size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="text-sm truncate">{r.title}</span>
              {r.core && <span className="text-[10px] px-1.5 rounded-full text-white shrink-0" style={{ backgroundColor: BRAND_HEX }}>Core</span>}
            </span>
            {(r.detail || r.notes.length > 0) && (
              <span className="block text-xs text-muted-foreground line-clamp-2">{[r.detail, ...r.notes].filter(Boolean).join(' · ')}</span>
            )}
          </span>
          <ChevronRight size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}

function ExternalResource({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:ring-1 hover:ring-border ${MUTED_TINT_CLS}`}>
      <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
      <span className="flex-1 min-w-0">
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-muted-foreground truncate">{hostOf(url)}</span>
      </span>
    </a>
  );
}

// Lessons, projects, quizzes, mentors and the node's own external resource
function WhereToLearn({ g, node }: { g: Graph; node: GraphNode }) {
  const res = learningResourcesFor(g, node.id);
  const url = resourceUrl(node.props.practice_resource ?? node.props.learning_resource);
  const kinds = (Object.keys(RESOURCE_META) as ResourceKind[]).filter(k => res[k].length > 0);
  if (!kinds.length && !url) {
    return <PanelSection title="Where to learn"><p className="text-sm text-muted-foreground">No lessons, projects or quizzes are linked yet.</p></PanelSection>;
  }
  return (
    <>
      {kinds.map(k => (
        <PanelSection key={k} title={RESOURCE_META[k].title}>
          <ResourceList kind={k} items={res[k]} />
        </PanelSection>
      ))}
      {url && (
        <PanelSection title={node.label === 'Skill' ? 'Practice online' : 'Read more'}>
          <ExternalResource url={url} label={node.label === 'Skill' ? `Practise ${nodeName(node)}` : `Learn ${nodeName(node)}`} />
        </PanelSection>
      )}
    </>
  );
}

function LearnerNodePanel({ g, node, onClose, onSelect }: {
  g: Graph;
  node: GraphNode;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { personal } = useAudience();
  const out = g.out.get(node.id)!;
  const inc = g.in.get(node.id)!;
  const outOf = (type: RelType, label?: NodeLabel) => out.filter(r => r.type === type && (!label || g.byId.get(r.to)!.label === label));
  const inOf = (type: RelType, label?: NodeLabel) => inc.filter(r => r.type === type && (!label || g.byId.get(r.from)!.label === label));
  const byWeight = (a: GraphRel, b: GraphRel) => ((b.props.weight as number) ?? 1) - ((a.props.weight as number) ?? 1);

  // A skill's standing, in words, for lists of skills
  const skillNote = (id: string, weight?: number): React.ReactNode => {
    const hs = hasSkillOf(g, id);
    const imp = weight !== undefined ? importance(weight) : null;
    if (!personal) return imp;
    const state = skillState(g, id);
    return (
      <span className="inline-flex items-center gap-1.5">
        {imp && <span>{imp}</span>}
        <StateMark state={state} size={8} />
        <span>{hs ? pct(hs.props.proficiency as number) : state === 'locked' ? 'later' : 'not started'}</span>
      </span>
    );
  };

  const related = [...outOf('RELATED_TO'), ...inOf('RELATED_TO')].map(r => {
    const other = r.from === node.id ? r.to : r.from;
    return { id: other, note: (RELATION_PHRASE[String(r.props.relation_type)] ?? 'related to').replace(/^is /, '') };
  });

  const facts: string[] = [];
  if (node.label === 'Skill') facts.push(`${levelLabel(node.props.level)} skill`);
  if (node.label === 'Knowledge') facts.push(kindLabel(node.props.kind), `${levelLabel(node.props.difficulty)}`);
  if (node.label === 'JobRole' && node.props.level) facts.push(`${levelLabel(node.props.level)} level`);

  let body: React.ReactNode = null;

  if (node.label === 'Skill') {
    const hs = hasSkillOf(g, node.id);
    const state = skillState(g, node.id);
    const note = stateNote(g, node.id);
    const needs = outOf('REQUIRES', 'Skill').sort(byWeight);
    const leadsTo = inOf('REQUIRES', 'Skill');
    const roles = inOf('REQUIRES', 'JobRole');
    body = (
      <>
        {personal && (
          <PanelSection title="Your progress">
            <div className={`p-3 rounded-xl ${MUTED_TINT_CLS}`}>
              <div className="flex items-center justify-between mb-1.5">
                <StatePill state={state} />
                {hs && <span className="text-sm font-medium">{pct(hs.props.proficiency as number)}</span>}
              </div>
              {hs ? (
                <>
                  <Bar value={hs.props.proficiency as number} color={SKILL_STATE_META[state].color} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {EVIDENCE_SOURCE_LABEL[String(hs.props.source)] ?? 'Recorded'} · {new Date(String(hs.props.lastUpdatedAt)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {hs.props.confidence !== undefined && <> · {confidenceLabel(hs.props.confidence as number)}</>}
                  </p>
                  {hs.props.credentials && <p className="text-xs mt-1 flex items-center gap-1.5"><Award size={12} className="text-muted-foreground" />{String(hs.props.credentials)}</p>}
                </>
              ) : note && <p className="text-xs text-muted-foreground">{note}</p>}
            </div>
          </PanelSection>
        )}
        <PanelSection title="What you'll learn">
          <KnowledgeChain g={g} skillId={node.id} onSelect={onSelect} />
        </PanelSection>
        {needs.length > 0 && (
          <PanelSection title="Builds on">
            <NodeRows g={g} onSelect={onSelect} items={needs.map(r => ({ id: r.to, note: skillNote(r.to, r.props.weight as number) }))} />
          </PanelSection>
        )}
        {leadsTo.length > 0 && (
          <PanelSection title="Leads to">
            <NodeRows g={g} onSelect={onSelect} items={leadsTo.map(r => ({ id: r.from, note: skillNote(r.from) }))} />
          </PanelSection>
        )}
        {related.length > 0 && (
          <PanelSection title="Related skills">
            <NodeRows g={g} onSelect={onSelect} items={related} />
          </PanelSection>
        )}
        {roles.length > 0 && (
          <PanelSection title="Needed for">
            <NodeRows g={g} onSelect={onSelect} items={roles.map(r => ({ id: r.from, note: importance(r.props.weight as number) }))} />
          </PanelSection>
        )}
        <WhereToLearn g={g} node={node} />
      </>
    );
  }

  if (node.label === 'Knowledge') {
    const status = personal ? knowledgeStatus(g, node.id) : null;
    const learnFirst = inOf('PREREQUISITE').map(r => r.from);
    const unlocks = outOf('PREREQUISITE').map(r => r.to);
    const kindOf = outOf('IS_A').map(r => r.to);
    const types = inOf('IS_A').map(r => r.from);
    const partOf = inOf('REQUIRES', 'Skill');
    const areas = inOf('HAS').map(r => r.from);
    const chips = (ids: string[]) => (
      <div className="flex flex-wrap gap-1.5">{ids.map(k => <KnowledgeChip key={k} g={g} id={k} onSelect={onSelect} />)}</div>
    );
    body = (
      <>
        {node.props.deprecated && (
          <p className={`text-xs p-2.5 rounded-lg ${MUTED_TINT_CLS}`}>This is a legacy approach — worth recognising in older code, but newer material uses something else.</p>
        )}
        {status && (
          <PanelSection title="Your status">
            <div className={`p-3 rounded-xl ${MUTED_TINT_CLS}`}>
              <div className="flex items-center gap-1.5 text-sm mb-1">
                <KnowledgeStatusIcon status={status.status} size={13} />
                {KNOWLEDGE_STATUS_META[status.status].label}
              </div>
              <p className="text-xs text-muted-foreground">{status.reason}</p>
            </div>
          </PanelSection>
        )}
        {learnFirst.length > 0 && <PanelSection title="Learn first">{chips(learnFirst)}</PanelSection>}
        {unlocks.length > 0 && <PanelSection title="Opens the way to">{chips(unlocks)}</PanelSection>}
        {kindOf.length > 0 && <PanelSection title="A type of">{chips(kindOf)}</PanelSection>}
        {types.length > 0 && <PanelSection title="Kinds of this">{chips(types)}</PanelSection>}
        {related.length > 0 && (
          <PanelSection title="Related">
            <div className="space-y-1">
              {related.map(({ id, note }) => (
                <div key={id} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-24 shrink-0">{note}</span>
                  <KnowledgeChip g={g} id={id} onSelect={onSelect} />
                </div>
              ))}
            </div>
          </PanelSection>
        )}
        {partOf.length > 0 && (
          <PanelSection title="Part of these skills">
            <NodeRows g={g} onSelect={onSelect} items={partOf.map(r => ({ id: r.from, note: skillNote(r.from) }))} />
          </PanelSection>
        )}
        {areas.length > 0 && (
          <PanelSection title="Topic">
            <NodeRows g={g} onSelect={onSelect} items={areas.map(id => ({ id }))} />
          </PanelSection>
        )}
        <WhereToLearn g={g} node={node} />
      </>
    );
  }

  if (node.label === 'JobRole') {
    const skills = outOf('REQUIRES', 'Skill').sort(byWeight);
    const readiness = personal ? analyze(g).readiness : null;
    body = (
      <>
        {readiness !== null && (
          <PanelSection title="Your readiness">
            <div className={`p-3 rounded-xl ${MUTED_TINT_CLS}`}>
              <div className="flex items-center gap-2">
                <Bar value={readiness} color={SKILL_STATE_META[proficiencyBand(readiness)].color} />
                <span className="text-sm font-medium w-10 text-right">{pct(readiness)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Across {skills.length} skills, weighted by how important each one is.</p>
            </div>
          </PanelSection>
        )}
        <PanelSection title="Skills this role needs">
          <NodeRows g={g} onSelect={onSelect} items={skills.map(r => ({ id: r.to, note: skillNote(r.to, r.props.weight as number) }))} />
        </PanelSection>
      </>
    );
  }

  if (node.label === 'KnowledgeArea') {
    const parent = inOf('PARENT_OF').map(r => r.from);
    const subs = outOf('PARENT_OF').sort((a, b) => (a.props.order as number) - (b.props.order as number)).map(r => r.to);
    const concepts = outOf('HAS').sort(byWeight).map(r => r.to);
    body = (
      <>
        {parent.length > 0 && <PanelSection title="Part of"><NodeRows g={g} onSelect={onSelect} items={parent.map(id => ({ id }))} /></PanelSection>}
        {subs.length > 0 && (
          <PanelSection title="Sub-topics">
            <NodeRows g={g} onSelect={onSelect} items={subs.map(id => ({ id, note: `${g.out.get(id)!.filter(r => r.type === 'HAS').length} concepts` }))} />
          </PanelSection>
        )}
        {concepts.length > 0 && (
          <PanelSection title="Concepts in this topic">
            <div className="flex flex-wrap gap-1.5">{concepts.map(k => <KnowledgeChip key={k} g={g} id={k} onSelect={onSelect} />)}</div>
          </PanelSection>
        )}
      </>
    );
  }

  return (
    <div className="bg-card border-2 border-border rounded-2xl flex flex-col overflow-hidden h-full shadow-xl">
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <LabelChip label={node.label} />
          <button onClick={onClose} aria-label="Close details"
            className="p-1.5 -mt-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <h3 className="leading-snug">{nodeName(node)}</h3>
        {node.props.description && <p className="text-sm text-muted-foreground leading-relaxed mt-1">{String(node.props.description)}</p>}
        {facts.filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {facts.filter(Boolean).map(f => <span key={f} className={`text-xs px-2 py-0.5 rounded-full ${MUTED_TINT_CLS}`}>{f}</span>)}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scroll-thin">{body}</div>
    </div>
  );
}

// ─── Schema view (meta-graph of the 9 labels and 12 relationships) ────────────

const META_POS: Record<NodeLabel, Pt> = {
  Account: { x: 170, y: 75 },
  Task: { x: 440, y: 75 },
  Content: { x: 610, y: 75 },
  JobRole: { x: 70, y: 255 },
  Skill: { x: 300, y: 255 },
  Knowledge: { x: 590, y: 255 },
  KnowledgeArea: { x: 820, y: 255 },
  Quiz: { x: 330, y: 445 },
  Mentor: { x: 470, y: 445 }
};
const META_R = 44;
const META_PILL = { hw: 50, hh: 19 };

// [type, from, to, where the label sits along the edge (0–1) — or, for a
// self-loop, the loop's angle in degrees]
const META_EDGES: [RelType, NodeLabel, NodeLabel, number, boolean?][] = [
  ['REQUIRES', 'JobRole', 'Skill', 0.5],
  ['REQUIRES', 'Skill', 'Knowledge', 0.5],
  ['REQUIRES', 'Skill', 'Skill', 160, true],
  ['RELATED_TO', 'Skill', 'Skill', 118, true],
  ['PREREQUISITE', 'Knowledge', 'Knowledge', 28, true],
  ['IS_A', 'Knowledge', 'Knowledge', 322, true],
  ['RELATED_TO', 'Knowledge', 'Knowledge', 78, true],
  ['PARENT_OF', 'KnowledgeArea', 'KnowledgeArea', 290, true],
  ['HAS', 'KnowledgeArea', 'Knowledge', 0.5],
  ['HAS_SKILL', 'Account', 'Skill', 0.5],
  ['PRACTICES', 'Task', 'Skill', 0.5],
  ['APPLIES', 'Task', 'Knowledge', 0.5],
  ['COVERS', 'Content', 'Knowledge', 0.45],
  ['ASSESSES', 'Quiz', 'Skill', 0.45],
  ['ASSESSES', 'Quiz', 'Knowledge', 0.64],
  ['COACHES', 'Mentor', 'Skill', 0.64],
  ['COACHES', 'Mentor', 'Knowledge', 0.45]
];

function metaOutline(label: NodeLabel, ux: number, uy: number) {
  if (!isShadow(label)) return META_R;
  return Math.min(ux ? META_PILL.hw / Math.abs(ux) : Infinity, uy ? META_PILL.hh / Math.abs(uy) : Infinity);
}

function SchemaView({ g, onPickLabel }: { g: Graph; onPickLabel: (l: NodeLabel) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const countLabel = (l: NodeLabel) => g.nodes.filter(n => n.label === l).length;
  const countRel = (t: RelType, a?: NodeLabel, b?: NodeLabel) => g.rels.filter(r =>
    r.type === t && (!a || g.byId.get(r.from)!.label === a) && (!b || g.byId.get(r.to)!.label === b)).length;
  const halo = { paintOrder: 'stroke' as const, stroke: 'var(--card)', strokeWidth: 4 };

  return (
    <div className="relative p-6 overflow-y-auto h-full scroll-thin">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-2xl">Graph schema</h2>
        <span className="text-xs text-muted-foreground">9 node labels · 12 relationship types · counts for {g.role.props.name as string}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Circles are graph-owned nodes with full properties. Dashed pills are shadow nodes that keep only an id and resolve the rest from their source system.
      </p>

      <div className="rounded-xl bg-card border border-border">
        <svg viewBox="0 0 920 500" className="w-full h-auto">
          <defs><EdgeMarkers prefix="meta" /></defs>
          {META_EDGES.map(([t, a, b, at, isLoop], i) => {
            const pa = META_POS[a];
            const pb = META_POS[b];
            const { color, dash } = REL_META[t];
            const dim = hover !== null && hover !== i;
            let d: string;
            let lx: number;
            let ly: number;
            let anchor: 'start' | 'middle' | 'end' = 'middle';
            if (isLoop) {
              const th = (at * Math.PI) / 180;
              const s = 0.24;
              const L = 58;
              const polar = (ang: number, dist: number) => [pa.x + Math.cos(ang) * dist, pa.y + Math.sin(ang) * dist];
              const [sx, sy] = polar(th - s, META_R + 1);
              const [ex, ey] = polar(th + s, META_R + 3);
              const [c1x, c1y] = polar(th - s * 1.9, META_R + L);
              const [c2x, c2y] = polar(th + s * 1.9, META_R + L);
              d = `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`;
              [lx, ly] = polar(th, META_R + L * 0.8 + 6);
              anchor = Math.cos(th) > 0.35 ? 'start' : Math.cos(th) < -0.35 ? 'end' : 'middle';
              if (anchor === 'middle') ly += Math.sin(th) * 6;
            } else {
              const dx = pb.x - pa.x;
              const dy = pb.y - pa.y;
              const len = Math.hypot(dx, dy);
              const ux = dx / len;
              const uy = dy / len;
              const ra = metaOutline(a, ux, uy) + 1;
              const rb = metaOutline(b, -ux, -uy) + 3;
              const sx = pa.x + ux * ra;
              const sy = pa.y + uy * ra;
              const ex = pb.x - ux * rb;
              const ey = pb.y - uy * rb;
              d = `M${sx},${sy} L${ex},${ey}`;
              lx = sx + (ex - sx) * at;
              ly = sy + (ey - sy) * at;
            }
            const n = countRel(t, a, b);
            return (
              <g key={i} opacity={dim ? 0.18 : 1} style={{ transition: 'opacity 0.15s' }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <path d={d} fill="none" style={{ stroke: color }} strokeWidth={1.8} strokeDasharray={dash}
                  strokeLinecap="round" {...edgeMarkerProps(t, 'meta')} />
                <path d={d} fill="none" stroke="transparent" strokeWidth={12} style={{ pointerEvents: 'stroke', cursor: 'help' }} />
                <text x={lx} y={ly + 3.5} textAnchor={anchor} fontSize={10} fontWeight={600} style={{ fill: color, ...halo }}>
                  {t}{REL_META[t].symmetric ? ' ↔' : ''}
                  <tspan fontWeight={400} style={{ fill: 'var(--muted-foreground)' }}> ·{n}</tspan>
                </text>
              </g>
            );
          })}

          {NODE_LABELS.map(l => {
            const p = META_POS[l];
            const c = NODE_META[l].color;
            const Icon = LABEL_ICON[l];
            const shadow = isShadow(l);
            return (
              <g key={l} transform={`translate(${p.x}, ${p.y})`} style={{ cursor: 'pointer' }} onClick={() => onPickLabel(l)}>
                {shadow ? (
                  <rect x={-META_PILL.hw} y={-META_PILL.hh} width={META_PILL.hw * 2} height={META_PILL.hh * 2} rx={META_PILL.hh}
                    fill="var(--card)" stroke={c} strokeWidth={1.8} strokeDasharray="4 3" />
                ) : (
                  <circle r={META_R} fill="var(--card)" stroke={c} strokeWidth={2.2} />
                )}
                {shadow
                  ? <rect x={-META_PILL.hw} y={-META_PILL.hh} width={META_PILL.hw * 2} height={META_PILL.hh * 2} rx={META_PILL.hh} fill={tint(c, 13)} />
                  : <circle r={META_R} fill={tint(c, 13)} />}
                {shadow ? (
                  <>
                    <Icon x={-META_PILL.hw + 10} y={-7} size={14} color={c} strokeWidth={2.2} />
                    <text x={-META_PILL.hw + 30} y={4} fontSize={11.5} fontWeight={600} fill="var(--foreground)">{l}</text>
                    <text x={META_PILL.hw - 9} y={4} textAnchor="end" fontSize={10} fill="var(--muted-foreground)">{countLabel(l)}</text>
                  </>
                ) : (
                  <>
                    <Icon x={-8} y={-26} size={16} color={c} strokeWidth={2.2} />
                    <text y={5} textAnchor="middle" fontSize={l === 'KnowledgeArea' ? 10.5 : 12} fontWeight={600} fill="var(--foreground)">{l}</text>
                    <text y={20} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">{countLabel(l)} nodes</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <h3 className="text-base mt-6 mb-2">Relationships</h3>
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={`text-xs text-muted-foreground ${MUTED_TINT_CLS}`}>
            <tr>
              <th className="text-left font-normal px-3 py-2">Type</th>
              <th className="text-left font-normal px-3 py-2">Reads as</th>
              <th className="text-left font-normal px-3 py-2">From → To</th>
              <th className="text-left font-normal px-3 py-2">Properties</th>
              <th className="text-right font-normal px-3 py-2">Here</th>
            </tr>
          </thead>
          <tbody>
            {REL_TYPES.map(t => {
              const m = REL_META[t];
              return (
                <tr key={t} className="border-t border-border align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2"><RelSwatch type={t} width={26} /><span className="font-medium text-xs" style={{ color: m.color }}>{t}</span></div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{m.reading}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    {m.endpoints.map(([a, b]) => <div key={a + b}>{a} {m.symmetric ? '↔' : '→'} {b}</div>)}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono">
                    {m.props.length ? m.props.map(p => (
                      <div key={p.name}>{p.name}{p.required && <span className="text-[#e05992]">*</span>}<span className="text-muted-foreground"> {p.type}{p.enum ? ` (${p.enum.join(' · ')})` : p.range ? ` [${p.range.join('–')}]` : ''}</span></div>
                    )) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right">{countRel(t)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="text-base mt-6 mb-2">Nodes</h3>
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={`text-xs text-muted-foreground ${MUTED_TINT_CLS}`}>
            <tr>
              <th className="text-left font-normal px-3 py-2">Label</th>
              <th className="text-left font-normal px-3 py-2">Group</th>
              <th className="text-left font-normal px-3 py-2">Properties</th>
              <th className="text-right font-normal px-3 py-2">Here</th>
            </tr>
          </thead>
          <tbody>
            {NODE_LABELS.map(l => {
              const m = NODE_META[l];
              return (
                <tr key={l} className="border-t border-border align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><NodeSwatch label={l} /><span className="font-medium">{l}</span></div>
                    <div className="text-xs text-muted-foreground mt-0.5 max-w-[14rem] whitespace-normal">{m.reading}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{m.group}</td>
                  <td className="px-3 py-2 text-xs font-mono">
                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
                      {m.props.map(p => (
                        <span key={p.name}>{p.name}{p.required && <span className="text-[#e05992]">*</span>}{p.name === m.pk && <span className="text-muted-foreground"> (PK)</span>}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">{countLabel(l)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-2"><span className="text-[#e05992]">*</span> required property. source and status are shared by every label.</p>
    </div>
  );
}

// ─── Other views ──────────────────────────────────────────────────────────────

// ─── Knowledge status chips (Roadmap) ─────────────────────────────────────────
// The chip keeps Knowledge's teal identity; status is carried by fill + icon:
// mastered = solid teal with a check, needs review = lighter teal with a violet
// ring and a refresh icon, not learned = empty dashed outline.

const KNOWLEDGE_STATUS_ORDER: KnowledgeStatus[] = ['mastered', 'review', 'not-learned'];

function KnowledgeStatusIcon({ status, size = 11 }: { status: KnowledgeStatus; size?: number }) {
  if (status === 'mastered') return <Check size={size} strokeWidth={3} className="shrink-0" style={{ color: NODE_META.Knowledge.color }} />;
  if (status === 'review') return <RotateCcw size={size} strokeWidth={2.5} className="shrink-0" style={{ color: 'var(--state-review)' }} />;
  return <Circle size={size - 1} strokeWidth={2} className="shrink-0 text-muted-foreground" />;
}

function knowledgeChipStyle(status: KnowledgeStatus): React.CSSProperties {
  const teal = NODE_META.Knowledge.color;
  if (status === 'mastered') return { backgroundColor: tint(teal, 22), border: '1px solid transparent' };
  if (status === 'review') return { backgroundColor: tint(teal, 10), border: '1px solid var(--state-review)' };
  return { backgroundColor: 'transparent', border: `1px dashed ${tint(teal, 70)}` };
}

// Without personal data (public page) the chip is plain teal: no status icon
function KnowledgeChip({ g, id, onSelect }: { g: Graph; id: string; onSelect: (id: string) => void }) {
  const { personal, system } = useAudience();
  const kn = g.byId.get(id)!;
  const { status, reason } = knowledgeStatus(g, id);
  const covered = g.in.get(id)!.some(r => r.type === 'COVERS');
  const coveredNote = covered ? (system ? ' · Content covers this' : ' · Has a lesson') : '';
  return (
    <button onClick={() => onSelect(id)}
      style={personal ? knowledgeChipStyle(status) : { backgroundColor: tint(NODE_META.Knowledge.color, 14), border: '1px solid transparent' }}
      title={personal ? `${KNOWLEDGE_STATUS_META[status].label} — ${reason}${coveredNote}` : `${nodeName(kn)}${coveredNote}`}
      className={`inline-flex items-center gap-1 max-w-full text-left text-xs px-2 py-1 rounded-full hover:ring-1 hover:ring-border/60 ${
        personal && status === 'not-learned' ? 'text-muted-foreground' : ''} ${kn.props.deprecated ? 'line-through opacity-60' : ''}`}>
      {personal && <KnowledgeStatusIcon status={status} />}
      <span className="truncate">{nodeName(kn)}</span>
      {covered && <span className="ml-0.5 text-[9px] leading-none" style={{ color: NODE_META.Content.color }}>●</span>}
    </button>
  );
}

// A skill's Knowledge in PREREQUISITE order, with a per-status tally
function KnowledgeChain({ g, skillId, onSelect }: { g: Graph; skillId: string; onSelect: (id: string) => void }) {
  const { personal } = useAudience();
  const ks = g.out.get(skillId)!.filter(r => r.type === 'REQUIRES' && g.byId.get(r.to)!.label === 'Knowledge').map(r => r.to);
  const order = topoOrder(ks, g.rels, 'PREREQUISITE');
  const tally = personal
    ? KNOWLEDGE_STATUS_ORDER.map(s => [s, ks.filter(k => knowledgeStatus(g, k).status === s).length] as const).filter(([, n]) => n > 0)
    : [];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-1.5">
        {tally.map(([s, n]) => (
          <span key={s} className="inline-flex items-center gap-1"><KnowledgeStatusIcon status={s} size={10} />{n} {KNOWLEDGE_STATUS_META[s].label.toLowerCase()}</span>
        ))}
        {!personal && <span>{ks.length} concepts, in learning order</span>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {order.map((k, j) => (
          <span key={k} className="flex items-center gap-1.5">
            {j > 0 && <ChevronRight size={11} className="text-muted-foreground" />}
            <KnowledgeChip g={g} id={k} onSelect={onSelect} />
          </span>
        ))}
      </div>
    </div>
  );
}

// A compact roadmap row (Not reached yet / Mastered) that opens to the same
// Knowledge chain the Up next cards show. The row itself toggles; opening the
// skill's detail drawer is a separate link inside, so the two never collide.
function ExpandableSkillRow({ g, id, open, onToggle, onSelect, lead, detail, trail, muted = false }: {
  g: Graph;
  id: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  lead: React.ReactNode;
  detail?: React.ReactNode;
  trail?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl ${MUTED_TINT_CLS}`}>
      <button onClick={onToggle} aria-expanded={open}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${muted ? 'text-muted-foreground hover:text-foreground' : ''}`}>
        <span className="shrink-0 flex">{lead}</span>
        <span className={`text-sm w-32 shrink-0 truncate ${muted ? 'text-foreground/80' : ''}`}>{nodeName(g.byId.get(id)!)}</span>
        {/* min-w-0 lets a flex item shrink below its content width — without it, truncate has nothing to clip against */}
        <span className="min-w-0 flex-1 flex">{detail}</span>
        <span className="shrink-0">{trail}</span>
        <ChevronDown size={14} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 space-y-2">
          <KnowledgeChain g={g} skillId={id} onSelect={onSelect} />
          <button onClick={() => onSelect(id)} className="text-xs text-muted-foreground hover:text-foreground">Skill details →</button>
        </div>
      )}
    </div>
  );
}

// Public roadmap: the same learning order, with no personal state — every skill
// shown in full, in the order its prerequisites allow.
function PublicRoadmap({ g, onSelect }: { g: Graph; onSelect: (id: string) => void }) {
  const required = g.out.get(g.role.id)!.filter(r => r.type === 'REQUIRES').sort((a, b) => ((b.props.weight as number) ?? 1) - ((a.props.weight as number) ?? 1));
  const weightOf = new Map(required.map(r => [r.to, r.props.weight as number]));
  const order = topoOrder(required.map(r => r.to), g.rels, 'REQUIRES', true);
  return (
    <div className="relative p-6 overflow-y-auto h-full scroll-thin">
      <h2 className="text-2xl mb-1">Roadmap to {String(g.role.props.name)}</h2>
      <p className="text-sm text-muted-foreground mb-3">
        The skills this role needs, in the order to learn them — each one comes after the skills it builds on.
      </p>
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 mb-5 rounded-xl text-xs text-muted-foreground ${MUTED_TINT_CLS}`}>
        <span className="inline-flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-foreground" style={{ backgroundColor: tint(NODE_META.Knowledge.color, 14) }}>Knowledge</span>
          concepts inside each skill, in learning order
        </span>
        <span className="inline-flex items-center gap-1"><span className="text-[9px]" style={{ color: NODE_META.Content.color }}>●</span> has a lesson</span>
      </div>
      <div className="space-y-3">
        {order.map((id, i) => {
          const deps = g.out.get(id)!.filter(r => r.type === 'REQUIRES' && g.byId.get(r.to)!.label === 'Skill').map(r => g.byId.get(r.to)!);
          const skill = g.byId.get(id)!;
          return (
            <div key={id} className="p-4 rounded-xl bg-background">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${MUTED_TINT_CLS}`}>{i + 1}</span>
                <button onClick={() => onSelect(id)} className="text-sm font-medium hover:underline">{nodeName(skill)}</button>
                <span className={`text-xs px-2 py-0.5 rounded-full ${MUTED_TINT_CLS}`}>{levelLabel(skill.props.level)}</span>
                <span className="text-xs text-muted-foreground ml-auto">{importance(weightOf.get(id))}</span>
              </div>
              {skill.props.description && <p className="text-xs text-muted-foreground mb-2">{String(skill.props.description)}</p>}
              {deps.length > 0 && <div className="text-xs text-muted-foreground mb-2">Builds on: {deps.map(d => nodeName(d)).join(', ')}</div>}
              <KnowledgeChain g={g} skillId={id} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoadmapView({ g, onSelect }: { g: Graph; onSelect: (id: string) => void }) {
  const { personal, system } = useAudience();
  const { rows, focus } = useMemo(() => analyze(g), [g]);
  // Compact rows (Not reached yet / Mastered) that are opened to show their Knowledge
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggle = (id: string) => setExpanded(e => (e.includes(id) ? e.filter(x => x !== id) : [...e, id]));
  const weightText = (w: number) => (system ? `weight ${w}` : importance(w));
  if (!personal) return <PublicRoadmap g={g} onSelect={onSelect} />;
  // Dependencies first (Skill REQUIRES Skill points at the dependency), then in
  // focus order (priority, ties broken by how much a skill unlocks)
  const focusIds = focus.map(r => r.node.id);
  const byPriority = [...focusIds, ...[...rows].sort((a, b) => b.priority - a.priority).map(r => r.node.id).filter(id => !focusIds.includes(id))];
  const order = topoOrder(byPriority, g.rels, 'REQUIRES', true);
  const rowOf = new Map(rows.map(r => [r.node.id, r]));

  // A path, not a report card: what can be worked on now comes first and in
  // full; skills whose prerequisites aren't in place wait, muted, below.
  const upNext = order.filter(id => !['locked', 'expert'].includes(rowOf.get(id)!.state));
  const later = order.filter(id => rowOf.get(id)!.state === 'locked');
  const mastered = order.filter(id => rowOf.get(id)!.state === 'expert');
  const startHere = focus[0]?.node.id;

  const sectionTitle = (title: string, count: number, hint: string) => (
    <div className="flex items-baseline gap-2 mt-6 mb-2 first:mt-0">
      <h3 className="text-sm">{title}</h3>
      <span className="text-xs text-muted-foreground">{count} · {hint}</span>
    </div>
  );

  return (
    <div className="relative p-6 overflow-y-auto h-full scroll-thin">
      <h2 className="text-2xl mb-1">Roadmap to {String(g.role.props.name)}</h2>
      <p className="text-sm text-muted-foreground mb-3">
        {system
          ? <>JobRole → REQUIRES → Skill, with prerequisite skills first. A skill is reachable once every skill it requires is at {pct(UNLOCK_AT)} or more.</>
          : <>Skills in the order to learn them — the ones you can work on now come first. A skill opens up once each skill it builds on is at {pct(UNLOCK_AT)} or more.</>}
      </p>
      {/* Knowledge status legend — derived from the parent skill's HAS_SKILL, see knowledgeStatus() */}
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 mb-5 rounded-xl text-xs ${MUTED_TINT_CLS}`}>
        <span className="text-muted-foreground">Knowledge:</span>
        {KNOWLEDGE_STATUS_ORDER.map(s => (
          <span key={s} className="inline-flex items-center gap-1.5" title={KNOWLEDGE_STATUS_META[s].hint}>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={knowledgeChipStyle(s)}>
              <KnowledgeStatusIcon status={s} size={10} /><span className={s === 'not-learned' ? 'text-muted-foreground' : ''}>{KNOWLEDGE_STATUS_META[s].label}</span>
            </span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <span className="text-[9px]" style={{ color: NODE_META.Content.color }}>●</span> {system ? 'has Content' : 'has a lesson'}
        </span>
        <span className="text-muted-foreground ml-auto hidden md:inline">Hover a chip to see why</span>
      </div>

      {upNext.length > 0 && sectionTitle('Up next', upNext.length, 'you can work on these now')}
      <div className="space-y-3">
        {upNext.map((id, i) => {
          const row = rowOf.get(id)!;
          const deps = g.out.get(id)!.filter(r => r.type === 'REQUIRES' && g.byId.get(r.to)!.label === 'Skill').map(r => g.byId.get(r.to)!);
          const first = id === startHere;
          return (
            <div key={id} className={`p-4 rounded-xl bg-background ${first ? 'ring-2 ring-[#1e3e4e]/40 dark:ring-[#9ccbdd]/50' : ''}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${MUTED_TINT_CLS}`}>{i + 1}</span>
                <button onClick={() => onSelect(id)} className="text-sm font-medium hover:underline">{nodeName(row.node)}</button>
                <StatePill state={row.state} />
                {first && (
                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: BRAND_HEX }}>
                    {row.prof === null ? 'Start here' : 'Focus next'}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">{weightText(row.weight)}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Bar value={row.prof ?? 0} color={SKILL_STATE_META[row.state].color} trackCls={MUTED_TINT_CLS} />
                <span className="text-xs w-9 text-right">{row.prof !== null ? pct(row.prof) : '—'}</span>
              </div>
              {deps.length > 0 && (
                <div className="text-xs text-muted-foreground mb-2">Builds on: {deps.map(d => nodeName(d)).join(', ')}</div>
              )}
              <KnowledgeChain g={g} skillId={id} onSelect={onSelect} />
            </div>
          );
        })}
      </div>

      {later.length > 0 && sectionTitle('Not reached yet', later.length, 'unlock as their prerequisites land')}
      <div className="space-y-1.5">
        {later.map(id => {
          const row = rowOf.get(id)!;
          const deps = blockingSkills(g, id).map(d => nodeName(g.byId.get(d)!));
          return (
            <ExpandableSkillRow key={id} g={g} id={id} open={expanded.includes(id)} onToggle={() => toggle(id)} onSelect={onSelect} muted
              lead={<StateMark state="locked" size={12} />}
              detail={<span className="text-xs truncate">after {deps.join(', ')}</span>}
              trail={<span className="text-xs">{weightText(row.weight)}</span>} />
          );
        })}
      </div>

      {mastered.length > 0 && sectionTitle('Mastered', mastered.length, '80% or more')}
      <div className="space-y-1.5">
        {mastered.map(id => {
          const row = rowOf.get(id)!;
          return (
            <ExpandableSkillRow key={id} g={g} id={id} open={expanded.includes(id)} onToggle={() => toggle(id)} onSelect={onSelect}
              lead={<CheckCircle size={13} style={{ color: SKILL_STATE_META.expert.color }} />}
              trail={<span className="text-xs text-muted-foreground">{row.prof !== null ? pct(row.prof) : ''}</span>} />
          );
        })}
      </div>
    </div>
  );
}

function EvidenceView({ g, onSelect }: { g: Graph; onSelect: (id: string) => void }) {
  const { system } = useAudience();
  const skills = g.nodes.filter(n => n.label === 'Skill');
  return (
    <div className="relative p-6 overflow-y-auto h-full scroll-thin">
      <h2 className="text-2xl mb-1">Evidence — {String(g.role.props.name)}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {system
          ? 'Account → HAS_SKILL → Skill, with the tasks (PRACTICES), quizzes (ASSESSES) and mentors (COACHES) that back it up.'
          : 'How your progress on each skill was measured, and the projects, quizzes and mentors that can move it forward.'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skills.map(s => {
          const hs = hasSkillOf(g, s.id);
          const state = skillState(g, s.id);
          const res = resourcesFor(g, s.id);
          return (
            <div key={s.id} onClick={() => onSelect(s.id)}
              className="p-4 rounded-xl bg-background cursor-pointer hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={13} className={BRAND_INK_CLS} />
                <span className="text-sm font-medium flex-1 truncate">{nodeName(s)}</span>
                <StatePill state={state} />
              </div>
              {hs ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Bar value={hs.props.proficiency as number} color={SKILL_STATE_META[state].color} trackCls={MUTED_TINT_CLS} />
                    <span className="text-xs w-9 text-right">{pct(hs.props.proficiency as number)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-full h-1 rounded-full ${MUTED_TINT_CLS}`}>
                      <div className={`h-1 rounded-full ${BRAND_BAR_CLS}`} style={{ width: pct((hs.props.confidence as number) ?? 0) }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-28 text-right whitespace-nowrap">
                      {system ? `conf. ${pct((hs.props.confidence as number) ?? 0)}` : confidenceLabel(hs.props.confidence as number)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {system ? `via ${String(hs.props.source)}` : EVIDENCE_SOURCE_LABEL[String(hs.props.source)] ?? 'Recorded'} · {new Date(String(hs.props.lastUpdatedAt)).toLocaleDateString()}
                    {hs.props.credentials && <div className="truncate">🎓 {String(hs.props.credentials)}</div>}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground mb-1">{system ? 'No HAS_SKILL edge yet.' : 'No progress recorded yet.'} {stateNote(g, s.id)}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                {([[system ? 'tasks' : 'projects', res.tasks, Hammer], ['quizzes', res.quizzes, ListChecks], ['mentors', res.mentors, GraduationCap]] as const).map(([k, ids, Icon]) => (
                  <span key={k} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${MUTED_TINT_CLS} ${ids.length ? '' : 'opacity-50'}`}>
                    <Icon size={11} /> {ids.length} {k}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkillGapView({ g, onSelect }: { g: Graph; onSelect: (id: string) => void }) {
  const { system } = useAudience();
  const { rows, locked } = useMemo(() => analyze(g), [g]);
  const actionable = rows.filter(r => r.state !== 'locked').sort((a, b) => b.priority - a.priority);
  return (
    <div className="relative p-6 overflow-y-auto h-full scroll-thin">
      <h2 className="text-2xl mb-1">Skill gap — {String(g.role.props.name)}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {system
          ? "Priority = REQUIRES.weight × (1 − HAS_SKILL.proficiency), for skills you can work on now. Skills whose prerequisites aren't in place yet are listed separately — not having them is expected."
          : "Skills ranked by how much they'd move you toward this role — the important ones you're furthest from come first. Skills that need others first are listed separately; not having them yet is expected."}
      </p>
      <div className="space-y-2">
        {actionable.map(r => (
          <button key={r.node.id} onClick={() => onSelect(r.node.id)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-background text-left hover:shadow-sm transition-shadow">
            <StateMark state={r.state} />
            <span className="text-sm w-32 truncate">{nodeName(r.node)}</span>
            <div className="flex-1"><Bar value={r.prof ?? 0} color={SKILL_STATE_META[r.state].color} trackCls={MUTED_TINT_CLS} h="h-2" /></div>
            <span className="text-sm w-10 text-right">{r.prof !== null ? pct(r.prof) : '—'}</span>
            {system ? (
              <>
                <span className="text-xs text-muted-foreground w-16 text-right hidden sm:inline">w {r.weight}</span>
                <span className="text-xs w-20 text-right">priority {r.priority.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground w-24 text-right hidden sm:inline">{importance(r.weight)}</span>
            )}
          </button>
        ))}
      </div>
      {locked.length > 0 && (
        <>
          <div className="flex items-baseline gap-2 mt-6 mb-2">
            <h3 className="text-sm">Not reached yet</h3>
            <span className="text-xs text-muted-foreground">{locked.length} · not counted as gaps</span>
          </div>
          <div className="space-y-1.5">
            {locked.map(r => (
              <button key={r.node.id} onClick={() => onSelect(r.node.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-muted-foreground hover:text-foreground transition-colors ${MUTED_TINT_CLS}`}>
                <StateMark state="locked" size={12} />
                <span className="text-sm w-32 shrink-0 truncate text-foreground/80">{nodeName(r.node)}</span>
                <span className="text-xs truncate min-w-0 flex-1">after {blockingSkills(g, r.node.id).map(d => nodeName(g.byId.get(d)!)).join(', ')}</span>
                <span className="text-xs shrink-0 hidden sm:inline">{system ? `w ${r.weight}` : importance(r.weight)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

const PANEL_CLS = `rounded-2xl p-4 ${MUTED_TINT_CLS}`;

function CareerReadinessCard({ g }: { g: Graph }) {
  const { system } = useAudience();
  const { rows, readiness, owned } = useMemo(() => analyze(g), [g]);
  // Same ramp as the skills: readiness is "how far along", not a pass/fail grade
  const color = SKILL_STATE_META[proficiencyBand(readiness)].color;
  return (
    <div className={PANEL_CLS}>
      <PanelHeader icon={<Briefcase size={13} />} title="Career Readiness" />
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="var(--background)" strokeWidth="6" />
            {readiness > 0 && (
              <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={`${readiness * 150.8} 150.8`} strokeLinecap="round" />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium">{pct(readiness)}</span>
          </div>
        </div>
        <div>
          <div className="text-sm mb-0.5">{String(g.role.props.name)}</div>
          <div className="text-xs text-muted-foreground">
            {system ? `Weighted by REQUIRES.weight over ${rows.length} skills` : `Across ${rows.length} skills, weighted by importance`}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Required', v: rows.length, icon: <Zap size={12} /> },
          { label: 'Owned', v: rows.filter(r => r.prof !== null).length, icon: <CheckCircle size={12} /> },
          { label: 'Verified', v: owned.filter(r => (r.props.confidence as number) >= 0.7).length, icon: <Shield size={12} /> }
        ].map(item => (
          <div key={item.label} className="bg-background rounded-lg p-2">
            <div className="flex justify-center mb-1 text-muted-foreground">{item.icon}</div>
            <div className="text-sm">{item.v}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Top strength skills, plus the Knowledge whose derived status is "needs
// review" (learned, but shaky, rusty or on weak evidence) — same rule as the
// Roadmap chips. Knowledge behind the strongest skills comes first.
function StrengthsCard({ g, onSelect }: { g: Graph; onSelect: (id: string) => void }) {
  const { strengths, owned } = useMemo(() => analyze(g), [g]);
  const toReview = useMemo(() => {
    const seen = new Set<string>();
    [...owned]
      .sort((a, b) => (b.props.proficiency as number) - (a.props.proficiency as number))
      .forEach(r => requiredKnowledge(g, r.to).forEach(k => {
        if (!g.byId.get(k)!.props.deprecated && knowledgeStatus(g, k).status === 'review') seen.add(k);
      }));
    return [...seen].slice(0, 5);
  }, [g, owned]);

  return (
    <div className={PANEL_CLS}>
      <PanelHeader icon={<Award size={13} />} title="Strengths" />
      <div className="space-y-2">
        {strengths.length === 0 && <p className="text-sm text-muted-foreground">No proficiency recorded yet.</p>}
        {strengths.map((r, i) => {
          const p = r.props.proficiency as number;
          return (
            <button key={r.id} onClick={() => onSelect(r.to)} className="w-full flex items-center gap-2 text-sm hover:text-foreground">
              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
              <span className="flex-1 truncate text-left">{nodeName(g.byId.get(r.to)!)}</span>
              <div className="w-12"><Bar value={p} color={SKILL_STATE_META[skillState(g, r.to)].color} h="h-1" /></div>
              <span className="text-xs w-8 text-right">{pct(p)}</span>
            </button>
          );
        })}
      </div>
      {toReview.length > 0 && (
        <>
          <div className="text-xs text-muted-foreground mb-1.5 pt-2 mt-2 border-t border-border">
            Knowledge to review <span className="opacity-70">— learned, but shaky or rusty</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {toReview.map(k => <KnowledgeChip key={k} g={g} id={k} onSelect={onSelect} />)}
          </div>
        </>
      )}
    </div>
  );
}

// Highest-priority actionable skills, with a way out to the full ranked list.
function FocusNextCard({ g, onSelect, onOpenView }: { g: Graph; onSelect: (id: string) => void; onOpenView: () => void }) {
  const { focus } = useMemo(() => analyze(g), [g]);
  return (
    <div className={PANEL_CLS}>
      <PanelHeader icon={<Target size={13} />} title="Focus Next"
        action={<button onClick={onOpenView} className="text-xs text-muted-foreground hover:text-foreground">Skill gap →</button>} />
      <div className="space-y-1.5">
        {focus.length === 0 && <p className="text-sm text-muted-foreground">No gaps you can act on right now.</p>}
        {focus.slice(0, 4).map(r => (
          <button key={r.node.id} onClick={() => onSelect(r.node.id)} className="w-full flex items-center gap-2 text-sm hover:text-foreground">
            <StateMark state={r.state} size={8} />
            <span className="flex-1 truncate text-left">{nodeName(r.node)}</span>
            <span className="text-xs text-muted-foreground">{r.prof !== null ? pct(r.prof) : 'start'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LearningTimeline({ g }: { g: Graph }) {
  const { system } = useAudience();
  const { owned } = useMemo(() => analyze(g), [g]);
  const events = [...owned].sort((a, b) => Date.parse(String(b.props.lastUpdatedAt)) - Date.parse(String(a.props.lastUpdatedAt))).slice(0, 5);
  return (
    <div className={PANEL_CLS}>
      <PanelHeader icon={<Calendar size={13} />} title="Learning Journey" />
      {events.length === 0 && <p className="text-sm text-muted-foreground">Your progress will show up here once you complete a quiz, task or mentor session.</p>}
      <div className="space-y-1">
        {events.map((e, i) => (
          <div key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${i === 0 ? BRAND_BAR_CLS : 'bg-muted-foreground/40'}`} />
              {i < events.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="pb-2 min-w-0">
              <div className="text-xs text-muted-foreground">{new Date(String(e.props.lastUpdatedAt)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className="text-sm">{nodeName(g.byId.get(e.to)!)} → {pct(e.props.proficiency as number)} <span className="text-muted-foreground text-xs">{system ? `via ${String(e.props.source)}` : EVIDENCE_SOURCE_LABEL[String(e.props.source)]?.toLowerCase()}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Public overview cards (no personal data) ─────────────────────────────────

function RoleOverviewCards({ g, onSelect }: { g: Graph; onSelect: (id: string) => void }) {
  const required = g.out.get(g.role.id)!.filter(r => r.type === 'REQUIRES')
    .sort((a, b) => ((b.props.weight as number) ?? 1) - ((a.props.weight as number) ?? 1));
  const skillIds = required.map(r => r.to);
  const concepts = new Set(skillIds.flatMap(id => requiredKnowledge(g, id)));
  // Entry points: required skills that don't build on another skill
  const starts = skillIds.filter(id => !g.out.get(id)!.some(r => r.type === 'REQUIRES' && g.byId.get(r.to)!.label === 'Skill'));
  const count = (label: NodeLabel) => g.nodes.filter(n => n.label === label).length;
  const resources: [string, number, LucideIcon, string][] = [
    ['Lessons', count('Content'), BookOpen, '/courses'],
    ['Projects', count('Task'), Hammer, '/projects'],
    ['Quizzes', count('Quiz'), ListChecks, '/assessment'],
    ['Mentors', count('Mentor'), GraduationCap, '/mentors']
  ];
  const row = 'w-full flex items-center gap-2 text-sm text-left hover:text-foreground';

  return (
    <>
      <div className={PANEL_CLS}>
        <PanelHeader icon={<Briefcase size={13} />} title="About this role" />
        <div className="text-sm mb-1">{String(g.role.props.name)}</div>
        {g.role.props.description && <p className="text-xs text-muted-foreground mb-3">{String(g.role.props.description)}</p>}
        <div className="grid grid-cols-2 gap-2 text-center">
          {[['Skills', skillIds.length], ['Concepts', concepts.size]].map(([l, v]) => (
            <div key={l} className="bg-background rounded-lg p-2">
              <div className="text-sm">{v}</div>
              <div className="text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={PANEL_CLS}>
        <PanelHeader icon={<Award size={13} />} title="Most important skills" />
        <div className="space-y-1.5">
          {required.slice(0, 4).map(r => (
            <button key={r.to} onClick={() => onSelect(r.to)} className={row}>
              <NodeSwatch label="Skill" size={11} />
              <span className="flex-1 truncate">{nodeName(g.byId.get(r.to)!)}</span>
              <span className="text-xs text-muted-foreground">{importance(r.props.weight as number)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={PANEL_CLS}>
        <PanelHeader icon={<Compass size={13} />} title="Where to start" />
        <p className="text-xs text-muted-foreground mb-2">These don't build on any other skill in this role.</p>
        <div className="space-y-1.5">
          {starts.map(id => (
            <button key={id} onClick={() => onSelect(id)} className={row}>
              <NodeSwatch label="Skill" size={11} />
              <span className="flex-1 truncate">{nodeName(g.byId.get(id)!)}</span>
              <span className="text-xs text-muted-foreground">{levelLabel(g.byId.get(id)!.props.level)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={PANEL_CLS}>
        <PanelHeader icon={<BookOpen size={13} />} title="Learning resources" />
        <div className="space-y-1.5">
          {resources.map(([l, n, Icon, to]) => (
            <a key={l} href={to} className="flex items-center gap-2 text-sm hover:text-foreground">
              <Icon size={13} className="text-muted-foreground" />
              <span className="flex-1">{l}</span>
              <span className="text-xs text-muted-foreground">{n}</span>
              <ChevronRight size={13} className="text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SkillGraphExplorer({ audience }: { audience: Audience }) {
  const cfg = AUDIENCES[audience];
  const [domain, setDomain] = useState<string>('Frontend Development');
  const [newLearner, setNewLearner] = useState(false);
  const [g, setG] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const roleMap: Record<string, string> = {
      'Frontend': 'Frontend Developer',
      'Backend': 'Backend Developer',
      'Mobile': 'Mobile Developer',
      'AI': 'AI Engineer',
      'Data Engineering': 'Data Engineer'
    };
    import('../data/api').then(({ fetchGraphForRole }) => {
      fetchGraphForRole(roleMap[domain] || domain).then(data => {
        if (cfg.previewNewLearner && newLearner) {
          data.rels = data.rels.filter(r => r.type !== 'HAS_SKILL');
          data.out.forEach((rels, key) => data.out.set(key, rels.filter(r => r.type !== 'HAS_SKILL')));
          data.in.forEach((rels, key) => data.in.set(key, rels.filter(r => r.type !== 'HAS_SKILL')));
        }
        setG(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    });
  }, [domain, newLearner, cfg.previewNewLearner]);

  if (loading || !g) {
    return <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      Loading graph data from Kmin backend...
    </div>;
  }

  return <SkillGraphExplorerInner g={g} cfg={cfg} domain={domain} setDomain={setDomain} newLearner={newLearner} setNewLearner={setNewLearner} />;
}

function SkillGraphExplorerInner({ g, cfg, domain, setDomain, newLearner, setNewLearner }: { g: any, cfg: AudienceConfig, domain: string, setDomain: (d: string) => void, newLearner: boolean, setNewLearner: React.Dispatch<React.SetStateAction<boolean>> }) {
  const { system, personal } = cfg;
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [colorMode, setColorMode] = useState<ColorMode>('label');
  const [hiddenLabels, setHiddenLabels] = useState<NodeLabel[]>(['Knowledge']);
  const [hiddenRels, setHiddenRels] = useState<RelType[]>([]);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState({ x: 40, y: 40, k: 1 });
  const [issuesOpen, setIssuesOpen] = useState(false);

  const pos = useMemo(() => layoutGraph(g), [g]);
  const issues = useMemo(() => validateGraph(g), [g]);

  // Public page has no personal data to colour by
  const effectiveColorMode: ColorMode = personal ? colorMode : 'label';

  // Non-system audiences never see shadow nodes or their edges; the graph
  // still holds them (proficiency and resources are derived from them).
  const visibleNodes = useMemo(
    () => g.nodes.filter(n => (system || !isShadow(n.label)) && !hiddenLabels.includes(n.label)),
    [g, hiddenLabels, system]
  );
  const visibleRels = useMemo(() => {
    const ids = new Set(visibleNodes.map(n => n.id));
    return g.rels.filter(r => (system || LEARNER_RELS.includes(r.type)) && !hiddenRels.includes(r.type) && ids.has(r.from) && ids.has(r.to));
  }, [g, visibleNodes, hiddenRels, system]);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(g.nodes.filter(n => {
      if (!system && isShadow(n.label)) return false;
      const aliases = Array.isArray(n.props.aliases) ? n.props.aliases : [];
      const hay = (system ? [n.id, n.props.name, ...aliases, SOURCE_RECORDS[n.id]?.title] : [n.props.name, ...aliases])
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    }).map(n => n.id));
  }, [g, query, system]);

  const selectNode = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) setQuery('');
  }, []);

  // ── Pan & zoom ──
  const graphContentRef = useRef<SVGGElement>(null);
  const graphBoxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  // Whether the last pointer gesture was a pan, so the click that ends it
  // doesn't also select/deselect a node.
  const panned = useRef(false);

  const fitToView = useCallback(() => {
    const gEl = graphContentRef.current;
    const box = graphBoxRef.current;
    if (!gEl || !box) return;
    const b = gEl.getBBox();
    if (!b.width || !b.height) return;
    const pad = 28;
    const k = Math.min((box.clientWidth - pad * 2) / b.width, (box.clientHeight - pad * 2) / b.height, 1.3);
    setView({
      k,
      x: (box.clientWidth - b.width * k) / 2 - b.x * k,
      y: (box.clientHeight - b.height * k) / 2 - b.y * k
    });
  }, []);

  useEffect(() => {
    if (viewMode === 'graph') fitToView();
  }, [domain, viewMode, fitToView]);

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    const box = graphBoxRef.current;
    if (!box) return;
    const px = cx ?? box.clientWidth / 2;
    const py = cy ?? box.clientHeight / 2;
    setView(v => {
      const k = Math.max(0.3, Math.min(3, v.k * factor));
      const f = k / v.k;
      return { k, x: px - (px - v.x) * f, y: py - (py - v.y) * f };
    });
  }, []);

  // Native, non-passive wheel listener so the page doesn't scroll while zooming
  useEffect(() => {
    const box = graphBoxRef.current;
    if (!box || viewMode !== 'graph') return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest('[data-panel]')) return;
      e.preventDefault();
      const rect = box.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    box.addEventListener('wheel', onWheel, { passive: false });
    return () => box.removeEventListener('wheel', onWheel);
  }, [viewMode, zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('[data-node],[data-edge],button')) return;
    drag.current = { x: e.clientX - view.x, y: e.clientY - view.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current.moved = true;
    const { x, y } = drag.current;
    setView(v => ({ ...v, x: e.clientX - x, y: e.clientY - y }));
  };
  const onPointerUp = () => {
    panned.current = drag.current?.moved ?? false;
    drag.current = null;
  };

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter(x => x !== item) : [...list, item]);

  const selected = selectedId ? g.byId.get(selectedId) ?? null : null;
  const hoverNodeObj = hoveredNode ? g.byId.get(hoveredNode) : null;
  const hoverRelObj = hoveredEdge ? g.rels.find(r => r.id === hoveredEdge) : null;

  const VIEW_MODES = ([
    { v: 'graph', icon: <Network size={14} />, label: 'Graph' },
    { v: 'schema', icon: <Layers size={14} />, label: 'Schema' },
    { v: 'roadmap', icon: <MapIcon size={14} />, label: 'Roadmap' },
    { v: 'evidence', icon: <Shield size={14} />, label: 'Evidence' },
    { v: 'skill-gap', icon: <BarChart3 size={14} />, label: 'Skill Gap' }
  ] as { v: ViewMode; icon: React.ReactNode; label: string }[]).filter(m => cfg.views.includes(m.v));

  const nodeGroups = system ? (['graph-owned', 'shadow'] as const) : (['graph-owned'] as const);
  const relGroups = system ? REL_GROUPS : REL_GROUPS.filter(grp => grp.types.every(t => LEARNER_RELS.includes(t)));

  const zoomBtnCls = 'w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors';
  const filterRowCls = (active: boolean) => `w-full flex items-center gap-2 px-2 py-1 rounded-lg text-sm transition-colors ${
    active ? 'text-foreground hover:bg-background/60' : 'text-muted-foreground opacity-45 hover:opacity-75'
  }`;

  return (
    <AudienceCtx.Provider value={cfg}>
    <div className="space-y-8">
      {/* MARKER-MAKE-KIT-INVOKED */}
      {/* MARKER-MAKE-KIT-DISCOVERY-READ */}

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">{cfg.title}</h1>
          <p className="text-muted-foreground">{cfg.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchHits && searchHits.size) {
                  selectNode([...searchHits][0]);
                  setViewMode('graph');
                }
                if (e.key === 'Escape') setQuery('');
              }}
              placeholder={system ? 'Search nodes, ids, aliases…' : 'Search skills and concepts…'}
              className="w-60 pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {cfg.previewNewLearner && (
            <button
              onClick={() => { setNewLearner(v => !v); setSelectedId(null); }}
              aria-pressed={newLearner}
              title="Preview the page for an account with no HAS_SKILL edges yet"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-border transition-colors ${newLearner ? 'bg-muted' : 'hover:bg-muted'}`}
            >
              <UserPlus size={14} className={newLearner ? BRAND_INK_CLS : ''} />
              New learner
            </button>
          )}
        </div>
      </div>

      {/* Domain chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {(g.domains || []).map((d: string) => (
          <button
            key={d}
            onClick={() => { setDomain(d); setSelectedId(null); }}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              domain === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] gap-6 items-start">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 scroll-thin">
          <div className={`${PANEL_CLS} p-2 space-y-1`}>
            <div className="text-xs text-muted-foreground px-2 pt-1 pb-1">View</div>
            {VIEW_MODES.map(({ v, icon, label }) => (
              <button
                key={v}
                onClick={() => { setViewMode(v); if (v === 'schema') setSelectedId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {viewMode === 'graph' && (
            <>
              {personal && <div className={`${PANEL_CLS} p-2`}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 pt-1 pb-2"><Palette size={12} /> Color nodes by</div>
                <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-background/60">
                  {([['label', system ? 'Label' : 'Type'], ['proficiency', system ? 'Proficiency' : 'My progress']] as const).map(([m, l]) => (
                    <button key={m} onClick={() => setColorMode(m)}
                      className={`text-xs py-1.5 rounded-md transition-colors ${colorMode === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                      {l}
                    </button>
                  ))}
                </div>
                {colorMode === 'proficiency' && (
                  <div className="px-2 pt-2 space-y-1">
                    {SKILL_STATES.map(s => (
                      <div key={s} className="flex items-center gap-2 text-xs" title={SKILL_STATE_META[s].hint}>
                        <span className="w-3 flex justify-center"><StateMark state={s} /></span>
                        <span className="flex-1">{SKILL_STATE_META[s].label}</span>
                        <span className="text-muted-foreground">{g.nodes.filter(n => n.label === 'Skill' && skillState(g, n.id) === s).length}</span>
                      </div>
                    ))}
                    <p className="text-[11px] text-muted-foreground pt-1">
                      {system ? 'Skills only — from your HAS_SKILL.proficiency. Other labels are greyed.' : 'Skills only — from your progress on each one. Everything else is greyed.'}
                    </p>
                  </div>
                )}
              </div>}

              <div className={`${PANEL_CLS} p-2`}>
                <div className="flex items-center justify-between px-2 pt-1 pb-1">
                  <span className="text-xs text-muted-foreground">{system ? 'Nodes' : 'Show'}</span>
                  {hiddenLabels.length > 0 && <button onClick={() => setHiddenLabels([])} className="text-xs text-muted-foreground hover:text-foreground">Show all</button>}
                </div>
                {nodeGroups.map(group => (
                  <div key={group} className="mb-1">
                    {system && <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80 px-2 pt-1.5 pb-0.5">{group === 'shadow' ? 'Shadow (id only)' : 'Graph-owned'}</div>}
                    {NODE_LABELS.filter(l => NODE_META[l].group === group).map(l => {
                      const active = !hiddenLabels.includes(l);
                      return (
                        <button key={l} onClick={() => setHiddenLabels(h => toggle(h, l))} className={filterRowCls(active)} title={NODE_META[l].reading}>
                          <NodeSwatch label={l} size={13} />
                          <span className="truncate">{system ? l : FRIENDLY_LABEL[l]}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{g.nodes.filter(n => n.label === l).length}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className={`${PANEL_CLS} p-2`}>
                <div className="flex items-center justify-between px-2 pt-1 pb-1">
                  <span className="text-xs text-muted-foreground">{system ? 'Relationships' : 'Connections'}</span>
                  {hiddenRels.length > 0 && <button onClick={() => setHiddenRels([])} className="text-xs text-muted-foreground hover:text-foreground">Show all</button>}
                </div>
                {relGroups.map(({ title, types }) => (
                  <div key={title} className="mb-1">
                    {system && <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80 px-2 pt-1.5 pb-0.5">{title}</div>}
                    {types.map(t => {
                      const active = !hiddenRels.includes(t);
                      return (
                        <button key={t} onClick={() => setHiddenRels(h => toggle(h, t))} className={filterRowCls(active)} title={system ? REL_META[t].reading : undefined}>
                          <RelSwatch type={t} width={24} />
                          <span className={`truncate text-xs ${system ? 'font-medium' : ''}`}>{system ? t : FRIENDLY_REL[t].name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{g.rels.filter(r => r.type === t).length}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                <label className="flex items-center gap-2 px-2 pt-2 mt-1 border-t border-border text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={showEdgeLabels} onChange={e => setShowEdgeLabels(e.target.checked)} className="accent-current" />
                  {system ? 'Always show relationship names' : 'Always show connection names'}
                </label>
              </div>
            </>
          )}

          {system && <div className={`${PANEL_CLS} space-y-2 text-sm`}>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nodes</span>
              <span>{viewMode === 'graph' ? `${visibleNodes.length}/` : ''}{g.nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Relationships</span>
              <span>{viewMode === 'graph' ? `${visibleRels.length}/` : ''}{g.rels.length}</span>
            </div>
            <button onClick={() => setIssuesOpen(o => !o)} className="w-full flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Schema check</span>
              {issues.length === 0
                ? <span className="flex items-center gap-1" style={{ color: SKILL_STATE_META.advanced.color }}><CheckCircle size={13} /> valid</span>
                : <span className="flex items-center gap-1" style={{ color: SKILL_STATE_META.missing.color }}><AlertTriangle size={13} /> {issues.length} issues</span>}
            </button>
            {issuesOpen && (
              <div className="text-xs text-muted-foreground space-y-1">
                {issues.length === 0
                  ? <p>Endpoints, required properties and enums match the schema. Every Knowledge is REQUIRED by a Skill and sits in a leaf area; PARENT_OF, PREREQUISITE and IS_A have no cycles.</p>
                  : issues.map(i => <p key={i} className="break-words">• {i}</p>)}
              </div>
            )}
          </div>}
        </aside>

        {/* ── MAIN ── */}
        <div className="space-y-6 min-w-0">
          <div
            ref={graphBoxRef}
            className={`relative h-[74vh] min-h-[560px] max-h-[780px] rounded-2xl overflow-hidden ${MUTED_TINT_CLS} ${viewMode === 'graph' ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
            onPointerDown={viewMode === 'graph' ? onPointerDown : undefined}
            onPointerMove={viewMode === 'graph' ? onPointerMove : undefined}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {viewMode === 'graph' && (
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            )}

            {viewMode === 'graph' && (
              <GraphCanvas
                g={g}
                pos={pos}
                nodes={visibleNodes}
                rels={visibleRels}
                colorMode={effectiveColorMode}
                selectedId={selectedId}
                hoveredNode={hoveredNode}
                hoveredEdge={hoveredEdge}
                searchHits={searchHits}
                showEdgeLabels={showEdgeLabels}
                view={view}
                onSelect={id => { if (!panned.current) selectNode(id); panned.current = false; }}
                onHoverNode={setHoveredNode}
                onHoverEdge={setHoveredEdge}
                contentRef={graphContentRef}
              />
            )}

            {viewMode === 'schema' && (
              <SchemaView g={g} onPickLabel={l => { setHiddenLabels(NODE_LABELS.filter(x => x !== l)); setViewMode('graph'); }} />
            )}
            {viewMode === 'roadmap' && <RoadmapView g={g} onSelect={selectNode} />}
            {viewMode === 'evidence' && <EvidenceView g={g} onSelect={selectNode} />}
            {viewMode === 'skill-gap' && <SkillGapView g={g} onSelect={selectNode} />}

            {viewMode === 'graph' && (hoverRelObj || (hoverNodeObj && hoverNodeObj.id !== selectedId)) && (
              <div className={`absolute top-4 z-20 pointer-events-none ${selected ? 'left-4' : 'left-1/2 -translate-x-1/2'}`}>
                {hoverRelObj ? <EdgeTooltip g={g} rel={hoverRelObj} /> : hoverNodeObj && <NodeTooltip g={g} node={hoverNodeObj} />}
              </div>
            )}

            {viewMode === 'graph' && (
              <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10">
                <button aria-label="Zoom in" onClick={() => zoomAt(1.2)} className={zoomBtnCls}><ZoomIn size={14} /></button>
                <button aria-label="Zoom out" onClick={() => zoomAt(1 / 1.2)} className={zoomBtnCls}><ZoomOut size={14} /></button>
                <button aria-label="Fit to screen" onClick={fitToView} className={zoomBtnCls}><Maximize2 size={14} /></button>
              </div>
            )}

            {selected && (
              <div className="absolute top-3 right-3 bottom-3 w-[22rem] max-w-[calc(100%-1.5rem)] z-30" data-panel onPointerDown={e => e.stopPropagation()}>
                {system
                  ? <NodeDetail key={selected.id} g={g} node={selected} onClose={() => setSelectedId(null)} onSelect={selectNode} />
                  : <LearnerNodePanel key={selected.id} g={g} node={selected} onClose={() => setSelectedId(null)} onSelect={selectNode} />}
              </div>
            )}
          </div>

          {/* Encoding legend — below the canvas so it never covers nodes */}
          {viewMode === 'graph' && !system && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 -mt-3 text-xs text-muted-foreground">
              {(['JobRole', 'Skill', 'Knowledge', 'KnowledgeArea'] as NodeLabel[]).map(l => (
                <div key={l} className="flex items-center gap-1.5"><NodeSwatch label={l} /> {FRIENDLY_LABEL[l]}</div>
              ))}
              {personal && (
                <div className="flex items-center gap-1.5">
                  <svg width="18" height="18" aria-hidden><circle cx="9" cy="9" r="6.5" fill="none" stroke={NEUTRAL} strokeOpacity={0.3} strokeWidth="2.5" /><circle cx="9" cy="9" r="6.5" fill="none" stroke={NEUTRAL} strokeWidth="2.5" strokeDasharray="26 41" transform="rotate(-90 9 9)" /></svg>
                  Ring = your progress on the skill
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <svg width="30" height="12" aria-hidden><line x1="2" y1="6" x2="28" y2="6" stroke={NEUTRAL} strokeWidth="0.9" /><line x1="2" y1="10" x2="28" y2="10" stroke={NEUTRAL} strokeWidth="2.5" /></svg>
                Thicker line = more important
              </div>
              <div className="flex items-center gap-1.5"><Tag size={12} /> Hover a line to see how things connect</div>
            </div>
          )}
          {viewMode === 'graph' && system && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 -mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><NodeSwatch label="Skill" color={NEUTRAL} /> Graph-owned (full properties)</div>
              <div className="flex items-center gap-1.5"><NodeSwatch label="Task" color={NEUTRAL} /> Shadow (id only)</div>
              <div className="flex items-center gap-1.5">
                <svg width="18" height="18" aria-hidden><circle cx="9" cy="9" r="6.5" fill="none" stroke={NEUTRAL} strokeOpacity={0.3} strokeWidth="2.5" /><circle cx="9" cy="9" r="6.5" fill="none" stroke={NEUTRAL} strokeWidth="2.5" strokeDasharray="26 41" transform="rotate(-90 9 9)" /></svg>
                Ring = your HAS_SKILL.proficiency
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="30" height="12" aria-hidden><line x1="2" y1="6" x2="28" y2="6" stroke={NEUTRAL} strokeWidth="0.9" /><line x1="2" y1="10" x2="28" y2="10" stroke={NEUTRAL} strokeWidth="2.5" /></svg>
                Width = weight / proficiency
              </div>
              <div className="flex items-center gap-1.5"><Tag size={12} /> Hover a line for its properties</div>
            </div>
          )}

          {/* ── Summary cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {personal ? (
              <>
                <CareerReadinessCard g={g} />
                <StrengthsCard g={g} onSelect={id => { selectNode(id); setViewMode('graph'); }} />
                <FocusNextCard g={g} onSelect={id => { selectNode(id); setViewMode('graph'); }} onOpenView={() => setViewMode('skill-gap')} />
                <LearningTimeline g={g} />
              </>
            ) : (
              <RoleOverviewCards g={g} onSelect={id => { selectNode(id); setViewMode('graph'); }} />
            )}
          </div>
        </div>
      </div>
    </div>
    </AudienceCtx.Provider>
  );
}
