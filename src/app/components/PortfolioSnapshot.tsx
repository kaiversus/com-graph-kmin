import { Award, Code, Star, ExternalLink } from 'lucide-react';

interface Skill {
  name: string;
  level: number;
}

interface FeaturedProject {
  title: string;
  description: string;
  tags: string[];
  rating?: number;
}

interface PortfolioSnapshotProps {
  skills: Skill[];
  featuredProjects: FeaturedProject[];
  profileHighlights: {
    completedProjects: number;
    certifications: number;
    mentorRating: number;
  };
  onViewFullPortfolio: () => void;
}

export function PortfolioSnapshot({
  skills,
  featuredProjects,
  profileHighlights,
  onViewFullPortfolio
}: PortfolioSnapshotProps) {
  return (
    <div
      className="bg-card rounded-lg border border-border p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onViewFullPortfolio}
    >
      <div className="flex items-center justify-between mb-6">
        <h3>Portfolio Snapshot</h3>
        <ExternalLink className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-muted rounded-lg">
          <Code className="w-5 h-5 mx-auto mb-1 text-blue-600" />
          <div className="text-xl">{profileHighlights.completedProjects}</div>
          <div className="text-xs text-muted-foreground">Projects</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <Award className="w-5 h-5 mx-auto mb-1 text-purple-600" />
          <div className="text-xl">{profileHighlights.certifications}</div>
          <div className="text-xs text-muted-foreground">Certificates</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <Star className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
          <div className="text-xl">{profileHighlights.mentorRating.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Rating</div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm mb-3">Top Skills</h4>
        <div className="space-y-2">
          {skills.map((skill, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{skill.name}</span>
                <span className="text-muted-foreground">{skill.level}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm mb-3">Featured Projects</h4>
        <div className="space-y-3">
          {featuredProjects.map((project, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h5 className="text-sm flex-1">{project.title}</h5>
                {project.rating && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{project.rating}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{project.description}</p>
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-0.5 bg-background text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
        View Full Portfolio
      </button>
    </div>
  );
}
