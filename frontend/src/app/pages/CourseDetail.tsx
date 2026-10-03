import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Clock, Play, CheckCircle, MessageCircle, Users, Award,
  ChevronRight, ChevronDown, ChevronLeft, ArrowRight, Network,
  FolderKanban, Sparkles, Target, Zap, Star, Layers, AlertCircle,
  Video, FileText, Code2, HelpCircle, Briefcase, Globe, Lock
} from 'lucide-react';
import {
  LEVEL_META, BRAND_INK_CLS, BRAND_BAR_CLS, MUTED_TINT_CLS,
  hexToRgba, LevelPill, levelFill, type Level
} from '../components/courseStyle';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  type: 'video' | 'exercise' | 'quiz' | 'reading';
}

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: number;
  completed: number;
  duration: string;
  locked: boolean;
  items: Lesson[];
}

interface ConceptNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'core' | 'related' | 'output';
  mastered: boolean;
}

interface ConceptEdge {
  from: string;
  to: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const COURSE_DATA = {
  id: 1,
  title: 'Advanced React Patterns',
  tagline: 'Go beyond tutorials — build production-grade React applications with confidence.',
  description: 'Master the advanced React patterns that senior engineers use daily. From custom hook architecture to concurrent rendering, you\'ll learn how to structure complex state, optimize rendering, and design component APIs that scale.',
  domain: 'Frontend',
  difficulty: 'Advanced' as Level,
  duration: '8 weeks',
  weeklyHours: 6,
  totalLessons: 25,
  completedLessons: 17,
  progress: 68,
  enrolled: true,
  certificate: true,
  lastUpdated: 'June 2026',

  instructor: {
    name: 'Sarah Chen',
    role: 'Senior Frontend Engineer',
    company: 'Meta',
    bio: 'Sarah has 9 years building large-scale React applications at Facebook, Meta, and several YC startups. She\'s an open-source contributor to the React ecosystem and has mentored 300+ engineers through technical interviews.',
    students: 18400,
    courses: 4,
    rating: 4.9,
    initials: 'SC',
    avatar: 'bg-gradient-to-br from-blue-500 to-purple-600'
  },

  prerequisites: [
    { label: 'React Fundamentals', mastery: 75, met: true, courseId: null },
    { label: 'JavaScript ES6+', mastery: 90, met: true, courseId: null },
    { label: 'TypeScript Basics', mastery: 42, met: false, courseId: 3 },
    { label: 'CSS & Flexbox', mastery: 88, met: true, courseId: null }
  ],

  outcomes: [
    'Build reusable custom hook libraries with proper TypeScript signatures',
    'Implement compound components and render-prop patterns for flexible APIs',
    'Profile and fix React performance bottlenecks using DevTools',
    'Manage complex state with useReducer, Context, and external stores',
    'Apply concurrent rendering features: Suspense, transitions, and deferred values',
    'Write component APIs that other engineers enjoy using'
  ],

  conceptsCovered: ['Custom Hooks', 'Context API', 'useReducer', 'Memoization', 'Suspense', 'Render Props', 'Compound Components', 'Code Splitting'],

  skillImpact: [
    { skill: 'React', before: 65, after: 90 },
    { skill: 'TypeScript', before: 42, after: 68 },
    { skill: 'Performance', before: 30, after: 72 }
  ],

  projectsUnlocked: [
    { name: 'Real-Time Dashboard', level: 'Advanced' as Level, points: 450 },
    { name: 'Component Library', level: 'Intermediate' as Level, points: 280 },
    { name: 'E-commerce Frontend', level: 'Advanced' as Level, points: 500 }
  ],

  learningPaths: ['Frontend Developer', 'Full Stack Engineer'],

  suitableFor: [
    { label: 'React developers with 1+ year experience', icon: <Code2 size={15} /> },
    { label: 'Engineers preparing for senior-level interviews', icon: <Briefcase size={15} /> },
    { label: 'Developers building complex component libraries', icon: <Layers size={15} /> },
    { label: 'Anyone aiming for Frontend / Full Stack roles', icon: <Target size={15} /> }
  ],

  relatedCourses: [
    { id: 3, title: 'TypeScript for React Developers', badge: 'Take first', level: 'Beginner' as Level },
    { id: 4, title: 'System Design Fundamentals', badge: 'Take after', level: 'Advanced' as Level }
  ],

  conceptGraph: {
    nodes: [
      { id: 'hooks', label: 'React Hooks', x: 200, y: 120, type: 'core', mastered: true },
      { id: 'custom-hooks', label: 'Custom Hooks', x: 100, y: 60, type: 'output', mastered: true },
      { id: 'usereducer', label: 'useReducer', x: 90, y: 170, type: 'core', mastered: true },
      { id: 'context', label: 'Context API', x: 300, y: 60, type: 'core', mastered: false },
      { id: 'memo', label: 'Memoization', x: 320, y: 180, type: 'core', mastered: false },
      { id: 'suspense', label: 'Suspense', x: 430, y: 110, type: 'output', mastered: false },
      { id: 'patterns', label: 'Design Patterns', x: 220, y: 230, type: 'output', mastered: false },
      { id: 'perf', label: 'Performance', x: 370, y: 240, type: 'output', mastered: false }
    ] as ConceptNode[],
    edges: [
      { from: 'hooks', to: 'custom-hooks' },
      { from: 'hooks', to: 'usereducer' },
      { from: 'hooks', to: 'context' },
      { from: 'hooks', to: 'memo' },
      { from: 'memo', to: 'perf' },
      { from: 'context', to: 'suspense' },
      { from: 'usereducer', to: 'patterns' },
      { from: 'patterns', to: 'perf' }
    ] as ConceptEdge[]
  }
};

const MODULES: Module[] = [
  {
    id: 1, title: 'Advanced Hooks', description: 'Deep dive into React\'s hook system and custom hook patterns.',
    lessons: 6, completed: 6, duration: '2h 30m', locked: false,
    items: [
      { id: 1, title: 'Custom Hooks Deep Dive', duration: '25min', completed: true, type: 'video' },
      { id: 2, title: 'useReducer vs useState', duration: '20min', completed: true, type: 'video' },
      { id: 3, title: 'useCallback and useMemo', duration: '30min', completed: true, type: 'video' },
      { id: 4, title: 'useRef Advanced Patterns', duration: '22min', completed: true, type: 'video' },
      { id: 5, title: 'Custom Hook Library', duration: '35min', completed: true, type: 'exercise' },
      { id: 6, title: 'Advanced Hooks Quiz', duration: '15min', completed: true, type: 'quiz' }
    ]
  },
  {
    id: 2, title: 'Context API & State Management', description: 'Global state patterns, provider composition, and performance.',
    lessons: 8, completed: 6, duration: '3h 15m', locked: false,
    items: [
      { id: 7, title: 'Context API Fundamentals', duration: '28min', completed: true, type: 'video' },
      { id: 8, title: 'Provider Pattern', duration: '25min', completed: true, type: 'video' },
      { id: 9, title: 'Context Performance', duration: '30min', completed: true, type: 'video' },
      { id: 10, title: 'Multiple Contexts', duration: '22min', completed: true, type: 'video' },
      { id: 11, title: 'Global State Management', duration: '35min', completed: true, type: 'video' },
      { id: 12, title: 'Building a Theme System', duration: '40min', completed: true, type: 'exercise' },
      { id: 13, title: 'State Management Quiz', duration: '15min', completed: false, type: 'quiz' },
      { id: 14, title: 'Context vs Redux', duration: '20min', completed: false, type: 'video' }
    ]
  },
  {
    id: 3, title: 'Performance Optimization', description: 'Profile, measure, and fix React performance bottlenecks.',
    lessons: 7, completed: 3, duration: '2h 45m', locked: false,
    items: [
      { id: 15, title: 'React DevTools Profiler', duration: '25min', completed: true, type: 'video' },
      { id: 16, title: 'Memoization Techniques', duration: '30min', completed: true, type: 'video' },
      { id: 17, title: 'Code Splitting', duration: '28min', completed: true, type: 'video' },
      { id: 18, title: 'Lazy Loading', duration: '22min', completed: false, type: 'video' },
      { id: 19, title: 'Virtualization', duration: '35min', completed: false, type: 'video' },
      { id: 20, title: 'Performance Project', duration: '45min', completed: false, type: 'exercise' },
      { id: 21, title: 'Optimization Quiz', duration: '15min', completed: false, type: 'quiz' }
    ]
  },
  {
    id: 4, title: 'Design Patterns', description: 'Compound components, render props, and HOC patterns.',
    lessons: 4, completed: 0, duration: '1h 50m', locked: true,
    items: [
      { id: 22, title: 'Compound Components', duration: '30min', completed: false, type: 'video' },
      { id: 23, title: 'Render Props', duration: '25min', completed: false, type: 'video' },
      { id: 24, title: 'Higher Order Components', duration: '28min', completed: false, type: 'video' },
      { id: 25, title: 'Patterns Quiz', duration: '12min', completed: false, type: 'quiz' }
    ]
  }
];

// Unmet prerequisites use the Intermediate yellow; raw yellow is unreadable as
// text on white, so light mode gets a dark amber shade.
const WARN_INK_CLS = 'text-[#8a5a00] dark:text-[#fcbf16]';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function LessonTypeIcon({ type }: { type: Lesson['type'] }) {
  const cls = 'text-muted-foreground shrink-0';
  if (type === 'video') return <Video size={13} className={cls} />;
  if (type === 'exercise') return <Code2 size={13} className={cls} />;
  if (type === 'quiz') return <HelpCircle size={13} className={cls} />;
  return <FileText size={13} className={cls} />;
}

function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <h3>{title}</h3>
      {caption && <span className="text-sm text-muted-foreground">{caption}</span>}
    </div>
  );
}

function SkillBar({ skill, before, after }: { skill: string; before: number; after: number }) {
  const delta = after - before;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-muted-foreground w-20 shrink-0 truncate">{skill}</span>
      <div className="relative flex-1 h-1.5 rounded-full bg-background">
        <div className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30" style={{ width: `${before}%` }} />
        <div className={`absolute inset-y-0 rounded-full ${BRAND_BAR_CLS}`} style={{ left: `${before}%`, width: `${delta}%` }} />
      </div>
      <div className="flex items-center gap-1 shrink-0 text-xs">
        <span className="text-muted-foreground">{before}%</span>
        <ArrowRight size={9} className="text-muted-foreground" />
        <span className={`font-medium ${BRAND_INK_CLS}`}>{after}%</span>
      </div>
    </div>
  );
}

// ─── Concept Graph ────────────────────────────────────────────────────────────

const NODE_STROKE: Record<ConceptNode['type'], string> = {
  core: LEVEL_META.Beginner.hex,
  related: 'var(--muted-foreground)',
  output: LEVEL_META.Advanced.hex
};

function ConceptGraph({ nodes, edges }: { nodes: ConceptNode[]; edges: ConceptEdge[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className={`rounded-2xl p-4 ${MUTED_TINT_CLS}`}>
      <svg viewBox="0 0 520 300" className="w-full" style={{ height: 220 }}>
        <defs>
          <marker id="cg-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="var(--muted-foreground)" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const from = nodes.find(n => n.id === e.from);
          const to = nodes.find(n => n.id === e.to);
          if (!from || !to) return null;
          const isActive = hovered === e.from || hovered === e.to;
          return (
            <line key={i}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="var(--muted-foreground)"
              strokeOpacity={isActive ? 0.8 : 0.3}
              strokeWidth={isActive ? 1.5 : 1}
              markerEnd="url(#cg-arrow)"
            />
          );
        })}
        {nodes.map(node => {
          const stroke = NODE_STROKE[node.type];
          const isHov = hovered === node.id;
          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={node.x} cy={node.y} r={isHov ? 20 : 17}
                fill="var(--card)" stroke={stroke}
                strokeWidth={node.mastered ? 2.5 : 1.5}
                opacity={node.mastered ? 1 : 0.7}
              />
              {node.mastered && (
                <circle cx={node.x} cy={node.y} r={9} fill={stroke} opacity={0.35} />
              )}
              <text x={node.x} y={node.y + 31} textAnchor="middle" fontSize={10}
                fill={isHov ? 'var(--foreground)' : 'var(--muted-foreground)'}>
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-5 mt-1 px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_STROKE.core }} />
          Core concept
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_STROKE.output }} />
          Output / skill
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-muted-foreground bg-muted-foreground/30" />
          Already mastered
        </div>
      </div>
    </div>
  );
}

// ─── Module Accordion ─────────────────────────────────────────────────────────

function ModuleRow({ mod, courseId }: { mod: Module; courseId: number }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(mod.completed > 0 && mod.completed < mod.lessons);
  const pct = Math.round((mod.completed / mod.lessons) * 100);

  return (
    <div className={`rounded-xl overflow-hidden ${MUTED_TINT_CLS}`}>
      <button
        onClick={() => !mod.locked && setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-opacity ${
          mod.locked ? 'cursor-default opacity-50' : 'hover:opacity-80'
        }`}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-background">
          {mod.locked
            ? <Lock size={13} className="text-muted-foreground" />
            : pct === 100
            ? <CheckCircle size={15} className={BRAND_INK_CLS} />
            : pct > 0
            ? <Play size={13} className={BRAND_INK_CLS} />
            : <div className="w-3.5 h-3.5 rounded border-2 border-muted-foreground/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="leading-snug">{mod.title}</h4>
            {!mod.locked && pct > 0 && pct < 100 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground shrink-0">
                {pct}% done
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <span className="shrink-0">{mod.completed}/{mod.lessons} lessons</span>
            <span>·</span>
            <span className="shrink-0">{mod.duration}</span>
            <span>·</span>
            <span className="truncate">{mod.description}</span>
          </div>
        </div>
        {!mod.locked && (
          <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {!mod.locked && open && (
        <div className="px-2 pb-2 space-y-1">
          {mod.items.map(item => (
            <div key={item.id}
              onClick={() => navigate(`/courses/${courseId}/lesson/${item.id}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div className="w-5 flex items-center justify-center shrink-0">
                {item.completed
                  ? <CheckCircle size={14} className={BRAND_INK_CLS} />
                  : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/50" />}
              </div>
              <LessonTypeIcon type={item.type} />
              <span className={`flex-1 text-sm ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{item.duration}</span>
              <Play size={11} className="text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function CourseDetail() {
  const navigate = useNavigate();
  const course = COURSE_DATA;
  const level = LEVEL_META[course.difficulty];
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'discussions'>('overview');

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'curriculum', label: `Curriculum (${course.totalLessons})` },
    { key: 'discussions', label: 'Discussions' }
  ] as const;

  const discussions = [
    { id: 1, user: 'John Doe', initials: 'JD', topic: 'When to use useReducer vs useState?', replies: 8, time: '2h ago', solved: true },
    { id: 2, user: 'Fatima Al-Hassan', initials: 'FA', topic: 'Context performance issues with many consumers', replies: 14, time: '5h ago', solved: false },
    { id: 3, user: 'Mike Johnson', initials: 'MJ', topic: 'Best pattern for custom hook that fetches data', replies: 12, time: '1d ago', solved: true }
  ];

  const heroChipCls = 'text-xs px-2.5 py-1 rounded-full bg-background/90 text-foreground';

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={15} />
        Courses
      </button>

      {/* ── Hero — same level-colored shape as the Recommended cards ── */}
      <div
        className="px-8 py-8 space-y-5"
        style={{ ...levelFill(course.difficulty), color: level.on, borderRadius: '0.5rem', borderTopLeftRadius: '4rem' }}
      >
        <div className="flex items-center gap-2 flex-wrap pl-6">
          <span className={heroChipCls}>{course.difficulty}</span>
          <span className={heroChipCls}>{course.domain}</span>
          <span className={heroChipCls}>{course.duration} · {course.weeklyHours}h/week</span>
          {course.certificate && (
            <span className={`${heroChipCls} flex items-center gap-1`}>
              <Award size={11} /> Certificate
            </span>
          )}
        </div>

        <div>
          <h1 className="text-3xl mb-2">{course.title}</h1>
          <p className="max-w-2xl opacity-85">{course.tagline}</p>
        </div>

        {course.enrolled && (
          <div className="max-w-md">
            <div className="flex justify-between text-xs mb-1.5 opacity-85">
              <span>{course.completedLessons}/{course.totalLessons} lessons complete</span>
              <span>{course.progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: hexToRgba(level.on, 0.25) }}>
              <div className="h-1.5 rounded-full" style={{ width: `${course.progress}%`, backgroundColor: level.on }} />
            </div>
          </div>
        )}

        <div
          className="flex flex-wrap items-center gap-3 pt-5 border-t"
          style={{ borderColor: hexToRgba(level.on, 0.2) }}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shrink-0 ${course.instructor.avatar}`}>
            {course.instructor.initials}
          </div>
          <div>
            <span className="text-sm font-medium">{course.instructor.name}</span>
            <span className="text-xs ml-2 opacity-75">{course.instructor.role} @ {course.instructor.company}</span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs opacity-85">
            <div className="flex items-center gap-1"><Star size={11} className="fill-current" /><span>{course.instructor.rating}</span></div>
            <span>{course.totalLessons} lessons</span>
            <span>Updated {course.lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══ Overview tab ══ */}
          {activeTab === 'overview' && (
            <div className="space-y-10">

              <section>
                <SectionHeader title="Prerequisites" caption="what you need before starting" />
                <div className="space-y-2">
                  {course.prerequisites.map((p, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${MUTED_TINT_CLS}`}>
                      {p.met
                        ? <CheckCircle size={15} className={`shrink-0 ${BRAND_INK_CLS}`} />
                        : <AlertCircle size={15} className={`shrink-0 ${WARN_INK_CLS}`} />}
                      <span className="flex-1 text-sm">{p.label}</span>
                      <div className="w-24 h-1.5 rounded-full bg-background shrink-0">
                        <div
                          className={`h-1.5 rounded-full ${p.met ? BRAND_BAR_CLS : ''}`}
                          style={{ width: `${p.mastery}%`, ...(p.met ? {} : { backgroundColor: LEVEL_META.Intermediate.hex }) }}
                        />
                      </div>
                      <span className="text-xs w-9 text-right text-muted-foreground shrink-0">{p.mastery}%</span>
                      {!p.met && p.courseId && (
                        <button
                          onClick={() => navigate(`/courses/${p.courseId}`)}
                          className="shrink-0 flex items-center gap-0.5 text-xs border-b border-foreground/40 hover:border-foreground transition-colors"
                        >
                          Fill gap <ChevronRight size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionHeader title="What You'll Be Able to Do" caption="after completing this course" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.outcomes.map((o, i) => (
                    <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl ${MUTED_TINT_CLS}`}>
                      <CheckCircle size={14} className={`shrink-0 mt-0.5 ${BRAND_INK_CLS}`} />
                      <span className="text-sm leading-relaxed">{o}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionHeader title="Knowledge Graph" caption="concepts covered in this course" />
                <ConceptGraph nodes={course.conceptGraph.nodes} edges={course.conceptGraph.edges} />
              </section>

              <section>
                <SectionHeader title="Who This Is For" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.suitableFor.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${MUTED_TINT_CLS}`}>
                      <span className="text-muted-foreground shrink-0">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionHeader title="Instructor" />
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg shrink-0 ${course.instructor.avatar}`}>
                    {course.instructor.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4>{course.instructor.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{course.instructor.role} @ {course.instructor.company}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{course.instructor.bio}</p>
                    <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Star size={12} className="text-yellow-500 fill-current" />
                        <span className="text-foreground">{course.instructor.rating}</span> rating
                      </div>
                      <div className="flex items-center gap-1.5"><Users size={12} />{course.instructor.students.toLocaleString()} students</div>
                      <div className="flex items-center gap-1.5"><Layers size={12} />{course.instructor.courses} courses</div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader title="In Your Learning Path" />
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {course.relatedCourses.map((rc, i) => (
                    <div key={rc.id} className="flex items-center gap-3 shrink-0">
                      <div
                        onClick={() => navigate(`/courses/${rc.id}`)}
                        className={`w-56 overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${MUTED_TINT_CLS}`}
                        style={{ borderRadius: '0.5rem' }}
                      >
                        <div className="h-2" style={levelFill(rc.level, 'to right')} />
                        <div className="p-3 space-y-2">
                          <div className="text-sm leading-snug">{rc.title}</div>
                          <div className="flex items-center gap-1.5">
                            <LevelPill difficulty={rc.level} />
                            <span className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground">{rc.badge}</span>
                          </div>
                        </div>
                      </div>
                      {i < course.relatedCourses.length - 1 && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ══ Curriculum tab ══ */}
          {activeTab === 'curriculum' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>{MODULES.length} modules · {course.totalLessons} lessons</span>
                <span>{course.completedLessons} completed</span>
              </div>
              {MODULES.map(mod => (
                <ModuleRow key={mod.id} mod={mod} courseId={course.id} />
              ))}
            </div>
          )}

          {/* ══ Discussions tab ══ */}
          {activeTab === 'discussions' && (
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MessageCircle size={14} />
                Start a new discussion
              </button>
              {discussions.map(d => (
                <div key={d.id} className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow ${MUTED_TINT_CLS}`}>
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs text-muted-foreground shrink-0">
                    {d.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm">{d.topic}</h4>
                      {d.solved && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground shrink-0">
                          <CheckCircle size={10} className={BRAND_INK_CLS} /> Solved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{d.user}</span>
                      <span>·</span>
                      <div className="flex items-center gap-1"><MessageCircle size={10} />{d.replies} replies</div>
                      <span>·</span>
                      <span>{d.time}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">

          {/* Primary CTA card */}
          <div className="bg-card border-2 border-border overflow-hidden" style={{ borderRadius: '0.5rem' }}>
            <div className="p-5 space-y-4">
              <button
                onClick={() => navigate(`/courses/${course.id}/lesson/1`)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg hover:opacity-90 transition-opacity"
                style={{ ...levelFill(course.difficulty), color: level.on }}
              >
                <Play size={15} />
                {course.enrolled ? 'Continue Learning' : 'Start Learning'}
              </button>

              <div className="space-y-2 text-sm text-muted-foreground">
                {[
                  { icon: <Clock size={13} />, text: `${course.duration} · ${course.weeklyHours}h/week` },
                  { icon: <Layers size={13} />, text: `${course.totalLessons} lessons across ${MODULES.length} modules` },
                  { icon: <Award size={13} />, text: 'Certificate of completion' },
                  { icon: <Globe size={13} />, text: 'English · Subtitles available' },
                  { icon: <MessageCircle size={13} />, text: 'Community Q&A included' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">{item.icon}<span>{item.text}</span></div>
                ))}
              </div>
            </div>
          </div>

          {/* Skill Graph impact */}
          <div className={`rounded-2xl p-4 space-y-3 ${MUTED_TINT_CLS}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network size={13} className="text-muted-foreground" />
                <h4 className="text-sm">Skill Graph Impact</h4>
              </div>
              <button onClick={() => navigate('/skill-graph')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                View <ChevronRight size={11} />
              </button>
            </div>
            {course.skillImpact.map(s => (
              <SkillBar key={s.skill} {...s} />
            ))}
            <div className="flex items-start gap-2 pt-3 text-xs text-muted-foreground border-t border-border">
              <Sparkles size={11} className={`shrink-0 mt-0.5 ${BRAND_INK_CLS}`} />
              <span>Completing this course → Frontend Readiness <span className="text-foreground font-medium">65% → 90%</span></span>
            </div>
          </div>

          {/* Projects unlocked */}
          <div className={`rounded-2xl p-4 space-y-2 ${MUTED_TINT_CLS}`}>
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban size={13} className="text-muted-foreground" />
              <h4 className="text-sm">Projects Unlocked</h4>
            </div>
            {course.projectsUnlocked.map((p, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-background">
                <span className="flex-1 text-sm leading-snug">{p.name}</span>
                <LevelPill difficulty={p.level} />
                <span className="text-xs text-muted-foreground shrink-0">+{p.points}xp</span>
              </div>
            ))}
            <button onClick={() => navigate('/projects')}
              className="w-full flex items-center justify-center gap-1 pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse all projects <ArrowRight size={12} />
            </button>
          </div>

          {/* Learning paths */}
          <div className={`rounded-2xl p-4 space-y-2 ${MUTED_TINT_CLS}`}>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} className="text-muted-foreground" />
              <h4 className="text-sm">Part of Paths</h4>
            </div>
            {course.learningPaths.map((path, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-background">
                <span className="flex-1 text-sm">{path}</span>
                <ChevronRight size={12} className="text-muted-foreground" />
              </div>
            ))}
            <button onClick={() => navigate('/learning-path')}
              className="w-full flex items-center justify-center gap-1 pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              View Learning Path <ArrowRight size={12} />
            </button>
          </div>

          {/* Concepts covered */}
          <div className={`rounded-2xl p-4 ${MUTED_TINT_CLS}`}>
            <h4 className="text-sm mb-3">Concepts Covered</h4>
            <div className="flex flex-wrap gap-1.5">
              {course.conceptsCovered.map(c => (
                <span key={c} className="text-xs px-2 py-1 rounded bg-background text-muted-foreground">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
