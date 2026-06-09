import { useState } from 'react';
import { CheckCircle, Circle, AlertCircle, ChevronRight } from 'lucide-react';

interface SkillNode {
  id: string;
  name: string;
  type: 'topic' | 'skill' | 'concept' | 'task';
  status: 'mastered' | 'in-progress' | 'not-started';
  level?: number;
  evidence?: string[];
  relatedProjects?: string[];
  relatedCourses?: string[];
}

interface SkillGraphProps {
  onNodeClick: (node: SkillNode) => void;
}

export function SkillGraph({ onNodeClick }: SkillGraphProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('frontend');

  const skillData: Record<string, SkillNode[]> = {
    frontend: [
      {
        id: 'react',
        name: 'React',
        type: 'topic',
        status: 'mastered',
        level: 85,
        evidence: ['5 projects', '3 certifications'],
        relatedProjects: ['E-commerce Platform', 'Task Management'],
        relatedCourses: ['Advanced React Patterns']
      },
      {
        id: 'jsx',
        name: 'JSX & Components',
        type: 'skill',
        status: 'mastered',
        level: 90,
        evidence: ['12 components built'],
        relatedProjects: ['E-commerce Platform']
      },
      {
        id: 'hooks',
        name: 'React Hooks',
        type: 'skill',
        status: 'mastered',
        level: 85,
        evidence: ['useState, useEffect, custom hooks'],
        relatedProjects: ['Task Management', 'Weather App']
      },
      {
        id: 'state-mgmt',
        name: 'State Management',
        type: 'concept',
        status: 'in-progress',
        level: 70,
        evidence: ['Redux used in 2 projects'],
        relatedProjects: ['E-commerce Platform']
      },
      {
        id: 'context-api',
        name: 'Context API',
        type: 'task',
        status: 'mastered',
        level: 80,
        evidence: ['Implemented in 3 projects']
      },
      {
        id: 'redux',
        name: 'Redux',
        type: 'task',
        status: 'in-progress',
        level: 65,
        evidence: ['Used in 1 project']
      },
      {
        id: 'performance',
        name: 'Performance Optimization',
        type: 'concept',
        status: 'in-progress',
        level: 60,
        evidence: ['Memoization, code splitting'],
        relatedCourses: ['Advanced React Patterns']
      }
    ],
    backend: [
      {
        id: 'nodejs',
        name: 'Node.js',
        type: 'topic',
        status: 'in-progress',
        level: 70,
        evidence: ['4 projects', '1 certification'],
        relatedProjects: ['RESTful API', 'Chat App']
      },
      {
        id: 'express',
        name: 'Express.js',
        type: 'skill',
        status: 'in-progress',
        level: 75,
        evidence: ['Built 3 APIs'],
        relatedProjects: ['RESTful API']
      },
      {
        id: 'auth',
        name: 'Authentication',
        type: 'concept',
        status: 'mastered',
        level: 85,
        evidence: ['JWT, OAuth'],
        relatedProjects: ['E-commerce Platform', 'RESTful API']
      },
      {
        id: 'jwt',
        name: 'JWT',
        type: 'task',
        status: 'mastered',
        level: 90,
        evidence: ['Implemented in 2 projects']
      },
      {
        id: 'database',
        name: 'Database Design',
        type: 'concept',
        status: 'in-progress',
        level: 65,
        evidence: ['SQL & NoSQL'],
        relatedProjects: ['Blog Platform']
      }
    ]
  };

  const topics = Object.keys(skillData);
  const currentNodes = skillData[selectedTopic] || [];

  const getStatusIcon = (status: SkillNode['status']) => {
    switch (status) {
      case 'mastered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'not-started':
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SkillNode['status']) => {
    switch (status) {
      case 'mastered':
        return 'border-green-500 bg-green-50';
      case 'in-progress':
        return 'border-yellow-500 bg-yellow-50';
      case 'not-started':
        return 'border-gray-300 bg-gray-50';
    }
  };

  const nodesByType = {
    topic: currentNodes.filter(n => n.type === 'topic'),
    skill: currentNodes.filter(n => n.type === 'skill'),
    concept: currentNodes.filter(n => n.type === 'concept'),
    task: currentNodes.filter(n => n.type === 'task')
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Skill Graph</h2>
        <p className="text-sm text-muted-foreground">Visualize how your skills are built and proven through learning</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`px-4 py-2 rounded-lg text-sm capitalize whitespace-nowrap transition-colors ${
              selectedTopic === topic
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="grid grid-cols-4 gap-6 mb-4">
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-3 uppercase">Topic</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-3 uppercase">Skills</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-3 uppercase">Concepts</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-3 uppercase">Tasks</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 relative">
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#cbd5e1" />
              </marker>
            </defs>
          </svg>

          <div className="space-y-3">
            {nodesByType.topic.map((node) => (
              <button
                key={node.id}
                onClick={() => onNodeClick(node)}
                className={`w-full p-3 rounded-lg border-2 ${getStatusColor(node.status)} hover:shadow-md transition-all text-left`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium">{node.name}</span>
                  {getStatusIcon(node.status)}
                </div>
                {node.level && (
                  <div className="mb-1">
                    <div className="w-full bg-white rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${node.level}%` }}
                      />
                    </div>
                  </div>
                )}
                {node.evidence && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {node.evidence.join(', ')}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {nodesByType.skill.map((node) => (
              <button
                key={node.id}
                onClick={() => onNodeClick(node)}
                className={`w-full p-3 rounded-lg border-2 ${getStatusColor(node.status)} hover:shadow-md transition-all text-left`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium">{node.name}</span>
                  {getStatusIcon(node.status)}
                </div>
                {node.level && (
                  <div className="mb-1">
                    <div className="w-full bg-white rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${node.level}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {nodesByType.concept.map((node) => (
              <button
                key={node.id}
                onClick={() => onNodeClick(node)}
                className={`w-full p-3 rounded-lg border-2 ${getStatusColor(node.status)} hover:shadow-md transition-all text-left`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium">{node.name}</span>
                  {getStatusIcon(node.status)}
                </div>
                {node.level && (
                  <div className="mb-1">
                    <div className="w-full bg-white rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${node.level}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {nodesByType.task.map((node) => (
              <button
                key={node.id}
                onClick={() => onNodeClick(node)}
                className={`w-full p-3 rounded-lg border-2 ${getStatusColor(node.status)} hover:shadow-md transition-all text-left`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium">{node.name}</span>
                  {getStatusIcon(node.status)}
                </div>
                {node.level && (
                  <div className="mb-1">
                    <div className="w-full bg-white rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${node.level}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">Mastered</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-muted-foreground">Not Started</span>
          </div>
        </div>
      </div>
    </div>
  );
}
