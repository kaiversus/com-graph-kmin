import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight, Network, Map, FolderKanban, Users, BarChart3,
  CheckCircle, Zap, Star, BookOpen, Target, Brain,
  TrendingUp, Code2, Award, MessageCircle, Play,
  ChevronRight, Sparkles, Menu, X
} from 'lucide-react';

// ─── Nav ──────────────────────────────────────────────────────────────────────

function LandingNav() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = ['Learn', 'Projects', 'Mentors', 'Community', 'Skill Graph', 'About'];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/landing')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white text-lg tracking-tight">COM</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <button key={l} className="text-sm text-slate-400 hover:text-slate-100 transition-colors">{l}</button>
          ))}
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-sm text-slate-400 hover:text-slate-100 transition-colors px-3 py-1.5">Sign In</button>
          <button onClick={() => navigate('/')} className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">Get Started</button>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-6 py-4 space-y-3">
          {links.map(l => (
            <div key={l} className="text-sm text-slate-400 py-1.5">{l}</div>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <button className="text-sm text-slate-400 py-2">Sign In</button>
            <button onClick={() => navigate('/')} className="text-sm py-2.5 bg-indigo-600 text-white rounded-lg">Get Started</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  const navigate = useNavigate();

  const journey = ['Learn', 'Practice', 'Build', 'Mentor', 'Prove', 'Career'];

  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="max-w-3xl mx-auto text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 mb-6">
            <Sparkles size={11} />
            Career-focused IT learning ecosystem
          </div>

          <h1 className="text-5xl md:text-6xl text-white leading-tight mb-6 tracking-tight">
            Don't Just Learn.<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Build Proof of What You Can Do.
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-xl mx-auto">
            Structured learning, real projects, expert mentors, and a living portfolio that grows with every skill you prove.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/20">
              Start Your Journey <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate('/learning-path')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm transition-colors">
              Explore Learning Paths
            </button>
          </div>
        </div>

        {/* Journey flow */}
        <div className="flex items-center justify-center gap-0 mb-14 flex-wrap md:flex-nowrap">
          {journey.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1 px-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs ${
                  i < 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400'
                }`}>
                  {i < 3 ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{step}</span>
              </div>
              {i < journey.length - 1 && (
                <div className={`w-8 md:w-12 h-px ${i < 2 ? 'bg-indigo-600/50' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Product preview */}
        <div className="relative max-w-5xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="text-xs text-slate-600 bg-slate-800 rounded px-3 py-1">app.com-platform.io/dashboard</div>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="p-6 grid grid-cols-3 gap-4 bg-slate-950">
              {/* Stat cards */}
              {[
                { label: 'Career Readiness', value: '72%', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Skills Verified', value: '18', color: 'text-green-400', bg: 'bg-green-500/10' },
                { label: 'Projects Built', value: '7', color: 'text-purple-400', bg: 'bg-purple-500/10' }
              ].map(s => (
                <div key={s.label} className={`${s.bg} border border-slate-800 rounded-xl p-4`}>
                  <div className={`text-2xl ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
              {/* Course in progress */}
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-2">Continue Learning</div>
                <div className="text-sm text-slate-200 mb-3">Advanced React Patterns</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
                    <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: '68%' }} />
                  </div>
                  <span className="text-xs text-slate-600">68%</span>
                </div>
                <div className="text-xs text-slate-600 mt-2">Module 3 / 4 — Performance Optimization</div>
              </div>
              {/* Skill graph mini */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
                <Network size={22} className="text-indigo-400 mb-2" />
                <div className="text-xs text-slate-400">Skill Graph</div>
                <div className="text-xs text-slate-600">18 nodes</div>
              </div>
            </div>
          </div>
          {/* Glow under */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-indigo-600/10 blur-2xl rounded-full" />
        </div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

function JourneySection() {
  const steps = [
    { num: 1, title: 'Discover Where You Are', desc: 'Take a skill assessment. Get your baseline, identify gaps, and understand your starting point.', icon: <BarChart3 size={18} className="text-indigo-400" />, color: 'border-indigo-500/30 bg-indigo-500/5' },
    { num: 2, title: 'Follow Your Roadmap', desc: 'Get a personalized learning path based on your target role, current skills, and goals.', icon: <Map size={18} className="text-blue-400" />, color: 'border-blue-500/30 bg-blue-500/5' },
    { num: 3, title: 'Learn & Practice', desc: 'Micro-content, coding exercises, quizzes, and practical challenges — all in structured progression.', icon: <BookOpen size={18} className="text-cyan-400" />, color: 'border-cyan-500/30 bg-cyan-500/5' },
    { num: 4, title: 'Build Real Projects', desc: 'Apply knowledge to projects inspired by real work. Create artifacts that prove your ability.', icon: <FolderKanban size={18} className="text-purple-400" />, color: 'border-purple-500/30 bg-purple-500/5' },
    { num: 5, title: 'Learn With Mentors', desc: 'Get code reviews, career advice, portfolio feedback, and skill validation from senior engineers.', icon: <Users size={18} className="text-pink-400" />, color: 'border-pink-500/30 bg-pink-500/5' },
    { num: 6, title: 'Prove Your Ability', desc: 'COM updates your Skill Graph with evidence from every activity — assessments, projects, reviews.', icon: <Network size={18} className="text-amber-400" />, color: 'border-amber-500/30 bg-amber-500/5' },
    { num: 7, title: 'Build Your Career', desc: 'Turn your journey into a public portfolio. Track career readiness. Land the role you want.', icon: <TrendingUp size={18} className="text-green-400" />, color: 'border-green-500/30 bg-green-500/5' }
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">How COM works</div>
          <h2 className="text-3xl md:text-4xl text-white mb-4">One connected journey from skill to career</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Every step reinforces the next. Learning builds skills. Skills unlock projects. Projects fill your portfolio. Portfolio gets you hired.</p>
        </div>

        {/* Connected steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[calc(50%-3px)] w-px h-[calc(100%-80px)] bg-gradient-to-b from-indigo-500/30 to-green-500/20 z-0" />

          <div className="space-y-4 relative z-10 max-w-3xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.num} className={`flex items-start gap-5 p-5 border rounded-2xl ${step.color} transition-all hover:border-opacity-60`}>
                {/* Number circle */}
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sm text-slate-400 shrink-0">
                  {step.num}
                </div>
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-0.5 shrink-0">{step.icon}</div>
                  <div>
                    <div className="text-slate-200 mb-1">{step.title}</div>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Learning Path preview ────────────────────────────────────────────────────

function LearningPathSection() {
  const navigate = useNavigate();

  const pathSteps = [
    { label: 'JavaScript Fundamentals', done: true },
    { label: 'React Basics', done: true },
    { label: 'TypeScript Essentials', done: false, current: true },
    { label: 'Advanced React Patterns', done: false },
    { label: 'Testing & Quality', done: false },
    { label: 'System Design', done: false }
  ];

  const gaps = ['TypeScript', 'Testing', 'Authentication', 'Performance'];

  return (
    <section className="py-24 px-6 bg-slate-900/40">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">Personalized Roadmap</div>
            <h2 className="text-3xl md:text-4xl text-white mb-5">Know exactly what<br />to learn next.</h2>
            <p className="text-slate-400 leading-relaxed mb-6">Your roadmap dynamically adapts based on assessment results, learning progress, project completions, and career goals — so you always know where to focus.</p>
            <div className="flex items-center gap-3 flex-wrap text-sm text-slate-400 mb-8">
              {['Adaptive to your goals', 'Skill-gap driven', 'Regularly updated'].map(t => (
                <div key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                  <CheckCircle size={12} className="text-green-400" />{t}
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/learning-path')}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              View Learning Path <ArrowRight size={14} />
            </button>
          </div>

          {/* Preview card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-1">Target Role</div>
                <div className="text-slate-200 text-sm flex items-center gap-2">
                  <Briefcase2 />
                  Frontend Developer
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Readiness</div>
                <div className="text-2xl text-indigo-400">72%</div>
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="space-y-2">
              {pathSteps.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                  s.current ? 'bg-indigo-500/10 border border-indigo-500/20' : ''
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    s.done ? 'bg-green-500/20 border border-green-500/30' :
                    s.current ? 'bg-indigo-500/20 border border-indigo-500/30' :
                    'bg-slate-800 border border-slate-700'
                  }`}>
                    {s.done ? <CheckCircle size={10} className="text-green-400" /> :
                     s.current ? <Play size={9} className="text-indigo-400" /> :
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                  </div>
                  <span className={`text-xs flex-1 ${s.done ? 'text-slate-600 line-through' : s.current ? 'text-slate-200' : 'text-slate-500'}`}>{s.label}</span>
                  {s.current && <span className="text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Now</span>}
                </div>
              ))}
            </div>

            <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3">
              <div className="text-xs text-amber-400 mb-2 flex items-center gap-1.5">
                <Target size={11} />Skill Gaps to Address
              </div>
              <div className="flex flex-wrap gap-1.5">
                {gaps.map(g => (
                  <span key={g} className="text-xs px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded">{g}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Small inline icon component ─────────────────────────────────────────────

function Briefcase2() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

// ─── Skill Graph ────────────────────────────────────────────────────────────

function SkillGraphSection() {
  const navigate = useNavigate();

  const gNodes = [
    { id: 'js', label: 'JavaScript', x: 200, y: 160, type: 'area' },
    { id: 'fn', label: 'Functions', x: 110, y: 90, type: 'knowledge' },
    { id: 'async', label: 'Async / Await', x: 290, y: 90, type: 'knowledge' },
    { id: 'hooks', label: 'React Hooks', x: 110, y: 230, type: 'skill' },
    { id: 'state', label: 'State Mgmt', x: 290, y: 230, type: 'skill' },
    { id: 'react', label: 'React Dev', x: 200, y: 310, type: 'skill' },
    { id: 'role', label: 'Frontend\nDeveloper', x: 200, y: 390, type: 'role' }
  ];
  const gEdges = [
    ['js', 'fn'], ['js', 'async'], ['js', 'hooks'], ['js', 'state'],
    ['hooks', 'react'], ['state', 'react'], ['react', 'role']
  ];

  const colorMap: Record<string, { fill: string; stroke: string; r: number }> = {
    area: { fill: '#0f172a', stroke: '#6366f1', r: 28 },
    knowledge: { fill: '#0f172a', stroke: '#3b82f6', r: 22 },
    skill: { fill: '#0f172a', stroke: '#22c55e', r: 22 },
    role: { fill: '#1e3a5f', stroke: '#6366f1', r: 26 }
  };

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Graph preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden order-2 lg:order-1">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
              <Network size={13} className="text-indigo-400" />
              <span className="text-xs text-slate-400">Your Skill Graph</span>
              <div className="ml-auto flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Area</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Knowledge</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Skill</span>
              </div>
            </div>
            <svg viewBox="0 0 400 440" className="w-full" style={{ height: 320 }}>
              {gEdges.map(([a, b], i) => {
                const n1 = gNodes.find(n => n.id === a);
                const n2 = gNodes.find(n => n.id === b);
                if (!n1 || !n2) return null;
                return <line key={i} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="#1e293b" strokeWidth="1.5" />;
              })}
              {gNodes.map(n => {
                const s = colorMap[n.type];
                const lines = n.label.split('\n');
                return (
                  <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />
                    {n.type === 'role' && <circle cx={n.x} cy={n.y} r={s.r + 5} fill="none" stroke={s.stroke} strokeWidth="0.5" opacity="0.3" />}
                    {lines.map((line, li) => (
                      <text key={li} x={n.x} y={n.y + 4 + (li - (lines.length - 1) / 2) * 12}
                        textAnchor="middle" fontSize={8.5} fill="#94a3b8">
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">Skill Graph</div>
            <h2 className="text-3xl md:text-4xl text-white mb-5">See your abilities grow, not just your course progress.</h2>
            <p className="text-slate-400 leading-relaxed mb-6">COM connects every learning activity, assessment, project, and mentor review to build a living representation of what you know and can do — mapped to real-world roles.</p>

            <div className="space-y-3 mb-8">
              {[
                { label: 'Knowledge Area → Knowledge → Skill → Role', icon: <Network size={13} className="text-indigo-400" /> },
                { label: 'Evidence-based mastery tracking per concept', icon: <CheckCircle size={13} className="text-green-400" /> },
                { label: 'Connects to assessments, projects & mentor reviews', icon: <Sparkles size={13} className="text-amber-400" /> }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                  {item.icon}{item.label}
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/skill-graph')}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              Explore Skill Graph <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Projects ────────────────────────────────────────────────────────────────

function ProjectsSection() {
  const navigate = useNavigate();

  const projects = [
    {
      title: 'E-commerce Web Application',
      desc: 'Build a full product catalog with cart, filters, and checkout flow.',
      level: 'Intermediate', effort: '12–15 hrs',
      stack: ['React', 'TypeScript', 'Tailwind'],
      skills: ['State Management', 'API Integration', 'UX Design'],
      color: 'from-blue-600 to-indigo-600'
    },
    {
      title: 'Authentication System',
      desc: 'Implement secure user auth with JWT, refresh tokens, and protected routes.',
      level: 'Intermediate', effort: '8–10 hrs',
      stack: ['Node.js', 'JWT', 'React'],
      skills: ['Security', 'Backend', 'Session Management'],
      color: 'from-purple-600 to-pink-500'
    },
    {
      title: 'Task Management Platform',
      desc: 'Create a Kanban-style board with drag-and-drop, labels, and team collaboration.',
      level: 'Advanced', effort: '20–25 hrs',
      stack: ['React', 'Redux', 'WebSocket'],
      skills: ['Real-time', 'Complex State', 'UX Patterns'],
      color: 'from-emerald-600 to-teal-500'
    }
  ];

  return (
    <section className="py-24 px-6 bg-slate-900/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">Learn by Building</div>
          <h2 className="text-3xl md:text-4xl text-white mb-4">Build things worth showing.</h2>
          <p className="text-slate-400 max-w-lg mx-auto">You don't just watch lessons — you solve realistic problems and create portfolio-ready products that demonstrate real skill.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12 mb-8">
          {projects.map(p => (
            <div key={p.title} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors group">
              <div className={`h-2 bg-gradient-to-r ${p.color}`} />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    p.level === 'Advanced' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>{p.level}</span>
                  <span className="text-xs text-slate-600">{p.effort}</span>
                </div>
                <div>
                  <h3 className="text-slate-200 mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1.5">Tech stack</div>
                  <div className="flex flex-wrap gap-1">
                    {p.stack.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1.5">Skills practiced</div>
                  <div className="flex flex-wrap gap-1">
                    {p.skills.map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => navigate('/projects')}
            className="flex items-center gap-2 mx-auto text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Explore all projects <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Assessment ──────────────────────────────────────────────────────────────

function AssessmentSection() {
  const navigate = useNavigate();

  const strengths = ['HTML & CSS', 'JavaScript Fundamentals', 'React Components'];
  const improvements = ['Testing', 'Authentication', 'Performance Optimization'];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">Skill Assessment</div>
            <h2 className="text-3xl md:text-4xl text-white mb-5">Understand what you know — and what you still need.</h2>
            <p className="text-slate-400 leading-relaxed mb-6">COM doesn't give you a score and forget it. It diagnoses your current level, shows exactly where the gaps are, and recommends what to do next.</p>
            <div className="space-y-3 mb-8 text-sm text-slate-400">
              {[
                'Adaptive multi-format assessment — not just multiple choice',
                'Maps results directly to your Skill Graph',
                'Recommends specific courses, projects, and mentors to fill gaps'
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/assessment')}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              Take the Assessment <ArrowRight size={14} />
            </button>
          </div>

          {/* Readiness card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-1">Role Assessment</div>
                <div className="text-slate-200">Frontend Developer Readiness</div>
              </div>
              <div className="text-3xl text-indigo-400">68%</div>
            </div>

            <div className="h-2 bg-slate-800 rounded-full">
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" style={{ width: '68%' }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-green-400 mb-2">
                  <CheckCircle size={11} />Strengths
                </div>
                <div className="space-y-1.5">
                  {strengths.map(s => (
                    <div key={s} className="text-xs text-slate-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{s}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                  <Target size={11} />Improve
                </div>
                <div className="space-y-1.5">
                  {improvements.map(s => (
                    <div key={s} className="text-xs text-slate-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />{s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
              <div className="text-xs text-indigo-300 mb-0.5">Recommended next action</div>
              <div className="text-sm text-slate-200 flex items-center gap-2">
                <Code2 size={13} className="text-indigo-400" />
                Complete Authentication Project
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Mentors ─────────────────────────────────────────────────────────────────

function MentorSection() {
  const navigate = useNavigate();

  const mentors = [
    {
      initials: 'SC', name: 'Sarah Chen', role: 'Senior Frontend Engineer', company: 'Meta',
      expertise: ['React', 'TypeScript', 'Performance'],
      services: ['Code Review', 'Career Guidance', 'Mock Interview'],
      rating: 4.9, sessions: 284
    },
    {
      initials: 'AR', name: 'Alex Rivera', role: 'Full Stack Engineer', company: 'Stripe',
      expertise: ['Node.js', 'System Design', 'APIs'],
      services: ['Project Review', 'CV & Portfolio', 'Career Guidance'],
      rating: 4.8, sessions: 196
    },
    {
      initials: 'MN', name: 'Mai Nguyen', role: 'Engineering Manager', company: 'Shopify',
      expertise: ['Leadership', 'Architecture', 'Team Dynamics'],
      services: ['Career Guidance', 'Mock Interview', 'Portfolio Review'],
      rating: 5.0, sessions: 142
    }
  ];

  return (
    <section className="py-24 px-6 bg-slate-900/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">Mentoring</div>
          <h2 className="text-3xl md:text-4xl text-white mb-4">AI helps you learn. People help you grow.</h2>
          <p className="text-slate-400 max-w-lg mx-auto">Connect with senior engineers who've been where you want to go. Get real feedback, career direction, and validation that matters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12 mb-8">
          {mentors.map(m => (
            <div key={m.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0">
                  {m.initials}
                </div>
                <div>
                  <div className="text-slate-200 text-sm">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.role} @ {m.company}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {m.expertise.map(e => (
                  <span key={e} className="text-xs px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded">{e}</span>
                ))}
              </div>

              <div className="space-y-1.5 mb-4">
                {m.services.map(s => (
                  <div key={s} className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={10} className="text-green-400 shrink-0" />{s}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-600">
                <div className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" /><span className="text-slate-400">{m.rating}</span></div>
                <span>{m.sessions} sessions</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => navigate('/mentors')}
            className="flex items-center gap-2 mx-auto text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Find a Mentor <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

function PortfolioSection() {
  const navigate = useNavigate();

  const skills = ['React', 'TypeScript', 'Node.js', 'System Design', 'Performance'];
  const projects = ['E-commerce App', 'Auth System', 'Task Manager'];
  const achievements = ['7-Day Streak', 'Project Milestone', 'Top Contributor'];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Portfolio mock */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Profile header */}
            <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/20 p-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-lg">TD</div>
                <div>
                  <div className="text-slate-200 text-base">Tran Duc Anh</div>
                  <div className="text-sm text-slate-400">Frontend Developer Candidate</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400">72% Career Ready</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Verified skills */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Verified Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span key={s} className="flex items-center gap-1 text-xs px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-300 rounded-lg">
                      <CheckCircle size={9} />{s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Portfolio Projects</div>
                <div className="flex flex-col gap-1.5">
                  {projects.map(p => (
                    <div key={p} className="flex items-center gap-2 text-xs text-slate-400">
                      <FolderKanban size={11} className="text-purple-400 shrink-0" />{p}
                      <span className="ml-auto text-green-500 text-xs">✓ Mentor reviewed</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Achievements</div>
                <div className="flex flex-wrap gap-1.5">
                  {achievements.map(a => (
                    <span key={a} className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/15 text-amber-300 rounded-lg">
                      <Award size={9} />{a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div>
            <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">Living Portfolio</div>
            <h2 className="text-3xl md:text-4xl text-white mb-5">Your portfolio builds itself as you grow.</h2>
            <p className="text-slate-400 leading-relaxed mb-4">Every project, assessment, mentor review, and community contribution becomes evidence of your ability — automatically collected into a public portfolio employers can trust.</p>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">Not just certificates. Real proof — linked to the actual work you did.</p>
            <button onClick={() => navigate('/portfolio')}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              View Portfolio Example <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Community ───────────────────────────────────────────────────────────────

function CommunitySection() {
  const navigate = useNavigate();

  const posts = [
    { initials: 'NV', name: 'Nguyen Van An', time: '2h', content: 'Why does useEffect run twice in React 18? Sharing what I found after 3 hours of debugging...', replies: 12, tag: 'Q&A', solved: true },
    { initials: 'TL', name: 'Tran Le Hoa', time: '5h', content: 'Just finished the Auth System project — here\'s the architecture breakdown and lessons learned.', replies: 8, tag: 'Knowledge', solved: false },
    { initials: 'BK', name: 'Bui Kim Chi', time: '1d', content: '10 TypeScript tricks that make React components much cleaner. Had these in my notes for months.', replies: 24, tag: 'Article', solved: false }
  ];

  const contributors = [
    { initials: 'PH', name: 'Phan Hoang', streak: 14, rice: 1240 },
    { initials: 'NT', name: 'Nguyen Thi Lan', streak: 8, rice: 980 },
    { initials: 'DM', name: 'Dinh Minh', streak: 21, rice: 1680 }
  ];

  return (
    <section className="py-24 px-6 bg-slate-900/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">Community</div>
          <h2 className="text-3xl md:text-4xl text-white mb-4">Learn together. Share what you know. Keep moving.</h2>
          <p className="text-slate-400 max-w-lg mx-auto">Ask questions, share discoveries, earn Rice by contributing — and keep your streak alive with the people around you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-12">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-3">
            {posts.map((p, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 shrink-0">{p.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-slate-300">{p.name}</span>
                      <span className="text-xs text-slate-600">{p.time}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ml-auto shrink-0 ${
                        p.tag === 'Q&A' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                        p.tag === 'Article' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                        'text-green-400 bg-green-500/10 border-green-500/20'
                      }`}>{p.tag}</span>
                      {p.solved && <span className="text-xs text-green-400 border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 rounded shrink-0">Solved</span>}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{p.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><MessageCircle size={10} />{p.replies} replies</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => navigate('/community')}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mt-2">
              Join the community <ArrowRight size={14} />
            </button>
          </div>

          {/* Leaderboard mini */}
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5"><Zap size={11} className="text-amber-400" />Top Contributors</div>
              <div className="space-y-3">
                {contributors.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-xs text-slate-700 w-4">{i + 1}</div>
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 shrink-0">{c.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-300 truncate">{c.name}</div>
                      <div className="text-xs text-slate-600">{c.streak}-day streak</div>
                    </div>
                    <div className="text-xs text-amber-400">{c.rice.toLocaleString()} 🌾</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earn Rice */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
              <div className="text-xs text-amber-400 mb-2">Earn Rice 🌾 by</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                {['Completing lessons', 'Finishing projects', 'Answering questions', 'Publishing articles', 'Helping the community'].map(a => (
                  <div key={a} className="flex items-center gap-1.5"><ChevronRight size={10} className="text-amber-400 shrink-0" />{a}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Philosophy / Why COM ─────────────────────────────────────────────────────

function PhilosophySection() {
  const pillars = [
    { title: 'Project-based Learning', desc: 'Learn by creating real products, not watching videos. Every module ends with something you built.', icon: <FolderKanban size={16} className="text-indigo-400" />, color: 'border-indigo-500/20 bg-indigo-500/5' },
    { title: 'Insight Learning', desc: 'Build strong foundations. Understand why things work, not just how — so you can adapt and create.', icon: <Brain size={16} className="text-blue-400" />, color: 'border-blue-500/20 bg-blue-500/5' },
    { title: 'Blended Learning', desc: 'Combine structured content, AI assistance, peer community, and real human mentors in one flow.', icon: <Sparkles size={16} className="text-cyan-400" />, color: 'border-cyan-500/20 bg-cyan-500/5' }
  ];

  const differentiators = [
    'Personalized learning roadmap',
    'Evidence-based skill tracking',
    'Career-readiness as a measurable metric',
    'Living portfolio built automatically',
    'Skill verification by real mentors',
    'Community learning momentum'
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs text-slate-500 mb-3 tracking-widest uppercase">Why COM is different</div>
          <h2 className="text-3xl md:text-4xl text-white mb-4">The PIB Learning Philosophy</h2>
          <p className="text-slate-400 max-w-lg mx-auto">Three interconnected principles that make COM more than an online course platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {pillars.map(p => (
            <div key={p.title} className={`p-6 border rounded-2xl ${p.color}`}>
              <div className="mb-3">{p.icon}</div>
              <h3 className="text-slate-200 mb-2">{p.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="text-xs text-slate-500 mb-4">Also built into COM</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {differentiators.map(d => (
              <div key={d} className="flex items-center gap-2.5 text-sm text-slate-400">
                <CheckCircle size={13} className="text-green-400 shrink-0" />{d}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Outcomes ────────────────────────────────────────────────────────────────

function OutcomesSection() {
  const before = [
    'Unsure what to learn next',
    'Watching disconnected tutorials',
    'No proof of real ability',
    'Hard to evaluate your own readiness',
    'Portfolio = GitHub with empty repos'
  ];
  const after = [
    'Clear, personalized career roadmap',
    'Structured, outcome-driven learning',
    'Real project experience as evidence',
    'Verified skills with measurable mastery',
    'Strong portfolio backed by proof'
  ];

  return (
    <section className="py-24 px-6 bg-slate-900/40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl text-white mb-4">The transformation COM enables</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6">
            <div className="text-sm text-red-400 mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-xs">✕</div>
              Before COM
            </div>
            <div className="space-y-3">
              {before.map(b => (
                <div key={b} className="flex items-start gap-2.5 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/50 mt-2 shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-green-500/5 border border-green-500/15 rounded-2xl p-6">
            <div className="text-sm text-green-400 mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-xs">✓</div>
              With COM
            </div>
            <div className="space-y-3">
              {after.map(a => (
                <div key={a} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <CheckCircle size={13} className="text-green-400 mt-0.5 shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto text-center relative">
        <div className="text-xs text-slate-500 mb-4 tracking-widest uppercase">Get started</div>
        <h2 className="text-4xl md:text-5xl text-white mb-6 leading-tight tracking-tight">
          Start building the career you want — <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">one verified skill at a time.</span>
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
          Discover where you are, choose where you want to go, and let COM help you build the path between them.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors shadow-xl shadow-indigo-500/20">
            Start for Free <ArrowRight size={15} />
          </button>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm transition-colors">
            <Play size={13} />Explore COM
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-4">No credit card required · Free to start</p>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function LandingFooter() {
  const cols = [
    {
      title: 'Platform',
      links: ['Courses', 'Projects', 'Learning Paths', 'Skill Graph', 'Mentors']
    },
    {
      title: 'Community',
      links: ['Community', 'Blog', 'Leaderboard']
    },
    {
      title: 'Company',
      links: ['About COM', 'About Kmin', 'Careers', 'Contact']
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms']
    }
  ];

  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="text-white">COM</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">Career-focused IT learning. Learn → Build → Prove → Grow.</p>
            <div className="flex items-center gap-3">
              {['fb', 'yt', 'in', 'gh'].map((label) => (
                <div key={label} className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors">
                  <span className="text-slate-500 text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {cols.map(col => (
            <div key={col.title}>
              <div className="text-xs text-slate-500 mb-3 tracking-wider uppercase">{col.title}</div>
              <div className="space-y-2">
                {col.links.map(l => (
                  <div key={l} className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex items-center justify-between text-xs text-slate-700 flex-wrap gap-3">
          <span>© 2026 COM Platform. Built by Kmin Academy.</span>
          <span>Made for learners who want more than just a certificate.</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <LandingNav />
      <main>
        <HeroSection />
        <JourneySection />
        <LearningPathSection />
        <SkillGraphSection />
        <ProjectsSection />
        <AssessmentSection />
        <MentorSection />
        <PortfolioSection />
        <CommunitySection />
        <PhilosophySection />
        <OutcomesSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
