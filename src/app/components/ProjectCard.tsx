import { Github, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';

interface ProjectCardProps {
  id?: number;
  title: string;
  status: 'In Progress' | 'Under Review' | 'Completed';
  skills: string[];
  score?: number;
  dueDate?: string;
}

export function ProjectCard({ id = 1, title, status, skills, score, dueDate }: ProjectCardProps) {
  const navigate = useNavigate();

  const statusColors = {
    'In Progress': 'bg-blue-100 text-blue-700',
    'Under Review': 'bg-yellow-100 text-yellow-700',
    'Completed': 'bg-green-100 text-green-700'
  };

  return (
    <div
      onClick={() => navigate(`/projects/${id}`)}
      className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="flex-1">{title}</h4>
        <span className={`px-2 py-1 rounded text-xs ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map((skill, index) => (
          <span key={index} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
            {skill}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {score !== undefined && <span>Score: {score}/100</span>}
        {dueDate && <span>Due: {dueDate}</span>}
        <div className="ml-auto flex gap-2">
          <Github className="w-4 h-4 cursor-pointer hover:text-foreground" />
          <ExternalLink className="w-4 h-4 cursor-pointer hover:text-foreground" />
        </div>
      </div>
    </div>
  );
}
