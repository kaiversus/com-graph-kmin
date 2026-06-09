import { useState } from 'react';
import {
  User,
  Mail,
  MapPin,
  Github,
  Linkedin,
  Globe,
  Download,
  Award,
  Star,
  Calendar,
  TrendingUp,
  Code,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { SkillGraphVisualization } from './SkillGraphVisualization';
import { ActivitySignals } from './ActivitySignals';
import { AcademicActivity } from './AcademicActivity';

export function Portfolio() {
  const [activeTab, setActiveTab] = useState<'all' | 'frontend' | 'backend' | 'fullstack'>('all');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const profile = {
    name: 'Alex Morgan',
    role: 'Full-Stack Developer',
    avatar: '',
    bio: 'Passionate developer with a strong foundation in React and Node.js. Love building scalable web applications and learning new technologies. Currently focused on mastering system design and cloud architecture.',
    location: 'San Francisco, CA',
    email: 'alex.morgan@example.com',
    github: 'github.com/alexmorgan',
    linkedin: 'linkedin.com/in/alexmorgan',
    website: 'alexmorgan.dev'
  };

  const skills = [
    { category: 'Frontend', items: [
      { name: 'React', level: 85 },
      { name: 'TypeScript', level: 75 },
      { name: 'Tailwind CSS', level: 80 },
      { name: 'Next.js', level: 70 }
    ]},
    { category: 'Backend', items: [
      { name: 'Node.js', level: 70 },
      { name: 'Express', level: 75 },
      { name: 'PostgreSQL', level: 65 },
      { name: 'MongoDB', level: 60 }
    ]},
    { category: 'Tools & Others', items: [
      { name: 'Git', level: 80 },
      { name: 'Docker', level: 55 },
      { name: 'AWS', level: 50 },
      { name: 'System Design', level: 60 }
    ]}
  ];

  const projects = [
    {
      id: 1,
      title: 'E-commerce Platform',
      category: 'fullstack',
      description: 'Full-featured online shopping platform with payment integration, user authentication, and admin dashboard.',
      tags: ['React', 'Node.js', 'Stripe', 'PostgreSQL'],
      rating: 4.8,
      mentorFeedback: 'Excellent code structure and implementation of best practices.',
      demoUrl: '#',
      githubUrl: '#',
      thumbnail: 'bg-gradient-to-br from-blue-500 to-purple-600'
    },
    {
      id: 2,
      title: 'Task Management System',
      category: 'fullstack',
      description: 'Collaborative project management tool with real-time updates, team collaboration features, and analytics.',
      tags: ['React', 'Redux', 'Firebase', 'Material-UI'],
      rating: 4.6,
      mentorFeedback: 'Great use of Redux for state management. Clean component architecture.',
      demoUrl: '#',
      githubUrl: '#',
      thumbnail: 'bg-gradient-to-br from-green-500 to-teal-600'
    },
    {
      id: 3,
      title: 'Weather Dashboard',
      category: 'frontend',
      description: 'Interactive weather application with location search, forecasts, and beautiful data visualizations.',
      tags: ['React', 'Chart.js', 'OpenWeather API'],
      rating: 4.4,
      mentorFeedback: 'Good API integration and responsive design.',
      demoUrl: '#',
      githubUrl: '#',
      thumbnail: 'bg-gradient-to-br from-cyan-500 to-blue-600'
    },
    {
      id: 4,
      title: 'RESTful API with Authentication',
      category: 'backend',
      description: 'Secure REST API with JWT authentication, role-based access control, and comprehensive documentation.',
      tags: ['Node.js', 'Express', 'JWT', 'MongoDB'],
      rating: 4.7,
      mentorFeedback: 'Solid security implementation and well-documented endpoints.',
      demoUrl: '#',
      githubUrl: '#',
      thumbnail: 'bg-gradient-to-br from-orange-500 to-red-600'
    },
    {
      id: 5,
      title: 'Blog Platform',
      category: 'fullstack',
      description: 'Modern blogging platform with markdown support, comments, and SEO optimization.',
      tags: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
      rating: 4.5,
      mentorFeedback: 'Impressive use of Next.js features and SEO best practices.',
      demoUrl: '#',
      githubUrl: '#',
      thumbnail: 'bg-gradient-to-br from-purple-500 to-pink-600'
    },
    {
      id: 6,
      title: 'Portfolio Website Builder',
      category: 'frontend',
      description: 'Drag-and-drop portfolio builder with customizable templates and export functionality.',
      tags: ['React', 'DnD Kit', 'Tailwind'],
      rating: 4.3,
      mentorFeedback: 'Creative approach to drag-and-drop implementation.',
      demoUrl: '#',
      githubUrl: '#',
      thumbnail: 'bg-gradient-to-br from-yellow-500 to-orange-600'
    }
  ];

  const achievements = [
    {
      title: 'React Advanced Certification',
      issuer: 'COM Platform',
      date: 'March 2026',
      icon: Award,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Full-Stack Developer Track Complete',
      issuer: 'COM Platform',
      date: 'February 2026',
      icon: Star,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'JavaScript Expert Badge',
      issuer: 'COM Platform',
      date: 'January 2026',
      icon: Award,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Top Learner of the Month',
      issuer: 'COM Platform',
      date: 'December 2025',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600'
    }
  ];

  const learningJourney = [
    {
      period: 'January 2026 - Present',
      title: 'Advanced Full-Stack Development',
      description: 'Focusing on system design, microservices architecture, and cloud deployment. Building complex, scalable applications.',
      courses: ['System Design Fundamentals', 'AWS Cloud Practitioner', 'Advanced React Patterns'],
      projects: 2
    },
    {
      period: 'September 2025 - December 2025',
      title: 'Backend Development Mastery',
      description: 'Deep dive into Node.js, database design, API development, and authentication systems.',
      courses: ['Node.js & Express Mastery', 'Database Design', 'API Security'],
      projects: 3
    },
    {
      period: 'June 2025 - August 2025',
      title: 'Frontend Development',
      description: 'Learned React, state management, and modern frontend tooling. Built multiple interactive web applications.',
      courses: ['React Fundamentals', 'Advanced JavaScript', 'UI/UX Principles'],
      projects: 4
    },
    {
      period: 'March 2025 - May 2025',
      title: 'Web Development Foundations',
      description: 'Started with HTML, CSS, JavaScript fundamentals and responsive design principles.',
      courses: ['Web Development Bootcamp', 'Responsive Design', 'Git & GitHub'],
      projects: 3
    }
  ];

  const mentorFeedback = [
    {
      mentor: 'Sarah Chen',
      role: 'Senior Frontend Engineer @ Google',
      feedback: 'Alex shows exceptional growth in React development. Strong understanding of component architecture and state management patterns.',
      rating: 5,
      date: 'March 2026'
    },
    {
      mentor: 'Michael Rodriguez',
      role: 'Tech Lead @ Microsoft',
      feedback: 'Impressive problem-solving skills and attention to code quality. Great potential for system design and architecture.',
      rating: 4.5,
      date: 'February 2026'
    }
  ];

  const filteredProjects = activeTab === 'all'
    ? projects
    : projects.filter(p => p.category === activeTab);

  const activitySignalsData = {
    streak: 23,
    totalLearningTime: 156,
    weeklyFrequency: 5,
    consistencyTrend: [8, 10, 12, 15, 14, 16, 18, 17, 20, 19, 22, 21]
  };

  const academicActivityData = {
    articles: [
      {
        title: 'Building Scalable React Applications with Custom Hooks',
        platform: 'Medium',
        date: 'Mar 15, 2026',
        views: 2340,
        likes: 156,
        url: '#'
      },
      {
        title: 'Understanding State Management in Modern Web Apps',
        platform: 'Dev.to',
        date: 'Feb 28, 2026',
        views: 1890,
        likes: 98,
        url: '#'
      },
      {
        title: 'JWT Authentication Best Practices',
        platform: 'Hashnode',
        date: 'Jan 20, 2026',
        views: 3120,
        likes: 204,
        url: '#'
      }
    ],
    contributions: [
      {
        type: 'Questions Answered',
        count: 47,
        description: 'Helped community members solve technical problems'
      },
      {
        type: 'Discussion Posts',
        count: 23,
        description: 'Participated in technical discussions and forums'
      },
      {
        type: 'Code Reviews',
        count: 15,
        description: 'Reviewed peer projects and provided feedback'
      },
      {
        type: 'Open Source PRs',
        count: 8,
        description: 'Contributed to open source projects'
      }
    ],
    speaking: [
      {
        title: 'Modern React Patterns Workshop',
        event: 'COM Platform Tech Talks',
        date: 'Mar 10, 2026',
        attendees: 45,
        url: '#'
      },
      {
        title: 'Getting Started with Node.js',
        event: 'Local Developer Meetup',
        date: 'Feb 5, 2026',
        attendees: 32,
        url: '#'
      },
      {
        title: 'Building Your First Full-Stack App',
        event: 'COM Platform Webinar',
        date: 'Jan 12, 2026',
        attendees: 78,
        url: '#'
      }
    ],
    memberships: [
      {
        name: 'React Developers Community',
        role: 'Active Member',
        since: 'Jan 2025',
        status: 'active' as const
      },
      {
        name: 'Full-Stack JavaScript Group',
        role: 'Contributor',
        since: 'Mar 2025',
        status: 'active' as const
      },
      {
        name: 'Open Source Contributors',
        role: 'Member',
        since: 'Jun 2025',
        status: 'active' as const
      },
      {
        name: 'Web Performance Guild',
        role: 'Member',
        since: 'Aug 2025',
        status: 'active' as const
      }
    ]
  };

  const handleAcademicItemClick = (type: string, item: any) => {
    console.log('Academic item clicked:', type, item);
  };

  const handleInsightClick = () => {
    console.log('View recommendations clicked');
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        <section className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white flex-shrink-0">
              <User className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl mb-2">{profile.name}</h1>
              <p className="text-xl text-blue-100 mb-4">{profile.role}</p>
              <p className="text-blue-50 mb-4 max-w-3xl">{profile.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  <a href={`https://${profile.github}`} className="hover:underline">{profile.github}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  <a href={`https://${profile.linkedin}`} className="hover:underline">{profile.linkedin}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <a href={`https://${profile.website}`} className="hover:underline">{profile.website}</a>
                </div>
              </div>
            </div>
            <button className="px-6 py-3 bg-white text-primary rounded-lg hover:shadow-lg transition-shadow flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download CV
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl mb-6">Skills & Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {skills.map((skillGroup, index) => (
              <div key={index} className="bg-card rounded-lg border border-border p-6">
                <h3 className="mb-4">{skillGroup.category}</h3>
                <div className="space-y-4">
                  {skillGroup.items.map((skill, skillIndex) => (
                    <div key={skillIndex}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>{skill.name}</span>
                        <span className="text-muted-foreground">{skill.level}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <SkillGraphVisualization onInsightClick={handleInsightClick} />
        </section>

        <section className="mb-8">
          <ActivitySignals {...activitySignalsData} />
        </section>

        <section className="mb-8">
          <AcademicActivity
            {...academicActivityData}
            onItemClick={handleAcademicItemClick}
          />
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">Projects Showcase</h2>
            <div className="flex gap-2">
              {['all', 'frontend', 'backend', 'fullstack'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-40 ${project.thumbnail} flex items-center justify-center`}>
                  <Code className="w-16 h-16 text-white opacity-50" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h4>{project.title}</h4>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">{project.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-muted text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3 rounded">
                    <p className="text-xs text-muted-foreground italic">"{project.mentorFeedback}"</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={project.demoUrl}
                      className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Demo
                    </a>
                    <a
                      href={project.githubUrl}
                      className="flex-1 px-3 py-2 border border-border rounded text-sm text-center hover:bg-muted transition-colors flex items-center justify-center gap-1"
                    >
                      <Github className="w-3 h-3" />
                      Code
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl mb-6">Achievements & Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div key={index} className="bg-card rounded-lg border border-border p-5 text-center">
                  <div className={`w-12 h-12 rounded-full ${achievement.color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm mb-1">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground mb-1">{achievement.issuer}</p>
                  <p className="text-xs text-muted-foreground">{achievement.date}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl mb-6">Learning Journey</h2>
          <div className="space-y-6">
            {learningJourney.map((period, index) => (
              <div key={index} className="relative pl-8 pb-6 border-l-2 border-border last:border-0">
                <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-primary -translate-x-[9px]"></div>
                <div className="bg-card rounded-lg border border-border p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4>{period.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{period.period}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded">
                      <Code className="w-4 h-4" />
                      <span>{period.projects} projects</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{period.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {period.courses.map((course, courseIndex) => (
                      <span key={courseIndex} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl mb-6">Mentor Feedback</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mentorFeedback.map((item, index) => (
              <div key={index} className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4>{item.mentor}</h4>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(item.rating)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic mb-2">"{item.feedback}"</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
