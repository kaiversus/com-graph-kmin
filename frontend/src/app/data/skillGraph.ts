// Skill Graph data model — mirrors SCHEMA_GUIDE_OFFICIAL.md.
//
// 9 node labels in two groups:
//   graph-owned: JobRole, Skill, Knowledge, KnowledgeArea (full properties)
//   shadow:      Account, Content, Task, Quiz, Mentor (only their primary key;
//                the real record lives in the source system and is resolved by id)
// 12 relationship types, each with its own allowed endpoints and properties.

export type NodeLabel =
  | 'JobRole' | 'Skill' | 'Knowledge' | 'KnowledgeArea'
  | 'Account' | 'Task' | 'Content' | 'Quiz' | 'Mentor';

export type RelType =
  | 'REQUIRES' | 'RELATED_TO' | 'HAS' | 'PARENT_OF' | 'IS_A' | 'PREREQUISITE'
  | 'HAS_SKILL' | 'PRACTICES' | 'APPLIES' | 'COVERS' | 'ASSESSES' | 'COACHES';

export type Domain = 'Frontend' | 'Backend' | 'Mobile' | 'AI' | 'Data Engineering';

export type PropValue = string | number | boolean | string[];
export type Props = Record<string, PropValue>;

export interface GraphNode {
  id: string;
  label: NodeLabel;
  props: Props;
}

export interface GraphRel {
  id: string;
  type: RelType;
  from: string;
  to: string;
  props: Props;
}

// ─── Schema metadata ──────────────────────────────────────────────────────────

export type PropType = 'string' | 'int' | 'float' | 'boolean' | 'datetime' | 'string_list' | 'enum_list' | 'json';

export interface PropSpec {
  name: string;
  type: PropType;
  required?: boolean;
  enum?: string[];
  range?: [number, number];
  note?: string;
}

export const REVIEW_STATUS = ['draft', 'reviewed', 'approved'];
export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
export const KNOWLEDGE_KINDS = [
  'concept', 'domain', 'technique', 'data-structure', 'algorithm', 'architecture', 'pattern',
  'principle', 'tool', 'framework', 'library', 'language', 'protocol', 'standard', 'model'
];
export const RELATION_TYPES = ['similar', 'alternative', 'complements', 'uses', 'related'];
export const COVER_DEPTHS = ['overview', 'applied', 'deep_dive'];
export const QUIZ_LEVELS = ['easy', 'medium', 'hard', 'expert'];
export const QUIZ_TAGS = ['single_choice', 'multiple_choice', 'true_false', 'fill_in_blank', 'matching', 'drag_drop'];

const COMMON_PROPS: PropSpec[] = [
  { name: 'source', type: 'string', note: '≤ 500' },
  { name: 'status', type: 'string', enum: REVIEW_STATUS, note: 'default draft' }
];

export type NodeGroup = 'graph-owned' | 'shadow';

export interface NodeMeta {
  group: NodeGroup;
  pk: string;
  color: string;
  reading: string;
  props: PropSpec[];
}

export const NODE_META: Record<NodeLabel, NodeMeta> = {
  JobRole: {
    group: 'graph-owned', pk: 'id', color: '#6366f1',
    reading: 'A job title the learner is aiming for',
    props: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string' },
      { name: 'level', type: 'string', enum: ['junior', 'middle', 'senior'] },
      { name: 'aliases', type: 'string_list' },
      ...COMMON_PROPS
    ]
  },
  Skill: {
    group: 'graph-owned', pk: 'id', color: '#238ec3',
    reading: 'A job-ready ability that can stand on its own line in a JD or CV',
    props: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string' },
      { name: 'level', type: 'string', required: true, enum: LEVELS, note: 'difficulty of the skill itself' },
      { name: 'aliases', type: 'string_list' },
      { name: 'practice_resource', type: 'json' },
      ...COMMON_PROPS
    ]
  },
  Knowledge: {
    group: 'graph-owned', pk: 'id', color: '#14b8a6',
    reading: 'An atomic unit of knowledge, small enough to teach and test on its own',
    props: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string' },
      { name: 'kind', type: 'string', required: true, enum: KNOWLEDGE_KINDS },
      { name: 'aliases', type: 'string_list' },
      { name: 'keywords', type: 'string_list' },
      { name: 'difficulty', type: 'string', enum: LEVELS },
      { name: 'deprecated', type: 'boolean' },
      { name: 'learning_resource', type: 'json' },
      ...COMMON_PROPS
    ]
  },
  KnowledgeArea: {
    group: 'graph-owned', pk: 'id', color: '#64748b',
    reading: 'A folder that organizes Knowledge; only leaf areas hold Knowledge',
    props: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string' },
      { name: 'aliases', type: 'string_list' },
      ...COMMON_PROPS
    ]
  },
  Account: {
    group: 'shadow', pk: 'id_account', color: '#e05992',
    reading: 'A learner account; the profile lives in the platform DB',
    props: [{ name: 'id_account', type: 'string', required: true }, ...COMMON_PROPS]
  },
  Task: {
    group: 'shadow', pk: 'id_task', color: '#f97316',
    reading: 'An exercise or project; the brief lives in the content system',
    props: [{ name: 'id_task', type: 'string', required: true }, ...COMMON_PROPS]
  },
  Content: {
    group: 'shadow', pk: 'id_content', color: '#22c55e',
    reading: 'A lesson or learning material; the body lives in the content system',
    props: [{ name: 'id_content', type: 'string', required: true }, ...COMMON_PROPS]
  },
  Quiz: {
    group: 'shadow', pk: 'id_quiz', color: '#eab308',
    reading: 'An assessment; the questions live in the content system',
    props: [{ name: 'id_quiz', type: 'string', required: true }, ...COMMON_PROPS]
  },
  Mentor: {
    group: 'shadow', pk: 'id_mentor', color: '#a855f7',
    reading: 'A mentor; the profile lives in the platform DB',
    props: [{ name: 'id_mentor', type: 'string', required: true }, ...COMMON_PROPS]
  }
};

export const NODE_LABELS = Object.keys(NODE_META) as NodeLabel[];

export type EdgeMarker = 'arrow' | 'triangle' | 'diamond' | 'none';

export interface RelMeta {
  reading: string;
  endpoints: [NodeLabel, NodeLabel][];
  props: PropSpec[];
  color: string;
  dash?: string;
  marker: EdgeMarker;
  symmetric?: boolean;
}

// Line styles: color groups the relationship with its source label where that
// helps (shadow relationships take the shadow node's color), and dash + marker
// keep each of the 12 types distinguishable even between same-colored pairs.
export const REL_META: Record<RelType, RelMeta> = {
  REQUIRES: {
    reading: 'needs / consists of',
    endpoints: [['JobRole', 'Skill'], ['Skill', 'Skill'], ['Skill', 'Knowledge']],
    props: [{ name: 'weight', type: 'float', range: [0, 1], note: 'default 1.0' }],
    color: 'var(--muted-foreground)', marker: 'arrow'
  },
  RELATED_TO: {
    reading: 'is related to (same label, ↔)',
    endpoints: [['Skill', 'Skill'], ['Knowledge', 'Knowledge']],
    props: [{ name: 'relation_type', type: 'string', required: true, enum: RELATION_TYPES }],
    color: '#0ea5e9', dash: '1 5', marker: 'none', symmetric: true
  },
  HAS: {
    reading: 'area contains knowledge',
    endpoints: [['KnowledgeArea', 'Knowledge']],
    props: [{ name: 'weight', type: 'float', range: [0, 1], note: 'default 1.0' }],
    color: '#64748b', dash: '4 3', marker: 'diamond'
  },
  PARENT_OF: {
    reading: 'is the parent area of',
    endpoints: [['KnowledgeArea', 'KnowledgeArea']],
    props: [{ name: 'order', type: 'int' }],
    color: '#64748b', marker: 'arrow'
  },
  IS_A: {
    reading: 'is a kind of (inheritance)',
    endpoints: [['Knowledge', 'Knowledge']],
    props: [],
    color: '#14b8a6', marker: 'triangle'
  },
  PREREQUISITE: {
    reading: 'must be learned before',
    endpoints: [['Knowledge', 'Knowledge']],
    props: [],
    color: '#ef4444', dash: '6 4', marker: 'arrow'
  },
  HAS_SKILL: {
    reading: 'account has skill',
    endpoints: [['Account', 'Skill']],
    props: [
      { name: 'proficiency', type: 'float', required: true, range: [0, 1] },
      { name: 'confidence', type: 'float', range: [0, 1] },
      { name: 'credentials', type: 'string' },
      { name: 'source', type: 'string' },
      { name: 'lastUpdatedAt', type: 'datetime', required: true, note: 'set by server' }
    ],
    color: '#e05992', marker: 'arrow'
  },
  PRACTICES: {
    reading: 'task trains skill',
    endpoints: [['Task', 'Skill']],
    props: [
      { name: 'weight', type: 'float', range: [0, 1] },
      { name: 'is_core', type: 'boolean' }
    ],
    color: '#f97316', marker: 'arrow'
  },
  APPLIES: {
    reading: 'task applies knowledge',
    endpoints: [['Task', 'Knowledge']],
    props: [],
    color: '#f97316', dash: '4 3', marker: 'arrow'
  },
  COVERS: {
    reading: 'content teaches knowledge',
    endpoints: [['Content', 'Knowledge']],
    props: [{ name: 'depth', type: 'string', required: true, enum: COVER_DEPTHS }],
    color: '#22c55e', marker: 'arrow'
  },
  ASSESSES: {
    reading: 'quiz assesses',
    endpoints: [['Quiz', 'Skill'], ['Quiz', 'Knowledge']],
    props: [
      { name: 'level', type: 'string', required: true, enum: QUIZ_LEVELS },
      { name: 'quiz_tag', type: 'enum_list', required: true, enum: QUIZ_TAGS },
      { name: 'weight', type: 'float', range: [0, 1] }
    ],
    color: '#eab308', marker: 'arrow'
  },
  COACHES: {
    reading: 'mentor coaches on',
    endpoints: [['Mentor', 'Skill'], ['Mentor', 'Knowledge']],
    props: [],
    color: '#a855f7', dash: '8 3 2 3', marker: 'arrow'
  }
};

export const REL_TYPES = Object.keys(REL_META) as RelType[];

export const REL_GROUPS: { title: string; types: RelType[] }[] = [
  { title: 'Requirements & prerequisites', types: ['REQUIRES', 'PREREQUISITE', 'IS_A', 'RELATED_TO'] },
  { title: 'Knowledge areas', types: ['PARENT_OF', 'HAS'] },
  { title: 'Shadow → graph', types: ['HAS_SKILL', 'PRACTICES', 'APPLIES', 'COVERS', 'ASSESSES', 'COACHES'] }
];

// ─── Proficiency (HAS_SKILL.proficiency) ──────────────────────────────────────
// Thresholds from the schema: [0,0.2) foundational · [0.2,0.4) beginner ·
// [0.4,0.6) intermediate · [0.6,0.8) advanced · [0.8,1] expert.

export type ProficiencyBand = 'foundational' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

// A required skill with no HAS_SKILL edge is one of two very different things:
//   missing — every skill it REQUIRES is already in place, so nothing stops the
//             learner from starting it: a real, actionable gap.
//   locked  — some skill it REQUIRES isn't there yet, so not having it is the
//             expected state for now ("not reached yet"), not a gap.
// Only `missing` gets the attention color; for a brand-new learner that is
// just the entry points of the dependency graph, not every required skill.
export type SkillState = ProficiencyBand | 'missing' | 'locked' | 'untracked';

export function proficiencyBand(p: number): ProficiencyBand {
  if (p < 0.2) return 'foundational';
  if (p < 0.4) return 'beginner';
  if (p < 0.6) return 'intermediate';
  if (p < 0.8) return 'advanced';
  return 'expert';
}

// A dependency counts as "in place" once the learner is past the lowest band.
// Deliberately lenient: people learn React while still filling gaps in JS.
export const UNLOCK_AT = 0.2;

// Proficiency bands are one ordinal blue ramp (light → dark in light mode,
// flipped in dark mode), so the colors read as "how far along", not as a
// traffic-light grade. The values live in theme.css per theme.
export const SKILL_STATE_META: Record<SkillState, { label: string; color: string; hint: string }> = {
  expert: { label: 'Expert', color: 'var(--prof-expert)', hint: '80–100%' },
  advanced: { label: 'Advanced', color: 'var(--prof-advanced)', hint: '60–80%' },
  intermediate: { label: 'Intermediate', color: 'var(--prof-intermediate)', hint: '40–60%' },
  beginner: { label: 'Beginner', color: 'var(--prof-beginner)', hint: '20–40%' },
  foundational: { label: 'Foundational', color: 'var(--prof-foundational)', hint: 'under 20%' },
  missing: { label: 'Missing · ready to start', color: 'var(--state-missing)', hint: 'Required, prerequisites in place, not started' },
  locked: { label: 'Not reached yet', color: 'var(--state-locked)', hint: 'Required, but a prerequisite skill comes first' },
  untracked: { label: 'Not required', color: 'var(--state-untracked)', hint: 'Not required by this role' }
};

export const SKILL_STATES = Object.keys(SKILL_STATE_META) as SkillState[];

// ─── Node library ─────────────────────────────────────────────────────────────
// Nodes are defined once and shared across domains (e.g. skill_javascript is the
// same node in Frontend and Backend). Each domain dataset is a list of
// relationships; its nodes are whatever those relationships touch.

const LIB: Record<string, GraphNode> = {};

function def(label: NodeLabel, id: string, props: Props = {}) {
  LIB[id] = { id, label, props: { [NODE_META[label].pk]: id, ...props } };
}
const role = (id: string, name: string, p: Props = {}) => def('JobRole', id, { name, ...p });
const skill = (id: string, name: string, level: string, p: Props = {}) => def('Skill', id, { name, level, ...p });
const know = (id: string, name: string, kind: string, p: Props = {}) => def('Knowledge', id, { name, kind, ...p });
const area = (id: string, name: string, p: Props = {}) => def('KnowledgeArea', id, { name, ...p });

// Job roles
role('role_fe_dev', 'Frontend Developer', { level: 'junior', aliases: ['FE Dev', 'Front-end Engineer'], description: 'Builds and ships user-facing web interfaces.', source: 'roadmap.sh Frontend', status: 'approved' });
role('role_be_dev', 'Backend Developer', { level: 'junior', aliases: ['BE Dev', 'Server-side Engineer'], description: 'Builds APIs, services and data access layers.', source: 'roadmap.sh Backend', status: 'approved' });
role('role_mobile_dev', 'Mobile Developer', { level: 'junior', aliases: ['App Developer'], description: 'Builds cross-platform mobile applications.', status: 'reviewed' });
role('role_ml_eng', 'ML Engineer', { level: 'middle', aliases: ['Machine Learning Engineer'], description: 'Trains, evaluates and ships machine-learning models.', status: 'reviewed' });
role('role_data_eng', 'Data Engineer', { level: 'junior', aliases: ['DE'], description: 'Designs data models and builds reliable data pipelines.', status: 'reviewed' });

// Skills
skill('skill_html', 'HTML', 'beginner', { aliases: ['HTML5'], description: 'Structuring web documents with semantic markup.', source: 'MDN Web Docs', status: 'approved' });
skill('skill_css', 'CSS', 'beginner', { aliases: ['CSS3'], description: 'Styling and laying out web pages.', source: 'MDN Web Docs', status: 'approved' });
skill('skill_javascript', 'JavaScript', 'intermediate', { aliases: ['JS', 'ECMAScript'], description: 'Programming the web platform with JavaScript.', practice_resource: '{"url":"https://javascript.info"}', source: 'MDN Web Docs', status: 'approved' });
skill('skill_typescript', 'TypeScript', 'intermediate', { aliases: ['TS'], description: 'Typed superset of JavaScript for large codebases.', source: 'typescriptlang.org Handbook', status: 'approved' });
skill('skill_react', 'React', 'intermediate', { aliases: ['React.js', 'ReactJS'], description: 'Building UIs from declarative components.', practice_resource: '{"url":"https://react.dev/learn"}', source: 'react.dev', status: 'approved' });
skill('skill_testing', 'Frontend Testing', 'intermediate', { aliases: ['UI Testing'], description: 'Unit and integration testing of UI code.', status: 'reviewed' });
skill('skill_nextjs', 'Next.js', 'advanced', { aliases: ['NextJS'], description: 'React framework with server rendering and file-based routing.', source: 'nextjs.org/docs', status: 'reviewed' });
skill('skill_vue', 'Vue', 'intermediate', { aliases: ['Vue.js'], description: 'Progressive framework for building UIs.', source: 'vuejs.org', status: 'draft' });
skill('skill_nodejs', 'Node.js', 'intermediate', { aliases: ['Node'], description: 'Server-side JavaScript runtime.', source: 'nodejs.org/docs', status: 'approved' });
skill('skill_sql', 'SQL', 'intermediate', { aliases: ['Structured Query Language'], description: 'Querying and manipulating relational data.', source: 'PostgreSQL docs', status: 'approved' });
skill('skill_api_design', 'REST API Design', 'intermediate', { aliases: ['API Design'], description: 'Designing resource-oriented HTTP APIs.', status: 'reviewed' });
skill('skill_docker', 'Docker', 'intermediate', { aliases: ['Containerization'], description: 'Packaging and running apps in containers.', source: 'docs.docker.com', status: 'approved' });
skill('skill_react_native', 'React Native', 'intermediate', { aliases: ['RN'], description: 'Building native mobile apps with React.', source: 'reactnative.dev', status: 'reviewed' });
skill('skill_flutter', 'Flutter', 'intermediate', { description: 'Cross-platform UI toolkit using Dart.', source: 'docs.flutter.dev', status: 'draft' });
skill('skill_python', 'Python', 'beginner', { aliases: ['Py'], description: 'General-purpose programming in Python.', source: 'docs.python.org', status: 'approved' });
skill('skill_data_analysis', 'Data Analysis', 'intermediate', { description: 'Cleaning, exploring and summarizing datasets.', status: 'reviewed' });
skill('skill_ml', 'Machine Learning', 'advanced', { aliases: ['ML'], description: 'Training and evaluating predictive models.', status: 'reviewed' });
skill('skill_deep_learning', 'Deep Learning', 'expert', { aliases: ['DL'], description: 'Training neural networks.', status: 'draft' });
skill('skill_data_modeling', 'Data Modeling', 'advanced', { description: 'Designing schemas for analytics and operations.', status: 'reviewed' });
skill('skill_etl', 'ETL Pipelines', 'intermediate', { aliases: ['ELT', 'Data Pipelines'], description: 'Extracting, transforming and loading data.', status: 'reviewed' });
skill('skill_orchestration', 'Workflow Orchestration', 'intermediate', { description: 'Scheduling and monitoring data workflows.', status: 'draft' });

// Knowledge — HTML & CSS
know('knowledge_semantic_html', 'Semantic HTML', 'standard', { difficulty: 'beginner', keywords: ['a11y', 'landmarks'], source: 'MDN Web Docs', status: 'approved' });
know('knowledge_dom', 'DOM', 'model', { aliases: ['Document Object Model'], difficulty: 'beginner', keywords: ['tree', 'nodes', 'events'], source: 'MDN Web Docs', status: 'approved' });
know('knowledge_layout_models', 'CSS Layout Models', 'concept', { difficulty: 'beginner', source: 'MDN Web Docs', status: 'approved' });
know('knowledge_flexbox', 'Flexbox', 'technique', { aliases: ['Flexible Box Layout'], difficulty: 'beginner', source: 'MDN Web Docs', status: 'approved' });
know('knowledge_css_grid', 'CSS Grid', 'technique', { aliases: ['Grid Layout'], difficulty: 'intermediate', source: 'MDN Web Docs', status: 'approved' });
// Knowledge — JavaScript language
know('knowledge_scope', 'Scope', 'concept', { keywords: ['lexical', 'block'], difficulty: 'beginner', source: 'MDN Web Docs', status: 'approved' });
know('knowledge_closures', 'Closures', 'concept', { keywords: ['scope', 'lexical'], difficulty: 'intermediate', learning_resource: '{"url":"https://developer.mozilla.org/docs/Web/JavaScript/Closures"}', source: 'MDN Web Docs', status: 'approved' });
know('knowledge_event_loop', 'Event Loop', 'model', { keywords: ['task queue', 'microtask'], difficulty: 'intermediate', source: 'MDN Web Docs', status: 'approved' });
know('knowledge_async', 'Promises & async/await', 'concept', { aliases: ['Async JavaScript'], difficulty: 'intermediate', source: 'MDN Web Docs', status: 'approved' });
// Knowledge — TypeScript
know('knowledge_type_annotations', 'Type Annotations & Inference', 'concept', { difficulty: 'beginner', source: 'typescriptlang.org Handbook', status: 'approved' });
know('knowledge_generics', 'Generics', 'concept', { difficulty: 'intermediate', source: 'typescriptlang.org Handbook', status: 'approved' });
// Knowledge — React ecosystem
know('knowledge_jsx', 'JSX', 'language', { difficulty: 'beginner', source: 'react.dev', status: 'approved' });
know('knowledge_components', 'Components & Props', 'concept', { difficulty: 'beginner', source: 'react.dev', status: 'approved' });
know('knowledge_react_hooks', 'React Hooks', 'pattern', { aliases: ['Hooks'], difficulty: 'intermediate', source: 'react.dev', status: 'approved' });
know('knowledge_usestate', 'useState', 'technique', { difficulty: 'beginner', source: 'react.dev', status: 'approved' });
know('knowledge_useeffect', 'useEffect', 'technique', { difficulty: 'intermediate', source: 'react.dev', status: 'approved' });
know('knowledge_class_lifecycle', 'Class Lifecycle Methods', 'technique', { aliases: ['componentDidMount'], deprecated: true, difficulty: 'intermediate', source: 'react.dev (legacy)', status: 'reviewed' });
know('knowledge_virtual_dom', 'Virtual DOM & Reconciliation', 'architecture', { difficulty: 'advanced', source: 'react.dev', status: 'reviewed' });
know('knowledge_ssr', 'Server-Side Rendering', 'architecture', { aliases: ['SSR'], difficulty: 'advanced', source: 'nextjs.org/docs', status: 'reviewed' });
know('knowledge_file_routing', 'File-based Routing', 'pattern', { difficulty: 'intermediate', source: 'nextjs.org/docs', status: 'reviewed' });
know('knowledge_vue_sfc', 'Single-File Components', 'pattern', { aliases: ['SFC', '.vue files'], difficulty: 'beginner', source: 'vuejs.org', status: 'draft' });
// Knowledge — quality
know('knowledge_unit_testing', 'Unit Testing', 'technique', { difficulty: 'intermediate', status: 'reviewed' });
know('knowledge_rtl', 'React Testing Library', 'library', { aliases: ['RTL'], difficulty: 'intermediate', source: 'testing-library.com', status: 'reviewed' });
// Knowledge — backend
know('knowledge_middleware', 'Middleware', 'pattern', { difficulty: 'intermediate', source: 'expressjs.com', status: 'approved' });
know('knowledge_http', 'HTTP', 'protocol', { aliases: ['HyperText Transfer Protocol'], difficulty: 'beginner', source: 'RFC 9110', status: 'approved' });
know('knowledge_rest', 'REST', 'architecture', { aliases: ['RESTful'], difficulty: 'intermediate', status: 'approved' });
know('knowledge_jwt', 'JWT', 'standard', { aliases: ['JSON Web Token'], difficulty: 'intermediate', source: 'RFC 7519', status: 'approved' });
know('knowledge_relational_model', 'Relational Model', 'model', { difficulty: 'beginner', source: 'PostgreSQL docs', status: 'approved' });
know('knowledge_normalization', 'Normalization', 'principle', { aliases: ['Normal Forms'], difficulty: 'intermediate', status: 'approved' });
know('knowledge_indexes', 'Indexes', 'data-structure', { difficulty: 'intermediate', source: 'PostgreSQL docs', status: 'approved' });
know('knowledge_btree_index', 'B-Tree Index', 'data-structure', { difficulty: 'advanced', source: 'PostgreSQL docs', status: 'reviewed' });
know('knowledge_joins', 'SQL Joins', 'technique', { difficulty: 'beginner', status: 'approved' });
know('knowledge_window_functions', 'Window Functions', 'technique', { difficulty: 'advanced', source: 'PostgreSQL docs', status: 'approved' });
know('knowledge_containers', 'Containers', 'concept', { difficulty: 'beginner', source: 'docs.docker.com', status: 'approved' });
know('knowledge_dockerfile', 'Dockerfile', 'tool', { difficulty: 'beginner', source: 'docs.docker.com', status: 'approved' });
// Knowledge — mobile
know('knowledge_native_components', 'Native Components', 'concept', { difficulty: 'beginner', source: 'reactnative.dev', status: 'reviewed' });
know('knowledge_navigation', 'Mobile Navigation', 'pattern', { difficulty: 'intermediate', status: 'reviewed' });
know('knowledge_stack_navigation', 'Stack Navigation', 'pattern', { difficulty: 'intermediate', source: 'reactnavigation.org', status: 'reviewed' });
know('knowledge_expo', 'Expo', 'framework', { difficulty: 'beginner', source: 'docs.expo.dev', status: 'reviewed' });
know('knowledge_platform_apis', 'Platform APIs', 'concept', { keywords: ['camera', 'permissions'], difficulty: 'intermediate', status: 'draft' });
know('knowledge_widgets', 'Widgets', 'concept', { difficulty: 'beginner', source: 'docs.flutter.dev', status: 'draft' });
know('knowledge_dart', 'Dart', 'language', { difficulty: 'beginner', source: 'dart.dev', status: 'draft' });
// Knowledge — AI / ML
know('knowledge_numpy', 'NumPy', 'library', { difficulty: 'beginner', source: 'numpy.org', status: 'approved' });
know('knowledge_pandas', 'pandas', 'library', { difficulty: 'beginner', source: 'pandas.pydata.org', status: 'approved' });
know('knowledge_vectorization', 'Vectorization', 'technique', { difficulty: 'intermediate', status: 'reviewed' });
know('knowledge_supervised', 'Supervised Learning', 'concept', { difficulty: 'intermediate', status: 'approved' });
know('knowledge_linear_regression', 'Linear Regression', 'algorithm', { difficulty: 'intermediate', status: 'approved' });
know('knowledge_decision_tree', 'Decision Tree', 'algorithm', { difficulty: 'intermediate', status: 'approved' });
know('knowledge_overfitting', 'Overfitting', 'concept', { difficulty: 'intermediate', status: 'approved' });
know('knowledge_cross_validation', 'Cross-Validation', 'technique', { difficulty: 'intermediate', status: 'approved' });
know('knowledge_gradient_descent', 'Gradient Descent', 'algorithm', { difficulty: 'advanced', status: 'approved' });
know('knowledge_neural_networks', 'Neural Networks', 'model', { difficulty: 'advanced', status: 'reviewed' });
know('knowledge_backprop', 'Backpropagation', 'algorithm', { difficulty: 'advanced', status: 'reviewed' });
// Knowledge — data engineering
know('knowledge_dimensional_modeling', 'Dimensional Modeling', 'concept', { difficulty: 'advanced', status: 'reviewed' });
know('knowledge_star_schema', 'Star Schema', 'pattern', { difficulty: 'intermediate', status: 'reviewed' });
know('knowledge_snowflake_schema', 'Snowflake Schema', 'pattern', { difficulty: 'intermediate', status: 'reviewed' });
know('knowledge_batch_processing', 'Batch Processing', 'concept', { difficulty: 'beginner', status: 'reviewed' });
know('knowledge_incremental_load', 'Incremental Load', 'technique', { difficulty: 'intermediate', status: 'reviewed' });
know('knowledge_dag', 'DAG', 'data-structure', { aliases: ['Directed Acyclic Graph'], difficulty: 'intermediate', status: 'reviewed' });
know('knowledge_airflow', 'Apache Airflow', 'tool', { aliases: ['Airflow'], difficulty: 'intermediate', source: 'airflow.apache.org', status: 'draft' });

// Knowledge areas
area('area_web_frontend', 'Web Frontend', { aliases: ['FE', 'Front-end'], status: 'approved' });
area('area_html_css', 'HTML & CSS', { status: 'approved' });
area('area_js_lang', 'JavaScript Language', { status: 'approved' });
area('area_typescript', 'TypeScript', { status: 'approved' });
area('area_ui_frameworks', 'UI Frameworks', { status: 'approved' });
area('area_react_eco', 'React Ecosystem', { status: 'approved' });
area('area_vue_eco', 'Vue Ecosystem', { status: 'draft' });
area('area_fe_quality', 'Frontend Quality', { status: 'reviewed' });
area('area_backend', 'Backend', { aliases: ['BE', 'Server-side'], status: 'approved' });
area('area_server_runtime', 'Server Runtime', { status: 'approved' });
area('area_web_apis', 'Web APIs', { status: 'approved' });
area('area_databases', 'Databases', { status: 'approved' });
area('area_devops', 'DevOps', { status: 'reviewed' });
area('area_mobile', 'Mobile', { status: 'reviewed' });
area('area_cross_platform', 'Cross-platform (React Native)', { status: 'reviewed' });
area('area_flutter_eco', 'Flutter Ecosystem', { status: 'draft' });
area('area_ai', 'Artificial Intelligence', { aliases: ['AI'], status: 'reviewed' });
area('area_python_data', 'Python Data Stack', { status: 'reviewed' });
area('area_ml_foundations', 'ML Foundations', { status: 'reviewed' });
area('area_dl', 'Deep Learning', { status: 'draft' });
area('area_data_eng', 'Data Engineering', { status: 'reviewed' });
area('area_sql_analytics', 'SQL Analytics', { status: 'reviewed' });
area('area_data_modeling', 'Data Modeling', { status: 'reviewed' });
area('area_pipelines', 'Pipelines', { status: 'reviewed' });

// Shadow nodes — only the primary key (plus the common source/status)
def('Account', 'acc_10293');
['task_landing_page', 'task_auth_flow', 'task_todo_ts', 'task_rest_api', 'task_rn_todo', 'task_titanic', 'task_sales_dw']
  .forEach(id => def('Task', id));
['content_css_layout', 'content_js_closures', 'content_react_hooks', 'content_nextjs_intro', 'content_node_async', 'content_sql_fund', 'content_rn_intro', 'content_ml_intro', 'content_window_fn']
  .forEach(id => def('Content', id));
['quiz_js_basics', 'quiz_react_core', 'quiz_testing', 'quiz_sql_basics', 'quiz_rn_basics', 'quiz_ml_basics', 'quiz_sql_adv']
  .forEach(id => def('Quiz', id));
['mentor_sarah', 'mentor_alex', 'mentor_minh', 'mentor_linh', 'mentor_huy']
  .forEach(id => def('Mentor', id, { source: 'platform' }));

// What the source systems return for each shadow id. The graph never stores
// these fields; the UI resolves them by id for display only.
export const SOURCE_RECORDS: Record<string, { system: string; title: string; detail?: string }> = {
  acc_10293: { system: 'Platform DB · accounts', title: 'You', detail: 'Learner since Mar 2025' },
  task_landing_page: { system: 'Content system · tasks', title: 'Build a responsive landing page', detail: 'Project · 6h' },
  task_auth_flow: { system: 'Content system · tasks', title: 'Build an auth flow in React', detail: 'Project · 10h' },
  task_todo_ts: { system: 'Content system · tasks', title: 'Type a Todo app with TypeScript', detail: 'Exercise · 3h' },
  task_rest_api: { system: 'Content system · tasks', title: 'Ship a REST API with Express', detail: 'Project · 12h' },
  task_rn_todo: { system: 'Content system · tasks', title: 'React Native todo app', detail: 'Project · 8h' },
  task_titanic: { system: 'Content system · tasks', title: 'Titanic survival classifier', detail: 'Project · 6h' },
  task_sales_dw: { system: 'Content system · tasks', title: 'Model a sales data warehouse', detail: 'Project · 10h' },
  content_css_layout: { system: 'Content system · lessons', title: 'Modern CSS Layout', detail: 'Video · 45 min' },
  content_js_closures: { system: 'Content system · lessons', title: 'Scope & Closures, explained', detail: 'Article · 20 min' },
  content_react_hooks: { system: 'Content system · lessons', title: 'React Hooks in depth', detail: 'Video · 1h 10m' },
  content_nextjs_intro: { system: 'Content system · lessons', title: 'Intro to Next.js', detail: 'Video · 40 min' },
  content_node_async: { system: 'Content system · lessons', title: 'Async Node.js', detail: 'Article · 25 min' },
  content_sql_fund: { system: 'Content system · lessons', title: 'SQL Fundamentals', detail: 'Course · 3h' },
  content_rn_intro: { system: 'Content system · lessons', title: 'Getting started with React Native', detail: 'Video · 35 min' },
  content_ml_intro: { system: 'Content system · lessons', title: 'Machine Learning 101', detail: 'Course · 2h' },
  content_window_fn: { system: 'Content system · lessons', title: 'Mastering Window Functions', detail: 'Article · 30 min' },
  quiz_js_basics: { system: 'Content system · quizzes', title: 'JavaScript Basics', detail: '15 questions' },
  quiz_react_core: { system: 'Content system · quizzes', title: 'React Core Concepts', detail: '20 questions' },
  quiz_testing: { system: 'Content system · quizzes', title: 'Testing Fundamentals', detail: '10 questions' },
  quiz_sql_basics: { system: 'Content system · quizzes', title: 'SQL Basics', detail: '12 questions' },
  quiz_rn_basics: { system: 'Content system · quizzes', title: 'React Native Basics', detail: '10 questions' },
  quiz_ml_basics: { system: 'Content system · quizzes', title: 'ML Basics', detail: '15 questions' },
  quiz_sql_adv: { system: 'Content system · quizzes', title: 'Advanced SQL', detail: '12 questions' },
  mentor_sarah: { system: 'Platform DB · mentors', title: 'Sarah Chen', detail: 'Senior Frontend Engineer' },
  mentor_alex: { system: 'Platform DB · mentors', title: 'Alex Rivera', detail: 'Staff Engineer' },
  mentor_minh: { system: 'Platform DB · mentors', title: 'Minh Tran', detail: 'Data Architect' },
  mentor_linh: { system: 'Platform DB · mentors', title: 'Linh Pham', detail: 'Mobile Lead' },
  mentor_huy: { system: 'Platform DB · mentors', title: 'Huy Nguyen', detail: 'ML Engineer' }
};

export const ME = 'acc_10293';

// ─── Relationship builders ────────────────────────────────────────────────────

type RelSpec = [RelType, string, string, Props?];

const req = (from: string, to: string, weight = 1): RelSpec => ['REQUIRES', from, to, { weight }];
const related = (from: string, to: string, relation_type: string): RelSpec => ['RELATED_TO', from, to, { relation_type }];
const has = (from: string, to: string, weight = 1): RelSpec => ['HAS', from, to, { weight }];
const parentOf = (from: string, to: string, order: number): RelSpec => ['PARENT_OF', from, to, { order }];
const isA = (from: string, to: string): RelSpec => ['IS_A', from, to];
const prereq = (from: string, to: string): RelSpec => ['PREREQUISITE', from, to];
const hasSkill = (to: string, proficiency: number, confidence: number, source: string, lastUpdatedAt: string, credentials?: string): RelSpec =>
  ['HAS_SKILL', ME, to, { proficiency, confidence, source, lastUpdatedAt, ...(credentials ? { credentials } : {}) }];
const practices = (from: string, to: string, weight: number, is_core: boolean): RelSpec => ['PRACTICES', from, to, { weight, is_core }];
const applies = (from: string, to: string): RelSpec => ['APPLIES', from, to];
const covers = (from: string, to: string, depth: string): RelSpec => ['COVERS', from, to, { depth }];
const assesses = (from: string, to: string, level: string, quiz_tag: string[], weight?: number): RelSpec =>
  ['ASSESSES', from, to, { level, quiz_tag, ...(weight !== undefined ? { weight } : {}) }];
const coaches = (from: string, to: string): RelSpec => ['COACHES', from, to];

// ─── Domain datasets ──────────────────────────────────────────────────────────

const DATASETS: Record<Domain, { role: string; rels: RelSpec[] }> = {
  Frontend: {
    role: 'role_fe_dev',
    rels: [
      req('role_fe_dev', 'skill_html', 1), req('role_fe_dev', 'skill_css', 1), req('role_fe_dev', 'skill_javascript', 1),
      req('role_fe_dev', 'skill_react', 0.9), req('role_fe_dev', 'skill_typescript', 0.7),
      req('role_fe_dev', 'skill_testing', 0.6), req('role_fe_dev', 'skill_nextjs', 0.5),

      req('skill_react', 'skill_javascript', 1), req('skill_typescript', 'skill_javascript', 1),
      req('skill_nextjs', 'skill_react', 1), req('skill_testing', 'skill_javascript', 0.8),
      related('skill_react', 'skill_vue', 'alternative'), related('skill_html', 'skill_css', 'complements'),

      req('skill_html', 'knowledge_semantic_html'), req('skill_html', 'knowledge_dom', 0.7),
      req('skill_css', 'knowledge_layout_models'), req('skill_css', 'knowledge_flexbox'), req('skill_css', 'knowledge_css_grid', 0.8),
      req('skill_javascript', 'knowledge_dom'), req('skill_javascript', 'knowledge_scope'), req('skill_javascript', 'knowledge_closures', 0.9),
      req('skill_javascript', 'knowledge_event_loop', 0.7), req('skill_javascript', 'knowledge_async', 0.9),
      req('skill_typescript', 'knowledge_type_annotations'), req('skill_typescript', 'knowledge_generics', 0.8),
      req('skill_react', 'knowledge_jsx'), req('skill_react', 'knowledge_components'), req('skill_react', 'knowledge_react_hooks'),
      req('skill_react', 'knowledge_usestate'), req('skill_react', 'knowledge_useeffect', 0.9),
      req('skill_react', 'knowledge_class_lifecycle', 0.2), req('skill_react', 'knowledge_virtual_dom', 0.6),
      req('skill_nextjs', 'knowledge_ssr'), req('skill_nextjs', 'knowledge_file_routing', 0.8),
      req('skill_testing', 'knowledge_unit_testing'), req('skill_testing', 'knowledge_rtl', 0.8),
      req('skill_vue', 'knowledge_vue_sfc'),

      isA('knowledge_flexbox', 'knowledge_layout_models'), isA('knowledge_css_grid', 'knowledge_layout_models'),
      isA('knowledge_usestate', 'knowledge_react_hooks'), isA('knowledge_useeffect', 'knowledge_react_hooks'),
      prereq('knowledge_scope', 'knowledge_closures'), prereq('knowledge_closures', 'knowledge_react_hooks'),
      prereq('knowledge_event_loop', 'knowledge_async'), prereq('knowledge_dom', 'knowledge_virtual_dom'),
      prereq('knowledge_type_annotations', 'knowledge_generics'), prereq('knowledge_components', 'knowledge_react_hooks'),
      prereq('knowledge_unit_testing', 'knowledge_rtl'),
      related('knowledge_jsx', 'knowledge_vue_sfc', 'alternative'),
      related('knowledge_flexbox', 'knowledge_css_grid', 'complements'),
      related('knowledge_useeffect', 'knowledge_class_lifecycle', 'alternative'),

      parentOf('area_web_frontend', 'area_html_css', 1), parentOf('area_web_frontend', 'area_js_lang', 2),
      parentOf('area_web_frontend', 'area_typescript', 3), parentOf('area_web_frontend', 'area_ui_frameworks', 4),
      parentOf('area_web_frontend', 'area_fe_quality', 5),
      parentOf('area_ui_frameworks', 'area_react_eco', 1), parentOf('area_ui_frameworks', 'area_vue_eco', 2),
      has('area_html_css', 'knowledge_semantic_html'), has('area_html_css', 'knowledge_layout_models', 0.8),
      has('area_html_css', 'knowledge_flexbox'), has('area_html_css', 'knowledge_css_grid'),
      has('area_js_lang', 'knowledge_dom'), has('area_js_lang', 'knowledge_scope'), has('area_js_lang', 'knowledge_closures'),
      has('area_js_lang', 'knowledge_event_loop', 0.8), has('area_js_lang', 'knowledge_async'),
      has('area_typescript', 'knowledge_type_annotations'), has('area_typescript', 'knowledge_generics'),
      has('area_react_eco', 'knowledge_jsx'), has('area_react_eco', 'knowledge_components'), has('area_react_eco', 'knowledge_react_hooks'),
      has('area_react_eco', 'knowledge_usestate'), has('area_react_eco', 'knowledge_useeffect'),
      has('area_react_eco', 'knowledge_class_lifecycle', 0.3), has('area_react_eco', 'knowledge_virtual_dom', 0.7),
      has('area_react_eco', 'knowledge_ssr'), has('area_react_eco', 'knowledge_file_routing'),
      has('area_vue_eco', 'knowledge_vue_sfc'),
      has('area_fe_quality', 'knowledge_unit_testing'), has('area_fe_quality', 'knowledge_rtl'),

      hasSkill('skill_html', 0.85, 0.9, 'quiz', '2025-11-02T10:12:00Z', 'kmin.edu/cert/html-2025'),
      hasSkill('skill_css', 0.78, 0.8, 'task', '2025-11-10T08:40:00Z'),
      hasSkill('skill_javascript', 0.66, 0.85, 'quiz', '2025-11-18T14:05:00Z'),
      hasSkill('skill_react', 0.62, 0.9, 'mentor', '2025-11-21T09:30:00Z', 'Mentor review · Sarah Chen'),
      hasSkill('skill_typescript', 0.35, 0.5, 'self-report', '2025-10-04T16:20:00Z'),
      hasSkill('skill_testing', 0.15, 0.4, 'self-report', '2025-09-12T11:00:00Z'),

      practices('task_landing_page', 'skill_html', 0.6, false), practices('task_landing_page', 'skill_css', 0.9, true),
      applies('task_landing_page', 'knowledge_semantic_html'), applies('task_landing_page', 'knowledge_flexbox'), applies('task_landing_page', 'knowledge_css_grid'),
      practices('task_auth_flow', 'skill_react', 0.8, true), practices('task_auth_flow', 'skill_javascript', 0.5, false),
      applies('task_auth_flow', 'knowledge_usestate'), applies('task_auth_flow', 'knowledge_useeffect'), applies('task_auth_flow', 'knowledge_async'),
      practices('task_todo_ts', 'skill_typescript', 0.9, true),
      applies('task_todo_ts', 'knowledge_type_annotations'), applies('task_todo_ts', 'knowledge_generics'),

      covers('content_css_layout', 'knowledge_layout_models', 'overview'), covers('content_css_layout', 'knowledge_flexbox', 'applied'),
      covers('content_css_layout', 'knowledge_css_grid', 'applied'),
      covers('content_js_closures', 'knowledge_scope', 'overview'), covers('content_js_closures', 'knowledge_closures', 'deep_dive'),
      covers('content_react_hooks', 'knowledge_react_hooks', 'applied'), covers('content_react_hooks', 'knowledge_usestate', 'applied'),
      covers('content_react_hooks', 'knowledge_useeffect', 'deep_dive'),
      covers('content_nextjs_intro', 'knowledge_ssr', 'overview'), covers('content_nextjs_intro', 'knowledge_file_routing', 'applied'),

      assesses('quiz_js_basics', 'skill_javascript', 'medium', ['single_choice', 'true_false'], 0.6),
      assesses('quiz_js_basics', 'knowledge_closures', 'medium', ['single_choice', 'fill_in_blank']),
      assesses('quiz_react_core', 'skill_react', 'hard', ['multiple_choice', 'drag_drop'], 0.8),
      assesses('quiz_react_core', 'knowledge_react_hooks', 'hard', ['multiple_choice']),
      assesses('quiz_testing', 'knowledge_unit_testing', 'easy', ['true_false', 'matching'], 0.4),

      coaches('mentor_sarah', 'skill_react'), coaches('mentor_sarah', 'knowledge_react_hooks'),
      coaches('mentor_alex', 'skill_typescript'), coaches('mentor_alex', 'skill_testing')
    ]
  },

  Backend: {
    role: 'role_be_dev',
    rels: [
      req('role_be_dev', 'skill_nodejs', 1), req('role_be_dev', 'skill_sql', 1),
      req('role_be_dev', 'skill_api_design', 0.9), req('role_be_dev', 'skill_docker', 0.6),
      req('skill_nodejs', 'skill_javascript', 1),
      related('skill_api_design', 'skill_nodejs', 'complements'),

      req('skill_javascript', 'knowledge_event_loop'), req('skill_javascript', 'knowledge_async'),
      req('skill_nodejs', 'knowledge_event_loop'), req('skill_nodejs', 'knowledge_middleware', 0.8),
      req('skill_api_design', 'knowledge_http'), req('skill_api_design', 'knowledge_rest'), req('skill_api_design', 'knowledge_jwt', 0.7),
      req('skill_sql', 'knowledge_relational_model'), req('skill_sql', 'knowledge_joins'), req('skill_sql', 'knowledge_normalization', 0.8),
      req('skill_sql', 'knowledge_indexes', 0.8), req('skill_sql', 'knowledge_btree_index', 0.4),
      req('skill_docker', 'knowledge_containers'), req('skill_docker', 'knowledge_dockerfile'),

      prereq('knowledge_event_loop', 'knowledge_async'), prereq('knowledge_http', 'knowledge_rest'),
      prereq('knowledge_relational_model', 'knowledge_normalization'), prereq('knowledge_relational_model', 'knowledge_joins'),
      prereq('knowledge_containers', 'knowledge_dockerfile'),
      isA('knowledge_btree_index', 'knowledge_indexes'),
      related('knowledge_middleware', 'knowledge_jwt', 'uses'),

      parentOf('area_backend', 'area_server_runtime', 1), parentOf('area_backend', 'area_web_apis', 2),
      parentOf('area_backend', 'area_databases', 3), parentOf('area_backend', 'area_devops', 4),
      has('area_server_runtime', 'knowledge_event_loop'), has('area_server_runtime', 'knowledge_async'), has('area_server_runtime', 'knowledge_middleware'),
      has('area_web_apis', 'knowledge_http'), has('area_web_apis', 'knowledge_rest'), has('area_web_apis', 'knowledge_jwt', 0.7),
      has('area_databases', 'knowledge_relational_model'), has('area_databases', 'knowledge_joins'), has('area_databases', 'knowledge_normalization'),
      has('area_databases', 'knowledge_indexes'), has('area_databases', 'knowledge_btree_index', 0.6),
      has('area_devops', 'knowledge_containers'), has('area_devops', 'knowledge_dockerfile'),

      hasSkill('skill_javascript', 0.66, 0.85, 'quiz', '2025-11-18T14:05:00Z'),
      hasSkill('skill_nodejs', 0.48, 0.7, 'task', '2025-11-08T13:00:00Z'),
      hasSkill('skill_api_design', 0.42, 0.6, 'task', '2025-11-08T13:00:00Z'),
      hasSkill('skill_sql', 0.31, 0.75, 'quiz', '2025-10-22T09:15:00Z'),

      practices('task_rest_api', 'skill_nodejs', 0.8, true), practices('task_rest_api', 'skill_api_design', 0.7, true),
      applies('task_rest_api', 'knowledge_middleware'), applies('task_rest_api', 'knowledge_rest'), applies('task_rest_api', 'knowledge_jwt'),
      covers('content_node_async', 'knowledge_event_loop', 'deep_dive'), covers('content_node_async', 'knowledge_async', 'applied'),
      covers('content_sql_fund', 'knowledge_relational_model', 'overview'), covers('content_sql_fund', 'knowledge_joins', 'applied'),
      covers('content_sql_fund', 'knowledge_normalization', 'deep_dive'),
      assesses('quiz_sql_basics', 'skill_sql', 'medium', ['single_choice', 'fill_in_blank'], 0.7),
      assesses('quiz_sql_basics', 'knowledge_indexes', 'hard', ['multiple_choice']),
      coaches('mentor_alex', 'skill_nodejs'), coaches('mentor_alex', 'skill_api_design'),
      coaches('mentor_minh', 'skill_sql'), coaches('mentor_minh', 'knowledge_normalization')
    ]
  },

  Mobile: {
    role: 'role_mobile_dev',
    rels: [
      req('role_mobile_dev', 'skill_react_native', 1), req('role_mobile_dev', 'skill_react', 0.8),
      req('skill_react_native', 'skill_react', 1),
      related('skill_react_native', 'skill_flutter', 'alternative'),

      req('skill_react', 'knowledge_components'), req('skill_react', 'knowledge_react_hooks'),
      req('skill_react_native', 'knowledge_native_components'), req('skill_react_native', 'knowledge_navigation'),
      req('skill_react_native', 'knowledge_stack_navigation', 0.7), req('skill_react_native', 'knowledge_expo', 0.6),
      req('skill_react_native', 'knowledge_platform_apis', 0.7),
      req('skill_flutter', 'knowledge_widgets'), req('skill_flutter', 'knowledge_dart'),

      prereq('knowledge_components', 'knowledge_native_components'), prereq('knowledge_components', 'knowledge_react_hooks'),
      isA('knowledge_stack_navigation', 'knowledge_navigation'),
      related('knowledge_native_components', 'knowledge_widgets', 'similar'),

      parentOf('area_mobile', 'area_cross_platform', 1), parentOf('area_mobile', 'area_flutter_eco', 2),
      has('area_react_eco', 'knowledge_components'), has('area_react_eco', 'knowledge_react_hooks'),
      has('area_cross_platform', 'knowledge_native_components'), has('area_cross_platform', 'knowledge_navigation'),
      has('area_cross_platform', 'knowledge_stack_navigation'), has('area_cross_platform', 'knowledge_expo'),
      has('area_cross_platform', 'knowledge_platform_apis', 0.7),
      has('area_flutter_eco', 'knowledge_widgets'), has('area_flutter_eco', 'knowledge_dart'),

      hasSkill('skill_react', 0.62, 0.9, 'mentor', '2025-11-21T09:30:00Z', 'Mentor review · Sarah Chen'),
      hasSkill('skill_react_native', 0.22, 0.5, 'self-report', '2025-10-30T19:00:00Z'),

      practices('task_rn_todo', 'skill_react_native', 0.9, true),
      applies('task_rn_todo', 'knowledge_navigation'), applies('task_rn_todo', 'knowledge_native_components'),
      covers('content_rn_intro', 'knowledge_native_components', 'overview'), covers('content_rn_intro', 'knowledge_expo', 'applied'),
      assesses('quiz_rn_basics', 'skill_react_native', 'easy', ['single_choice', 'true_false'], 0.5),
      coaches('mentor_linh', 'skill_react_native'), coaches('mentor_linh', 'knowledge_navigation')
    ]
  },

  AI: {
    role: 'role_ml_eng',
    rels: [
      req('role_ml_eng', 'skill_python', 1), req('role_ml_eng', 'skill_data_analysis', 0.8),
      req('role_ml_eng', 'skill_ml', 1), req('role_ml_eng', 'skill_deep_learning', 0.7),
      req('skill_ml', 'skill_python', 1), req('skill_ml', 'skill_data_analysis', 0.8), req('skill_deep_learning', 'skill_ml', 1),
      req('skill_data_analysis', 'skill_python', 0.8),

      req('skill_python', 'knowledge_numpy', 0.8), req('skill_python', 'knowledge_vectorization', 0.6),
      req('skill_data_analysis', 'knowledge_pandas'), req('skill_data_analysis', 'knowledge_numpy', 0.7),
      req('skill_ml', 'knowledge_supervised'), req('skill_ml', 'knowledge_linear_regression'), req('skill_ml', 'knowledge_decision_tree', 0.8),
      req('skill_ml', 'knowledge_overfitting'), req('skill_ml', 'knowledge_cross_validation', 0.9), req('skill_ml', 'knowledge_gradient_descent', 0.8),
      req('skill_deep_learning', 'knowledge_gradient_descent'), req('skill_deep_learning', 'knowledge_neural_networks'),
      req('skill_deep_learning', 'knowledge_backprop'),

      isA('knowledge_linear_regression', 'knowledge_supervised'), isA('knowledge_decision_tree', 'knowledge_supervised'),
      prereq('knowledge_numpy', 'knowledge_vectorization'), prereq('knowledge_overfitting', 'knowledge_cross_validation'),
      prereq('knowledge_gradient_descent', 'knowledge_backprop'), prereq('knowledge_neural_networks', 'knowledge_backprop'),
      related('knowledge_numpy', 'knowledge_pandas', 'complements'),

      parentOf('area_ai', 'area_python_data', 1), parentOf('area_ai', 'area_ml_foundations', 2), parentOf('area_ai', 'area_dl', 3),
      has('area_python_data', 'knowledge_numpy'), has('area_python_data', 'knowledge_pandas'), has('area_python_data', 'knowledge_vectorization'),
      has('area_ml_foundations', 'knowledge_supervised'), has('area_ml_foundations', 'knowledge_linear_regression'),
      has('area_ml_foundations', 'knowledge_decision_tree'), has('area_ml_foundations', 'knowledge_overfitting'),
      has('area_ml_foundations', 'knowledge_cross_validation'), has('area_ml_foundations', 'knowledge_gradient_descent'),
      has('area_dl', 'knowledge_neural_networks'), has('area_dl', 'knowledge_backprop'),

      hasSkill('skill_python', 0.45, 0.8, 'quiz', '2025-10-15T10:00:00Z'),
      hasSkill('skill_data_analysis', 0.3, 0.6, 'task', '2025-10-28T15:30:00Z'),
      hasSkill('skill_ml', 0.12, 0.4, 'self-report', '2025-09-30T08:00:00Z'),

      practices('task_titanic', 'skill_ml', 0.8, true), practices('task_titanic', 'skill_data_analysis', 0.6, false),
      applies('task_titanic', 'knowledge_pandas'), applies('task_titanic', 'knowledge_decision_tree'), applies('task_titanic', 'knowledge_cross_validation'),
      covers('content_ml_intro', 'knowledge_supervised', 'overview'), covers('content_ml_intro', 'knowledge_linear_regression', 'applied'),
      covers('content_ml_intro', 'knowledge_overfitting', 'applied'),
      assesses('quiz_ml_basics', 'skill_ml', 'medium', ['single_choice', 'multiple_choice'], 0.6),
      assesses('quiz_ml_basics', 'knowledge_overfitting', 'easy', ['true_false']),
      coaches('mentor_huy', 'skill_ml'), coaches('mentor_huy', 'knowledge_neural_networks')
    ]
  },

  'Data Engineering': {
    role: 'role_data_eng',
    rels: [
      req('role_data_eng', 'skill_sql', 1), req('role_data_eng', 'skill_data_modeling', 0.9),
      req('role_data_eng', 'skill_etl', 1), req('role_data_eng', 'skill_python', 0.7), req('role_data_eng', 'skill_orchestration', 0.6),
      req('skill_etl', 'skill_sql', 0.9), req('skill_etl', 'skill_python', 0.7), req('skill_data_modeling', 'skill_sql', 0.8),
      related('skill_etl', 'skill_orchestration', 'complements'),

      req('skill_sql', 'knowledge_joins'), req('skill_sql', 'knowledge_window_functions', 0.8),
      req('skill_data_modeling', 'knowledge_normalization'), req('skill_data_modeling', 'knowledge_dimensional_modeling'),
      req('skill_data_modeling', 'knowledge_star_schema'), req('skill_data_modeling', 'knowledge_snowflake_schema', 0.6),
      req('skill_etl', 'knowledge_batch_processing'), req('skill_etl', 'knowledge_incremental_load', 0.8),
      req('skill_orchestration', 'knowledge_dag'), req('skill_orchestration', 'knowledge_airflow', 0.8),
      req('skill_python', 'knowledge_pandas', 0.6),

      isA('knowledge_star_schema', 'knowledge_dimensional_modeling'), isA('knowledge_snowflake_schema', 'knowledge_dimensional_modeling'),
      prereq('knowledge_joins', 'knowledge_window_functions'), prereq('knowledge_dag', 'knowledge_airflow'),
      prereq('knowledge_batch_processing', 'knowledge_incremental_load'),
      related('knowledge_star_schema', 'knowledge_snowflake_schema', 'alternative'),

      parentOf('area_data_eng', 'area_sql_analytics', 1), parentOf('area_data_eng', 'area_data_modeling', 2), parentOf('area_data_eng', 'area_pipelines', 3),
      has('area_sql_analytics', 'knowledge_joins'), has('area_sql_analytics', 'knowledge_window_functions'),
      has('area_data_modeling', 'knowledge_normalization'), has('area_data_modeling', 'knowledge_dimensional_modeling'),
      has('area_data_modeling', 'knowledge_star_schema'), has('area_data_modeling', 'knowledge_snowflake_schema'),
      has('area_pipelines', 'knowledge_batch_processing'), has('area_pipelines', 'knowledge_incremental_load'),
      has('area_pipelines', 'knowledge_dag'), has('area_pipelines', 'knowledge_airflow'),
      has('area_python_data', 'knowledge_pandas'),

      hasSkill('skill_sql', 0.31, 0.75, 'quiz', '2025-10-22T09:15:00Z'),
      hasSkill('skill_python', 0.45, 0.8, 'quiz', '2025-10-15T10:00:00Z'),
      hasSkill('skill_etl', 0.25, 0.5, 'self-report', '2025-10-01T12:00:00Z'),

      practices('task_sales_dw', 'skill_data_modeling', 0.9, true), practices('task_sales_dw', 'skill_sql', 0.6, false),
      applies('task_sales_dw', 'knowledge_star_schema'), applies('task_sales_dw', 'knowledge_window_functions'),
      covers('content_window_fn', 'knowledge_window_functions', 'deep_dive'),
      assesses('quiz_sql_adv', 'knowledge_window_functions', 'hard', ['fill_in_blank', 'multiple_choice'], 0.8),
      assesses('quiz_sql_adv', 'skill_sql', 'medium', ['single_choice']),
      coaches('mentor_minh', 'skill_sql'), coaches('mentor_minh', 'skill_data_modeling')
    ]
  }
};

export const DOMAINS = Object.keys(DATASETS) as Domain[];

// ─── Graph access ─────────────────────────────────────────────────────────────

export interface Graph {
  role: GraphNode;
  nodes: GraphNode[];
  rels: GraphRel[];
  byId: Map<string, GraphNode>;
  out: Map<string, GraphRel[]>;
  in: Map<string, GraphRel[]>;
  domains: string[];
}

// `newLearner` previews the same domain for an account with no HAS_SKILL edges
// yet — the cold-start case the locked/missing split is designed for.
export function buildGraph(domain: Domain, { newLearner = false } = {}): Graph {
  const { role, rels: specs } = DATASETS[domain];
  const rels: GraphRel[] = specs
    .filter(([type]) => !(newLearner && type === 'HAS_SKILL'))
    .map(([type, from, to, props = {}]) => ({ id: `${type}:${from}->${to}`, type, from, to, props }));
  const ids = new Set<string>([role]);
  rels.forEach(r => { ids.add(r.from); ids.add(r.to); });
  const nodes = [...ids].map(id => {
    const n = LIB[id];
    if (!n) throw new Error(`Unknown node id in ${domain} dataset: ${id}`);
    return n;
  });
  const byId = new Map(nodes.map(n => [n.id, n]));
  const out = new Map<string, GraphRel[]>();
  const inc = new Map<string, GraphRel[]>();
  nodes.forEach(n => { out.set(n.id, []); inc.set(n.id, []); });
  rels.forEach(r => { out.get(r.from)!.push(r); inc.get(r.to)!.push(r); });
  return { role: byId.get(role)!, nodes, rels, byId, out, in: inc };
}

export function nodeName(n: GraphNode): string {
  return NODE_META[n.label].group === 'shadow' ? n.id : String(n.props.name);
}

export function hasSkillOf(g: Graph, skillId: string): GraphRel | undefined {
  return g.in.get(skillId)?.find(r => r.type === 'HAS_SKILL' && r.from === ME);
}

export function requiredSkillIds(g: Graph): Set<string> {
  return new Set(g.out.get(g.role.id)!.filter(r => r.type === 'REQUIRES').map(r => r.to));
}

// Skills this skill REQUIRES that the learner doesn't have at UNLOCK_AT yet
export function blockingSkills(g: Graph, skillId: string): string[] {
  return g.out.get(skillId)!
    .filter(r => r.type === 'REQUIRES' && g.byId.get(r.to)!.label === 'Skill')
    .map(r => r.to)
    .filter(dep => ((hasSkillOf(g, dep)?.props.proficiency as number | undefined) ?? 0) < UNLOCK_AT);
}

// ─── Knowledge status (derived) ───────────────────────────────────────────────
// The schema records learner progress only at Skill level (Account -HAS_SKILL->
// Skill); there is no Account→Knowledge edge. A Knowledge's status is therefore
// inferred from the skills that REQUIRE it:
//   not-learned — no parent skill is proficient enough for this Knowledge's
//                 difficulty (or there's no evidence at all)
//   review      — the bar is met, but only just, or the evidence is old or
//                 low-confidence (e.g. self-reported)
//   mastered    — the bar is met with room to spare, on recent, confident evidence
// When several skills REQUIRE the same Knowledge, the best one wins.

export type KnowledgeStatus = 'mastered' | 'review' | 'not-learned';

// Proficiency a parent skill needs before a Knowledge of that difficulty counts
// as learned — the lower edge of the matching proficiency band.
const DIFFICULTY_BAR: Record<string, number> = { beginner: 0.2, intermediate: 0.4, advanced: 0.6, expert: 0.8 };
export const REVIEW_MARGIN = 0.1;      // within this of the bar = shaky
export const REVIEW_AFTER_DAYS = 45;   // evidence older than this = rusty
export const REVIEW_CONFIDENCE = 0.6;  // below this = not trustworthy yet

export const KNOWLEDGE_STATUS_META: Record<KnowledgeStatus, { label: string; hint: string }> = {
  mastered: { label: 'Mastered', hint: 'The skill behind it is well above what this concept needs, on recent, confident evidence' },
  review: { label: 'Needs review', hint: `Only just above the bar, evidence older than ${REVIEW_AFTER_DAYS} days, or low confidence` },
  'not-learned': { label: 'Not learned', hint: 'No skill behind it is proficient enough for this concept yet' }
};

const DAY = 86_400_000;
const RANK: Record<KnowledgeStatus, number> = { mastered: 2, review: 1, 'not-learned': 0 };

export function knowledgeStatus(g: Graph, knowledgeId: string): { status: KnowledgeStatus; reason: string } {
  const k = g.byId.get(knowledgeId)!;
  const need = DIFFICULTY_BAR[String(k.props.difficulty ?? 'intermediate')] ?? 0.4;
  const parents = g.in.get(knowledgeId)!
    .filter(r => r.type === 'REQUIRES' && g.byId.get(r.from)!.label === 'Skill')
    .map(r => r.from);

  // "Now" is the account's latest recorded activity, so staleness is relative
  // to how the learner has been progressing rather than to the wall clock.
  const owned = g.rels.filter(r => r.type === 'HAS_SKILL' && r.from === ME);
  const latest = Math.max(0, ...owned.map(r => Date.parse(String(r.props.lastUpdatedAt))));

  let best: { status: KnowledgeStatus; reason: string } = {
    status: 'not-learned',
    reason: `No progress recorded yet on ${parents.map(p => nodeName(g.byId.get(p)!)).join(' or ')}`
  };
  for (const p of parents) {
    const hs = hasSkillOf(g, p);
    if (!hs) continue;
    const skill = nodeName(g.byId.get(p)!);
    const prof = hs.props.proficiency as number;
    const conf = (hs.props.confidence as number | undefined) ?? 1;
    const ageDays = (latest - Date.parse(String(hs.props.lastUpdatedAt))) / DAY;
    const bar = `${skill} at ${Math.round(prof * 100)}%, this ${k.props.difficulty ?? 'intermediate'} concept needs ${Math.round(need * 100)}%`;

    let cand: { status: KnowledgeStatus; reason: string };
    if (prof < need) cand = { status: 'not-learned', reason: bar };
    else if (prof < need + REVIEW_MARGIN) cand = { status: 'review', reason: `${bar} — only just above` };
    else if (ageDays > REVIEW_AFTER_DAYS) cand = { status: 'review', reason: `${bar}, but last evidence is ${Math.round(ageDays)} days older than your latest` };
    else if (conf < REVIEW_CONFIDENCE) cand = { status: 'review', reason: `${bar}, but confidence is ${Math.round(conf * 100)}% (${hs.props.source})` };
    else cand = { status: 'mastered', reason: bar };

    if (RANK[cand.status] > RANK[best.status] || best.reason.startsWith('No progress')) best = cand;
  }
  return best;
}

// Knowledge a Skill REQUIRES, most central (by weight) first. Used to surface
// "what to keep sharp" underneath a skill the learner already has evidence for.
export function requiredKnowledge(g: Graph, skillId: string): string[] {
  return g.out.get(skillId)!
    .filter(r => r.type === 'REQUIRES' && g.byId.get(r.to)!.label === 'Knowledge')
    .sort((a, b) => ((b.props.weight as number) ?? 1) - ((a.props.weight as number) ?? 1))
    .map(r => r.to);
}

export function skillState(g: Graph, skillId: string): SkillState {
  const hs = hasSkillOf(g, skillId);
  if (hs) return proficiencyBand(hs.props.proficiency as number);
  if (!requiredSkillIds(g).has(skillId)) return 'untracked';
  return blockingSkills(g, skillId).length ? 'locked' : 'missing';
}

// Topological order over one relationship type (edges point from "first" to
// "then"). Nodes outside the given set are ignored.
export function topoOrder(ids: string[], rels: GraphRel[], type: RelType, reverse = false): string[] {
  const set = new Set(ids);
  const indeg = new Map(ids.map(id => [id, 0]));
  const next = new Map(ids.map(id => [id, [] as string[]]));
  rels.filter(r => r.type === type && set.has(r.from) && set.has(r.to)).forEach(r => {
    const [a, b] = reverse ? [r.to, r.from] : [r.from, r.to];
    next.get(a)!.push(b);
    indeg.set(b, indeg.get(b)! + 1);
  });
  const queue = ids.filter(id => indeg.get(id) === 0);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    next.get(id)!.forEach(b => {
      indeg.set(b, indeg.get(b)! - 1);
      if (indeg.get(b) === 0) queue.push(b);
    });
  }
  return order.length === ids.length ? order : ids;
}

// ─── Schema validation (§2 constraints and §11 checklist) ─────────────────────

function findCycle(g: Graph, type: RelType): string[] | null {
  const adj = new Map<string, string[]>();
  g.rels.filter(r => r.type === type).forEach(r => {
    if (!adj.has(r.from)) adj.set(r.from, []);
    adj.get(r.from)!.push(r.to);
  });
  const state = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const visit = (id: string): string[] | null => {
    state.set(id, 1);
    stack.push(id);
    for (const nxt of adj.get(id) ?? []) {
      if (state.get(nxt) === 1) return [...stack.slice(stack.indexOf(nxt)), nxt];
      if (!state.has(nxt)) {
        const c = visit(nxt);
        if (c) return c;
      }
    }
    stack.pop();
    state.set(id, 2);
    return null;
  };
  for (const id of adj.keys()) {
    if (!state.has(id)) {
      const c = visit(id);
      if (c) return c;
    }
  }
  return null;
}

function checkValue(spec: PropSpec, v: PropValue): string | null {
  if (spec.type === 'float' || spec.type === 'int') {
    if (typeof v !== 'number') return 'must be a number';
    if (spec.type === 'int' && !Number.isInteger(v)) return 'must be an integer';
    if (spec.range && (v < spec.range[0] || v > spec.range[1])) return `must be in [${spec.range[0]}, ${spec.range[1]}]`;
  }
  if (spec.type === 'boolean' && typeof v !== 'boolean') return 'must be boolean';
  if (spec.type === 'string_list' && !Array.isArray(v)) return 'must be a list';
  if (spec.type === 'enum_list') {
    if (!Array.isArray(v) || v.length === 0) return 'must be a non-empty list';
    const bad = v.filter(x => !spec.enum!.includes(x));
    if (bad.length) return `invalid values ${bad.join(', ')}`;
  }
  if (spec.type === 'string' && spec.enum && !spec.enum.includes(String(v))) return `"${v}" not in enum`;
  if (spec.type === 'json') {
    try { JSON.parse(String(v)); } catch { return 'must be valid JSON'; }
  }
  if (spec.type === 'datetime' && Number.isNaN(Date.parse(String(v)))) return 'must be a datetime';
  return null;
}

function checkProps(where: string, specs: PropSpec[], props: Props, issues: string[]) {
  specs.forEach(spec => {
    const v = props[spec.name];
    if (v === undefined) {
      if (spec.required) issues.push(`${where}: missing required ${spec.name}`);
      return;
    }
    const err = checkValue(spec, v);
    if (err) issues.push(`${where}: ${spec.name} ${err}`);
  });
  Object.keys(props).forEach(k => {
    if (!specs.some(s => s.name === k)) issues.push(`${where}: unknown property ${k}`);
  });
}

export function validateGraph(g: Graph): string[] {
  const issues: string[] = [];

  g.nodes.forEach(n => checkProps(`${n.label} ${n.id}`, NODE_META[n.label].props, n.props, issues));

  const seen = new Set<string>();
  g.rels.forEach(r => {
    const where = `${r.type} ${r.from}→${r.to}`;
    if (seen.has(r.id)) issues.push(`${where}: duplicate relationship`);
    seen.add(r.id);
    if (r.from === r.to) issues.push(`${where}: self-loop`);
    const a = g.byId.get(r.from)!.label;
    const b = g.byId.get(r.to)!.label;
    if (!REL_META[r.type].endpoints.some(([x, y]) => x === a && y === b)) issues.push(`${where}: ${a}→${b} not allowed`);
    checkProps(where, REL_META[r.type].props, r.props, issues);
  });

  // Knowledge must be REQUIRED by at least one Skill and sit in a leaf area.
  g.nodes.filter(n => n.label === 'Knowledge').forEach(n => {
    const inc = g.in.get(n.id)!;
    if (!inc.some(r => r.type === 'REQUIRES' && g.byId.get(r.from)!.label === 'Skill')) issues.push(`Knowledge ${n.id}: orphan (no Skill REQUIRES it)`);
    if (!inc.some(r => r.type === 'HAS')) issues.push(`Knowledge ${n.id}: not in any KnowledgeArea`);
  });

  // Only leaf areas may HAS Knowledge.
  g.nodes.filter(n => n.label === 'KnowledgeArea').forEach(n => {
    const out = g.out.get(n.id)!;
    if (out.some(r => r.type === 'PARENT_OF') && out.some(r => r.type === 'HAS')) issues.push(`KnowledgeArea ${n.id}: has children and HAS Knowledge`);
    if (g.in.get(n.id)!.filter(r => r.type === 'PARENT_OF').length > 1) issues.push(`KnowledgeArea ${n.id}: more than one parent`);
  });

  (['PARENT_OF', 'PREREQUISITE', 'IS_A'] as RelType[]).forEach(t => {
    const c = findCycle(g, t);
    if (c) issues.push(`${t}: cycle ${c.join(' → ')}`);
  });

  // A specific relationship already covers the pair: RELATED_TO is redundant.
  g.rels.filter(r => r.type === 'RELATED_TO').forEach(r => {
    const dup = g.rels.find(o => o !== r && o.type !== 'RELATED_TO' &&
      ((o.from === r.from && o.to === r.to) || (o.from === r.to && o.to === r.from)));
    if (dup) issues.push(`RELATED_TO ${r.from}↔${r.to}: redundant with ${dup.type}`);
  });

  return issues;
}
