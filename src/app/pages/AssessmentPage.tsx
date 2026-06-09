import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis
} from 'recharts';
import {
  Clock, ChevronRight, ChevronLeft, Flag, CheckCircle, Circle,
  Code2, MessageSquare, ListChecks, ToggleLeft, Brain,
  Target, TrendingUp, Award, AlertTriangle, Zap, BookOpen,
  FolderKanban, Users, Network, ArrowRight, Play, Plus,
  Lightbulb, Star, Lock, Unlock, BarChart3, Map,
  CheckSquare, Square, X, Bookmark, BookmarkCheck, Timer,
  Layers, Sparkles, Shield, ChevronDown, ExternalLink, RefreshCw
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'overview' | 'assessment' | 'results';
type TargetRole = 'Frontend' | 'Backend' | 'Full Stack' | 'Mobile' | 'AI Engineer' | 'Data Engineer';
type QuestionType = 'multiple-choice' | 'multiple-select' | 'coding' | 'scenario' | 'self-eval';
type SkillArea =
  | 'Programming Fundamentals'
  | 'Problem Solving'
  | 'React'
  | 'Node.js'
  | 'Database'
  | 'AI/ML'
  | 'Communication'
  | 'System Design';

interface Question {
  id: number;
  type: QuestionType;
  skill: SkillArea;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  description?: string;
  options?: { id: string; label: string; code?: string }[];
  codeStarter?: string;
  selfEvalLabels?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points: number;
}

interface Answer {
  questionId: number;
  value: string | string[] | number;
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1, type: 'multiple-choice', skill: 'React', difficulty: 'medium', points: 10,
    question: 'Which hook should you use to run a side effect after every render?',
    options: [
      { id: 'a', label: 'useState' },
      { id: 'b', label: 'useEffect' },
      { id: 'c', label: 'useRef' },
      { id: 'd', label: 'useMemo' }
    ],
    correctAnswer: 'b',
    explanation: 'useEffect runs after every render by default. You can control when it runs with a dependency array.'
  },
  {
    id: 2, type: 'multiple-select', skill: 'React', difficulty: 'medium', points: 15,
    question: 'Which of the following are valid React Hooks? (Select all that apply)',
    options: [
      { id: 'a', label: 'useCallback' },
      { id: 'b', label: 'useTheme' },
      { id: 'c', label: 'useReducer' },
      { id: 'd', label: 'useController' },
      { id: 'e', label: 'useContext' }
    ],
    correctAnswer: ['a', 'c', 'e'],
    explanation: 'useCallback, useReducer, and useContext are official React hooks. useTheme and useController are not built-in.'
  },
  {
    id: 3, type: 'coding', skill: 'Programming Fundamentals', difficulty: 'medium', points: 20,
    question: 'Implement a function that returns the two numbers in an array that add up to a target sum.',
    description: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Assume exactly one solution exists.',
    codeStarter: `function twoSum(nums, target) {
  // Your solution here

}

// Test:
// twoSum([2, 7, 11, 15], 9) → [0, 1]
// twoSum([3, 2, 4], 6) → [1, 2]`,
    explanation: 'A hash map approach gives O(n) time complexity. For each number, check if (target - num) exists in the map.'
  },
  {
    id: 4, type: 'scenario', skill: 'System Design', difficulty: 'hard', points: 20,
    question: 'You are building a real-time chat application for 10,000 concurrent users. Which architecture best handles this requirement?',
    description: 'Consider scalability, latency, and maintainability when selecting your answer.',
    options: [
      { id: 'a', label: 'REST API with long polling — simplest to implement, works for small scale' },
      { id: 'b', label: 'WebSockets with Redis pub/sub — handles real-time bidirectionally, horizontally scalable' },
      { id: 'c', label: 'GraphQL subscriptions with in-memory state — typed schema, single server' },
      { id: 'd', label: 'Server-Sent Events with a monolithic server — one-directional push, easier deployment' }
    ],
    correctAnswer: 'b',
    explanation: 'WebSockets + Redis pub/sub is the industry standard for large-scale real-time systems. It enables horizontal scaling across multiple server instances.'
  },
  {
    id: 5, type: 'multiple-choice', skill: 'Node.js', difficulty: 'easy', points: 10,
    question: 'What does the event loop allow Node.js to do?',
    options: [
      { id: 'a', label: 'Run multiple threads simultaneously' },
      { id: 'b', label: 'Perform non-blocking I/O operations on a single thread' },
      { id: 'c', label: 'Automatically scale to multiple CPU cores' },
      { id: 'd', label: 'Execute JavaScript in parallel using web workers' }
    ],
    correctAnswer: 'b',
    explanation: 'The event loop enables Node.js to handle concurrent operations without multi-threading by offloading I/O to the OS and resuming execution via callbacks.'
  },
  {
    id: 6, type: 'self-eval', skill: 'Communication', difficulty: 'easy', points: 10,
    question: 'How confidently can you explain a complex technical concept to a non-technical stakeholder?',
    description: 'Think about a recent experience where you had to bridge technical and non-technical perspectives.',
    selfEvalLabels: ['Not confident', 'Slightly confident', 'Moderately confident', 'Very confident', 'Expert level'],
    explanation: 'Communication skills are assessed through self-evaluation and validated by mentor reviews in your profile.'
  },
  {
    id: 7, type: 'multiple-choice', skill: 'Database', difficulty: 'medium', points: 10,
    question: 'Which SQL clause is used to filter groups of rows after a GROUP BY?',
    options: [
      { id: 'a', label: 'WHERE' },
      { id: 'b', label: 'FILTER' },
      { id: 'c', label: 'HAVING' },
      { id: 'd', label: 'LIMIT' }
    ],
    correctAnswer: 'c',
    explanation: 'HAVING filters rows after grouping, while WHERE filters individual rows before grouping.'
  },
  {
    id: 8, type: 'multiple-select', skill: 'Problem Solving', difficulty: 'hard', points: 15,
    question: 'Which algorithmic approaches have O(log n) time complexity? (Select all that apply)',
    options: [
      { id: 'a', label: 'Binary Search' },
      { id: 'b', label: 'Bubble Sort' },
      { id: 'c', label: 'Balanced BST lookup' },
      { id: 'd', label: 'Linear Search' },
      { id: 'e', label: 'Merge Sort (single pass)' }
    ],
    correctAnswer: ['a', 'c'],
    explanation: 'Binary Search and Balanced BST lookup both operate in O(log n) by halving the search space each step.'
  },
  {
    id: 9, type: 'coding', skill: 'Programming Fundamentals', difficulty: 'easy', points: 15,
    question: 'Write a function to check if a string is a palindrome.',
    description: 'A palindrome reads the same forwards and backwards. Ignore case sensitivity.',
    codeStarter: `function isPalindrome(str) {
  // Your solution here

}

// Test:
// isPalindrome("racecar") → true
// isPalindrome("Hello") → false`,
    explanation: 'Clean solution: reverse the string and compare, or use two-pointer approach from both ends.'
  },
  {
    id: 10, type: 'multiple-choice', skill: 'AI/ML', difficulty: 'hard', points: 10,
    question: 'In supervised learning, what is the purpose of the validation set?',
    options: [
      { id: 'a', label: 'To train the model weights through backpropagation' },
      { id: 'b', label: 'To tune hyperparameters and prevent overfitting during training' },
      { id: 'c', label: 'To provide the final unbiased evaluation of model performance' },
      { id: 'd', label: 'To augment the training data with additional samples' }
    ],
    correctAnswer: 'b',
    explanation: 'The validation set monitors performance during training to tune hyperparameters. The test set provides the final unbiased evaluation.'
  }
];

const SKILL_AREAS: { name: SkillArea; icon: React.ReactNode; color: string }[] = [
  { name: 'Programming Fundamentals', icon: <Code2 size={13} />, color: 'text-blue-400' },
  { name: 'Problem Solving', icon: <Brain size={13} />, color: 'text-purple-400' },
  { name: 'React', icon: <Zap size={13} />, color: 'text-cyan-400' },
  { name: 'Node.js', icon: <Target size={13} />, color: 'text-green-400' },
  { name: 'Database', icon: <Layers size={13} />, color: 'text-amber-400' },
  { name: 'AI/ML', icon: <Sparkles size={13} />, color: 'text-pink-400' },
  { name: 'Communication', icon: <MessageSquare size={13} />, color: 'text-orange-400' },
  { name: 'System Design', icon: <Network size={13} />, color: 'text-indigo-400' }
];

const TARGET_ROLES: TargetRole[] = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'AI Engineer', 'Data Engineer'];

const ROLE_SKILLS: Record<TargetRole, SkillArea[]> = {
  Frontend: ['Programming Fundamentals', 'React', 'Problem Solving', 'Communication', 'System Design'],
  Backend: ['Programming Fundamentals', 'Node.js', 'Database', 'System Design', 'Problem Solving'],
  'Full Stack': ['Programming Fundamentals', 'React', 'Node.js', 'Database', 'System Design'],
  Mobile: ['Programming Fundamentals', 'React', 'Problem Solving', 'Communication', 'System Design'],
  'AI Engineer': ['Programming Fundamentals', 'AI/ML', 'Problem Solving', 'Database', 'System Design'],
  'Data Engineer': ['Programming Fundamentals', 'Database', 'AI/ML', 'Problem Solving', 'System Design']
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<QuestionType, { label: string; icon: React.ReactNode; color: string }> = {
  'multiple-choice': { label: 'Multiple Choice', icon: <Circle size={12} />, color: 'text-blue-400' },
  'multiple-select': { label: 'Multiple Select', icon: <CheckSquare size={12} />, color: 'text-purple-400' },
  coding: { label: 'Coding Challenge', icon: <Code2 size={12} />, color: 'text-green-400' },
  scenario: { label: 'Scenario', icon: <MessageSquare size={12} />, color: 'text-amber-400' },
  'self-eval': { label: 'Self Evaluation', icon: <Brain size={12} />, color: 'text-pink-400' }
};

const DIFF_COLOR = { easy: 'text-green-400 bg-green-500/10 border-green-500/25', medium: 'text-amber-400 bg-amber-500/10 border-amber-500/25', hard: 'text-red-400 bg-red-500/10 border-red-500/25' };

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function computeResults(answers: Answer[], role: TargetRole) {
  const skillScores: Record<SkillArea, { earned: number; total: number }> = {} as any;
  SKILL_AREAS.forEach(s => { skillScores[s.name] = { earned: 0, total: 0 }; });

  QUESTIONS.forEach(q => {
    skillScores[q.skill].total += q.points;
    const answer = answers.find(a => a.questionId === q.id);
    if (!answer) return;

    if (q.type === 'multiple-choice' || q.type === 'scenario') {
      if (answer.value === q.correctAnswer) skillScores[q.skill].earned += q.points;
    } else if (q.type === 'multiple-select') {
      const correct = q.correctAnswer as string[];
      const given = answer.value as string[];
      const hits = given.filter(x => correct.includes(x)).length;
      const misses = given.filter(x => !correct.includes(x)).length;
      const score = Math.max(0, ((hits - misses) / correct.length)) * q.points;
      skillScores[q.skill].earned += score;
    } else if (q.type === 'self-eval') {
      const val = answer.value as number;
      skillScores[q.skill].earned += (val / 4) * q.points;
    } else if (q.type === 'coding') {
      skillScores[q.skill].earned += q.points * 0.75;
    }
  });

  const radarData = SKILL_AREAS.map(s => ({
    skill: s.name.replace(' Fundamentals', ' Fund.').replace('Programming', 'Prog.'),
    value: skillScores[s.name].total > 0
      ? Math.round((skillScores[s.name].earned / skillScores[s.name].total) * 100)
      : 0
  }));

  const totalEarned = Object.values(skillScores).reduce((s, v) => s + v.earned, 0);
  const totalPossible = Object.values(skillScores).reduce((s, v) => s + v.total, 0);
  const overallPct = Math.round((totalEarned / totalPossible) * 100);

  const roleSkills = ROLE_SKILLS[role];
  const roleScore = roleSkills.reduce((s, skill) => {
    const d = skillScores[skill];
    return s + (d.total > 0 ? d.earned / d.total : 0);
  }, 0) / roleSkills.length;
  const careerReadiness = Math.round(roleScore * 100);

  const sorted = SKILL_AREAS.map(s => ({
    name: s.name,
    pct: skillScores[s.name].total > 0
      ? Math.round((skillScores[s.name].earned / skillScores[s.name].total) * 100)
      : 0
  })).sort((a, b) => b.pct - a.pct);

  const strengths = sorted.slice(0, 3);
  const weakAreas = sorted.slice(-3).reverse();
  const gaps = sorted.filter(s => s.pct < 40);

  return { skillScores, radarData, overallPct, careerReadiness, strengths, weakAreas, gaps };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className={`w-full h-1.5 rounded-full bg-slate-800 ${className}`}>
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SkillCoverage({ answers, activeSkill }: { answers: Answer[]; activeSkill: SkillArea | null }) {
  const answeredIds = new Set(answers.map(a => a.questionId));
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-indigo-400" />
          <span className="text-xs text-slate-300">Skill Coverage</span>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {SKILL_AREAS.map(({ name, icon, color }) => {
          const qs = QUESTIONS.filter(q => q.skill === name);
          const done = qs.filter(q => answeredIds.has(q.id)).length;
          const pct = qs.length > 0 ? Math.round((done / qs.length) * 100) : 0;
          const isActive = activeSkill === name;
          return (
            <div key={name}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${isActive ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
            >
              <span className={color}>{icon}</span>
              <span className="text-xs text-slate-400 flex-1 leading-tight">{name}</span>
              <div className="flex items-center gap-2">
                <div className="w-14 h-1 rounded-full bg-slate-700/60">
                  <div className="h-1 rounded-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-slate-600 w-8 text-right">{done}/{qs.length}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionNav({ questions, answers, flagged, current, onJump }: {
  questions: Question[];
  answers: Answer[];
  flagged: Set<number>;
  current: number;
  onJump: (i: number) => void;
}) {
  const answeredIds = new Set(answers.map(a => a.questionId));
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <span className="text-xs text-slate-300">Questions</span>
      </div>
      <div className="p-3 grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const answered = answeredIds.has(q.id);
          const isFlagged = flagged.has(q.id);
          const isCurrent = i === current;
          return (
            <button
              key={q.id}
              onClick={() => onJump(i)}
              className={`relative w-full aspect-square rounded-lg text-xs flex items-center justify-center transition-all border ${
                isCurrent
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : answered
                  ? 'bg-green-500/15 border-green-500/30 text-green-400'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {i + 1}
              {isFlagged && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-3 flex gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500/40 border border-green-500/30" /><span>Answered</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-600" /><span>Current</span></div>
        <div className="flex items-center gap-1"><div className="relative w-2 h-2 rounded bg-slate-700"><div className="absolute top-0 right-0 w-1 h-1 rounded-full bg-amber-400" /></div><span>Flagged</span></div>
      </div>
    </div>
  );
}

// ─── Phase: Overview ──────────────────────────────────────────────────────────

function OverviewPhase({ role, setRole, onStart }: {
  role: TargetRole;
  setRole: (r: TargetRole) => void;
  onStart: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs">
                  Career Readiness Assessment
                </div>
                <div className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs">
                  v2.4 · Jun 2026
                </div>
              </div>
              <h1 className="text-3xl text-slate-100 mb-2">Full-Stack Skills Assessment</h1>
              <p className="text-slate-400 max-w-xl leading-relaxed">
                Evaluate your current skill level across 8 core competency areas and receive a personalized learning roadmap tailored to your target role.
              </p>
            </div>
            <div className="shrink-0 hidden lg:block">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                <Brain size={36} className="text-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Questions', value: QUESTIONS.length, icon: <ListChecks size={16} className="text-blue-400" /> },
              { label: 'Estimated Time', value: '25 min', icon: <Clock size={16} className="text-indigo-400" /> },
              { label: 'Skill Areas', value: SKILL_AREAS.length, icon: <BarChart3 size={16} className="text-purple-400" /> },
              { label: 'Points Possible', value: QUESTIONS.reduce((s, q) => s + q.points, 0), icon: <Award size={16} className="text-amber-400" /> }
            ].map((item, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
                {item.icon}
                <div>
                  <div className="text-slate-200 text-base">{item.value}</div>
                  <div className="text-slate-500 text-xs">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Role + Purpose */}
        <div className="col-span-2 space-y-6">
          {/* Target Role */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-slate-200 text-base mb-1">Target Role</h2>
            <p className="text-slate-500 text-sm mb-4">Select the role you're working toward. The assessment will weight relevant skills accordingly.</p>
            <div className="grid grid-cols-3 gap-2">
              {TARGET_ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-3 rounded-xl text-sm text-left transition-all border ${
                    role === r
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <div className={`text-xs mb-1 ${role === r ? 'text-indigo-400' : 'text-slate-600'}`}>Target</div>
                  {r}
                  {role === r && <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* What's covered */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-slate-200 text-base mb-1">What's Evaluated</h2>
            <p className="text-slate-500 text-sm mb-4">8 core competency areas across {QUESTIONS.length} questions with 5 question types.</p>
            <div className="grid grid-cols-2 gap-2">
              {SKILL_AREAS.map(({ name, icon, color }) => {
                const count = QUESTIONS.filter(q => q.skill === name).length;
                const isTarget = ROLE_SKILLS[role].includes(name);
                return (
                  <div key={name} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isTarget ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-800/20 border-slate-800/60 opacity-60'
                  }`}>
                    <span className={color}>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-300 leading-tight">{name}</div>
                      <div className="text-xs text-slate-600">{count} {count === 1 ? 'question' : 'questions'}</div>
                    </div>
                    {isTarget && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-600 mt-3">
              <span className="text-indigo-400">●</span> Highlighted skills are prioritized for your <span className="text-slate-400">{role}</span> target role.
            </p>
          </div>

          {/* Question Types */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-slate-200 text-base mb-4">Question Types</h2>
            <div className="grid grid-cols-5 gap-3">
              {(Object.keys(TYPE_META) as QuestionType[]).map(type => {
                const { label, icon, color } = TYPE_META[type];
                const count = QUESTIONS.filter(q => q.type === type).length;
                return (
                  <div key={type} className="flex flex-col items-center gap-2 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-center">
                    <span className={color}>{icon}</span>
                    <div className="text-slate-300 text-sm">{count}</div>
                    <div className="text-slate-600 text-xs leading-tight">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Info + Start */}
        <div className="space-y-4">
          <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900/60 border border-indigo-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-amber-400" />
              <span className="text-slate-300 text-sm">How it works</span>
            </div>
            <div className="space-y-3">
              {[
                { step: '1', label: 'Answer 10 questions across skill areas', icon: <ListChecks size={12} className="text-blue-400" /> },
                { step: '2', label: 'Get scored on mastery and coverage', icon: <BarChart3 size={12} className="text-purple-400" /> },
                { step: '3', label: 'View skill gap analysis & radar chart', icon: <Network size={12} className="text-indigo-400" /> },
                { step: '4', label: 'Receive personalized learning roadmap', icon: <Map size={12} className="text-green-400" /> }
              ].map(item => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-xs">{item.step}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-green-400" />
              <span className="text-slate-300 text-sm">Your data</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2"><CheckCircle size={11} className="text-green-400 shrink-0" />Auto-saves progress</li>
              <li className="flex items-center gap-2"><CheckCircle size={11} className="text-green-400 shrink-0" />Resume at any time</li>
              <li className="flex items-center gap-2"><CheckCircle size={11} className="text-green-400 shrink-0" />Results added to Skill Graph</li>
              <li className="flex items-center gap-2"><CheckCircle size={11} className="text-green-400 shrink-0" />Visible to mentors you approve</li>
            </ul>
          </div>

          <button
            onClick={onStart}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/20"
          >
            <Play size={16} />
            Start Assessment
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-center text-xs text-slate-600">~25 minutes · Auto-saved</p>
        </div>
      </div>
    </div>
  );
}

// ─── Phase: Question ──────────────────────────────────────────────────────────

function QuestionCard({ question, answer, onAnswer }: {
  question: Question;
  answer: Answer | undefined;
  onAnswer: (value: string | string[] | number) => void;
}) {
  const [code, setCode] = useState<string>(answer?.value as string || question.codeStarter || '');
  const [selfVal, setSelfVal] = useState<number>(answer?.value as number ?? -1);

  const { label, icon, color } = TYPE_META[question.type];
  const selected = answer?.value;

  const toggleSelect = (id: string) => {
    const cur = (selected as string[]) || [];
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    onAnswer(next);
  };

  return (
    <div className="space-y-6">
      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${color} bg-slate-800/60 border-slate-700/60`}>
          {icon}
          {label}
        </div>
        <div className={`text-xs px-2.5 py-1.5 rounded-lg border ${DIFF_COLOR[question.difficulty]}`}>
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {SKILL_AREAS.find(s => s.name === question.skill)?.icon}
          {question.skill}
        </div>
        <div className="ml-auto text-xs text-slate-500">{question.points} pts</div>
      </div>

      {/* Question */}
      <div>
        <h2 className="text-slate-100 text-lg leading-snug mb-2">{question.question}</h2>
        {question.description && (
          <p className="text-slate-400 text-sm leading-relaxed">{question.description}</p>
        )}
      </div>

      {/* Answer area */}
      {(question.type === 'multiple-choice' || question.type === 'scenario') && question.options && (
        <div className="space-y-2.5">
          {question.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onAnswer(opt.id)}
              className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                selected === opt.id
                  ? 'bg-indigo-600/15 border-indigo-500/50 text-slate-200'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                selected === opt.id ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
              }`}>
                {selected === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <span className="text-xs text-slate-600 mr-2 uppercase">{opt.id}.</span>
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      )}

      {question.type === 'multiple-select' && question.options && (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-600">Select all that apply</p>
          {question.options.map(opt => {
            const isSelected = ((selected as string[]) || []).includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleSelect(opt.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-purple-600/15 border-purple-500/50 text-slate-200'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                  isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
                }`}>
                  {isSelected && <CheckCircle size={10} className="text-white" />}
                </div>
                <span className="text-xs text-slate-600 mr-1 uppercase">{opt.id}.</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'coding' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Code2 size={12} className="text-green-400" />
            <span>Write your solution below</span>
          </div>
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700 rounded-t-xl z-10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-slate-500 ml-2">JavaScript</span>
            </div>
            <textarea
              value={code}
              onChange={e => { setCode(e.target.value); onAnswer(e.target.value); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pt-10 pb-4 px-4 text-sm text-slate-300 font-mono resize-none outline-none focus:border-slate-600 min-h-56"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {question.type === 'self-eval' && question.selfEvalLabels && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {question.selfEvalLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => { setSelfVal(i); onAnswer(i); }}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border text-xs transition-all ${
                  selfVal === i
                    ? 'bg-pink-600/15 border-pink-500/50 text-pink-300'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-500 hover:border-slate-600'
                }`}
              >
                <div className={`text-lg ${selfVal === i ? 'opacity-100' : 'opacity-30'}`}>
                  {['😟', '😕', '🙂', '😊', '🚀'][i]}
                </div>
                <span className="leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
          <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="text-amber-400">Note:</span> Self-evaluations are calibrated against your project evidence and mentor reviews in your Skill Graph profile.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function AssessmentPhase({
  answers, flagged, onAnswer, onFlag, onSubmit
}: {
  answers: Answer[];
  flagged: Set<number>;
  onAnswer: (qId: number, value: string | string[] | number) => void;
  onFlag: (qId: number) => void;
  onSubmit: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  const question = QUESTIONS[current];
  const answeredCount = answers.length;
  const isLast = current === QUESTIONS.length - 1;
  const currentAnswer = answers.find(a => a.questionId === question.id);
  const timerPct = (timeLeft / (25 * 60)) * 100;
  const timerColor = timerPct > 50 ? 'text-slate-300' : timerPct > 20 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top bar */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900/80 px-6 py-3">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="text-slate-300 text-sm">Career Assessment</span>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-slate-600 shrink-0">Question {current + 1}/{QUESTIONS.length}</span>
            <ProgressBar value={current + 1} max={QUESTIONS.length} className="flex-1" />
            <span className="text-xs text-slate-500 shrink-0">{answeredCount} answered</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTimerActive(v => !v)}
              className={`flex items-center gap-1.5 text-sm ${timerColor}`}
            >
              <Timer size={14} />
              {formatTime(timeLeft)}
            </button>
            <button
              onClick={() => onFlag(question.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                flagged.has(question.id)
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {flagged.has(question.id) ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {flagged.has(question.id) ? 'Flagged' : 'Flag'}
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-hidden flex max-w-6xl mx-auto w-full px-6 py-6 gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-4 overflow-y-auto">
          <QuestionNav
            questions={QUESTIONS}
            answers={answers}
            flagged={flagged}
            current={current}
            onJump={setCurrent}
          />
          <SkillCoverage answers={answers} activeSkill={question.skill} />
        </div>

        {/* Question + Actions */}
        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7">
            <QuestionCard
              question={question}
              answer={currentAnswer}
              onAnswer={v => onAnswer(question.id, v)}
            />
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <div className="flex items-center gap-2">
              {flagged.size > 0 && (
                <span className="text-xs text-amber-400">{flagged.size} flagged for review</span>
              )}
            </div>
            {isLast ? (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors shadow-lg shadow-indigo-600/20"
              >
                Submit Assessment
                <CheckCircle size={15} />
              </button>
            ) : (
              <button
                onClick={() => setCurrent(c => Math.min(QUESTIONS.length - 1, c + 1))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm transition-all"
              >
                Next
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submit confirm overlay */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-slate-100 text-base mb-2">Submit Assessment?</h3>
            <p className="text-slate-400 text-sm mb-1">
              You've answered <strong className="text-slate-300">{answeredCount}</strong> of {QUESTIONS.length} questions.
            </p>
            {QUESTIONS.length - answeredCount > 0 && (
              <p className="text-amber-400 text-xs mb-4">
                {QUESTIONS.length - answeredCount} question(s) unanswered. Unanswered questions score 0.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors"
              >
                Continue editing
              </button>
              <button
                onClick={onSubmit}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
              >
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Phase: Results ───────────────────────────────────────────────────────────

function ResultsPhase({ answers, role, onRetake }: { answers: Answer[]; role: TargetRole; onRetake: () => void }) {
  const navigate = useNavigate();
  const results = computeResults(answers, role);
  const [activeSkill, setActiveSkill] = useState<SkillArea | null>(null);

  const RECOMMENDATIONS = {
    courses: [
      { name: 'React: The Complete Guide 2026', platform: 'Udemy', rating: 4.8, students: '820K', skill: 'React', duration: '48h', match: 97 },
      { name: 'TypeScript for React Developers', platform: 'Frontend Masters', rating: 4.9, students: '210K', skill: 'Programming Fundamentals', duration: '12h', match: 94 },
      { name: 'JavaScript Algorithms & Data Structures', platform: 'freeCodeCamp', rating: 4.7, students: '1.2M', skill: 'Problem Solving', duration: '300h', match: 91 },
      { name: 'Node.js & Express Masterclass', platform: 'Coursera', rating: 4.6, students: '180K', skill: 'Node.js', duration: '24h', match: 88 }
    ],
    projects: [
      { name: 'Build a Real-Time Chat App', skills: ['React', 'Node.js', 'WebSockets'], difficulty: 'Medium', points: 350 },
      { name: 'Full-Stack E-commerce Platform', skills: ['React', 'Node.js', 'Database'], difficulty: 'Hard', points: 500 },
      { name: 'REST API with Authentication', skills: ['Node.js', 'Database'], difficulty: 'Medium', points: 280 }
    ],
    mentors: [
      { name: 'Sarah Chen', role: 'Senior Frontend Engineer @ Meta', skills: ['React', 'TypeScript'], rating: 4.9, sessions: 142, price: '$60/hr' },
      { name: 'Marcus Liu', role: 'Full Stack Lead @ Stripe', skills: ['Node.js', 'System Design'], rating: 4.8, sessions: 89, price: '$75/hr' },
      { name: 'Aisha Mohammed', role: 'Staff Engineer @ Google', skills: ['System Design', 'Problem Solving'], rating: 5.0, sessions: 234, price: '$90/hr' }
    ]
  };

  const ROADMAP_STEPS = [
    { label: 'Current Level', desc: `${results.overallPct}% overall score`, status: 'done', color: 'bg-green-500' },
    { label: `Learn ${results.weakAreas[0]?.name}`, desc: 'Critical skill gap · ~3 weeks', status: 'next', color: 'bg-indigo-500' },
    { label: 'Build Portfolio Project', desc: 'Apply skills with mentorship · ~4 weeks', status: 'future', color: 'bg-slate-700' },
    { label: 'Mentor Review', desc: 'Validate progress · 2–3 sessions', status: 'future', color: 'bg-slate-700' },
    { label: `${role} Role Ready`, desc: `Target: ${results.careerReadiness >= 80 ? 'Almost there' : '8–12 weeks'}`, status: 'future', color: 'bg-slate-700' }
  ];

  const scoreColor = results.overallPct >= 70 ? 'text-green-400' : results.overallPct >= 45 ? 'text-amber-400' : 'text-red-400';
  const readinessColor = results.careerReadiness >= 70 ? 'text-green-400' : results.careerReadiness >= 45 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Results Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-3xl p-8">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(99,102,241,0.1) 0%, transparent 55%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-green-400 text-sm">Assessment Complete</span>
            </div>
            <h1 className="text-3xl text-slate-100 mb-1">Your Results</h1>
            <p className="text-slate-400 text-sm">Assessed against <span className="text-indigo-300">{role}</span> role requirements</p>
          </div>
          <div className="flex gap-6 shrink-0">
            <div className="text-center">
              <div className={`text-5xl mb-1 ${scoreColor}`}>{results.overallPct}%</div>
              <div className="text-slate-500 text-xs">Overall Score</div>
            </div>
            <div className="w-px bg-slate-800" />
            <div className="text-center">
              <div className={`text-5xl mb-1 ${readinessColor}`}>{results.careerReadiness}%</div>
              <div className="text-slate-500 text-xs">Career Readiness</div>
              <div className="text-slate-600 text-xs">{role}</div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="relative z-10 grid grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Questions Answered', value: `${answers.length}/${QUESTIONS.length}`, icon: <CheckCircle size={14} className="text-green-400" /> },
            { label: 'Top Strength', value: results.strengths[0]?.name.split(' ')[0] ?? '—', icon: <Award size={14} className="text-amber-400" /> },
            { label: 'Knowledge Gaps', value: results.gaps.length, icon: <AlertTriangle size={14} className="text-red-400" /> },
            { label: 'Points Earned', value: `${Math.round(results.overallPct / 100 * QUESTIONS.reduce((s, q) => s + q.points, 0))}/${QUESTIONS.reduce((s, q) => s + q.points, 0)}`, icon: <Star size={14} className="text-indigo-400" /> }
          ].map((item, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
              {item.icon}
              <div>
                <div className="text-slate-200 text-sm">{item.value}</div>
                <div className="text-slate-500 text-xs">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Breakdown + Radar */}
      <div className="grid grid-cols-5 gap-6">
        {/* Radar */}
        <div className="col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Network size={14} className="text-indigo-400" />
            <span className="text-slate-200 text-sm">Skill Radar</span>
          </div>
          <p className="text-xs text-slate-600 mb-4">Multi-dimensional mastery overview</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={results.radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#64748b' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Cards */}
        <div className="col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-indigo-400" />
            <span className="text-slate-200 text-sm">Skill Mastery Breakdown</span>
          </div>
          <div className="space-y-2.5">
            {SKILL_AREAS.map(({ name, icon, color }) => {
              const pct = results.skillScores[name].total > 0
                ? Math.round((results.skillScores[name].earned / results.skillScores[name].total) * 100)
                : 0;
              const barColor = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-amber-500' : pct > 0 ? 'bg-red-500' : 'bg-slate-700';
              const isTarget = ROLE_SKILLS[role].includes(name);
              return (
                <div
                  key={name}
                  onClick={() => setActiveSkill(activeSkill === name ? null : name)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    activeSkill === name ? 'bg-slate-800/80 border-slate-700' : 'border-transparent hover:bg-slate-800/40'
                  }`}
                >
                  <span className={color}>{icon}</span>
                  <span className={`text-xs w-40 shrink-0 ${isTarget ? 'text-slate-300' : 'text-slate-500'}`}>{name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800">
                    <div className={`h-2 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs w-10 text-right ${pct >= 70 ? 'text-green-400' : pct >= 45 ? 'text-amber-400' : pct > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                    {pct > 0 ? `${pct}%` : '—'}
                  </span>
                  {isTarget && <div className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strengths + Weak + Gaps */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={14} className="text-green-400" />
            <span className="text-slate-200 text-sm">Strengths</span>
          </div>
          <div className="space-y-2.5">
            {results.strengths.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs text-green-400">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300 truncate">{s.name}</div>
                  <div className="text-xs text-green-400">{s.pct}% mastery</div>
                </div>
                <CheckCircle size={13} className="text-green-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-amber-400" />
            <span className="text-slate-200 text-sm">Needs Work</span>
          </div>
          <div className="space-y-2.5">
            {results.weakAreas.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs text-amber-400">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300 truncate">{s.name}</div>
                  <div className="text-xs text-amber-400">{s.pct > 0 ? `${s.pct}% mastery` : 'Not assessed'}</div>
                </div>
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <X size={14} className="text-red-400" />
            <span className="text-slate-200 text-sm">Knowledge Gaps</span>
          </div>
          {results.gaps.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No critical gaps detected</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {results.gaps.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                    <span className="text-xs text-red-400">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 truncate">{s.name}</div>
                    <div className="text-xs text-red-400">{s.pct}% — critical gap</div>
                  </div>
                  <X size={13} className="text-red-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-indigo-400" />
          <span className="text-slate-200 text-sm">AI Insight</span>
          <div className="ml-auto px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs">Personalized</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              icon: <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />,
              text: `Strong ${results.strengths[0]?.name} foundation (${results.strengths[0]?.pct}%). ${results.strengths[0]?.pct > 80 ? 'You\'re ready to mentor others in this area.' : 'Keep building projects to reinforce this.'}`
            },
            {
              icon: <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />,
              text: `Missing depth in ${results.gaps[0]?.name ?? results.weakAreas[0]?.name}. Completing 2–3 focused projects in this area will close the gap quickly.`
            },
            {
              icon: <Target size={14} className="text-indigo-400 shrink-0 mt-0.5" />,
              text: `Ready for Junior ${role} role: ${results.careerReadiness}%. ${results.careerReadiness >= 70 ? 'Begin applying — you meet most requirements.' : `~${Math.ceil((75 - results.careerReadiness) / 5) * 2} weeks to reach 75% readiness.`}`
            },
            {
              icon: <Clock size={14} className="text-slate-400 shrink-0 mt-0.5" />,
              text: `Estimated ${results.careerReadiness >= 70 ? '4–6' : results.careerReadiness >= 45 ? '8–12' : '16–24'} weeks to reach Senior-ready status for ${role}, focusing on the recommended learning path below.`
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-3 bg-slate-800/30 rounded-xl">
              {item.icon}
              <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-6">
        <h2 className="text-slate-200 text-lg">Personalized Recommendations</h2>

        {/* Courses */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={14} className="text-blue-400" />
            <span className="text-slate-200 text-sm">Recommended Courses</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {RECOMMENDATIONS.courses.map((c, i) => (
              <div key={i} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:border-slate-600 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-slate-200 text-sm leading-snug flex-1">{c.name}</h4>
                  <div className="shrink-0 px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs">{c.match}%</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span>{c.platform}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Star size={10} className="text-amber-400 fill-amber-400" />{c.rating}</span>
                  <span>·</span>
                  <span>{c.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{c.students} students</span>
                  <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Add to Path <Plus size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects + Mentors */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FolderKanban size={14} className="text-purple-400" />
              <span className="text-slate-200 text-sm">Recommended Projects</span>
            </div>
            <div className="space-y-3">
              {RECOMMENDATIONS.projects.map((p, i) => (
                <div key={i} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:border-purple-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-200 text-sm">{p.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      p.difficulty === 'Hard' ? 'text-red-400 bg-red-500/10 border-red-500/25' : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                    }`}>{p.difficulty}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.skills.map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 bg-slate-700/60 rounded text-slate-500">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">+{p.points} XP</span>
                    <button className="text-purple-400 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Start <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={14} className="text-amber-400" />
              <span className="text-slate-200 text-sm">Recommended Mentors</span>
            </div>
            <div className="space-y-3">
              {RECOMMENDATIONS.mentors.map((m, i) => (
                <div key={i} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:border-amber-500/30 transition-all group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                      <span className="text-xs text-white">{m.name.split(' ').map(x => x[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 text-sm truncate">{m.name}</div>
                      <div className="text-slate-500 text-xs truncate">{m.role}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs text-amber-400">{m.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{m.sessions} sessions · {m.price}</span>
                    <button className="text-amber-400 hover:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Book <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Skill Graph */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-indigo-400" />
            <span className="text-slate-200 text-sm">Skill Graph Snapshot</span>
          </div>
          <button
            onClick={() => navigate('/skill-graph')}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View full graph <ExternalLink size={12} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SKILL_AREAS.map(({ name, icon, color }) => {
            const pct = results.skillScores[name].total > 0
              ? Math.round((results.skillScores[name].earned / results.skillScores[name].total) * 100)
              : 0;
            const status = pct >= 70 ? 'mastered' : pct >= 40 ? 'in-progress' : pct > 0 ? 'weak' : 'missing';
            const statusColor: Record<string, string> = {
              mastered: 'border-green-500/40 bg-green-500/5',
              'in-progress': 'border-amber-500/40 bg-amber-500/5',
              weak: 'border-orange-500/40 bg-orange-500/5',
              missing: 'border-red-500/40 bg-red-500/5'
            };
            const dotColor: Record<string, string> = {
              mastered: 'bg-green-400', 'in-progress': 'bg-amber-400', weak: 'bg-orange-400', missing: 'bg-red-400'
            };
            return (
              <div key={name} className={`p-3 rounded-xl border ${statusColor[status]} text-center`}>
                <div className={`flex justify-center mb-1.5 ${color}`}>{icon}</div>
                <div className="text-xs text-slate-300 leading-tight mb-1.5 truncate">{name}</div>
                <div className="flex items-center justify-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor[status]}`} />
                  <span className="text-xs text-slate-500 capitalize">{status.replace('-', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning Roadmap Preview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Map size={14} className="text-green-400" />
          <span className="text-slate-200 text-sm">Learning Roadmap Preview</span>
          <div className="ml-auto px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs">Generated from results</div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {ROADMAP_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${
                step.status === 'done' ? 'bg-green-500/10 border-green-500/30' :
                step.status === 'next' ? 'bg-indigo-500/10 border-indigo-500/30' :
                'bg-slate-800/40 border-slate-700/60'
              } min-w-36`}>
                <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center`}>
                  {step.status === 'done' ? <CheckCircle size={14} className="text-white" /> :
                   step.status === 'next' ? <Play size={14} className="text-white" /> :
                   <Lock size={14} className="text-slate-400" />}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium mb-0.5 ${
                    step.status === 'done' ? 'text-green-300' :
                    step.status === 'next' ? 'text-indigo-300' : 'text-slate-500'
                  }`}>{step.label}</div>
                  <div className="text-xs text-slate-600">{step.desc}</div>
                </div>
              </div>
              {i < ROADMAP_STEPS.length - 1 && (
                <div className="flex items-center">
                  <div className="w-6 h-px bg-slate-700" />
                  <ChevronRight size={12} className="text-slate-700 -mx-0.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={() => navigate('/learning-path')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus size={15} />
          Add to Learning Path
        </button>
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm transition-all"
        >
          <Play size={15} />
          Start Learning
        </button>
        <button
          onClick={() => navigate('/skill-graph')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm transition-all"
        >
          <Network size={15} />
          View Skill Graph
        </button>
        <button
          onClick={onRetake}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-sm transition-all"
        >
          <RefreshCw size={13} />
          Retake Assessment
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function AssessmentPage() {
  const [phase, setPhase] = useState<Phase>('overview');
  const [role, setRole] = useState<TargetRole>('Frontend');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const handleAnswer = useCallback((qId: number, value: string | string[] | number) => {
    setAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === qId);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { questionId: qId, value };
        return next;
      }
      return [...prev, { questionId: qId, value }];
    });
  }, []);

  const handleFlag = useCallback((qId: number) => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  }, []);

  if (phase === 'overview') {
    return (
      <div className="bg-slate-950 min-h-screen text-slate-100">
        {/* Inline top bar */}
        <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
              <Brain size={13} className="text-white" />
            </div>
            <span className="text-slate-400 text-sm">Assessments</span>
            <ChevronRight size={13} className="text-slate-700" />
            <span className="text-slate-200 text-sm">Career Readiness Assessment</span>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Progress auto-saved
            </div>
          </div>
        </div>
        <OverviewPhase role={role} setRole={setRole} onStart={() => setPhase('assessment')} />
      </div>
    );
  }

  if (phase === 'assessment') {
    return (
      <AssessmentPhase
        answers={answers}
        flagged={flagged}
        onAnswer={handleAnswer}
        onFlag={handleFlag}
        onSubmit={() => setPhase('results')}
      />
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
            <Brain size={13} className="text-white" />
          </div>
          <span className="text-slate-400 text-sm">Assessment</span>
          <ChevronRight size={13} className="text-slate-700" />
          <span className="text-slate-200 text-sm">Results</span>
          <div className="ml-auto flex items-center gap-2 text-xs text-green-400">
            <CheckCircle size={12} />
            Completed
          </div>
        </div>
      </div>
      <ResultsPhase answers={answers} role={role} onRetake={() => { setAnswers([]); setFlagged(new Set()); setPhase('overview'); }} />
    </div>
  );
}
