import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Play, Pause, ChevronDown, ChevronRight, ChevronLeft, CheckCircle, FileText,
  Award, MessageCircle, ThumbsUp, MessageSquare, Sparkles,
  Clock, Menu, X, HelpCircle, AlertCircle,
  TrendingUp, Target, SkipForward, SkipBack, Eye, EyeOff,
  Image as ImageIcon, BrainCircuit
} from 'lucide-react';
import {
  LEVEL_META, BRAND_HEX, BRAND_INK_CLS, BRAND_BAR_CLS, MUTED_TINT_CLS, MUTED_TINT_BTN_CLS, levelFill, type Level
} from '../components/courseStyle';

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonKind = 'video' | 'reading' | 'quiz';
type MainTab = 'content' | 'discussion';

interface ContentItem {
  id: string;
  kind: LessonKind;
  title: string;
  duration?: string;
}

interface Lesson {
  id: string;
  title: string;
  contents: ContentItem[];
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface FlatContent extends ContentItem {
  chapterId: string;
  lessonId: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface DiscussionPost {
  id: number;
  user: string;
  avatar: string;
  question: string;
  answer: string | null;
  upvotes: number;
  replies: number;
  isBest: boolean;
  time: string;
}

interface KnowledgeNode {
  id: string;
  term: string;
  definition: string;
}

interface KnowledgeEdge {
  from: string;
  to: string;
}

interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const COURSE: Chapter[] = [
  {
    id: 'ch1', title: 'Chapter 1: Getting Started',
    lessons: [
      {
        id: 'l1', title: 'Lesson 1: JSX Fundamentals',
        contents: [
          { id: 'l1-c1', kind: 'video',   title: 'Your first React component', duration: '15:20' },
          { id: 'l1-c2', kind: 'reading', title: 'Understanding JSX' },
          { id: 'l1-c3', kind: 'quiz',    title: 'JSX Quiz' }
        ]
      },
      {
        id: 'l2', title: 'Lesson 2: Component Props',
        contents: [
          { id: 'l2-c1', kind: 'video',   title: 'Passing and using props', duration: '12:40' },
          { id: 'l2-c2', kind: 'reading', title: 'Props vs State' }
        ]
      }
    ]
  },
  {
    id: 'ch2', title: 'Chapter 2: State & Effects',
    lessons: [
      {
        id: 'l3', title: 'Lesson 1: The useState Hook',
        contents: [
          { id: 'l3-c1', kind: 'video', title: 'Managing component state', duration: '18:05' },
          { id: 'l3-c2', kind: 'quiz',  title: 'useState Quiz' }
        ]
      }
    ]
  }
];

const FLAT_CONTENTS: FlatContent[] = COURSE.flatMap(ch =>
  ch.lessons.flatMap(lesson =>
    lesson.contents.map(c => ({ ...c, chapterId: ch.id, lessonId: lesson.id }))
  )
);

const ALL_LESSONS: Lesson[] = COURSE.flatMap(ch => ch.lessons);

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'What does JSX stand for?',
    options: ['JavaScript XML', 'Java Syntax Extension', 'JavaScript Extra', 'JSON XML'],
    correct: 0,
    explanation: 'JSX stands for JavaScript XML. It is a syntax extension that lets you write HTML-like markup inside a JavaScript file, which is then compiled by Babel into React.createElement() calls.'
  },
  {
    id: 2,
    question: 'Which of the following is valid JSX?',
    options: [
      '<div class="box">Hello</div>',
      '<div className="box">Hello</div>',
      '<div class-name="box">Hello</div>',
      '<div htmlClass="box">Hello</div>'
    ],
    correct: 1,
    explanation: 'In JSX, you must use `className` instead of `class` because `class` is a reserved keyword in JavaScript. All HTML attribute names that conflict with JS keywords are renamed in JSX.'
  },
  {
    id: 3,
    question: 'How do you embed a JavaScript expression inside JSX?',
    options: ['Using {{ expression }}', 'Using ${ expression }', 'Using { expression }', 'Using <% expression %>'],
    correct: 2,
    explanation: 'JSX uses single curly braces { } to embed any valid JavaScript expression — variables, function calls, ternary operators, and more. Double braces {{ }} are used only for inline style objects.'
  },
  {
    id: 4,
    question: 'What must a component\'s JSX return when it has multiple top-level elements?',
    options: [
      'Elements separated by commas',
      'All elements wrapped in a single parent or Fragment',
      'Elements inside an array only',
      'Multiple return statements'
    ],
    correct: 1,
    explanation: 'JSX must have a single root element. Use a real element like <div> or a React Fragment (<> </>) which renders no extra DOM node. Fragments are preferred when you don\'t want to add an unnecessary wrapper to the DOM.'
  },
  {
    id: 5,
    question: 'Which statement about JSX is correct?',
    options: [
      'JSX is required to build React apps',
      'Browsers can execute JSX natively',
      'JSX is compiled to React.createElement() by Babel',
      'JSX only works with class components'
    ],
    correct: 2,
    explanation: 'JSX is syntactic sugar — optional but widely used. Babel (or another transpiler) transforms JSX into React.createElement() calls that browsers can execute. You could write React without JSX, but it would be very verbose.'
  }
];

const DISCUSSIONS: Record<string, DiscussionPost[]> = {
  'l1-c1': [
    {
      id: 1, user: 'Sarah Chen', avatar: 'SC',
      question: "What's the difference between function and class components?",
      answer: "Function components are the modern approach. They're simpler, support Hooks, and are what React recommends today. Class components still work but are considered legacy.",
      upvotes: 24, replies: 8, isBest: true, time: '2h ago'
    },
    {
      id: 2, user: 'Mike Johnson', avatar: 'MJ',
      question: 'Can I use multiple return statements in a component?',
      answer: null, upvotes: 12, replies: 5, isBest: false, time: '5h ago'
    }
  ],
  'l1-c2': [
    {
      id: 1, user: 'Linh Tran', avatar: 'LT',
      question: 'Why does JSX use className instead of class?',
      answer: '`class` is a reserved keyword in JavaScript (used for ES6 classes). JSX is JavaScript, so it avoids conflicts by using `className` which maps to the HTML `class` attribute.',
      upvotes: 31, replies: 6, isBest: true, time: '1h ago'
    },
    {
      id: 2, user: 'Nam Hoang', avatar: 'NH',
      question: 'Can I put an if statement directly inside JSX curly braces?',
      answer: 'No — only expressions are allowed inside { }, not statements. Use a ternary operator `condition ? a : b` or move the if/else outside the return statement.',
      upvotes: 18, replies: 4, isBest: true, time: '3h ago'
    }
  ],
  'l1-c3': [
    {
      id: 1, user: 'Duc Anh', avatar: 'DA',
      question: 'I got question 3 wrong — can someone explain expressions vs statements?',
      answer: 'An expression always evaluates to a value (e.g. `x + 1`, `arr.map(...)`, `a ? b : c`). A statement is an instruction that does something but doesn\'t produce a value on its own (e.g. `if`, `for`, `let x = 1`). JSX needs values, so only expressions work inside { }.',
      upvotes: 22, replies: 9, isBest: true, time: '30min ago'
    }
  ]
};

const KNOWLEDGE: Record<string, KnowledgeGraph> = {
  l1: {
    nodes: [
      { id: 'jsx',      term: 'JSX',          definition: 'A syntax extension that lets you write HTML-like markup directly inside JavaScript.' },
      { id: 'babel',    term: 'Babel',        definition: 'The compiler that transforms JSX into React.createElement() calls the browser can run.' },
      { id: 'createEl', term: 'createElement', definition: 'The plain JS function call that JSX compiles down to at build time.' },
      { id: 'vdom',     term: 'Virtual DOM',  definition: 'An in-memory tree React uses to diff changes before touching the real DOM.' },
      { id: 'fragment', term: 'Fragment',     definition: 'A wrapper (<>...</>) that groups elements without adding an extra DOM node.' }
    ],
    edges: [
      { from: 'jsx', to: 'babel' },
      { from: 'babel', to: 'createEl' },
      { from: 'createEl', to: 'vdom' },
      { from: 'jsx', to: 'fragment' }
    ]
  },
  l2: {
    nodes: [
      { id: 'props',    term: 'Props',        definition: 'Read-only inputs passed from a parent component down to a child component.' },
      { id: 'state',    term: 'State',        definition: 'Data a component owns and manages internally, separate from props.' },
      { id: 'drilling', term: 'Prop drilling', definition: 'Passing props through many layers of components just to reach one nested deep.' },
      { id: 'children', term: 'children prop', definition: 'A special prop holding whatever is nested between a component\'s opening and closing tags.' }
    ],
    edges: [
      { from: 'props', to: 'state' },
      { from: 'props', to: 'drilling' },
      { from: 'props', to: 'children' }
    ]
  },
  l3: {
    nodes: [
      { id: 'useState',  term: 'useState',   definition: 'A Hook that adds local state to a function component.' },
      { id: 'rerender',  term: 'Re-render',  definition: 'React re-running a component function again after its state changes.' },
      { id: 'setter',    term: 'Setter fn',  definition: 'The update function returned by useState, used to schedule a new state value.' }
    ],
    edges: [
      { from: 'useState', to: 'rerender' },
      { from: 'useState', to: 'setter' }
    ]
  }
};

// Level of the course this lesson belongs to — drives the primary action fill so
// "Next" / "Submit" match the course's "Continue Learning" button.
const COURSE_LEVEL: Level = 'Advanced';
const PRIMARY_FILL = { ...levelFill(COURSE_LEVEL), color: LEVEL_META[COURSE_LEVEL].on };

// ─── Quiz / feedback palette ─────────────────────────────────────────────────
// Correct = Kmin blue, wrong = Kmin pink, warning = Kmin yellow. Text gets its own
// shade per theme because the raw brand colors lose contrast as text.

const CORRECT_INK_CLS = 'text-[#1b6f99] dark:text-[#7cc4ea]';
const CORRECT_BG_CLS = 'bg-[#238ec3]/12';
const WRONG_INK_CLS = 'text-[#b8336c] dark:text-[#eb96b8]';
const WRONG_BG_CLS = 'bg-[#e05992]/12';
const WARN_INK_CLS = 'text-[#8a5a00] dark:text-[#fcbf16]';
const WARN_BG_CLS = 'bg-[#fcbf16]/15';
const SELECTED_RING_CLS = 'ring-2 ring-[#1e3e4e] dark:ring-[#9ccbdd]';

function ContentKindIcon({ kind, size, className }: { kind: LessonKind; size: number; className: string }) {
  if (kind === 'video') return <Play size={size} className={className} />;
  if (kind === 'reading') return <FileText size={size} className={className} />;
  return <HelpCircle size={size} className={className} />;
}

// ─── Video View ──────────────────────────────────────────────────────────────

function VideoView() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Your first React component</h1>
        <p className="text-muted-foreground leading-relaxed">
          Learn how to create and structure your first React component using functional syntax — covering component basics, JSX, and rendering.
        </p>
      </div>

      <div className="rounded-xl overflow-hidden aspect-video relative" style={{ background: `linear-gradient(135deg, #10222b, ${BRAND_HEX})` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <button onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center mb-3 transition-colors mx-auto">
              {isPlaying ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-1" />}
            </button>
            <p className="text-white/70 text-sm">Resume from 5:20</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center gap-3 text-white">
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1 h-1 bg-white/20 rounded-full">
              <div className="h-1 bg-white rounded-full" style={{ width: '35%' }} />
            </div>
            <span className="text-xs text-white/70">5:20 / 15:20</span>
            <select className="bg-white/10 rounded px-2 py-0.5 text-xs border border-white/20">
              <option>1x</option><option>1.25x</option><option>1.5x</option><option>2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reading View ─────────────────────────────────────────────────────────────

function CodeWindow({ label, dotColor, code }: { label: string; dotColor?: string; code: string }) {
  return (
    <div className={`rounded-xl overflow-hidden ${MUTED_TINT_CLS}`}>
      <div className="px-4 py-2 border-b border-border flex items-center gap-2">
        {dotColor
          ? <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
          : <span className="flex gap-1">{[0, 1, 2].map(i => <span key={i} className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />)}</span>}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <pre className="p-4 text-xs overflow-x-auto leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

function ReadingView() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl mb-2">Understanding JSX</h1>
        <p className="text-muted-foreground leading-relaxed">Read through this article carefully, then take the quiz.</p>
      </div>

      <article className="space-y-10 leading-relaxed">
        <section className="space-y-3">
          <h2>What is JSX?</h2>
          <p className="text-muted-foreground">JSX (JavaScript XML) is a syntax extension for JavaScript used in React. It lets you write HTML-like markup directly inside your JavaScript code, making it easier to describe what the UI should look like.</p>
          <p className="text-muted-foreground">Although JSX looks like HTML, it is not HTML. It is closer to JavaScript — and your browser cannot execute it directly. A tool called <strong className="text-foreground">Babel</strong> compiles JSX into regular JavaScript function calls before the browser runs it.</p>
        </section>

        <section className="space-y-3">
          <h2>JSX vs. Plain JavaScript</h2>
          <p className="text-muted-foreground">These two snippets produce identical output. The JSX version is what you write; Babel produces the plain JS version.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CodeWindow label="JSX (what you write)" dotColor={LEVEL_META.Beginner.hex}
              code={`function Greeting() {\n  return (\n    <h1 className="title">\n      Hello, world!\n    </h1>\n  );\n}`} />
            <CodeWindow label="After Babel compiles it" dotColor={LEVEL_META.Advanced.hex}
              code={`function Greeting() {\n  return React.createElement(\n    'h1',\n    { className: 'title' },\n    'Hello, world!'\n  );\n}`} />
          </div>
        </section>

        <section className="space-y-3">
          <h2>How JSX Gets Rendered</h2>
          <div className={`rounded-xl overflow-hidden ${MUTED_TINT_CLS}`}>
            <div className="border-b border-border flex items-center gap-2 px-4 py-2.5">
              <ImageIcon size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">JSX compilation and render pipeline</span>
            </div>
            <div className="p-5 flex items-center justify-center flex-wrap gap-2">
              {['Your JSX', 'Babel', 'React.createElement()', 'Virtual DOM', 'Real DOM'].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-background">{step}</span>
                  {i < arr.length - 1 && <ChevronRight size={14} className="text-muted-foreground" />}
                </span>
              ))}
            </div>
          </div>
          <p className="text-muted-foreground">React maintains a <strong className="text-foreground">Virtual DOM</strong> — a lightweight in-memory tree. When state changes, React diffs the new tree against the old one and only updates the real DOM nodes that actually changed.</p>
        </section>

        <section className="space-y-3">
          <h2>JSX vs. HTML — Key Differences</h2>
          <div className={`rounded-xl overflow-hidden ${MUTED_TINT_CLS}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-2.5 text-xs font-medium">Rule</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium">HTML</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium">JSX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['CSS class', '<div class="box">', '<div className="box">'],
                  ['Inline style', 'style="color:red"', 'style={{ color: "red" }}'],
                  ['Self-closing tags', '<img> / <br>', '<img /> / <br />'],
                  ['Expressions', '—', '<h1>{user.name}</h1>'],
                  ['Event listeners', 'onclick="fn()"', 'onClick={fn}'],
                  ['Boolean attrs', 'disabled', 'disabled={true}'],
                ].map(([rule, html, jsx], i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{rule}</td>
                    <td className="px-4 py-2.5"><code className={`text-xs px-1.5 py-0.5 rounded ${WRONG_BG_CLS} ${WRONG_INK_CLS}`}>{html}</code></td>
                    <td className="px-4 py-2.5"><code className={`text-xs px-1.5 py-0.5 rounded ${CORRECT_BG_CLS} ${CORRECT_INK_CLS}`}>{jsx}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2>Embedding Expressions</h2>
          <p className="text-muted-foreground">Any valid JavaScript expression can go inside <code className={`text-xs px-1.5 py-0.5 rounded text-foreground ${MUTED_TINT_CLS}`}>{'{ }'}</code> — variables, function calls, ternary operators, and array maps.</p>
          <CodeWindow label="UserCard.jsx" code={`function UserCard({ user }) {
  const isOnline = user.status === 'online';

  return (
    <div className="card">
      {/* Variable */}
      <h2>{user.name}</h2>

      {/* Ternary expression */}
      <span className={isOnline ? 'green' : 'grey'}>
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {/* Conditional rendering */}
      {user.isPremium && <Badge label="Premium" />}
    </div>
  );
}`} />
          <div className={`flex gap-3 p-4 rounded-xl ${WARN_BG_CLS}`}>
            <AlertCircle size={15} className={`shrink-0 mt-0.5 ${WARN_INK_CLS}`} />
            <div>
              <div className={`text-sm font-medium mb-1 ${WARN_INK_CLS}`}>Expressions only — no statements</div>
              <p className="text-sm text-muted-foreground leading-relaxed">You cannot use <code className="bg-background px-1 rounded">if/else</code> or <code className="bg-background px-1 rounded">for</code> loops directly inside JSX. Use ternary operators and <code className="bg-background px-1 rounded">.map()</code> instead.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2>Key Takeaways</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              'JSX compiles to React.createElement() — it\'s JavaScript, not HTML',
              'Use className instead of class for CSS',
              'All tags must be self-closed: <br /> not <br>',
              'Use { } to embed any JavaScript expression',
              'A component must return one single root element',
              'Inline styles use a JS object with camelCase keys'
            ].map((point, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl ${MUTED_TINT_CLS}`}>
                <CheckCircle size={14} className={`shrink-0 mt-0.5 ${BRAND_INK_CLS}`} />
                <span className="text-sm leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}

// ─── Quiz View ────────────────────────────────────────────────────────────────

function QuizView() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeQ, setActiveQ] = useState(1);

  const answered = Object.keys(answers).length;
  const score = submitted ? QUIZ_QUESTIONS.filter(q => answers[q.id] === q.correct).length : 0;
  const currentQ = QUIZ_QUESTIONS.find(q => q.id === activeQ)!;
  const allAnswered = answered === QUIZ_QUESTIONS.length;

  const qStatus = (q: QuizQuestion) => {
    if (!submitted) return answers[q.id] !== undefined ? 'answered' : 'unanswered';
    return answers[q.id] === q.correct ? 'correct' : 'wrong';
  };

  const result = score >= 4
    ? { bg: CORRECT_BG_CLS, ink: CORRECT_INK_CLS, msg: 'Great work!' }
    : score >= 3
    ? { bg: WARN_BG_CLS, ink: WARN_INK_CLS, msg: 'Almost there — review the explanations' }
    : { bg: WRONG_BG_CLS, ink: WRONG_INK_CLS, msg: 'Keep studying — check the explanations carefully' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">JSX Quiz</h1>
        <p className="text-muted-foreground">
          {submitted
            ? `Scored ${score}/${QUIZ_QUESTIONS.length} — review the explanations below.`
            : `${answered} of ${QUIZ_QUESTIONS.length} answered.`}
        </p>
      </div>

      {submitted && (
        <div className={`flex items-center gap-4 p-4 rounded-xl ${result.bg}`}>
          <div className={`text-4xl font-light ${result.ink}`}>{score}/{QUIZ_QUESTIONS.length}</div>
          <div>
            <div className={`font-medium ${result.ink}`}>{result.msg}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{Math.round((score / QUIZ_QUESTIONS.length) * 100)}% correct</div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Question panel */}
        <div className="w-36 shrink-0 space-y-1.5">
          <div className="text-xs text-muted-foreground mb-2 px-1">Questions</div>
          {QUIZ_QUESTIONS.map(q => {
            const s = qStatus(q);
            const isActive = activeQ === q.id;
            const stateCls =
              s === 'correct' ? `${CORRECT_BG_CLS} ${CORRECT_INK_CLS}` :
              s === 'wrong' ? `${WRONG_BG_CLS} ${WRONG_INK_CLS}` :
              s === 'answered' ? 'bg-background text-foreground' :
              `${MUTED_TINT_BTN_CLS} text-muted-foreground`;
            return (
              <button key={q.id} onClick={() => setActiveQ(q.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-shadow ${stateCls} ${isActive ? SELECTED_RING_CLS : 'hover:shadow-sm'}`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-black/5 dark:bg-white/10">
                  {s === 'correct' ? '✓' : s === 'wrong' ? '✕' : q.id}
                </span>
                <span className="truncate">{
                  s === 'correct' ? 'Correct' :
                  s === 'wrong' ? 'Wrong' :
                  s === 'answered' ? 'Answered' : 'Not yet'
                }</span>
              </button>
            );
          })}

          {!submitted && (
            <button onClick={() => allAnswered && setSubmitted(true)}
              disabled={!allAnswered}
              className={`w-full mt-3 py-2.5 rounded-lg text-sm transition-opacity ${
                allAnswered ? 'hover:opacity-90' : `${MUTED_TINT_BTN_CLS} text-muted-foreground cursor-not-allowed`
              }`}
              style={allAnswered ? PRIMARY_FILL : undefined}>
              {allAnswered ? 'Submit Quiz' : `${QUIZ_QUESTIONS.length - answered} left`}
            </button>
          )}
        </div>

        {/* Active question */}
        <div className="flex-1 min-w-0">
          <div className={`rounded-2xl p-5 space-y-4 ${MUTED_TINT_CLS}`}>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-xs shrink-0">{currentQ.id}</div>
              <p className="leading-relaxed pt-0.5">{currentQ.question}</p>
            </div>

            <div className="space-y-2">
              {currentQ.options.map((opt, i) => {
                const selected = answers[currentQ.id] === i;
                const isCorrect = submitted && currentQ.correct === i;
                const isWrong = submitted && selected && !isCorrect;
                const optionCls =
                  isWrong ? `${WRONG_BG_CLS} ${WRONG_INK_CLS}` :
                  isCorrect ? `${CORRECT_BG_CLS} ${CORRECT_INK_CLS}` :
                  selected ? `bg-background ${SELECTED_RING_CLS}` :
                  'bg-background hover:shadow-sm';
                return (
                  <button key={i}
                    onClick={() => !submitted && setAnswers(a => ({ ...a, [currentQ.id]: i }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-shadow ${optionCls} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        isWrong || isCorrect ? 'bg-black/5 dark:bg-white/10' : selected ? 'text-white' : 'border border-muted-foreground/40'
                      }`}
                      style={selected && !submitted ? { backgroundColor: BRAND_HEX } : undefined}
                    >
                      {isWrong ? '✕' : isCorrect ? '✓' : String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <span className="text-xs shrink-0">Correct answer</span>}
                    {isWrong && <span className="text-xs shrink-0">Your answer</span>}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <HelpCircle size={13} className={answers[currentQ.id] === currentQ.correct ? CORRECT_INK_CLS : WARN_INK_CLS} />
                  <span className={`text-sm font-medium ${answers[currentQ.id] === currentQ.correct ? CORRECT_INK_CLS : WARN_INK_CLS}`}>
                    {answers[currentQ.id] === currentQ.correct ? 'Correct!' : 'Explanation'}
                  </span>
                </div>

                {answers[currentQ.id] !== currentQ.correct && (
                  <div className="space-y-2 text-xs">
                    <div className={`flex items-start gap-2 p-2.5 rounded-lg ${WRONG_BG_CLS}`}>
                      <span className={`shrink-0 ${WRONG_INK_CLS}`}>✕ You answered:</span>
                      <span className="text-muted-foreground">{currentQ.options[answers[currentQ.id]]}</span>
                    </div>
                    <div className={`flex items-start gap-2 p-2.5 rounded-lg ${CORRECT_BG_CLS}`}>
                      <span className={`shrink-0 ${CORRECT_INK_CLS}`}>✓ Correct answer:</span>
                      <span>{currentQ.options[currentQ.correct]}</span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-muted-foreground leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button onClick={() => setActiveQ(q => Math.max(1, q - 1))} disabled={activeQ === 1}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1 transition-colors">
                <SkipBack size={12} /> Prev
              </button>
              <span className="text-xs text-muted-foreground">{activeQ} / {QUIZ_QUESTIONS.length}</span>
              <button onClick={() => setActiveQ(q => Math.min(QUIZ_QUESTIONS.length, q + 1))} disabled={activeQ === QUIZ_QUESTIONS.length}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1 transition-colors">
                Next <SkipForward size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder View (content not yet authored) ─────────────────────────────

function PlaceholderView({ content }: { content: ContentItem }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ContentKindIcon kind={content.kind} size={28} className="mb-3 text-muted-foreground opacity-50" />
      <h2 className="text-2xl mb-1">{content.title}</h2>
      <p className="text-muted-foreground">Content for this lesson is coming soon.</p>
    </div>
  );
}

// ─── Knowledge Graph Modal ────────────────────────────────────────────────────

const GRAPH_ACCENT = LEVEL_META.Beginner.hex;

function KnowledgeGraphModal({ graph, lessonTitle, focusId, onClose }: {
  graph: KnowledgeGraph;
  lessonTitle: string;
  focusId: string;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(focusId);
  const selected = graph.nodes.find(n => n.id === selectedId) ?? graph.nodes[0];

  const size = 300;
  const center = size / 2;
  const radius = size * 0.34;
  const positions = new Map<string, { x: number; y: number }>();
  graph.nodes.forEach((n, i) => {
    if (i === 0 || graph.nodes.length === 1) {
      positions.set(n.id, { x: center, y: center });
    } else {
      const angle = (2 * Math.PI * (i - 1)) / (graph.nodes.length - 1) - Math.PI / 2;
      positions.set(n.id, { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) });
    }
  });

  const neighborIds = new Set(
    graph.edges
      .filter(e => e.from === selectedId || e.to === selectedId)
      .map(e => (e.from === selectedId ? e.to : e.from))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border-2 border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="flex items-center gap-2"><BrainCircuit size={16} className={BRAND_INK_CLS} />Knowledge Graph</h3>
            <p className="text-sm text-muted-foreground">{lessonTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col md:flex-row gap-5">
          <div className={`flex-1 rounded-xl shrink-0 h-64 md:h-80 ${MUTED_TINT_CLS}`}>
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
              {graph.edges.map((e, i) => {
                const a = positions.get(e.from)!;
                const b = positions.get(e.to)!;
                const active = e.from === selectedId || e.to === selectedId;
                return (
                  <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={active ? GRAPH_ACCENT : 'var(--muted-foreground)'}
                    strokeWidth={active ? 1.5 : 1}
                    strokeOpacity={active ? 0.9 : 0.3} />
                );
              })}
              {graph.nodes.map(n => {
                const p = positions.get(n.id)!;
                const active = n.id === selectedId;
                const related = neighborIds.has(n.id);
                const r = active ? 26 : 20;
                return (
                  <g key={n.id} onClick={() => setSelectedId(n.id)} className="cursor-pointer">
                    <circle cx={p.x} cy={p.y} r={r}
                      fill={active ? GRAPH_ACCENT : 'var(--card)'}
                      stroke={active || related ? GRAPH_ACCENT : 'var(--muted-foreground)'}
                      strokeWidth={active ? 2 : 1.5}
                      strokeOpacity={active || related ? 1 : 0.4} />
                    <text x={p.x} y={p.y + r + 14} textAnchor="middle" fontSize="10"
                      fill={active || related ? 'var(--foreground)' : 'var(--muted-foreground)'}
                      className="pointer-events-none select-none">
                      {n.term}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full md:w-56 shrink-0 space-y-3">
            <div className={`p-3 rounded-xl ${MUTED_TINT_CLS}`}>
              <h4 className="mb-1.5">{selected.term}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.definition}</p>
            </div>
            {neighborIds.size > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Related</div>
                <div className="flex flex-wrap gap-1.5">
                  {graph.nodes.filter(n => neighborIds.has(n.id)).map(n => (
                    <button key={n.id} onClick={() => setSelectedId(n.id)}
                      className={`text-xs px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity ${MUTED_TINT_BTN_CLS}`}>
                      {n.term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discussion View ──────────────────────────────────────────────────────────

function DiscussionView({ contentId, title }: { contentId: string; title: string }) {
  const posts = DISCUSSIONS[contentId] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Discussion</h2>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <MessageSquare size={14} />Ask a Question
        </button>
      </div>

      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <MessageCircle size={32} className="mb-3 opacity-40" />
          <p>No discussions yet for this lesson.</p>
          <p className="text-sm mt-1">Be the first to ask a question!</p>
        </div>
      )}

      <div className="space-y-3">
        {posts.map(d => (
          <div key={d.id} className={`rounded-xl p-4 hover:shadow-md transition-shadow ${MUTED_TINT_CLS}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs text-muted-foreground shrink-0">{d.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium">{d.user}</span>
                  <span className="text-xs text-muted-foreground">{d.time}</span>
                </div>
                <p className="text-sm mb-2.5">{d.question}</p>
                {d.answer && (
                  <div className="p-3 rounded-xl bg-background text-sm leading-relaxed">
                    {d.isBest && (
                      <div className={`flex items-center gap-1.5 text-xs font-medium mb-1.5 ${BRAND_INK_CLS}`}>
                        <CheckCircle size={11} />Best Answer
                      </div>
                    )}
                    <p className="text-muted-foreground">{d.answer}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors"><ThumbsUp size={11} />{d.upvotes}</button>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors"><MessageCircle size={11} />{d.replies} replies</button>
                  <button className="hover:text-foreground transition-colors">Reply</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function Learning() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [activeContentId, setActiveContentId] = useState<string>(FLAT_CONTENTS[0].id);
  const [completed, setCompleted] = useState<string[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['ch1']);
  const [activeTab, setActiveTab] = useState<MainTab>('content');
  const [showAI, setShowAI] = useState(false);
  const [graphFocusId, setGraphFocusId] = useState<string | null>(null);

  const contentIndex = FLAT_CONTENTS.findIndex(c => c.id === activeContentId);
  const currentContent = FLAT_CONTENTS[contentIndex];
  const currentLesson = ALL_LESSONS.find(l => l.id === currentContent.lessonId)!;
  const canGoBack = contentIndex > 0;
  const canGoNext = contentIndex < FLAT_CONTENTS.length - 1;
  const isDone = completed.includes(activeContentId);

  const goToContent = (id: string) => {
    const target = FLAT_CONTENTS.find(c => c.id === id)!;
    setActiveContentId(id);
    setActiveTab('content');
    setShowMobileNav(false);
    setExpandedChapters(p => p.includes(target.chapterId) ? p : [...p, target.chapterId]);
  };

  const goToLesson = (lessonId: string) => {
    const lesson = ALL_LESSONS.find(l => l.id === lessonId)!;
    goToContent(lesson.contents[0].id);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(p => p.includes(chapterId) ? p.filter(x => x !== chapterId) : [...p, chapterId]);
  };

  const markDone = () => {
    if (!isDone) setCompleted(prev => [...prev, activeContentId]);
  };

  const handleNext = () => {
    markDone();
    if (canGoNext) goToContent(FLAT_CONTENTS[contentIndex + 1].id);
    else navigate(`/courses/${courseId}`);
  };

  const handlePrev = () => {
    if (canGoBack) goToContent(FLAT_CONTENTS[contentIndex - 1].id);
  };

  const tabLabel: Record<LessonKind, string> = {
    video: 'Video',
    reading: 'Reading',
    quiz: 'Quiz'
  };

  const isAuthoredContent = currentLesson.id === 'l1';
  const knowledgeNodes = KNOWLEDGE[currentLesson.id]?.nodes ?? [];
  const discussionCount = DISCUSSIONS[activeContentId]?.length ?? 0;

  const tabCls = (active: boolean) =>
    `px-4 py-2.5 border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
      active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="space-y-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => navigate(`/courses/${courseId}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors min-w-0">
          <ChevronLeft size={15} className="shrink-0" />
          <span className="truncate">Advanced React Patterns</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setFocusMode(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            {focusMode ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="hidden sm:inline">{focusMode ? 'Exit Focus' : 'Focus'}</span>
          </button>
          <button onClick={() => setShowMobileNav(v => !v)} className="md:hidden p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Menu size={15} />
          </button>
        </div>
      </div>

      <div className="flex gap-6 xl:gap-8 items-start">

        {/* LEFT — chapter/lesson/content nav */}
        {!focusMode && (
          <nav className={`${showMobileNav ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' : 'hidden'} md:block md:w-60 md:shrink-0 md:sticky md:top-24 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto`}>
            <div className="flex items-center justify-between mb-3 md:hidden">
              <h3>Course Content</h3>
              <button onClick={() => setShowMobileNav(false)} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>

            <div className={`rounded-2xl p-2 space-y-1 ${MUTED_TINT_CLS}`}>
              {COURSE.map(ch => {
                const chExpanded = expandedChapters.includes(ch.id);
                return (
                  <div key={ch.id}>
                    <button onClick={() => toggleChapter(ch.id)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {chExpanded ? <ChevronDown size={13} className="shrink-0" /> : <ChevronRight size={13} className="shrink-0" />}
                      <span className="leading-snug">{ch.title}</span>
                    </button>

                    {chExpanded && (
                      <div className="ml-3 space-y-0.5">
                        {ch.lessons.map(lesson => {
                          const lessonActive = lesson.id === currentLesson.id;
                          const lessonDone = lesson.contents.every(c => completed.includes(c.id));
                          return (
                            <div key={lesson.id}>
                              <button onClick={() => goToLesson(lesson.id)}
                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                                  lessonActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                                }`}>
                                {lessonActive ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
                                {lessonDone && <CheckCircle size={12} className={`shrink-0 ${BRAND_INK_CLS}`} />}
                                <span className="flex-1 leading-snug truncate">{lesson.title}</span>
                              </button>

                              {/* Content level — only for the active lesson */}
                              {lessonActive && (
                                <div className="ml-4 space-y-0.5 mb-1">
                                  {lesson.contents.map(content => {
                                    const active = content.id === activeContentId;
                                    const done = completed.includes(content.id);
                                    return (
                                      <button key={content.id} onClick={() => goToContent(content.id)}
                                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
                                          active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                        }`}>
                                        {done
                                          ? <CheckCircle size={13} className={`shrink-0 ${BRAND_INK_CLS}`} />
                                          : <ContentKindIcon kind={content.kind} size={12} className="shrink-0" />}
                                        <span className="flex-1 leading-snug truncate">{content.title}</span>
                                        {content.duration && !active && (
                                          <span className="text-xs text-muted-foreground shrink-0">{content.duration}</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        )}

        {/* CENTER — content + bottom nav */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 border-b border-border">
            <button onClick={() => setActiveTab('content')} className={tabCls(activeTab === 'content')}>
              {tabLabel[currentContent.kind]}
            </button>
            <button onClick={() => setActiveTab('discussion')} className={tabCls(activeTab === 'discussion')}>
              <MessageCircle size={14} />Discussion
              {discussionCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full text-muted-foreground ${MUTED_TINT_CLS}`}>
                  {discussionCount}
                </span>
              )}
            </button>
          </div>

          <div className="max-w-3xl mx-auto py-8">
            {activeTab === 'content' && !isAuthoredContent && <PlaceholderView content={currentContent} />}
            {activeTab === 'content' && isAuthoredContent && currentContent.kind === 'video' && <VideoView />}
            {activeTab === 'content' && isAuthoredContent && currentContent.kind === 'reading' && <ReadingView />}
            {activeTab === 'content' && isAuthoredContent && currentContent.kind === 'quiz' && <QuizView />}
            {activeTab === 'discussion' && <DiscussionView contentId={activeContentId} title={currentContent.title} />}
          </div>

          {/* Bottom nav — stays reachable while scrolling long lessons */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-3 flex items-center gap-3">
            <button onClick={handlePrev} disabled={!canGoBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
              <SkipBack size={14} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex-1 flex justify-center">
              <button onClick={markDone}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg whitespace-nowrap transition-opacity ${
                  isDone ? `${CORRECT_BG_CLS} ${CORRECT_INK_CLS} cursor-default` : `${MUTED_TINT_BTN_CLS} hover:opacity-80`
                }`}>
                <CheckCircle size={15} className={isDone ? '' : 'text-muted-foreground'} />
                {isDone ? 'Marked as Done' : 'Mark as Done'}
              </button>
            </div>

            <button onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shrink-0"
              style={PRIMARY_FILL}>
              <span className="hidden sm:inline">{canGoNext ? 'Next' : 'Finish'}</span>
              <SkipForward size={14} />
            </button>
          </div>
        </div>

        {/* RIGHT — support panel */}
        {!focusMode && (
          <aside className="hidden xl:block w-64 shrink-0 space-y-4 sticky top-24">

            {/* AI */}
            <div>
              <button onClick={() => setShowAI(v => !v)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                <Sparkles size={14} className={BRAND_INK_CLS} />Ask AI Assistant
              </button>
              {showAI && (
                <div className={`mt-2 p-3 rounded-xl space-y-2 ${MUTED_TINT_CLS}`}>
                  <textarea rows={3} placeholder="Ask anything about this lesson..."
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
                  <div className="flex gap-2">
                    <button className="flex-1 text-sm py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: BRAND_HEX }}>Ask</button>
                    <button onClick={() => setShowAI(false)} className="flex-1 text-sm py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">Close</button>
                  </div>
                </div>
              )}
            </div>

            {/* Knowledge */}
            <div className={`rounded-2xl p-4 ${MUTED_TINT_CLS}`}>
              <h4 className="text-sm flex items-center gap-1.5"><BrainCircuit size={13} className="text-muted-foreground" />Knowledge</h4>
              <p className="text-xs text-muted-foreground mb-3 truncate">{currentLesson.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {knowledgeNodes.map(n => (
                  <div key={n.id} className="relative group">
                    <button onClick={() => setGraphFocusId(n.id)}
                      className="text-xs px-2.5 py-1 rounded-full bg-background hover:shadow-sm transition-shadow">
                      {n.term}
                    </button>
                    <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-popover text-popover-foreground border border-border rounded-lg p-2.5 shadow-lg">
                      <p className="text-xs leading-relaxed">{n.definition}</p>
                    </div>
                  </div>
                ))}
                {knowledgeNodes.length === 0 && (
                  <p className="text-xs text-muted-foreground">No key concepts yet.</p>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className={`rounded-2xl p-4 space-y-3 ${MUTED_TINT_CLS}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm">Skills</h4>
                <button onClick={() => navigate('/skill-graph')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                  View <ChevronRight size={11} />
                </button>
              </div>
              {[
                { name: 'React Basics', progress: 45 },
                { name: 'JSX', progress: 30 },
                { name: 'Components', progress: 20 }
              ].map(s => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground">{s.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full">
                    <div className={`h-1.5 rounded-full ${BRAND_BAR_CLS}`} style={{ width: `${s.progress}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 pt-3 text-xs text-muted-foreground border-t border-border">
                <TrendingUp size={12} className={`shrink-0 mt-0.5 ${BRAND_INK_CLS}`} />
                <span>After this module: React Basics <span className="text-foreground font-medium">+5%</span> · JSX <span className="text-foreground font-medium">+8%</span></span>
              </div>
            </div>

            {/* Lesson meta */}
            <div className={`rounded-2xl p-4 space-y-2.5 text-sm ${MUTED_TINT_CLS}`}>
              {[
                { icon: <Target size={13} />, label: 'Concepts', val: '3' },
                { icon: <Clock size={13} />, label: 'Est. time', val: '15 min' },
                { icon: <Award size={13} />, label: 'XP reward', val: '50 pts' }
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2 text-muted-foreground">
                  {r.icon}<span className="flex-1">{r.label}</span><span className="text-foreground">{r.val}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {graphFocusId && KNOWLEDGE[currentLesson.id] && (
        <KnowledgeGraphModal
          graph={KNOWLEDGE[currentLesson.id]}
          lessonTitle={currentLesson.title}
          focusId={graphFocusId}
          onClose={() => setGraphFocusId(null)}
        />
      )}
    </div>
  );
}
