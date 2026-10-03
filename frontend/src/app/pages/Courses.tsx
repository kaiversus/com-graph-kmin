import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Clock, Layers, Play, Flame, FolderKanban, Map,
  ArrowRight, Sparkles, Network, Filter,
  ChevronDown, ChevronRight, Award, TrendingUp
} from 'lucide-react';
import {
  LEVEL_META, BRAND_HEX, MUTED_TINT_CLS, MUTED_TINT_BTN_CLS, hexToRgba, LevelPill, levelFill, type Level
} from '../components/courseStyle';

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = 'All' | 'Frontend' | 'Backend' | 'Full Stack' | 'Database' | 'DevOps' | 'AI/ML';
type Difficulty = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
type Status = 'All' | 'Not Started' | 'In Progress' | 'Completed';
type SortBy = 'Recommended' | 'Most Popular' | 'Highest Rated' | 'Recently Updated' | 'Newest';

interface SkillImpact {
  skill: string;
  before: number;
  after: number;
}

interface Instructor {
  name: string;
  initials: string;
  avatar: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  domain: Domain;
  difficulty: Difficulty;
  duration: string;
  lessons: number;
  language: string;
  instructor: Instructor;
  enrolled: boolean;
  completed: boolean;
  progress: number;
  currentLesson?: string;
  streak?: number;
  skillsTaght: string[];
  skillImpact: SkillImpact[];
  projectsUnlocked: string[];
  learningPaths: string[];
  rolesSupported: string[];
  certificate: boolean;
  isNew: boolean;
  recommendBadge?: 'Fills Skill Gap' | 'Path Required' | 'Project Requirement' | 'Career Goal';
  recommendReason?: string;
  aiImpact?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const COURSES: Course[] = [
  {
    id: 1,
    title: 'Advanced React Patterns',
    description: 'Master custom hooks, context patterns, memoization, Suspense, and concurrent features to build production-grade React applications.',
    domain: 'Frontend', difficulty: 'Advanced', duration: '8 weeks', lessons: 25, language: 'English',
    instructor: { name: 'Sarah Chen', initials: 'SC', avatar: 'bg-gradient-to-br from-blue-500 to-purple-600' },
    enrolled: true, completed: false, progress: 68,
    currentLesson: 'Lesson 17 — useMemo & useCallback Deep Dive',
    streak: 7,
    skillsTaght: ['React', 'TypeScript', 'Performance'],
    skillImpact: [{ skill: 'React', before: 65, after: 90 }, { skill: 'TypeScript', before: 48, after: 68 }],
    projectsUnlocked: ['Real-Time Dashboard', 'Component Library', 'E-commerce Frontend'],
    learningPaths: ['Frontend Developer', 'Full Stack'],
    rolesSupported: ['Frontend Developer', 'Full Stack Engineer'],
    certificate: true, isNew: false,
    aiImpact: 'Boosts Frontend Readiness 65% → 90%'
  },
  {
    id: 2,
    title: 'Node.js & Express Mastery',
    description: 'Build production-grade APIs with Node.js, Express middleware, JWT authentication, rate limiting, caching, and deployment strategies.',
    domain: 'Backend', difficulty: 'Intermediate', duration: '10 weeks', lessons: 34, language: 'English',
    instructor: { name: 'Emily Watson', initials: 'EW', avatar: 'bg-gradient-to-br from-red-500 to-pink-600' },
    enrolled: true, completed: false, progress: 82,
    currentLesson: 'Lesson 28 — JWT Refresh Token Strategy',
    streak: 14,
    skillsTaght: ['Node.js', 'Express', 'Authentication', 'REST APIs'],
    skillImpact: [{ skill: 'Node.js', before: 55, after: 88 }, { skill: 'Database', before: 35, after: 60 }],
    projectsUnlocked: ['REST API Server', 'Auth Microservice', 'File Upload Service'],
    learningPaths: ['Backend Developer', 'Full Stack'],
    rolesSupported: ['Backend Developer', 'Full Stack Engineer'],
    certificate: true, isNew: false,
    aiImpact: 'Unlocks 3 backend projects'
  },
  {
    id: 3,
    title: 'TypeScript for React Developers',
    description: 'From generics and utility types to module augmentation — full TypeScript mastery integrated with React and Node.js.',
    domain: 'Frontend', difficulty: 'Beginner', duration: '5 weeks', lessons: 18, language: 'English',
    instructor: { name: 'James Park', initials: 'JP', avatar: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
    enrolled: false, completed: false, progress: 0,
    skillsTaght: ['TypeScript', 'React', 'Type Safety'],
    skillImpact: [{ skill: 'TypeScript', before: 28, after: 75 }, { skill: 'React', before: 65, after: 72 }],
    projectsUnlocked: ['Typed Component Library', 'Full-Stack TypeScript App'],
    learningPaths: ['Frontend Developer', 'Full Stack'],
    rolesSupported: ['Frontend Developer', 'Full Stack Engineer', 'Senior Engineer'],
    certificate: true, isNew: false,
    recommendBadge: 'Fills Skill Gap',
    recommendReason: 'TypeScript is missing from your Skill Graph',
    aiImpact: 'TypeScript 28% → 75%'
  },
  {
    id: 4,
    title: 'System Design Fundamentals',
    description: 'Design scalable distributed systems: load balancing, caching, database sharding, message queues, and real-time architectures.',
    domain: 'Full Stack', difficulty: 'Advanced', duration: '6 weeks', lessons: 20, language: 'English',
    instructor: { name: 'Michael Rodriguez', initials: 'MR', avatar: 'bg-gradient-to-br from-green-500 to-teal-600' },
    enrolled: false, completed: false, progress: 0,
    skillsTaght: ['System Design', 'Architecture', 'Scalability'],
    skillImpact: [{ skill: 'System Design', before: 12, after: 68 }, { skill: 'Problem Solving', before: 52, after: 70 }],
    projectsUnlocked: ['URL Shortener', 'Real-Time Chat System', 'News Feed Service'],
    learningPaths: ['Full Stack', 'Backend Developer'],
    rolesSupported: ['Full Stack Engineer', 'Backend Developer', 'Senior Engineer'],
    certificate: true, isNew: false,
    recommendBadge: 'Path Required',
    recommendReason: 'Required for your Full Stack Learning Path',
    aiImpact: 'System Design gap 12% → 68%'
  },
  {
    id: 5,
    title: 'Database Design & PostgreSQL',
    description: 'Relational schema design, complex SQL, query optimization, indexing strategies, transactions, and scaling PostgreSQL.',
    domain: 'Database', difficulty: 'Intermediate', duration: '6 weeks', lessons: 22, language: 'English',
    instructor: { name: 'Priya Patel', initials: 'PP', avatar: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    enrolled: false, completed: false, progress: 0,
    skillsTaght: ['SQL', 'PostgreSQL', 'Database Design'],
    skillImpact: [{ skill: 'Database', before: 30, after: 72 }],
    projectsUnlocked: ['Analytics Dashboard', 'Multi-tenant SaaS Schema'],
    learningPaths: ['Backend Developer', 'Data Engineering'],
    rolesSupported: ['Backend Developer', 'Data Engineer'],
    certificate: true, isNew: false,
    recommendBadge: 'Project Requirement',
    recommendReason: 'Required to unlock the E-commerce Platform project',
    aiImpact: 'Unlocks E-commerce Platform project'
  },
  {
    id: 6,
    title: 'Machine Learning Foundations',
    description: 'Build ML intuition from scratch: supervised learning, neural networks, model evaluation, and deploying models with FastAPI.',
    domain: 'AI/ML', difficulty: 'Intermediate', duration: '12 weeks', lessons: 40, language: 'English',
    instructor: { name: 'Nina Osei', initials: 'NO', avatar: 'bg-gradient-to-br from-pink-500 to-rose-600' },
    enrolled: false, completed: false, progress: 0,
    skillsTaght: ['AI/ML', 'Python', 'Data Analysis'],
    skillImpact: [{ skill: 'AI/ML', before: 0, after: 65 }],
    projectsUnlocked: ['Recommendation Engine', 'Sentiment Analyzer', 'Image Classifier'],
    learningPaths: ['AI Engineer', 'Data Engineer'],
    rolesSupported: ['AI Engineer', 'Data Scientist', 'ML Engineer'],
    certificate: true, isNew: true,
    recommendBadge: 'Career Goal',
    recommendReason: 'Matches your AI Engineer career goal',
    aiImpact: 'Opens entire AI/ML skill branch'
  },
  {
    id: 7,
    title: 'Docker & Kubernetes in Production',
    description: 'Containerize applications, manage K8s clusters, build CI/CD pipelines, blue-green deployments, and secrets management.',
    domain: 'DevOps', difficulty: 'Advanced', duration: '7 weeks', lessons: 26, language: 'English',
    instructor: { name: 'Lisa Anderson', initials: 'LA', avatar: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
    enrolled: false, completed: false, progress: 0,
    skillsTaght: ['Docker', 'Kubernetes', 'CI/CD'],
    skillImpact: [{ skill: 'System Design', before: 12, after: 45 }],
    projectsUnlocked: ['Microservice Pipeline', 'Auto-Scaling API'],
    learningPaths: ['Backend Developer', 'Full Stack'],
    rolesSupported: ['DevOps Engineer', 'Backend Developer', 'Full Stack Engineer'],
    certificate: true, isNew: false,
    aiImpact: 'Recommended after Node.js Mastery'
  },
  {
    id: 8,
    title: 'Full-Stack JavaScript',
    description: 'Build complete production applications end-to-end: React frontend, Node.js API, PostgreSQL, authentication, deployment, and monitoring.',
    domain: 'Full Stack', difficulty: 'Advanced', duration: '12 weeks', lessons: 42, language: 'English',
    instructor: { name: 'David Kim', initials: 'DK', avatar: 'bg-gradient-to-br from-yellow-500 to-orange-600' },
    enrolled: false, completed: false, progress: 0,
    skillsTaght: ['React', 'Node.js', 'PostgreSQL', 'Deployment'],
    skillImpact: [
      { skill: 'React', before: 65, after: 88 },
      { skill: 'Node.js', before: 55, after: 84 },
      { skill: 'Database', before: 30, after: 65 }
    ],
    projectsUnlocked: ['SaaS Starter Kit', 'Full-Stack Blog', 'E-commerce Platform'],
    learningPaths: ['Full Stack', 'Frontend Developer', 'Backend Developer'],
    rolesSupported: ['Full Stack Engineer', 'Product Engineer'],
    certificate: true, isNew: false,
    aiImpact: 'Most impactful course for Full Stack role'
  }
];

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAINS: Domain[] = ['All', 'Frontend', 'Backend', 'Full Stack', 'Database', 'DevOps', 'AI/ML'];
const DIFFICULTIES: Difficulty[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const STATUSES: Status[] = ['All', 'Not Started', 'In Progress', 'Completed'];
const SORT_OPTIONS: SortBy[] = ['Recommended', 'Most Popular', 'Highest Rated', 'Recently Updated', 'Newest'];

function levelOf(course: Course) {
  return LEVEL_META[course.difficulty as Level];
}

// ─── Skill impact bar ─────────────────────────────────────────────────────────

function SkillImpactRow({ skill, before, after }: SkillImpact) {
  const delta = after - before;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{skill}</span>
      <div className="relative flex-1 h-1.5 rounded-full bg-background">
        <div className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30"
          style={{ width: `${before}%` }} />
        <div className="absolute inset-y-0 rounded-full"
          style={{ left: `${before}%`, width: `${delta}%`, backgroundColor: hexToRgba(BRAND_HEX, 0.55) }} />
      </div>
      <div className="flex items-center gap-1 shrink-0 text-xs">
        <span className="text-muted-foreground">{before}%</span>
        <ArrowRight size={9} className="text-muted-foreground" />
        <span className="font-medium" style={{ color: BRAND_HEX }}>{after}%</span>
      </div>
    </div>
  );
}

// ─── Continue Learning Card ───────────────────────────────────────────────────

function ContinueCard({ course }: { course: Course }) {
  const navigate = useNavigate();
  return (
    <div className="bg-card rounded-2xl border-2 border-border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-5 p-5">
        {/* Instructor avatar */}
        <div className="shrink-0">
          <div
            title={course.instructor.name}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm ${course.instructor.avatar}`}
          >
            {course.instructor.initials}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs text-muted-foreground px-2 py-0.5 rounded-full ${MUTED_TINT_CLS}`}>
              {course.domain}
            </span>
            {course.streak && course.streak > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame size={11} />
                <span>{course.streak}-day streak</span>
              </div>
            )}
          </div>

          <h4 className="leading-snug mb-2">{course.title}</h4>

          <div className="mb-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="truncate">{course.currentLesson}</span>
              <span className="shrink-0 ml-3">{course.progress}% complete</span>
            </div>
            <div className={`h-1.5 w-full rounded-full ${MUTED_TINT_CLS}`}>
              <div className="h-1.5 rounded-full transition-all"
                style={{ width: `${course.progress}%`, ...levelFill(course.difficulty as Level, 'to right') }} />
            </div>
          </div>

          {course.aiImpact && (
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles size={11} style={{ color: BRAND_HEX }} />
              <span>{course.aiImpact}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col gap-2">
          <button
            onClick={() => navigate(`/courses/${course.id}/lesson/1`)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity ${MUTED_TINT_BTN_CLS}`}
          >
            <Play size={13} />
            Continue
          </button>
          <button
            onClick={() => navigate(`/courses/${course.id}`)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Details
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI readiness banner ──────────────────────────────────────────────────────

function ReadinessBanner() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-5 px-5 py-4 bg-card rounded-2xl hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: hexToRgba(BRAND_HEX, 0.15) }}>
        <Sparkles size={16} style={{ color: BRAND_HEX }} />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm">
          You're <span className="font-medium">72% ready</span> for Frontend Developer.
        </p>
        <p className="text-xs text-muted-foreground">
          Completing <span className="text-foreground">TypeScript for React Developers</span> unlocks 3 projects and increases readiness to <span className="text-foreground">84%</span>.
        </p>
      </div>
      <button
        onClick={() => navigate('/skill-graph')}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity whitespace-nowrap ${MUTED_TINT_BTN_CLS}`}
      >
        <Network size={13} />
        View Skill Graph
      </button>
    </div>
  );
}

// ─── Recommended Course Card ──────────────────────────────────────────────────

function RecommendCard({ course }: { course: Course }) {
  const navigate = useNavigate();
  const level = levelOf(course);
  return (
    <div className="group relative">
      {/* Compact card — always visible, defines the grid cell's size */}
      <div
        className="relative z-10 flex flex-col bg-card overflow-hidden transition-shadow duration-200 group-hover:shadow-xl"
        style={{ borderRadius: '0.5rem', borderTopLeftRadius: '4rem' }}
      >
        {/* Cover */}
        <div
          className="relative h-24"
          style={levelFill(course.difficulty as Level)}
        >
          {course.recommendBadge && (
            <span className="absolute left-3 bottom-3 text-xs px-2 py-0.5 rounded-full bg-background/90">
              {course.recommendBadge}
            </span>
          )}
          {course.isNew && (
            <span className="absolute right-3 bottom-3 text-xs px-2 py-0.5 rounded-full bg-foreground text-background">
              New
            </span>
          )}
          {course.certificate && (
            <Award size={14} className="absolute top-3 right-3 opacity-70" style={{ color: level.on }} />
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="leading-snug">{course.title}</h4>
              <LevelPill difficulty={course.difficulty} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{course.description}</p>
          </div>

          {course.recommendReason && (
            <div className={`flex items-start gap-2 p-2.5 rounded-xl ${MUTED_TINT_CLS}`}>
              <Sparkles size={11} className="shrink-0 mt-0.5" style={{ color: BRAND_HEX }} />
              <span className="text-xs text-muted-foreground leading-relaxed">{course.recommendReason}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Clock size={11} /><span>{course.duration}</span></div>
            <div className="flex items-center gap-1"><Layers size={11} /><span>{course.lessons} lessons</span></div>
          </div>

          <div className="flex-1" />

          <button
            onClick={() => navigate(`/courses/${course.id}`)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:opacity-80 transition-opacity ${MUTED_TINT_BTN_CLS}`}
          >
            Start Learning
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Hover overlay — floats above the grid, never resizes sibling cards */}
      <div className="absolute left-0 right-0 top-full z-20 pt-2 opacity-0 invisible -translate-y-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:pointer-events-auto">
        <div className="bg-card border border-border shadow-xl rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-1">
            {course.skillsTaght.map(s => (
              <span key={s} className={`text-xs px-2 py-0.5 rounded text-muted-foreground ${MUTED_TINT_CLS}`}>
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
            <TrendingUp size={10} className="shrink-0" />
            <span>For: {course.rolesSupported.slice(0, 2).join(', ')}</span>
            {course.rolesSupported.length > 2 && <span>+{course.rolesSupported.length - 2}</span>}
          </div>

          {course.skillImpact.length > 0 && (
            <div className={`space-y-1.5 p-2.5 rounded-xl ${MUTED_TINT_CLS}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Network size={10} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Skill Graph Impact</span>
              </div>
              {course.skillImpact.map(s => (
                <SkillImpactRow key={s.skill} {...s} />
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FolderKanban size={11} className="shrink-0" />
            <span className="truncate">
              Unlocks <span className="text-foreground">{course.projectsUnlocked.length} projects</span> · {course.projectsUnlocked[0]}
              {course.projectsUnlocked.length > 1 ? ` +${course.projectsUnlocked.length - 1}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── All Courses Card ─────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-card overflow-hidden hover:shadow-md transition-shadow" style={{ borderRadius: '0.5rem' }}>
      <div className="h-2" style={levelFill(course.difficulty as Level, 'to right')} />

      <div className="flex flex-col flex-1 p-5 gap-2">
        <h4 className="leading-snug">{course.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><Clock size={11} /><span>{course.duration}</span></div>
          <div className="flex items-center gap-1"><Layers size={11} /><span>{course.lessons} lessons</span></div>
          <span>·</span>
          <span>{course.domain}</span>
        </div>

        {course.enrolled && !course.completed && (
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-1 rounded-full ${MUTED_TINT_CLS}`}>
              <div className="h-1 rounded-full" style={{ width: `${course.progress}%`, ...levelFill(course.difficulty as Level, 'to right') }} />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{course.progress}%</span>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={() => navigate(course.enrolled ? `/courses/${course.id}/lesson/1` : `/courses/${course.id}`)}
          className="self-start flex items-center gap-1 text-sm mt-1 border-b border-foreground/40 hover:border-foreground transition-colors"
        >
          {course.completed ? 'Review' : course.enrolled ? 'Continue' : 'View details'}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Courses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState<Domain>('All');
  const [difficulty, setDifficulty] = useState<Difficulty>('All');
  const [status, setStatus] = useState<Status>('All');
  const [sortBy, setSortBy] = useState<SortBy>('Recommended');
  const [showFilters, setShowFilters] = useState(false);

  const activeCourses = COURSES.filter(c => c.enrolled && !c.completed);
  const recommended = COURSES.filter(c => !c.enrolled && c.recommendBadge);

  const allCourses = useMemo(() => {
    let list = COURSES.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.title.toLowerCase().includes(q) ||
        c.skillsTaght.some(s => s.toLowerCase().includes(q)) ||
        c.domain.toLowerCase().includes(q);
      const matchDomain = domain === 'All' || c.domain === domain;
      const matchDiff = difficulty === 'All' || c.difficulty === difficulty;
      const matchStatus =
        status === 'All' ? true :
        status === 'In Progress' ? (c.enrolled && !c.completed) :
        status === 'Completed' ? c.completed :
        (!c.enrolled && !c.completed);
      return matchSearch && matchDomain && matchDiff && matchStatus;
    });

    if (sortBy === 'Most Popular') list = [...list].sort((a, b) => b.lessons - a.lessons);
    else if (sortBy === 'Newest') list = [...list].sort((a, b) => b.id - a.id);
    else if (sortBy === 'Recommended') list = [...list].sort((a, b) => {
      const score = (c: Course) => (c.enrolled ? 2 : 0) + (c.recommendBadge ? 1 : 0);
      return score(b) - score(a);
    });

    return list;
  }, [search, domain, difficulty, status, sortBy]);

  const hasActiveFilters = domain !== 'All' || difficulty !== 'All' || status !== 'All';
  const clearFilters = () => { setDomain('All'); setDifficulty('All'); setStatus('All'); };

  return (
    <div className="space-y-10">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Courses</h1>
          <p className="text-muted-foreground">Courses connected to your Skill Graph and Learning Path</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/learning-path')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Map size={14} />
            My Path
          </button>
          <button
            onClick={() => navigate('/skill-graph')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: BRAND_HEX }}
          >
            <Network size={14} />
            Skill Graph
          </button>
        </div>
      </div>

      {/* ── Continue Learning ── */}
      {activeCourses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl">Continue Learning</h2>
            <span className="text-sm text-muted-foreground">{activeCourses.length} active</span>
          </div>
          {activeCourses.slice(0, 2).map(c => (
            <ContinueCard key={c.id} course={c} />
          ))}
        </section>
      )}

      {/* ── AI Readiness banner ── */}
      <ReadinessBanner />

      {/* ── Recommended ── */}
      {recommended.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl">Recommended for You</h2>
            <span className="text-sm text-muted-foreground">based on your Skill Graph</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommended.map(c => (
              <RecommendCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      {/* ── All Courses ── */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl">All Courses</h2>
          <span className="text-sm text-muted-foreground">
            {allCourses.length} course{allCourses.length !== 1 ? 's' : ''}
            {domain !== 'All' && <> in <span className="text-foreground">{domain}</span></>}
          </span>
        </div>

        {/* Search + sort + filter toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses or skills…"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="appearance-none pl-3 pr-8 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-border text-sm transition-colors shrink-0 ${
              showFilters || hasActiveFilters ? 'bg-muted' : 'hover:bg-muted'
            }`}
          >
            <Filter size={13} />
            Filter
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-foreground" />}
          </button>
        </div>

        {/* Domain chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                domain === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Difficulty</span>
              <div className="flex gap-1">
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      difficulty === d ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Status</span>
              <div className="flex gap-1">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      status === s ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* List */}
        {allCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allCourses.map(c => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search size={28} className="text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">No courses match your filters</p>
            <button
              onClick={() => { setSearch(''); clearFilters(); }}
              className="text-sm underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
