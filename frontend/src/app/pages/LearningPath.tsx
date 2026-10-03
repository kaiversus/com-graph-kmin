import { CheckCircle, Circle, Lock, ArrowRight, Star, Clock, Target } from 'lucide-react';

export function LearningPath() {
  const learningPath = {
    currentLevel: 'Intermediate',
    completionPercentage: 58,
    estimatedCompletion: '4 months',
    nextMilestone: 'Complete Advanced React Patterns'
  };

  const roadmap = [
    {
      phase: 'Foundation',
      status: 'completed',
      duration: '3 months',
      modules: [
        {
          id: 1,
          title: 'Web Development Fundamentals',
          status: 'completed',
          courses: ['HTML & CSS Basics', 'JavaScript Fundamentals', 'Responsive Design'],
          projects: ['Portfolio Website', 'Landing Page'],
          skills: ['HTML', 'CSS', 'JavaScript']
        },
        {
          id: 2,
          title: 'Version Control & Tools',
          status: 'completed',
          courses: ['Git & GitHub', 'Command Line Basics'],
          projects: ['Open Source Contribution'],
          skills: ['Git', 'GitHub', 'Terminal']
        }
      ]
    },
    {
      phase: 'Frontend Development',
      status: 'in-progress',
      duration: '4 months',
      modules: [
        {
          id: 3,
          title: 'React Fundamentals',
          status: 'completed',
          courses: ['React Basics', 'Component Patterns', 'State Management'],
          projects: ['Weather App', 'Task Manager'],
          skills: ['React', 'JSX', 'Hooks']
        },
        {
          id: 4,
          title: 'Advanced React',
          status: 'in-progress',
          courses: ['Advanced React Patterns', 'Performance Optimization'],
          projects: ['E-commerce Platform'],
          skills: ['Context API', 'Redux', 'Performance']
        },
        {
          id: 5,
          title: 'TypeScript & Modern Tools',
          status: 'not-started',
          courses: ['TypeScript Complete Guide', 'Modern Build Tools'],
          projects: ['Type-safe Application'],
          skills: ['TypeScript', 'Webpack', 'Vite']
        }
      ]
    },
    {
      phase: 'Backend Development',
      status: 'not-started',
      duration: '5 months',
      modules: [
        {
          id: 6,
          title: 'Node.js & Express',
          status: 'not-started',
          courses: ['Node.js Fundamentals', 'Express.js Mastery'],
          projects: ['REST API', 'Authentication System'],
          skills: ['Node.js', 'Express', 'API Design']
        },
        {
          id: 7,
          title: 'Database Design',
          status: 'not-started',
          courses: ['SQL Fundamentals', 'MongoDB Basics'],
          projects: ['Database-driven App'],
          skills: ['PostgreSQL', 'MongoDB', 'Schema Design']
        }
      ]
    },
    {
      phase: 'Full-Stack Mastery',
      status: 'locked',
      duration: '6 months',
      modules: [
        {
          id: 8,
          title: 'Full-Stack Projects',
          status: 'locked',
          courses: ['Full-Stack Architecture', 'Deployment & DevOps'],
          projects: ['Social Platform', 'SaaS Application'],
          skills: ['System Design', 'AWS', 'Docker']
        },
        {
          id: 9,
          title: 'Advanced Topics',
          status: 'locked',
          courses: ['Microservices', 'GraphQL', 'Testing'],
          projects: ['Scalable Architecture'],
          skills: ['Microservices', 'GraphQL', 'CI/CD']
        }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Circle className="w-5 h-5 text-blue-600" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'in-progress':
        return 'border-blue-500 bg-blue-50';
      case 'locked':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Your Learning Path</h1>
        <p className="text-muted-foreground">Personalized roadmap to full-stack development mastery</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-2xl font-semibold">{learningPath.currentLevel}</div>
              <div className="text-xs text-muted-foreground">Current Level</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-600" />
            <div>
              <div className="text-2xl font-semibold">{learningPath.completionPercentage}%</div>
              <div className="text-xs text-muted-foreground">Overall Progress</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-purple-600" />
            <div>
              <div className="text-2xl font-semibold">{learningPath.estimatedCompletion}</div>
              <div className="text-xs text-muted-foreground">To Completion</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-6 h-6 text-green-600" />
            <div>
              <div className="text-sm font-semibold line-clamp-1">{learningPath.nextMilestone}</div>
              <div className="text-xs text-muted-foreground">Next Milestone</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {roadmap.map((phase, phaseIndex) => (
            <div key={phaseIndex} className={`border-2 rounded-lg ${getPhaseColor(phase.status)}`}>
              <div className="p-6 border-b border-current/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(phase.status)}
                    <h2 className="text-2xl">Phase {phaseIndex + 1}: {phase.phase}</h2>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                    phase.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {phase.status === 'completed' ? 'Completed' :
                     phase.status === 'in-progress' ? 'In Progress' :
                     phase.status === 'locked' ? 'Locked' : 'Not Started'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Estimated duration: {phase.duration}</p>
              </div>

              <div className="p-6 space-y-4">
                {phase.modules.map((module) => (
                  <div
                    key={module.id}
                    className={`bg-white rounded-lg border-2 p-5 ${
                      module.status === 'locked' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(module.status)}
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{module.title}</h3>
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Courses:</div>
                              <div className="flex flex-wrap gap-1">
                                {module.courses.map((course, i) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                    {course}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Projects:</div>
                              <div className="flex flex-wrap gap-1">
                                {module.projects.map((project, i) => (
                                  <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                    {project}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Skills:</div>
                              <div className="flex flex-wrap gap-1">
                                {module.skills.map((skill, i) => (
                                  <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {module.status !== 'locked' && module.status !== 'completed' && (
                      <button className="mt-3 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                        {module.status === 'in-progress' ? 'Continue Learning' : 'Start Module'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 sticky top-8">
            <h3 className="mb-4">Overall Progress</h3>
            <div className="mb-4">
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                  style={{ width: `${learningPath.completionPercentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {learningPath.completionPercentage}% Complete
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phases Completed</span>
                <span className="font-medium">1 / 4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Modules Completed</span>
                <span className="font-medium">3 / 9</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Courses Finished</span>
                <span className="font-medium">8 / 15</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Projects Done</span>
                <span className="font-medium">6 / 12</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="mb-3">Next Steps</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Complete Advanced React Patterns course</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Submit E-commerce Platform project</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Start TypeScript Complete Guide</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
            <h3 className="mb-3">Achievements</h3>
            <div className="space-y-2">
              {[
                { label: 'Foundation Complete', icon: '🎓' },
                { label: 'React Master', icon: '⚛️' },
                { label: '30-Day Streak', icon: '🔥' }
              ].map((achievement, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-xl">{achievement.icon}</span>
                  <span>{achievement.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
