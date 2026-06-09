import { useState } from 'react';
import { CheckCircle, Circle, AlertCircle, X, ExternalLink, Award, TrendingUp, Target, Lightbulb, ZoomIn, ZoomOut } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  type: 'topic' | 'skill' | 'concept' | 'task';
  status: 'mastered' | 'in-progress' | 'not-started';
  level: number;
  x: number;
  y: number;
  description?: string;
  evidence?: string[];
  relatedProjects?: Array<{ name: string; url: string }>;
  relatedCourses?: string[];
  mentorReviews?: Array<{ mentor: string; feedback: string; score: number }>;
  quizzesPassed?: number;
  totalQuizzes?: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'direct' | 'prerequisite';
}

interface SkillGraphVisualizationProps {
  onInsightClick?: () => void;
}

export function SkillGraphVisualization({ onInsightClick }: SkillGraphVisualizationProps) {
  const [selectedDomain, setSelectedDomain] = useState<'frontend' | 'backend'>('frontend');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);

  const graphData: Record<string, { nodes: GraphNode[]; edges: GraphEdge[] }> = {
    frontend: {
      nodes: [
        {
          id: 'react',
          name: 'React',
          type: 'topic',
          status: 'mastered',
          level: 85,
          x: 100,
          y: 200,
          description: 'A JavaScript library for building user interfaces',
          evidence: ['5 projects completed', '3 certifications earned', '120+ hours practice'],
          relatedProjects: [
            { name: 'E-commerce Platform', url: '#' },
            { name: 'Task Management System', url: '#' },
            { name: 'Weather Dashboard', url: '#' }
          ],
          relatedCourses: ['Advanced React Patterns', 'React Fundamentals'],
          mentorReviews: [
            { mentor: 'Sarah Chen', feedback: 'Excellent understanding of React concepts', score: 95 }
          ],
          quizzesPassed: 12,
          totalQuizzes: 12
        },
        {
          id: 'jsx',
          name: 'JSX & Components',
          type: 'skill',
          status: 'mastered',
          level: 90,
          x: 300,
          y: 100,
          description: 'Writing declarative UI with JSX syntax and reusable components',
          evidence: ['Built 15+ reusable components', 'Component composition mastery'],
          relatedProjects: [
            { name: 'E-commerce Platform', url: '#' },
            { name: 'Portfolio Builder', url: '#' }
          ],
          quizzesPassed: 5,
          totalQuizzes: 5
        },
        {
          id: 'hooks',
          name: 'React Hooks',
          type: 'skill',
          status: 'mastered',
          level: 85,
          x: 300,
          y: 300,
          description: 'State and lifecycle management with hooks',
          evidence: ['useState, useEffect, useContext', 'Custom hooks created: 8'],
          relatedProjects: [
            { name: 'Task Management System', url: '#' },
            { name: 'Chat Application', url: '#' }
          ],
          quizzesPassed: 8,
          totalQuizzes: 8
        },
        {
          id: 'state-mgmt',
          name: 'State Management',
          type: 'concept',
          status: 'in-progress',
          level: 70,
          x: 500,
          y: 150,
          description: 'Managing application state across components',
          evidence: ['Redux implemented in 2 projects', 'Context API in 4 projects'],
          relatedProjects: [
            { name: 'E-commerce Platform', url: '#' }
          ],
          quizzesPassed: 4,
          totalQuizzes: 6
        },
        {
          id: 'context-api',
          name: 'Context API',
          type: 'task',
          status: 'mastered',
          level: 80,
          x: 700,
          y: 100,
          description: 'Global state management without external libraries',
          evidence: ['Implemented in 4 projects'],
          relatedProjects: [
            { name: 'Weather Dashboard', url: '#' }
          ],
          quizzesPassed: 3,
          totalQuizzes: 3
        },
        {
          id: 'redux',
          name: 'Redux',
          type: 'task',
          status: 'in-progress',
          level: 65,
          x: 700,
          y: 200,
          description: 'Predictable state container for JavaScript apps',
          evidence: ['Used in 2 projects', 'Actions, reducers, middleware'],
          relatedProjects: [
            { name: 'E-commerce Platform', url: '#' }
          ],
          quizzesPassed: 2,
          totalQuizzes: 4
        },
        {
          id: 'performance',
          name: 'Performance',
          type: 'concept',
          status: 'in-progress',
          level: 60,
          x: 500,
          y: 350,
          description: 'Optimizing React application performance',
          evidence: ['Memoization', 'Code splitting', 'Lazy loading'],
          relatedCourses: ['Advanced React Patterns'],
          quizzesPassed: 3,
          totalQuizzes: 5
        },
        {
          id: 'memo',
          name: 'Memoization',
          type: 'task',
          status: 'mastered',
          level: 75,
          x: 700,
          y: 300,
          description: 'useMemo and React.memo for performance',
          evidence: ['Applied in 3 projects'],
          quizzesPassed: 2,
          totalQuizzes: 2
        },
        {
          id: 'code-split',
          name: 'Code Splitting',
          type: 'task',
          status: 'in-progress',
          level: 55,
          x: 700,
          y: 400,
          description: 'Dynamic imports and lazy loading',
          evidence: ['Implemented in 1 project'],
          quizzesPassed: 1,
          totalQuizzes: 3
        }
      ],
      edges: [
        { from: 'react', to: 'jsx', type: 'direct' },
        { from: 'react', to: 'hooks', type: 'direct' },
        { from: 'jsx', to: 'state-mgmt', type: 'direct' },
        { from: 'hooks', to: 'state-mgmt', type: 'prerequisite' },
        { from: 'state-mgmt', to: 'context-api', type: 'direct' },
        { from: 'state-mgmt', to: 'redux', type: 'direct' },
        { from: 'hooks', to: 'performance', type: 'direct' },
        { from: 'performance', to: 'memo', type: 'direct' },
        { from: 'performance', to: 'code-split', type: 'direct' }
      ]
    },
    backend: {
      nodes: [
        {
          id: 'nodejs',
          name: 'Node.js',
          type: 'topic',
          status: 'in-progress',
          level: 70,
          x: 100,
          y: 200,
          description: 'JavaScript runtime for server-side development',
          evidence: ['4 projects completed', '1 certification', '80+ hours practice'],
          relatedProjects: [
            { name: 'RESTful API', url: '#' },
            { name: 'Chat Application', url: '#' }
          ],
          relatedCourses: ['Node.js & Express Mastery'],
          quizzesPassed: 8,
          totalQuizzes: 10
        },
        {
          id: 'express',
          name: 'Express.js',
          type: 'skill',
          status: 'in-progress',
          level: 75,
          x: 300,
          y: 150,
          description: 'Web application framework for Node.js',
          evidence: ['Built 4 REST APIs', 'Middleware expertise'],
          relatedProjects: [
            { name: 'RESTful API', url: '#' }
          ],
          quizzesPassed: 6,
          totalQuizzes: 8
        },
        {
          id: 'auth',
          name: 'Authentication',
          type: 'concept',
          status: 'mastered',
          level: 85,
          x: 500,
          y: 150,
          description: 'User authentication and authorization',
          evidence: ['JWT & OAuth implementation', 'Secure token management'],
          relatedProjects: [
            { name: 'E-commerce Platform', url: '#' },
            { name: 'RESTful API', url: '#' }
          ],
          quizzesPassed: 7,
          totalQuizzes: 7
        },
        {
          id: 'jwt',
          name: 'JWT',
          type: 'task',
          status: 'mastered',
          level: 90,
          x: 700,
          y: 100,
          description: 'JSON Web Token authentication',
          evidence: ['Implemented in 3 projects'],
          quizzesPassed: 4,
          totalQuizzes: 4
        },
        {
          id: 'database',
          name: 'Database Design',
          type: 'concept',
          status: 'in-progress',
          level: 65,
          x: 500,
          y: 300,
          description: 'Relational and NoSQL database design',
          evidence: ['PostgreSQL & MongoDB experience'],
          relatedProjects: [
            { name: 'Blog Platform', url: '#' }
          ],
          quizzesPassed: 4,
          totalQuizzes: 8
        },
        {
          id: 'sql',
          name: 'SQL',
          type: 'task',
          status: 'in-progress',
          level: 70,
          x: 700,
          y: 250,
          description: 'Structured Query Language',
          evidence: ['Complex queries', 'Schema design'],
          quizzesPassed: 3,
          totalQuizzes: 5
        },
        {
          id: 'nosql',
          name: 'NoSQL',
          type: 'task',
          status: 'in-progress',
          level: 60,
          x: 700,
          y: 350,
          description: 'Document-based databases',
          evidence: ['MongoDB usage'],
          quizzesPassed: 2,
          totalQuizzes: 4
        }
      ],
      edges: [
        { from: 'nodejs', to: 'express', type: 'direct' },
        { from: 'express', to: 'auth', type: 'direct' },
        { from: 'auth', to: 'jwt', type: 'direct' },
        { from: 'nodejs', to: 'database', type: 'direct' },
        { from: 'database', to: 'sql', type: 'direct' },
        { from: 'database', to: 'nosql', type: 'direct' }
      ]
    }
  };

  const currentGraph = graphData[selectedDomain];

  const getNodeColor = (status: GraphNode['status']) => {
    switch (status) {
      case 'mastered':
        return '#22c55e';
      case 'in-progress':
        return '#eab308';
      case 'not-started':
        return '#9ca3af';
    }
  };

  const getNodeSize = (level: number) => {
    return 20 + (level / 100) * 20;
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    const path = findLearningPath(node.id);
    setHighlightedPath(path);
  };

  const findLearningPath = (nodeId: string): string[] => {
    const path: string[] = [nodeId];
    let currentId = nodeId;

    while (true) {
      const parentEdge = currentGraph.edges.find(e => e.to === currentId);
      if (!parentEdge) break;
      path.unshift(parentEdge.from);
      currentId = parentEdge.from;
    }

    const addChildren = (id: string) => {
      const childEdges = currentGraph.edges.filter(e => e.from === id);
      childEdges.forEach(edge => {
        if (!path.includes(edge.to)) {
          path.push(edge.to);
          addChildren(edge.to);
        }
      });
    };

    addChildren(nodeId);
    return path;
  };

  const isNodeHighlighted = (nodeId: string) => {
    return highlightedPath.length === 0 || highlightedPath.includes(nodeId);
  };

  const isEdgeHighlighted = (edge: GraphEdge) => {
    return highlightedPath.length === 0 ||
           (highlightedPath.includes(edge.from) && highlightedPath.includes(edge.to));
  };

  const insights = {
    topStrengths: ['JSX & Components (90%)', 'JWT Authentication (90%)', 'React Hooks (85%)'],
    biggestGaps: ['Code Splitting (55%)', 'NoSQL Databases (60%)', 'Performance Optimization (60%)'],
    progressPercent: 73,
    evidenceSummary: {
      projects: 12,
      certifications: 5,
      mentorReviews: 8
    },
    aiInsight: 'Strong foundation in React fundamentals and component design. Recommended focus: Advanced state management patterns and performance optimization techniques.'
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Skill Graph Visualization</h2>
        <p className="text-sm text-muted-foreground">Interactive map showing how skills are built and proven</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-sm mb-3">Domain Filter</h3>
            <div className="space-y-2">
              {['frontend', 'backend'].map((domain) => (
                <button
                  key={domain}
                  onClick={() => {
                    setSelectedDomain(domain as 'frontend' | 'backend');
                    setSelectedNode(null);
                    setHighlightedPath([]);
                  }}
                  className={`w-full px-3 py-2 rounded text-sm capitalize transition-colors ${
                    selectedDomain === domain
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-background/80'
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-sm mb-3">Legend</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium mb-2">Node Status</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>Mastered</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <span>Not Started</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-2">Node Type</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-4 border-blue-500"></div>
                    <span>Topic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-3 border-purple-500"></div>
                    <span>Skill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-cyan-500"></div>
                    <span>Concept</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-orange-500"></div>
                    <span>Task</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-2">Edge Type</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-gray-400"></div>
                    <span>Direct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-400"></div>
                    <span>Prerequisite</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium">AI Insight</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{insights.aiInsight}</p>
            <button
              onClick={onInsightClick}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View Recommendations
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="col-span-6">
          <div className="bg-muted rounded-lg p-4 h-[600px] relative overflow-hidden">
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <button
                onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
                className="p-2 bg-background rounded hover:bg-background/80"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
                className="p-2 bg-background rounded hover:bg-background/80"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            <svg
              width="100%"
              height="100%"
              viewBox="0 0 900 550"
              className="cursor-move"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
                </marker>
                <marker
                  id="arrowhead-highlight"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>

              {currentGraph.edges.map((edge, index) => {
                const fromNode = currentGraph.nodes.find(n => n.id === edge.from);
                const toNode = currentGraph.nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                const highlighted = isEdgeHighlighted(edge);

                return (
                  <line
                    key={index}
                    x1={fromNode.x + getNodeSize(fromNode.level) / 2}
                    y1={fromNode.y}
                    x2={toNode.x - getNodeSize(toNode.level) / 2}
                    y2={toNode.y}
                    stroke={highlighted ? '#3b82f6' : '#d1d5db'}
                    strokeWidth={highlighted ? 2 : 1}
                    strokeDasharray={edge.type === 'prerequisite' ? '5,5' : 'none'}
                    markerEnd={highlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                    opacity={highlighted ? 1 : 0.3}
                  />
                );
              })}

              {currentGraph.nodes.map((node) => {
                const size = getNodeSize(node.level);
                const color = getNodeColor(node.status);
                const highlighted = isNodeHighlighted(node.id);
                const borderWidth = node.type === 'topic' ? 4 : node.type === 'skill' ? 3 : node.type === 'concept' ? 2 : 1;

                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size}
                      fill="white"
                      stroke={color}
                      strokeWidth={borderWidth}
                      strokeDasharray={node.status === 'in-progress' ? '4,2' : 'none'}
                      opacity={highlighted ? 1 : 0.3}
                      className="cursor-pointer transition-all hover:stroke-primary"
                      onClick={() => handleNodeClick(node)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    <text
                      x={node.x}
                      y={node.y + size + 15}
                      textAnchor="middle"
                      fontSize="11"
                      fill={highlighted ? '#000' : '#999'}
                      className="pointer-events-none select-none"
                    >
                      {node.name}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + size + 28}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#6b7280"
                      className="pointer-events-none select-none"
                    >
                      {node.level}%
                    </text>

                    {hoveredNode === node.id && (
                      <g>
                        <rect
                          x={node.x + size + 10}
                          y={node.y - 40}
                          width="180"
                          height="80"
                          fill="rgba(0,0,0,0.9)"
                          rx="4"
                        />
                        <text x={node.x + size + 20} y={node.y - 25} fill="white" fontSize="11" fontWeight="bold">
                          {node.name}
                        </text>
                        <text x={node.x + size + 20} y={node.y - 10} fill="#d1d5db" fontSize="9">
                          Mastery: {node.level}%
                        </text>
                        <text x={node.x + size + 20} y={node.y + 5} fill="#d1d5db" fontSize="9">
                          Projects: {node.relatedProjects?.length || 0}
                        </text>
                        <text x={node.x + size + 20} y={node.y + 20} fill="#d1d5db" fontSize="9">
                          Quizzes: {node.quizzesPassed}/{node.totalQuizzes}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium">Top Strengths</span>
              </div>
              <div className="space-y-1">
                {insights.topStrengths.map((strength, i) => (
                  <div key={i} className="text-xs text-muted-foreground">{strength}</div>
                ))}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-medium">Focus Areas</span>
              </div>
              <div className="space-y-1">
                {insights.biggestGaps.map((gap, i) => (
                  <div key={i} className="text-xs text-muted-foreground">{gap}</div>
                ))}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium">Evidence</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>{insights.evidenceSummary.projects} Projects</div>
                <div>{insights.evidenceSummary.certifications} Certifications</div>
                <div>{insights.evidenceSummary.mentorReviews} Reviews</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3">
          {selectedNode ? (
            <div className="bg-muted rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-1">{selectedNode.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedNode.status === 'mastered' ? 'bg-green-100 text-green-700' :
                    selectedNode.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedNode.status.replace('-', ' ')}
                  </span>
                </div>
                <button onClick={() => {
                  setSelectedNode(null);
                  setHighlightedPath([]);
                }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="text-xs font-medium mb-2">Mastery Level</div>
                <div className="mb-1">
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                      style={{ width: `${selectedNode.level}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{selectedNode.level}%</div>
              </div>

              {selectedNode.description && (
                <div>
                  <div className="text-xs font-medium mb-1">Description</div>
                  <p className="text-xs text-muted-foreground">{selectedNode.description}</p>
                </div>
              )}

              {selectedNode.evidence && selectedNode.evidence.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2">Evidence</div>
                  <div className="space-y-1">
                    {selectedNode.evidence.map((item, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.relatedProjects && selectedNode.relatedProjects.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2">Related Projects</div>
                  <div className="space-y-2">
                    {selectedNode.relatedProjects.map((project, i) => (
                      <a
                        key={i}
                        href={project.url}
                        className="flex items-center justify-between text-xs bg-background rounded p-2 hover:bg-background/80"
                      >
                        <span>{project.name}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.quizzesPassed !== undefined && (
                <div>
                  <div className="text-xs font-medium mb-2">Assessments</div>
                  <div className="bg-background rounded p-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Quizzes Passed</span>
                      <span className="font-medium">{selectedNode.quizzesPassed}/{selectedNode.totalQuizzes}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${(selectedNode.quizzesPassed / (selectedNode.totalQuizzes || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.mentorReviews && selectedNode.mentorReviews.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2">Mentor Feedback</div>
                  <div className="space-y-2">
                    {selectedNode.mentorReviews.map((review, i) => (
                      <div key={i} className="bg-background rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{review.mentor}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{review.score}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic">"{review.feedback}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.relatedCourses && selectedNode.relatedCourses.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2">Related Courses</div>
                  <div className="space-y-1">
                    {selectedNode.relatedCourses.map((course, i) => (
                      <div key={i} className="text-xs bg-background rounded p-2">
                        {course}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4 h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Circle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click a node to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
