import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain, Target, TrendingUp, Award, BookOpen, FolderKanban, Users, MessageCircle,
  FileText, Lightbulb, ChevronRight, ZoomIn, ZoomOut, Maximize2, RotateCcw,
  CheckCircle, Clock, AlertTriangle, XCircle, Circle, Star, ArrowRight,
  Play, Briefcase, Filter, Eye, Map, BarChart3, Search, Layers,
  Network, GitBranch, Sparkles, Shield, ExternalLink, Plus, ChevronDown, ChevronUp,
  User, Calendar, Hash
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = 'Frontend' | 'Backend' | 'Mobile' | 'AI' | 'Data Engineering';
type NodeStatus = 'mastered' | 'in-progress' | 'weak' | 'missing' | 'future';
type NodeType = 'topic' | 'skill' | 'concept' | 'task';
type ViewMode = 'graph' | 'roadmap' | 'evidence' | 'skill-gap';
type EdgeType = 'dependency' | 'prerequisite' | 'evidence';

interface SkillNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  mastery: number;
  evidenceScore: number;
  x: number;
  y: number;
  domain: Domain;
  description: string;
  parentId?: string;
  courses: { name: string; platform: string; completed: boolean }[];
  projects: { name: string; role: string; link?: string }[];
  mentorReviews: { mentor: string; score: number; comment: string; date: string }[];
  communityContributions: { type: string; title: string; upvotes: number }[];
  blogPosts: { title: string; views: number; date: string }[];
  relatedConcepts: string[];
  nextSkills: string[];
  tags: string[];
}

interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const GRAPH_DATA: Record<Domain, { nodes: SkillNode[]; edges: GraphEdge[] }> = {
  Frontend: {
    nodes: [
      {
        id: 'react', name: 'React', type: 'topic', status: 'mastered', mastery: 87, evidenceScore: 92,
        x: 420, y: 200, domain: 'Frontend',
        description: 'A JavaScript library for building user interfaces with declarative components',
        courses: [
          { name: 'React — The Complete Guide', platform: 'Udemy', completed: true },
          { name: 'Advanced React Patterns', platform: 'Frontend Masters', completed: true }
        ],
        projects: [
          { name: 'E-commerce Platform', role: 'Lead Developer', link: '#' },
          { name: 'Task Management App', role: 'Full-stack Dev', link: '#' }
        ],
        mentorReviews: [
          { mentor: 'Sarah Chen', score: 9.2, comment: 'Excellent grasp of component composition and state lifting patterns.', date: '2025-11-12' }
        ],
        communityContributions: [
          { type: 'Answer', title: 'Explained React reconciliation algorithm', upvotes: 124 }
        ],
        blogPosts: [
          { title: 'Deep Dive: React Fiber Architecture', views: 3240, date: '2025-10-01' }
        ],
        relatedConcepts: ['hooks', 'jsx', 'context'],
        nextSkills: ['nextjs', 'react-query'],
        tags: ['javascript', 'ui', 'spa']
      },
      {
        id: 'hooks', name: 'React Hooks', type: 'skill', status: 'mastered', mastery: 91, evidenceScore: 88,
        x: 250, y: 120, domain: 'Frontend',
        description: 'Functions that let you use state and lifecycle features in functional components',
        courses: [{ name: 'React Hooks In Depth', platform: 'egghead.io', completed: true }],
        projects: [{ name: 'Weather Dashboard', role: 'Developer' }],
        mentorReviews: [],
        communityContributions: [{ type: 'Tutorial', title: 'Custom Hooks Patterns Guide', upvotes: 89 }],
        blogPosts: [],
        relatedConcepts: ['jsx', 'context', 'effects'],
        nextSkills: ['custom-hooks', 'suspense'],
        tags: ['state', 'lifecycle', 'functional']
      },
      {
        id: 'jsx', name: 'JSX & Components', type: 'skill', status: 'mastered', mastery: 95, evidenceScore: 96,
        x: 580, y: 120, domain: 'Frontend',
        description: 'Declarative UI syntax and component composition patterns',
        courses: [],
        projects: [{ name: 'Component Library', role: 'Creator' }],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['react', 'props'],
        nextSkills: ['storybook'],
        tags: ['syntax', 'components']
      },
      {
        id: 'useeffect', name: 'useEffect', type: 'concept', status: 'mastered', mastery: 89, evidenceScore: 85,
        x: 180, y: 50, domain: 'Frontend',
        description: 'Side effect management in functional components',
        courses: [],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['hooks', 'lifecycle'],
        nextSkills: ['useReducer'],
        tags: ['side-effects']
      },
      {
        id: 'usestate', name: 'useState', type: 'concept', status: 'mastered', mastery: 98, evidenceScore: 99,
        x: 310, y: 55, domain: 'Frontend',
        description: 'Local state management in functional components',
        courses: [],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['hooks'],
        nextSkills: ['useReducer', 'zustand'],
        tags: ['state']
      },
      {
        id: 'auth-task', name: 'Build Auth Flow', type: 'task', status: 'mastered', mastery: 100, evidenceScore: 94,
        x: 130, y: 130, domain: 'Frontend',
        description: 'Implemented full JWT authentication with refresh tokens',
        courses: [],
        projects: [{ name: 'E-commerce Platform', role: 'Auth Module Owner' }],
        mentorReviews: [{ mentor: 'Alex Rivera', score: 9.8, comment: 'Production-ready auth implementation.', date: '2025-09-05' }],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['useeffect', 'usestate'],
        nextSkills: ['oauth', 'jwt-advanced'],
        tags: ['auth', 'security']
      },
      {
        id: 'context', name: 'Context API', type: 'skill', status: 'in-progress', mastery: 62, evidenceScore: 55,
        x: 420, y: 320, domain: 'Frontend',
        description: 'React\'s built-in state management for avoiding prop drilling',
        courses: [{ name: 'React State Management', platform: 'Scrimba', completed: false }],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['react', 'hooks', 'zustand'],
        nextSkills: ['redux', 'zustand'],
        tags: ['state', 'global']
      },
      {
        id: 'typescript', name: 'TypeScript', type: 'skill', status: 'in-progress', mastery: 58, evidenceScore: 48,
        x: 650, y: 270, domain: 'Frontend',
        description: 'Typed superset of JavaScript for large-scale applications',
        courses: [{ name: 'TypeScript Fundamentals', platform: 'Pluralsight', completed: false }],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['jsx', 'react'],
        nextSkills: ['advanced-types', 'decorators'],
        tags: ['types', 'tooling']
      },
      {
        id: 'testing', name: 'Testing (Jest)', type: 'skill', status: 'weak', mastery: 32, evidenceScore: 25,
        x: 570, y: 370, domain: 'Frontend',
        description: 'Unit and integration testing for React components',
        courses: [{ name: 'Testing React Applications', platform: 'Testing Library', completed: false }],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['react', 'jsx'],
        nextSkills: ['e2e-cypress', 'tdd'],
        tags: ['testing', 'quality']
      },
      {
        id: 'css-grid', name: 'CSS Grid & Flexbox', type: 'skill', status: 'mastered', mastery: 88, evidenceScore: 82,
        x: 270, y: 360, domain: 'Frontend',
        description: 'Modern CSS layout techniques',
        courses: [],
        projects: [{ name: 'Portfolio Website', role: 'Designer + Dev' }],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['tailwind', 'responsive'],
        nextSkills: ['css-animations', 'css-variables'],
        tags: ['layout', 'css']
      },
      {
        id: 'nextjs', name: 'Next.js', type: 'skill', status: 'missing', mastery: 0, evidenceScore: 0,
        x: 420, y: 450, domain: 'Frontend',
        description: 'React framework for production with SSR and SSG capabilities',
        courses: [],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['react', 'ssr'],
        nextSkills: ['vercel-deploy', 'api-routes'],
        tags: ['framework', 'ssr']
      },
      {
        id: 'performance', name: 'Performance Optimization', type: 'skill', status: 'future', mastery: 0, evidenceScore: 0,
        x: 700, y: 430, domain: 'Frontend',
        description: 'React.memo, useMemo, code splitting, lazy loading',
        courses: [],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['react', 'webpack'],
        nextSkills: ['core-web-vitals'],
        tags: ['optimization', 'advanced']
      }
    ],
    edges: [
      { from: 'react', to: 'hooks', type: 'dependency' },
      { from: 'react', to: 'jsx', type: 'dependency' },
      { from: 'hooks', to: 'useeffect', type: 'dependency' },
      { from: 'hooks', to: 'usestate', type: 'dependency' },
      { from: 'useeffect', to: 'auth-task', type: 'prerequisite' },
      { from: 'usestate', to: 'auth-task', type: 'prerequisite' },
      { from: 'react', to: 'context', type: 'dependency' },
      { from: 'react', to: 'typescript', type: 'prerequisite' },
      { from: 'jsx', to: 'testing', type: 'prerequisite' },
      { from: 'react', to: 'nextjs', type: 'prerequisite' },
      { from: 'react', to: 'performance', type: 'prerequisite' },
      { from: 'context', to: 'nextjs', type: 'prerequisite' },
      { from: 'auth-task', to: 'context', type: 'evidence' },
      { from: 'auth-task', to: 'useeffect', type: 'evidence' },
    ]
  },
  Backend: {
    nodes: [
      {
        id: 'node', name: 'Node.js', type: 'topic', status: 'in-progress', mastery: 55, evidenceScore: 48,
        x: 400, y: 200, domain: 'Backend',
        description: 'Server-side JavaScript runtime environment',
        courses: [{ name: 'Node.js Complete Guide', platform: 'Udemy', completed: false }],
        projects: [{ name: 'REST API Server', role: 'Backend Dev' }],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['express', 'async'],
        nextSkills: ['nestjs', 'microservices'],
        tags: ['server', 'runtime']
      },
      {
        id: 'express', name: 'Express.js', type: 'skill', status: 'in-progress', mastery: 60, evidenceScore: 52,
        x: 240, y: 130, domain: 'Backend',
        description: 'Minimal Node.js web application framework',
        courses: [],
        projects: [{ name: 'REST API Server', role: 'Backend Dev' }],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['node', 'middleware'],
        nextSkills: ['fastify', 'nestjs'],
        tags: ['framework', 'http']
      },
      {
        id: 'databases', name: 'SQL Databases', type: 'skill', status: 'weak', mastery: 35, evidenceScore: 28,
        x: 560, y: 130, domain: 'Backend',
        description: 'Relational database design and querying',
        courses: [{ name: 'SQL Mastery', platform: 'Mode Analytics', completed: false }],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['postgresql', 'orm'],
        nextSkills: ['postgresql', 'mongodb'],
        tags: ['database', 'sql']
      },
      {
        id: 'auth-backend', name: 'Auth & Security', type: 'skill', status: 'missing', mastery: 0, evidenceScore: 0,
        x: 400, y: 360, domain: 'Backend',
        description: 'JWT, OAuth, session management, bcrypt',
        courses: [],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['express', 'databases'],
        nextSkills: ['oauth2', 'security-headers'],
        tags: ['auth', 'security']
      },
      {
        id: 'docker', name: 'Docker', type: 'skill', status: 'future', mastery: 0, evidenceScore: 0,
        x: 250, y: 360, domain: 'Backend',
        description: 'Containerization for consistent deployment environments',
        courses: [],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['deployment', 'devops'],
        nextSkills: ['kubernetes', 'ci-cd'],
        tags: ['devops', 'containers']
      }
    ],
    edges: [
      { from: 'node', to: 'express', type: 'dependency' },
      { from: 'node', to: 'databases', type: 'prerequisite' },
      { from: 'express', to: 'auth-backend', type: 'prerequisite' },
      { from: 'databases', to: 'auth-backend', type: 'prerequisite' },
    ]
  },
  Mobile: {
    nodes: [
      {
        id: 'react-native', name: 'React Native', type: 'topic', status: 'weak', mastery: 28, evidenceScore: 20,
        x: 400, y: 200, domain: 'Mobile',
        description: 'Build native mobile apps with React',
        courses: [{ name: 'React Native - The Practical Guide', platform: 'Udemy', completed: false }],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['react', 'expo'],
        nextSkills: ['expo', 'native-modules'],
        tags: ['mobile', 'cross-platform']
      },
      {
        id: 'expo', name: 'Expo', type: 'skill', status: 'missing', mastery: 0, evidenceScore: 0,
        x: 250, y: 130, domain: 'Mobile',
        description: 'Framework and platform for React Native',
        courses: [],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['react-native'],
        nextSkills: ['eas-build'],
        tags: ['tooling', 'mobile']
      }
    ],
    edges: [
      { from: 'react-native', to: 'expo', type: 'prerequisite' }
    ]
  },
  AI: {
    nodes: [
      {
        id: 'python-ml', name: 'Python for ML', type: 'topic', status: 'in-progress', mastery: 45, evidenceScore: 38,
        x: 400, y: 200, domain: 'AI',
        description: 'Python fundamentals for machine learning workflows',
        courses: [{ name: 'Python for Data Science', platform: 'Coursera', completed: false }],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['numpy', 'pandas'],
        nextSkills: ['scikit-learn', 'pytorch'],
        tags: ['python', 'ml']
      }
    ],
    edges: []
  },
  'Data Engineering': {
    nodes: [
      {
        id: 'sql-advanced', name: 'Advanced SQL', type: 'topic', status: 'in-progress', mastery: 50, evidenceScore: 42,
        x: 400, y: 200, domain: 'Data Engineering',
        description: 'Complex queries, optimization, window functions',
        courses: [{ name: 'Advanced SQL for Data Engineers', platform: 'DataCamp', completed: false }],
        projects: [],
        mentorReviews: [],
        communityContributions: [],
        blogPosts: [],
        relatedConcepts: ['postgresql', 'dbt'],
        nextSkills: ['dbt', 'airflow'],
        tags: ['sql', 'analytics']
      }
    ],
    edges: []
  }
};

// ─── Helper functions ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<NodeStatus, string> = {
  mastered: '#22c55e',
  'in-progress': '#eab308',
  weak: '#f97316',
  missing: '#ef4444',
  future: '#94a3b8'
};

const STATUS_BG: Record<NodeStatus, string> = {
  mastered: 'bg-green-500/15 text-green-400 border-green-500/30',
  'in-progress': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  weak: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  missing: 'bg-red-500/15 text-red-400 border-red-500/30',
  future: 'bg-slate-500/15 text-slate-400 border-slate-500/30'
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  mastered: 'Mastered',
  'in-progress': 'In Progress',
  weak: 'Weak',
  missing: 'Missing',
  future: 'Future'
};

const NODE_SIZE: Record<NodeType, number> = {
  topic: 38,
  skill: 28,
  concept: 20,
  task: 14
};

function StatusIcon({ status, size = 14 }: { status: NodeStatus; size?: number }) {
  const props = { size, style: { color: STATUS_COLOR[status] } };
  if (status === 'mastered') return <CheckCircle {...props} />;
  if (status === 'in-progress') return <Clock {...props} />;
  if (status === 'weak') return <AlertTriangle {...props} />;
  if (status === 'missing') return <XCircle {...props} />;
  return <Circle {...props} />;
}

function MasteryBar({ value, status }: { value: number; status: NodeStatus }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: STATUS_COLOR[status] }}
      />
    </div>
  );
}

// ─── Graph SVG ────────────────────────────────────────────────────────────────

function GraphCanvas({
  nodes,
  edges,
  selectedNode,
  hoveredNode,
  zoom,
  pan,
  onNodeClick,
  onNodeHover,
  onPanStart,
  onPanMove,
  onPanEnd,
  onWheel,
  filterStatuses
}: {
  nodes: SkillNode[];
  edges: GraphEdge[];
  selectedNode: SkillNode | null;
  hoveredNode: string | null;
  zoom: number;
  pan: { x: number; y: number };
  onNodeClick: (n: SkillNode) => void;
  onNodeHover: (id: string | null) => void;
  onPanStart: (e: React.MouseEvent) => void;
  onPanMove: (e: React.MouseEvent) => void;
  onPanEnd: () => void;
  onWheel: (e: React.WheelEvent) => void;
  filterStatuses: NodeStatus[];
}) {
  const visibleNodes = nodes.filter(n => filterStatuses.includes(n.status));
  const visibleIds = new Set(visibleNodes.map(n => n.id));

  return (
    <svg
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      onMouseDown={onPanStart}
      onMouseMove={onPanMove}
      onMouseUp={onPanEnd}
      onMouseLeave={onPanEnd}
      onWheel={onWheel}
    >
      <defs>
        <marker id="arrow-dep" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#475569" />
        </marker>
        <marker id="arrow-pre" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
        </marker>
        <marker id="arrow-ev" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#a855f7" />
        </marker>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-yellow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
        </filter>
      </defs>

      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Edges */}
        {edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to)).map((edge, i) => {
          const from = nodes.find(n => n.id === edge.from);
          const to = nodes.find(n => n.id === edge.to);
          if (!from || !to) return null;

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const r1 = NODE_SIZE[from.type];
          const r2 = NODE_SIZE[to.type];
          const x1 = from.x + (dx / dist) * r1;
          const y1 = from.y + (dy / dist) * r1;
          const x2 = to.x - (dx / dist) * (r2 + 8);
          const y2 = to.y - (dy / dist) * (r2 + 8);

          const isHighlighted = selectedNode && (selectedNode.id === edge.from || selectedNode.id === edge.to);

          if (edge.type === 'dependency') {
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isHighlighted ? '#64748b' : '#334155'}
                strokeWidth={isHighlighted ? 2 : 1.5}
                markerEnd="url(#arrow-dep)"
                opacity={isHighlighted ? 1 : 0.5}
              />
            );
          }
          if (edge.type === 'prerequisite') {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2 - 20;
            return (
              <path key={i}
                d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                fill="none"
                stroke={isHighlighted ? '#94a3b8' : '#1e293b'}
                strokeWidth={isHighlighted ? 2 : 1.5}
                strokeDasharray="5,4"
                markerEnd="url(#arrow-pre)"
                opacity={isHighlighted ? 1 : 0.6}
              />
            );
          }
          // evidence
          return (
            <path key={i}
              d={`M${x1},${y1} Q${(from.x + to.x) / 2},${(from.y + to.y) / 2 - 30} ${x2},${y2}`}
              fill="none"
              stroke="#a855f7"
              strokeWidth={isHighlighted ? 2 : 1.5}
              strokeDasharray="2,5"
              markerEnd="url(#arrow-ev)"
              opacity={isHighlighted ? 0.9 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const r = NODE_SIZE[node.type];
          const isSelected = selectedNode?.id === node.id;
          const isHovered = hoveredNode === node.id;
          const color = STATUS_COLOR[node.status];
          const scale = isSelected ? 1.2 : isHovered ? 1.1 : 1;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
              style={{ transition: 'transform 0.15s ease', cursor: 'pointer' }}
              onClick={() => onNodeClick(node)}
              onMouseEnter={() => onNodeHover(node.id)}
              onMouseLeave={() => onNodeHover(null)}
            >
              {/* Outer glow ring for selected */}
              {isSelected && (
                <circle r={r + 8} fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
              )}
              {/* Pulse ring for in-progress */}
              {node.status === 'in-progress' && (
                <circle r={r + 5} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3} strokeDasharray="3,3" />
              )}
              {/* Main circle */}
              <circle
                r={r}
                fill={`${color}22`}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                filter={isSelected ? 'url(#shadow)' : undefined}
              />
              {/* Inner mastery fill */}
              <circle
                r={r * (node.mastery / 100) * 0.7}
                fill={`${color}55`}
              />
              {/* Label */}
              <text
                textAnchor="middle"
                dy={r + 14}
                fontSize={node.type === 'topic' ? 11 : node.type === 'skill' ? 10 : 9}
                fill={isSelected || isHovered ? '#f1f5f9' : '#94a3b8'}
                fontWeight={node.type === 'topic' ? '600' : '400'}
                style={{ transition: 'fill 0.15s' }}
              >
                {node.name}
              </text>
              {/* Type indicator dot */}
              {node.type === 'topic' && (
                <text textAnchor="middle" dy={5} fontSize={12} fill={color} fontWeight="700">
                  {node.name.slice(0, 1)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function NodeTooltip({ node }: { node: SkillNode }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl min-w-48 pointer-events-none">
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon status={node.status} size={13} />
        <span className="text-slate-100 text-xs">{node.name}</span>
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded border ${STATUS_BG[node.status]}`}>
          {STATUS_LABEL[node.status]}
        </span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Mastery</span>
          <span style={{ color: STATUS_COLOR[node.status] }}>{node.mastery}%</span>
        </div>
        <MasteryBar value={node.mastery} status={node.status} />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{node.description}</p>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({ node, onClose }: { node: SkillNode; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'evidence' | 'path'>('overview');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{node.type}</span>
              <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_BG[node.status]}`}>
                {STATUS_LABEL[node.status]}
              </span>
            </div>
            <h3 className="text-slate-100 text-base">{node.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <XCircle size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">{node.description}</p>

        {/* Mastery + Evidence */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 rounded-lg p-2.5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-400">Mastery</span>
              <span className="text-xs" style={{ color: STATUS_COLOR[node.status] }}>{node.mastery}%</span>
            </div>
            <MasteryBar value={node.mastery} status={node.status} />
          </div>
          <div className="bg-slate-800/60 rounded-lg p-2.5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-400">Evidence</span>
              <span className="text-xs text-purple-400">{node.evidenceScore}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10">
              <div className="h-1.5 rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${node.evidenceScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {(['overview', 'evidence', 'path'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs py-2.5 capitalize transition-colors ${
              tab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'overview' && (
          <>
            {/* Courses */}
            {node.courses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={12} className="text-blue-400" />
                  <span className="text-xs text-slate-300">Courses</span>
                </div>
                <div className="space-y-2">
                  {node.courses.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
                      <div className={`w-1.5 h-1.5 rounded-full ${c.completed ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-200 truncate">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.platform}</div>
                      </div>
                      {c.completed && <CheckCircle size={12} className="text-green-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {node.projects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FolderKanban size={12} className="text-purple-400" />
                  <span className="text-xs text-slate-300">Projects</span>
                </div>
                <div className="space-y-2">
                  {node.projects.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-200 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.role}</div>
                      </div>
                      {p.link && <ExternalLink size={10} className="text-slate-500 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentor Reviews */}
            {node.mentorReviews.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={12} className="text-amber-400" />
                  <span className="text-xs text-slate-300">Mentor Reviews</span>
                </div>
                <div className="space-y-2">
                  {node.mentorReviews.map((r, i) => (
                    <div key={i} className="p-2 bg-slate-800/40 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-300">{r.mentor}</span>
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs text-amber-400">{r.score}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">"{r.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community */}
            {node.communityContributions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={12} className="text-green-400" />
                  <span className="text-xs text-slate-300">Community</span>
                </div>
                {node.communityContributions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
                    <span className="text-xs text-slate-500">{c.type}</span>
                    <span className="text-xs text-slate-300 flex-1 truncate">{c.title}</span>
                    <span className="text-xs text-green-400">↑{c.upvotes}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Blog Posts */}
            {node.blogPosts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-300">Blog Posts</span>
                </div>
                {node.blogPosts.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
                    <span className="text-xs text-slate-300 flex-1 truncate">{b.title}</span>
                    <span className="text-xs text-slate-500">{b.views.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {node.courses.length === 0 && node.projects.length === 0 && node.mentorReviews.length === 0 && (
              <div className="text-center py-6">
                <Circle size={28} className="text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No evidence yet</p>
                <p className="text-xs text-slate-600 mt-1">Start learning to build evidence</p>
              </div>
            )}
          </>
        )}

        {tab === 'evidence' && (
          <>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-2">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={12} className="text-purple-400" />
                <span className="text-xs text-purple-300">Verified Evidence Score</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl text-purple-400">{node.evidenceScore}</span>
                <span className="text-xs text-slate-500 mb-1">/100</span>
              </div>
              <MasteryBar value={node.evidenceScore} status="mastered" />
            </div>
            <div className="space-y-2">
              {[
                { label: 'Project Completion', value: node.projects.length > 0 ? 85 : 0, icon: <FolderKanban size={11} className="text-purple-400" /> },
                { label: 'Mentor Validation', value: node.mentorReviews.length > 0 ? node.mentorReviews[0].score * 10 : 0, icon: <Users size={11} className="text-amber-400" /> },
                { label: 'Community Impact', value: node.communityContributions.length > 0 ? 72 : 0, icon: <MessageCircle size={11} className="text-green-400" /> },
                { label: 'Written Content', value: node.blogPosts.length > 0 ? 60 : 0, icon: <FileText size={11} className="text-blue-400" /> }
              ].map((item, i) => (
                <div key={i} className="p-2 bg-slate-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">{item.icon}<span className="text-xs text-slate-400">{item.label}</span></div>
                    <span className="text-xs text-slate-300">{item.value}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/10">
                    <div className="h-1 rounded-full bg-blue-500/60 transition-all duration-500" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'path' && (
          <>
            {/* Related */}
            {node.relatedConcepts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Network size={12} className="text-blue-400" />
                  <span className="text-xs text-slate-300">Related Concepts</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {node.relatedConcepts.map((c, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-slate-800/60 border border-slate-700 rounded text-slate-400">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Next */}
            {node.nextSkills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight size={12} className="text-green-400" />
                  <span className="text-xs text-slate-300">Next Skills</span>
                </div>
                <div className="space-y-1.5">
                  {node.nextSkills.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                      <span className="text-xs text-slate-300">{s}</span>
                      <ArrowRight size={10} className="text-slate-600 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {node.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-300">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {node.tags.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-slate-800 grid grid-cols-3 gap-2">
        <button className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-colors">
          <Play size={12} className="text-blue-400" />
          <span className="text-xs text-blue-400">Learn</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 transition-colors">
          <Target size={12} className="text-purple-400" />
          <span className="text-xs text-purple-400">Practice</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 transition-colors">
          <Users size={12} className="text-amber-400" />
          <span className="text-xs text-amber-400">Mentor</span>
        </button>
      </div>
    </div>
  );
}

// ─── Career Readiness ─────────────────────────────────────────────────────────

function CareerReadinessCard({ domain }: { domain: Domain }) {
  const scores: Record<Domain, { score: number; role: string; gap: number }> = {
    Frontend: { score: 72, role: 'Frontend Developer', gap: 28 },
    Backend: { score: 41, role: 'Backend Developer', gap: 59 },
    Mobile: { score: 18, role: 'Mobile Developer', gap: 82 },
    AI: { score: 24, role: 'ML Engineer', gap: 76 },
    'Data Engineering': { score: 31, role: 'Data Engineer', gap: 69 }
  };
  const { score, role, gap } = scores[domain];

  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase size={14} className="text-blue-400" />
        <span className="text-sm text-slate-300">Career Readiness</span>
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#1e293b" strokeWidth="6" />
            <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={`${(score / 100) * 150.8} 150.8`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm" style={{ color }}>{score}%</span>
          </div>
        </div>
        <div>
          <div className="text-slate-200 text-sm mb-0.5">{role}</div>
          <div className="text-xs text-slate-500">{gap}% skill gap remaining</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Projects', v: score >= 70 ? '5' : '2', icon: <FolderKanban size={12} className="text-purple-400" /> },
          { label: 'Verified', v: score >= 70 ? '87%' : '41%', icon: <Shield size={12} className="text-green-400" /> },
          { label: 'Reviews', v: score >= 70 ? '3' : '1', icon: <Star size={12} className="text-amber-400" /> }
        ].map((item, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-2">
            <div className="flex justify-center mb-1">{item.icon}</div>
            <div className="text-slate-200 text-xs">{item.v}</div>
            <div className="text-slate-500 text-xs">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skill Gap Analysis ───────────────────────────────────────────────────────

function SkillGapCard({ nodes }: { nodes: SkillNode[] }) {
  const missing = nodes.filter(n => n.status === 'missing');
  const weak = nodes.filter(n => n.status === 'weak');

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} className="text-orange-400" />
        <span className="text-sm text-slate-300">Skill Gap Analysis</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
          <div className="text-red-400 text-lg">{missing.length}</div>
          <div className="text-xs text-slate-500">Missing</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
          <div className="text-orange-400 text-lg">{weak.length}</div>
          <div className="text-xs text-slate-500">Weak</div>
        </div>
      </div>
      {[...missing.slice(0, 2), ...weak.slice(0, 2)].map((n, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 border-t border-slate-800/80">
          <StatusIcon status={n.status} size={11} />
          <span className="text-xs text-slate-400 flex-1">{n.name}</span>
          <span className="text-xs text-slate-600">{n.type}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function LearningTimeline() {
  const events = [
    { date: 'Nov 2025', label: 'Completed Auth Flow project', type: 'project', color: 'bg-purple-500' },
    { date: 'Oct 2025', label: 'React Hooks mastery reached 91%', type: 'skill', color: 'bg-green-500' },
    { date: 'Sep 2025', label: 'Mentor session with Sarah Chen', type: 'mentor', color: 'bg-amber-500' },
    { date: 'Aug 2025', label: 'Published React Fiber blog post', type: 'blog', color: 'bg-blue-500' },
    { date: 'Jul 2025', label: 'Started CSS Grid & Flexbox course', type: 'course', color: 'bg-slate-500' }
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-blue-400" />
        <span className="text-sm text-slate-300">Learning Journey</span>
      </div>
      <div className="space-y-3">
        {events.map((e, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full mt-1 ${e.color}`} />
              {i < events.length - 1 && <div className="w-px flex-1 bg-slate-800 mt-1" />}
            </div>
            <div className="pb-2">
              <div className="text-xs text-slate-500 mb-0.5">{e.date}</div>
              <div className="text-xs text-slate-300">{e.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SkillGraphPage() {
  const [domain, setDomain] = useState<Domain>('Frontend');
  const [filterStatuses, setFilterStatuses] = useState<NodeStatus[]>(['mastered', 'in-progress', 'weak', 'missing', 'future']);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);

  const data = GRAPH_DATA[domain];

  const toggleStatus = useCallback((s: NodeStatus) => {
    setFilterStatuses(prev =>
      prev.includes(s) ? (prev.length > 1 ? prev.filter(x => x !== s) : prev) : [...prev, s]
    );
  }, []);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === 'circle' || (e.target as SVGElement).tagName === 'text') return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handlePanEnd = useCallback(() => setIsPanning(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
  }, []);

  // Stats for top of center
  const masteredCount = data.nodes.filter(n => n.status === 'mastered').length;
  const totalCount = data.nodes.length;
  const avgMastery = Math.round(data.nodes.reduce((s, n) => s + n.mastery, 0) / totalCount);

  const topStrengths = [...data.nodes].filter(n => n.status === 'mastered').sort((a, b) => b.mastery - a.mastery).slice(0, 3);
  const focusAreas = [...data.nodes].filter(n => n.status === 'weak' || n.status === 'in-progress').sort((a, b) => a.mastery - b.mastery).slice(0, 3);

  const DOMAINS: Domain[] = ['Frontend', 'Backend', 'Mobile', 'AI', 'Data Engineering'];
  const ALL_STATUSES: { s: NodeStatus; label: string }[] = [
    { s: 'mastered', label: 'Mastered' },
    { s: 'in-progress', label: 'In Progress' },
    { s: 'weak', label: 'Weak' },
    { s: 'missing', label: 'Missing' },
    { s: 'future', label: 'Future' }
  ];
  const VIEW_MODES: { v: ViewMode; icon: React.ReactNode; label: string }[] = [
    { v: 'graph', icon: <Network size={13} />, label: 'Graph' },
    { v: 'roadmap', icon: <Map size={13} />, label: 'Roadmap' },
    { v: 'evidence', icon: <Shield size={13} />, label: 'Evidence' },
    { v: 'skill-gap', icon: <BarChart3 size={13} />, label: 'Skill Gap' }
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* MARKER-MAKE-KIT-INVOKED */}
      {/* MARKER-MAKE-KIT-DISCOVERY-READ */}

      {/* Top Bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Network size={14} className="text-white" />
          </div>
          <span className="text-slate-200 text-sm">Skill Graph</span>
        </div>

        {/* Domain tabs */}
        <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-1">
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => { setDomain(d); setSelectedNode(null); }}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                domain === d ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Recruiter Mode */}
          <button
            onClick={() => setRecruiterMode(r => !r)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              recruiterMode
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Eye size={12} />
            <span>Recruiter Mode</span>
          </button>

          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5">
            <Search size={12} className="text-slate-500" />
            <input
              className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-28"
              placeholder="Search skills…"
            />
          </div>
        </div>
      </div>

      {/* Main 3-col layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-52 shrink-0 border-r border-slate-800 bg-slate-900/40 flex flex-col overflow-y-auto">
          <div className="p-3 space-y-4">

            {/* View Modes */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">View</div>
              <div className="space-y-1">
                {VIEW_MODES.map(({ v, icon, label }) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                      viewMode === v
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Filter</div>
              <div className="space-y-1">
                {ALL_STATUSES.map(({ s, label }) => (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      filterStatuses.includes(s)
                        ? 'bg-slate-800/60 text-slate-300'
                        : 'text-slate-600 hover:text-slate-500'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full transition-all ${filterStatuses.includes(s) ? 'opacity-100' : 'opacity-30'}`}
                      style={{ backgroundColor: STATUS_COLOR[s] }}
                    />
                    {label}
                    <span className="ml-auto text-slate-600">
                      {data.nodes.filter(n => n.status === s).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats mini */}
            <div className="bg-slate-800/40 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mastered</span>
                <span className="text-green-400">{masteredCount}/{totalCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Avg Mastery</span>
                <span className="text-blue-400">{avgMastery}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-700/60">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${avgMastery}%` }} />
              </div>
            </div>

            {/* AI Insight */}
            <div className="bg-gradient-to-b from-blue-950/60 to-purple-950/40 border border-blue-500/20 rounded-xl p-3">
              <button
                onClick={() => setAiExpanded(v => !v)}
                className="w-full flex items-center gap-2 mb-2"
              >
                <Sparkles size={12} className="text-blue-400" />
                <span className="text-xs text-blue-300">AI Insight</span>
                {aiExpanded ? <ChevronUp size={12} className="ml-auto text-slate-500" /> : <ChevronDown size={12} className="ml-auto text-slate-500" />}
              </button>
              {aiExpanded && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You're 72% ready for a <strong className="text-blue-300">Frontend Developer</strong> role. Focus on <strong className="text-orange-300">TypeScript</strong> and <strong className="text-orange-300">Testing</strong> to unlock the next tier.
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <Lightbulb size={10} className="text-yellow-400 mt-0.5 shrink-0" />
                      <span>Complete "Testing React Apps" course</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <Target size={10} className="text-green-400 mt-0.5 shrink-0" />
                      <span>Build a Next.js project for portfolio</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <Users size={10} className="text-purple-400 mt-0.5 shrink-0" />
                      <span>Book TypeScript mentor session</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CENTER ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Graph Area */}
          <div className="flex-1 relative overflow-hidden bg-slate-950">
            {/* Dot grid background */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.08) 1px, transparent 1px)',
                backgroundSize: '28px 28px'
              }}
            />

            {viewMode === 'graph' && (
              <GraphCanvas
                nodes={data.nodes}
                edges={data.edges}
                selectedNode={selectedNode}
                hoveredNode={hoveredNode}
                zoom={zoom}
                pan={pan}
                onNodeClick={setSelectedNode}
                onNodeHover={setHoveredNode}
                onPanStart={handlePanStart}
                onPanMove={handlePanMove}
                onPanEnd={handlePanEnd}
                onWheel={handleWheel}
                filterStatuses={filterStatuses}
              />
            )}

            {viewMode === 'roadmap' && (
              <div className="p-8 overflow-y-auto h-full">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-slate-300 text-base mb-6">Learning Roadmap — {domain}</h2>
                  <div className="space-y-3">
                    {data.nodes.map((node, i) => (
                      <div key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="flex items-center gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                          style={{ borderColor: STATUS_COLOR[node.status], backgroundColor: `${STATUS_COLOR[node.status]}15` }}>
                          <StatusIcon status={node.status} size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-200 text-sm">{node.name}</span>
                            <span className="text-xs text-slate-600">{node.type}</span>
                          </div>
                          <MasteryBar value={node.mastery} status={node.status} />
                        </div>
                        <span className="text-xs" style={{ color: STATUS_COLOR[node.status] }}>{node.mastery}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'evidence' && (
              <div className="p-8 overflow-y-auto h-full">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-slate-300 text-base mb-6">Evidence Summary — {domain}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {data.nodes.filter(n => n.evidenceScore > 0).map(node => (
                      <div key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:border-purple-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Shield size={12} className="text-purple-400" />
                          <span className="text-slate-200 text-sm flex-1 truncate">{node.name}</span>
                          <span className="text-purple-400 text-xs">{node.evidenceScore}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10">
                          <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${node.evidenceScore}%` }} />
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-slate-600">
                          {node.projects.length > 0 && <span>{node.projects.length} projects</span>}
                          {node.mentorReviews.length > 0 && <span>{node.mentorReviews.length} reviews</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'skill-gap' && (
              <div className="p-8 overflow-y-auto h-full">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-slate-300 text-base mb-6">Skill Gap Analysis — {domain}</h2>
                  <div className="space-y-2">
                    {[...data.nodes].sort((a, b) => a.mastery - b.mastery).map(node => (
                      <div key={node.id} className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                        <StatusIcon status={node.status} size={13} />
                        <span className="text-slate-300 text-sm w-36 truncate">{node.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-800">
                          <div className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${node.mastery}%`, backgroundColor: STATUS_COLOR[node.status] }} />
                        </div>
                        <span className="text-xs w-10 text-right" style={{ color: STATUS_COLOR[node.status] }}>{node.mastery}%</span>
                        <span className="text-xs text-slate-600 w-16 text-right">gap: {100 - node.mastery}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Hover tooltip */}
            {hoveredNode && viewMode === 'graph' && (() => {
              const node = data.nodes.find(n => n.id === hoveredNode);
              if (!node) return null;
              return (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <NodeTooltip node={node} />
                </div>
              );
            })()}

            {/* Zoom Controls */}
            {viewMode === 'graph' && (
              <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10">
                <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
                  <ZoomIn size={14} />
                </button>
                <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
                  <ZoomOut size={14} />
                </button>
                <button onClick={() => { setZoom(1); setPan({ x: 60, y: 40 }); }}
                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
                  <RotateCcw size={14} />
                </button>
                <button className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
                  <Maximize2 size={14} />
                </button>
              </div>
            )}

            {/* Graph Legend */}
            {viewMode === 'graph' && (
              <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 z-10 text-xs space-y-2">
                <div className="text-slate-500 uppercase tracking-wider text-xs mb-2">Legend</div>
                <div className="space-y-1">
                  {ALL_STATUSES.map(({ s, label }) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
                      <span className="text-slate-500">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-800 pt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 border-t border-slate-500" />
                    <span className="text-slate-500">Dependency</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 border-t border-dashed border-slate-500" />
                    <span className="text-slate-500">Prerequisite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 border-t border-dotted border-purple-400" />
                    <span className="text-slate-500">Evidence</span>
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-2 space-y-1">
                  {(['topic', 'skill', 'concept', 'task'] as NodeType[]).map(t => (
                    <div key={t} className="flex items-center gap-2">
                      <div className="rounded-full bg-slate-700 border border-slate-600"
                        style={{ width: NODE_SIZE[t] / 2, height: NODE_SIZE[t] / 2 }} />
                      <span className="text-slate-500 capitalize">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── BOTTOM PANELS ── */}
          <div className="shrink-0 border-t border-slate-800 bg-slate-900/60">
            <div className="grid grid-cols-3 divide-x divide-slate-800">
              {/* Timeline */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch size={13} className="text-blue-400" />
                  <span className="text-xs text-slate-300">Learning Journey</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {[
                    { label: 'Auth Flow Project', sub: 'Nov 2025', color: 'bg-purple-500' },
                    { label: 'Hooks Mastered', sub: 'Oct 2025', color: 'bg-green-500' },
                    { label: 'Mentor Session', sub: 'Sep 2025', color: 'bg-amber-500' },
                    { label: 'Blog Published', sub: 'Aug 2025', color: 'bg-blue-500' }
                  ].map((e, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 min-w-max">
                      <div className={`w-2 h-2 rounded-full ${e.color}`} />
                      <div className="text-xs text-slate-400 text-center">{e.label}</div>
                      <div className="text-xs text-slate-600">{e.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Strengths */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={13} className="text-green-400" />
                  <span className="text-xs text-slate-300">Top Strengths</span>
                </div>
                <div className="space-y-1.5">
                  {topStrengths.map((n, i) => (
                    <div key={n.id} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 w-4">{i + 1}.</span>
                      <span className="text-xs text-slate-300 flex-1">{n.name}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1 rounded-full bg-slate-800">
                          <div className="h-1 rounded-full bg-green-500" style={{ width: `${n.mastery}%` }} />
                        </div>
                        <span className="text-xs text-green-400">{n.mastery}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus Areas */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={13} className="text-orange-400" />
                  <span className="text-xs text-slate-300">Focus Areas</span>
                </div>
                <div className="space-y-1.5">
                  {focusAreas.map((n, i) => (
                    <div key={n.id} className="flex items-center gap-2">
                      <StatusIcon status={n.status} size={11} />
                      <span className="text-xs text-slate-300 flex-1">{n.name}</span>
                      <span className="text-xs" style={{ color: STATUS_COLOR[n.status] }}>{n.mastery}%</span>
                    </div>
                  ))}
                  {focusAreas.length === 0 && (
                    <p className="text-xs text-slate-600">All skills mastered!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={`shrink-0 border-l border-slate-800 bg-slate-900/40 transition-all duration-300 ${
          selectedNode ? 'w-72' : 'w-64'
        } flex flex-col overflow-hidden`}>

          {selectedNode ? (
            <RightPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          ) : (
            <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3">
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-2">
                  <Layers size={16} className="text-slate-500" />
                </div>
                <p className="text-xs text-slate-500">Click any node to explore skill details</p>
              </div>

              <CareerReadinessCard domain={domain} />
              <SkillGapCard nodes={data.nodes} />
              <LearningTimeline />

              {/* Missing Skill Recs */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plus size={13} className="text-red-400" />
                  <span className="text-sm text-slate-300">Missing Skills</span>
                </div>
                <div className="space-y-2">
                  {data.nodes.filter(n => n.status === 'missing').slice(0, 3).map((n, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/15 rounded-lg">
                      <XCircle size={11} className="text-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300 truncate">{n.name}</div>
                        <div className="text-xs text-slate-600">{n.type}</div>
                      </div>
                      <button className="text-xs text-blue-400 hover:text-blue-300 shrink-0">Start</button>
                    </div>
                  ))}
                  {data.nodes.filter(n => n.status === 'missing').length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-2">No missing skills for this domain</p>
                  )}
                </div>
              </div>

              {/* Recruiter mode badge */}
              {recruiterMode && (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye size={13} className="text-blue-400" />
                    <span className="text-sm text-blue-300">Recruiter View</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Verified Skills</span>
                      <span className="text-blue-300">{data.nodes.filter(n => n.evidenceScore > 50).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Strongest Area</span>
                      <span className="text-green-300">{topStrengths[0]?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Portfolio Projects</span>
                      <span className="text-purple-300">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mentor Endorsed</span>
                      <span className="text-amber-300">3 skills</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
