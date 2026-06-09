import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Filter, Github, ExternalLink } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';

export function Projects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statuses = ['all', 'In Progress', 'Under Review', 'Completed'];

  const projects = [
    {
      id: 1,
      title: 'E-commerce Platform with React & Redux',
      status: 'Under Review' as const,
      skills: ['React', 'Redux', 'API Integration', 'Stripe'],
      score: undefined,
      dueDate: undefined
    },
    {
      id: 2,
      title: 'RESTful API with Authentication',
      status: 'Completed' as const,
      skills: ['Node.js', 'Express', 'JWT', 'PostgreSQL'],
      score: 92,
      dueDate: undefined
    },
    {
      id: 3,
      title: 'Real-time Chat Application',
      status: 'In Progress' as const,
      skills: ['WebSocket', 'React', 'Node.js', 'Socket.io'],
      score: undefined,
      dueDate: 'May 5, 2026'
    },
    {
      id: 4,
      title: 'Task Management Dashboard',
      status: 'Completed' as const,
      skills: ['React', 'Firebase', 'Material-UI'],
      score: 88,
      dueDate: undefined
    },
    {
      id: 5,
      title: 'Blog Platform with CMS',
      status: 'Completed' as const,
      skills: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
      score: 95,
      dueDate: undefined
    },
    {
      id: 6,
      title: 'Weather Dashboard',
      status: 'Completed' as const,
      skills: ['React', 'Chart.js', 'API Integration'],
      score: 85,
      dueDate: undefined
    },
    {
      id: 7,
      title: 'Social Media Analytics Tool',
      status: 'In Progress' as const,
      skills: ['React', 'Node.js', 'MongoDB', 'D3.js'],
      score: undefined,
      dueDate: 'May 15, 2026'
    },
    {
      id: 8,
      title: 'Portfolio Website Builder',
      status: 'Under Review' as const,
      skills: ['React', 'Tailwind', 'DnD Kit'],
      score: undefined,
      dueDate: undefined
    }
  ];

  const availableProjects = [
    {
      id: 1,
      title: 'Expense Tracker App',
      description: 'Build a full-stack expense tracking application with charts and budget management.',
      difficulty: 'Intermediate',
      skills: ['React', 'Node.js', 'MongoDB'],
      estimatedTime: '3-4 weeks'
    },
    {
      id: 2,
      title: 'Video Streaming Platform',
      description: 'Create a video streaming service with user authentication and video upload functionality.',
      difficulty: 'Advanced',
      skills: ['React', 'Node.js', 'AWS S3', 'FFmpeg'],
      estimatedTime: '6-8 weeks'
    },
    {
      id: 3,
      title: 'Recipe Finder Application',
      description: 'Develop a recipe search app with filtering, favorites, and meal planning features.',
      difficulty: 'Beginner',
      skills: ['React', 'API Integration', 'Local Storage'],
      estimatedTime: '2-3 weeks'
    },
    {
      id: 4,
      title: 'Job Board Platform',
      description: 'Build a job posting and application platform with employer and candidate dashboards.',
      difficulty: 'Advanced',
      skills: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe'],
      estimatedTime: '8-10 weeks'
    }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return {
      all: projects.length,
      'In Progress': projects.filter(p => p.status === 'In Progress').length,
      'Under Review': projects.filter(p => p.status === 'Under Review').length,
      'Completed': projects.filter(p => p.status === 'Completed').length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">Projects</h1>
          <p className="text-muted-foreground">Build real-world projects and showcase your skills</p>
        </div>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Start New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`p-4 rounded-lg border-2 transition-colors text-left ${
              selectedStatus === status
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-muted'
            }`}
          >
            <div className="text-2xl mb-1">{statusCounts[status as keyof typeof statusCounts]}</div>
            <div className="text-sm text-muted-foreground capitalize">{status}</div>
          </button>
        ))}
      </div>

      <section className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">Your Projects</h2>
          <span className="text-sm text-muted-foreground">{filteredProjects.length} projects</span>
        </div>

        <div className="space-y-3">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl mb-4">Available Projects</h2>
        <p className="text-muted-foreground mb-6">Choose from these curated projects to expand your portfolio</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3>{project.title}</h3>
                <span className={`px-3 py-1 rounded text-xs ${
                  project.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                  project.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {project.difficulty}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-muted text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Est. {project.estimatedTime}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}`);
                  }}
                  className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Start Project
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
