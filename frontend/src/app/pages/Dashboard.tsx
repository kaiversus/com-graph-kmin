import { BookOpen, Target, Trophy, Flame, TrendingUp, Code } from 'lucide-react';
import { ProgressCard } from '../components/ProgressCard';
import { CourseCard } from '../components/CourseCard';
import { ProjectCard } from '../components/ProjectCard';
import { MentorSessionCard } from '../components/MentorSessionCard';
import { RoadmapSnapshot } from '../components/RoadmapSnapshot';
import { PortfolioSnapshot } from '../components/PortfolioSnapshot';
import { useNavigate } from 'react-router';

export function Dashboard() {
  const navigate = useNavigate();

  const roadmapSteps = [
    {
      id: '1',
      title: 'Frontend Fundamentals',
      description: 'HTML, CSS, JavaScript basics',
      status: 'completed' as const
    },
    {
      id: '2',
      title: 'React Development',
      description: 'Component-based architecture, hooks, state management',
      status: 'current' as const,
      progress: 68
    },
    {
      id: '3',
      title: 'Backend with Node.js',
      description: 'Express, RESTful APIs, database integration',
      status: 'locked' as const
    },
    {
      id: '4',
      title: 'Full-Stack Projects',
      description: 'Build complete applications end-to-end',
      status: 'locked' as const
    },
    {
      id: '5',
      title: 'System Design & Architecture',
      description: 'Scalability, design patterns, best practices',
      status: 'locked' as const
    }
  ];

  const portfolioData = {
    skills: [
      { name: 'React', level: 85 },
      { name: 'TypeScript', level: 75 },
      { name: 'Node.js', level: 70 },
      { name: 'Database Design', level: 65 }
    ],
    featuredProjects: [
      {
        title: 'E-commerce Platform',
        description: 'Full-stack shopping app with payment integration',
        tags: ['React', 'Node.js', 'Stripe'],
        rating: 4.8
      },
      {
        title: 'Task Management System',
        description: 'Collaborative project management tool',
        tags: ['React', 'Redux', 'Firebase'],
        rating: 4.6
      }
    ],
    profileHighlights: {
      completedProjects: 12,
      certifications: 5,
      mentorRating: 4.7
    }
  };

  const currentCourses = [
    {
      title: 'Advanced React Patterns',
      progress: 68,
      lessonsCompleted: 17,
      totalLessons: 25,
      timeLeft: '2 weeks',
      thumbnail: ''
    },
    {
      title: 'System Design Fundamentals',
      progress: 45,
      lessonsCompleted: 9,
      totalLessons: 20,
      timeLeft: '3 weeks',
      thumbnail: ''
    },
    {
      title: 'Node.js & Express Mastery',
      progress: 82,
      lessonsCompleted: 28,
      totalLessons: 34,
      timeLeft: '1 week',
      thumbnail: ''
    }
  ];

  const recentProjects = [
    {
      title: 'E-commerce Platform with React & Redux',
      status: 'Under Review' as const,
      skills: ['React', 'Redux', 'API Integration'],
      score: undefined,
      dueDate: undefined
    },
    {
      title: 'RESTful API with Authentication',
      status: 'Completed' as const,
      skills: ['Node.js', 'Express', 'JWT'],
      score: 92,
      dueDate: undefined
    },
    {
      title: 'Real-time Chat Application',
      status: 'In Progress' as const,
      skills: ['WebSocket', 'React', 'Node.js'],
      score: undefined,
      dueDate: 'May 5, 2026'
    }
  ];

  const upcomingSessions = [
    {
      mentorName: 'Sarah Chen',
      mentorRole: 'Senior Frontend Engineer @ Google',
      topic: 'React Performance Optimization',
      date: 'Apr 24, 2026',
      time: '3:00 PM',
      platform: 'Google Meet'
    },
    {
      mentorName: 'Michael Rodriguez',
      mentorRole: 'Tech Lead @ Microsoft',
      topic: 'System Design Review',
      date: 'Apr 26, 2026',
      time: '10:00 AM',
      platform: 'Zoom'
    }
  ];

  const handleStepClick = (stepId: string) => {
    console.log('Clicked step:', stepId);
  };

  const handleViewPortfolio = () => {
    navigate('/portfolio');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Welcome back, Alex!</h1>
        <p className="text-muted-foreground">Track your learning journey and continue building your skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ProgressCard
          title="Courses in Progress"
          value="3"
          subtitle="+1 this month"
          icon={BookOpen}
          progress={65}
          color="bg-blue-100 text-blue-600"
        />
        <ProgressCard
          title="Projects Completed"
          value="12"
          subtitle="+2 this month"
          icon={Code}
          progress={75}
          color="bg-green-100 text-green-600"
        />
        <ProgressCard
          title="Learning Streak"
          value="23"
          subtitle="days in a row"
          icon={Flame}
          color="bg-orange-100 text-orange-600"
        />
        <ProgressCard
          title="Rice Earned"
          value="2,450"
          subtitle="+180 this week"
          icon={Trophy}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <RoadmapSnapshot steps={roadmapSteps} onStepClick={handleStepClick} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3>Active Courses</h3>
              <button onClick={() => navigate('/courses')} className="text-sm text-primary hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCourses.slice(0, 2).map((course, index) => (
                <CourseCard key={index} {...course} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3>Recent Projects</h3>
              <button onClick={() => navigate('/projects')} className="text-sm text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {recentProjects.map((project, index) => (
                <ProjectCard key={index} {...project} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <PortfolioSnapshot
              skills={portfolioData.skills}
              featuredProjects={portfolioData.featuredProjects}
              profileHighlights={portfolioData.profileHighlights}
              onViewFullPortfolio={handleViewPortfolio}
            />
          </section>

          <section className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3>Learning Goals</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <span>Complete Advanced React course by end of month</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                <span>Build 3 full-stack projects this quarter</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <span>Achieve 80% skill level in System Design</span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3>Upcoming Mentor Sessions</h3>
          <button onClick={() => navigate('/mentors')} className="text-sm text-primary hover:underline">Book New Session</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {upcomingSessions.map((session, index) => (
            <MentorSessionCard key={index} {...session} />
          ))}
        </div>
      </section>

      <section className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl mb-2">Ready to level up?</h3>
            <p className="text-blue-100 mb-4">Personalized learning path recommendations based on your progress</p>
            <button className="px-6 py-2 bg-white text-primary rounded-lg hover:shadow-lg transition-shadow">
              View Recommendations
            </button>
          </div>
          <TrendingUp className="w-16 h-16 opacity-50 hidden md:block" />
        </div>
      </section>
    </div>
  );
}
