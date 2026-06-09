import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Github, ExternalLink, CheckCircle, Clock, Star, Upload, MessageCircle,
  BookOpen, Target, Lightbulb, Award, User, ArrowRight, Bookmark, Share2,
  AlertCircle, ChevronDown, ChevronUp, TrendingUp, Play, Lock, Calendar,
  Zap, BarChart3, Users, GraduationCap
} from 'lucide-react';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedHints, setExpandedHints] = useState(false);
  const [expandedCompletedSkills, setExpandedCompletedSkills] = useState(false);
  const [highlightedCourseId, setHighlightedCourseId] = useState<number | null>(null);
  const [projectStatus, setProjectStatus] = useState<'not_started' | 'in_progress' | 'submitted' | 'completed'>('in_progress');

  const project = {
    id: 1,
    title: 'E-commerce Platform with React & Redux',
    level: 'Advanced',
    estimatedTime: '6-8 weeks',
    effortPerWeek: '8-10 hrs/week',
    successRate: 78,
    description: 'Build a full-featured online shopping platform with user authentication, product catalog, shopping cart, and payment integration.',
    tags: ['React', 'Redux', 'API Integration', 'Stripe', 'Authentication', 'E-commerce'],

    requiredSkills: [
      { id: 1, name: 'React Hooks', status: 'completed', level: 85, courseId: 3, usedIn: ['Product Catalog', 'Shopping Cart', 'User Dashboard'] },
      { id: 2, name: 'Redux State Management', status: 'completed', level: 70, courseId: 3, usedIn: ['Global State', 'Cart Management'] },
      { id: 3, name: 'REST API Integration', status: 'completed', level: 75, courseId: 4, usedIn: ['Product Data', 'Order Processing'] },
      { id: 4, name: 'JWT Authentication', status: 'weak', level: 45, courseId: 1, usedIn: ['User Login', 'Protected Routes'] },
      { id: 5, name: 'Payment Integration', status: 'missing', level: 0, courseId: 2, usedIn: ['Checkout Flow', 'Payment Processing'] }
    ],

    relatedCourses: [
      {
        id: 1,
        title: 'Security Fundamentals',
        level: 'Intermediate',
        duration: '4 weeks',
        enrolled: false,
        progress: 0,
        priority: 'Important',
        skillsCovered: ['JWT Authentication', 'Session Management'],
        reason: 'Strengthen JWT Authentication skills'
      },
      {
        id: 2,
        title: 'Payment Systems Integration',
        level: 'Advanced',
        duration: '3 weeks',
        enrolled: false,
        progress: 0,
        priority: 'Critical',
        skillsCovered: ['Payment Integration', 'Stripe API'],
        reason: 'Required for checkout implementation'
      },
      {
        id: 3,
        title: 'Advanced React Patterns',
        level: 'Advanced',
        duration: '8 weeks',
        enrolled: true,
        progress: 68,
        priority: 'Optional',
        skillsCovered: ['React Hooks', 'Redux State Management'],
        reason: 'Improve component architecture'
      },
      {
        id: 4,
        title: 'API Development',
        level: 'Intermediate',
        duration: '5 weeks',
        enrolled: false,
        progress: 0,
        priority: 'Optional',
        skillsCovered: ['REST API Integration'],
        reason: 'Deepen API integration knowledge'
      }
    ],

    problemStatement: {
      overview: 'Build a scalable e-commerce platform for a startup expecting 10,000+ daily users. The platform must handle concurrent transactions, maintain cart state across sessions, and integrate with Stripe for payments.',
      businessContext: 'Real-world scenario: You are building for a fashion retail startup launching in 3 months.',
      challenges: [
        'Managing complex state across multiple components',
        'Implementing secure authentication and authorization',
        'Integrating with payment gateway (Stripe)',
        'Handling async operations and error states',
        'Optimizing performance for large product catalogs'
      ]
    },

    requirements: {
      functional: [
        { id: 1, text: 'User registration and login with JWT authentication', completed: false },
        { id: 2, text: 'Product listing with search, filter, and pagination', completed: false },
        { id: 3, text: 'Shopping cart with add/remove/update quantity', completed: false },
        { id: 4, text: 'Checkout process with Stripe payment integration', completed: false },
        { id: 5, text: 'Order history and tracking for logged-in users', completed: false },
        { id: 6, text: 'Admin dashboard for product management', completed: false }
      ],
      nonFunctional: [
        { id: 1, text: 'Responsive design for mobile and desktop', completed: false },
        { id: 2, text: 'Loading states and error handling', completed: false },
        { id: 3, text: 'Code organization following best practices', completed: false },
        { id: 4, text: 'Unit tests for critical components', completed: false },
        { id: 5, text: 'Performance optimization (lazy loading, memoization)', completed: false }
      ]
    },

    expectedOutput: [
      'GitHub repository with complete source code',
      'Live demo deployed on Vercel/Netlify',
      'README with setup instructions and architecture overview',
      'API documentation (if backend included)',
      'Test coverage report (minimum 60%)'
    ],

    timeline: [
      {
        phase: 'Setup & Foundation',
        duration: '1-2 weeks',
        tasks: ['Project scaffolding', 'Redux setup', 'Basic routing', 'Authentication UI']
      },
      {
        phase: 'Core Features',
        duration: '3-4 weeks',
        tasks: ['Product catalog', 'Shopping cart', 'User dashboard', 'Search & filters']
      },
      {
        phase: 'Integration & Polish',
        duration: '2-3 weeks',
        tasks: ['Stripe integration', 'Testing', 'Performance optimization', 'Deployment']
      }
    ],

    portfolioImpact: {
      skillsProven: ['React', 'Redux', 'API Integration', 'Payment Systems', 'Authentication'],
      projectLevel: 'Advanced',
      portfolioStrength: 'This project demonstrates full-stack capabilities and real-world e-commerce experience, making you stand out for frontend and full-stack roles.'
    },

    hints: [
      {
        step: 1,
        title: 'Project Setup',
        content: 'Start with Create React App or Vite. Set up Redux Toolkit for state management.',
        difficulty: 'easy'
      },
      {
        step: 2,
        title: 'Authentication Flow',
        content: 'Implement JWT-based authentication. Store tokens securely. Create protected routes.',
        difficulty: 'medium'
      },
      {
        step: 3,
        title: 'State Management',
        content: 'Use Redux slices for cart, products, and user state. Implement async thunks for API calls.',
        difficulty: 'medium'
      },
      {
        step: 4,
        title: 'Stripe Integration',
        content: 'Use Stripe Checkout for payment processing. Test with Stripe test keys before going live.',
        difficulty: 'hard'
      },
      {
        step: 5,
        title: 'Optimization',
        content: 'Implement code splitting, lazy loading for routes, and memoization for expensive computations.',
        difficulty: 'hard'
      }
    ],

    evaluationCriteria: [
      { category: 'Completeness', weight: 25, description: 'All required features implemented', tooltip: 'All functional requirements met with working features' },
      { category: 'Code Quality', weight: 25, description: 'Clean, readable, maintainable code', tooltip: 'Follows best practices, DRY principle, proper component structure' },
      { category: 'Functionality', weight: 20, description: 'Features work as expected', tooltip: 'No critical bugs, smooth user experience' },
      { category: 'UI/UX Design', weight: 15, description: 'User-friendly interface', tooltip: 'Intuitive navigation, responsive design, good visual hierarchy' },
      { category: 'Documentation', weight: 15, description: 'Clear README and code comments', tooltip: 'Easy to understand and set up for other developers' }
    ],

    recommendedMentors: [
      {
        id: 1,
        name: 'Sarah Chen',
        role: 'Senior Frontend Engineer @ Google',
        expertise: ['React', 'Redux', 'Performance'],
        rating: 4.9,
        rate: 80,
        avatar: 'SC',
        whyRelevant: 'Expert in React and Redux with 5+ years building e-commerce platforms at scale'
      },
      {
        id: 2,
        name: 'Michael Rodriguez',
        role: 'Tech Lead @ Microsoft',
        expertise: ['Full-Stack', 'System Design', 'E-commerce'],
        rating: 4.8,
        rate: 100,
        avatar: 'MR',
        whyRelevant: 'Led development of payment systems and has deep expertise in Stripe integration'
      }
    ],

    submission: projectStatus === 'in_progress' || projectStatus === 'submitted' || projectStatus === 'completed' ? {
      githubUrl: projectStatus !== 'in_progress' ? 'https://github.com/alexmorgan/ecommerce-platform' : '',
      demoUrl: projectStatus !== 'in_progress' ? 'https://ecommerce-demo.alexmorgan.dev' : '',
      submittedDate: projectStatus !== 'in_progress' ? 'Apr 20, 2026' : null,
      status: projectStatus
    } : null,

    review: projectStatus === 'completed' ? {
      reviewer: 'Sarah Chen',
      role: 'Senior Frontend Engineer @ Google',
      avatar: 'SC',
      overallFeedback: 'Excellent implementation with clean code structure and good use of Redux patterns.',
      strengths: [
        'Well-organized component architecture',
        'Effective state management using Redux Toolkit',
        'Clean and responsive UI design'
      ],
      weaknesses: [
        'Limited test coverage (only 45% vs required 60%)',
        'Payment flow could use better error messages'
      ],
      suggestions: [
        'Increase test coverage for Redux actions',
        'Add more detailed error messages in payment flow'
      ],
      score: 89,
      breakdown: [
        { category: 'Completeness', score: 23, max: 25 },
        { category: 'Code Quality', score: 22, max: 25 },
        { category: 'Functionality', score: 18, max: 20 },
        { category: 'UI/UX Design', score: 14, max: 15 },
        { category: 'Documentation', score: 12, max: 15 }
      ],
      reviewDate: 'Apr 22, 2026'
    } : null,

    discussions: [
      { id: 1, user: 'John Doe', topic: 'Best way to structure Redux slices?', replies: 8, time: '2 hours ago' },
      { id: 2, user: 'Jane Smith', topic: 'Stripe webhook setup help needed', replies: 5, time: '5 hours ago' },
      { id: 3, user: 'Mike Johnson', topic: 'Testing async Redux thunks', replies: 12, time: '1 day ago' }
    ]
  };

  const skillsReadiness = {
    completed: project.requiredSkills.filter(s => s.status === 'completed').length,
    weak: project.requiredSkills.filter(s => s.status === 'weak').length,
    missing: project.requiredSkills.filter(s => s.status === 'missing').length,
    total: project.requiredSkills.length
  };

  const readinessPercentage = Math.round((skillsReadiness.completed / skillsReadiness.total) * 100);
  const blockingSkills = skillsReadiness.missing + skillsReadiness.weak;
  const estimatedTimeToFix = blockingSkills * 6; // 6 hours per skill average

  const needsImprovementSkills = project.requiredSkills.filter(s => s.status === 'missing' || s.status === 'weak');
  const completedSkills = project.requiredSkills.filter(s => s.status === 'completed');

  const getPrimaryCTA = () => {
    if (readinessPercentage === 100 && projectStatus === 'not_started') {
      return { text: 'Start Project', icon: Play, action: () => setProjectStatus('in_progress') };
    }
    if (readinessPercentage < 100) {
      return { text: 'Fix Skill Gaps', icon: AlertCircle, action: () => window.scrollTo({ top: 600, behavior: 'smooth' }) };
    }
    if (projectStatus === 'in_progress') {
      return { text: 'Continue Project', icon: Play, action: () => window.scrollTo({ top: 1200, behavior: 'smooth' }) };
    }
    return { text: 'View Submission', icon: CheckCircle, action: () => window.scrollTo({ top: 2000, behavior: 'smooth' }) };
  };

  const primaryCTA = getPrimaryCTA();
  const PrimaryCTAIcon = primaryCTA.icon;

  const handleSkillClick = (courseId: number) => {
    setHighlightedCourseId(courseId);
    setTimeout(() => setHighlightedCourseId(null), 3000);
  };

  const sortedCourses = [...project.relatedCourses].sort((a, b) => {
    const priorityOrder = { Critical: 0, Important: 1, Optional: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  return (
    <div className="relative">
      <button
        onClick={() => navigate('/projects')}
        className="text-sm text-primary hover:underline mb-4"
      >
        ← Back to Projects
      </button>

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">{project.level}</span>
                <span className="px-3 py-1 bg-white/20 rounded-lg text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {project.estimatedTime}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-lg text-sm flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  {project.effortPerWeek}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-lg text-sm flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  {project.successRate}% success rate
                </span>
              </div>
              <h1 className="text-3xl mb-2">{project.title}</h1>
              <p className="text-blue-100">{project.description}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={primaryCTA.action}
                className="px-6 py-3 bg-white text-primary rounded-lg hover:shadow-lg transition-shadow flex items-center gap-2 font-medium whitespace-nowrap"
              >
                <PrimaryCTAIcon className="w-5 h-5" />
                {primaryCTA.text}
              </button>
              <button
                onClick={() => navigate('/mentors')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Users className="w-5 h-5" />
                Book Mentor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout - 60/40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* LEFT COLUMN - 60% (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Required Knowledge & Skills - REDESIGNED */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-4">Required Knowledge & Skills</h2>

            {/* Readiness Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-semibold text-blue-900 mb-1">{readinessPercentage}% Ready</div>
                  {blockingSkills > 0 && (
                    <>
                      <p className="text-sm text-blue-700">
                        {blockingSkills} skill{blockingSkills > 1 ? 's' : ''} blocking your progress
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Estimated time to fix: {estimatedTimeToFix}–{estimatedTimeToFix + 4} hours
                      </p>
                    </>
                  )}
                  {blockingSkills === 0 && (
                    <p className="text-sm text-green-700">All skills ready! You can start the project.</p>
                  )}
                </div>
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                  <div className="text-2xl font-bold text-primary">{skillsReadiness.completed}/{skillsReadiness.total}</div>
                </div>
              </div>
            </div>

            {/* Needs Improvement Section */}
            {needsImprovementSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-red-700 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  🔴 Needs Improvement ({needsImprovementSkills.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {needsImprovementSkills.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillClick(skill.courseId)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        skill.status === 'missing'
                          ? 'border-red-200 bg-red-50 hover:border-red-300'
                          : 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{skill.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          skill.status === 'missing' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {skill.status === 'missing' ? 'Missing' : 'Weak'}
                        </span>
                      </div>
                      {skill.level > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-muted-foreground mb-1">{skill.level}% mastery</div>
                          <div className="w-full bg-white rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${skill.status === 'weak' ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Used in: {skill.usedIn.slice(0, 2).join(', ')}
                        {skill.usedIn.length > 2 && ` +${skill.usedIn.length - 2}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Skills - Collapsed */}
            {completedSkills.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedCompletedSkills(!expandedCompletedSkills)}
                  className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">
                      🟢 Completed Skills ({completedSkills.length})
                    </span>
                  </div>
                  {expandedCompletedSkills ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {expandedCompletedSkills && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    {completedSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{skill.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Problem Statement - Enhanced */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-4">Problem Statement</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Business Context</p>
              <p className="text-sm text-blue-700">{project.problemStatement.businessContext}</p>
            </div>
            <p className="mb-4">{project.problemStatement.overview}</p>
            <div>
              <h3 className="font-medium mb-3">Key Challenges</h3>
              <ul className="space-y-2">
                {project.problemStatement.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Requirements - Progress-Aware Checklist */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-6">Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Functional Requirements
                </h3>
                <ul className="space-y-2">
                  {project.requirements.functional.map((req) => (
                    <li key={req.id} className="flex items-start gap-3 text-sm group">
                      <input
                        type="checkbox"
                        checked={req.completed}
                        className="w-4 h-4 mt-0.5 rounded border-2 border-border cursor-pointer"
                        readOnly
                      />
                      <span className={req.completed ? 'line-through text-muted-foreground' : ''}>
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Non-Functional Requirements
                </h3>
                <ul className="space-y-2">
                  {project.requirements.nonFunctional.map((req) => (
                    <li key={req.id} className="flex items-start gap-3 text-sm group">
                      <input
                        type="checkbox"
                        checked={req.completed}
                        className="w-4 h-4 mt-0.5 rounded border-2 border-border cursor-pointer"
                        readOnly
                      />
                      <span className={req.completed ? 'line-through text-muted-foreground' : ''}>
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Expected Output */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">Expected Output & Deliverables</h2>
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-4 h-4" />
                View Sample Project
              </button>
            </div>
            <div className="space-y-3">
              {project.expectedOutput.map((output, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{output}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-6">Evaluation Criteria</h2>
            <div className="space-y-4">
              {project.evaluationCriteria.map((criteria, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{criteria.category}</span>
                      <div className="group relative">
                        <AlertCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {criteria.tooltip}
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-semibold">{criteria.weight}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{criteria.description}</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                      style={{ width: `${criteria.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hints & Guidance - Collapsible */}
          <div className="bg-card rounded-lg border border-border p-6">
            <button
              onClick={() => setExpandedHints(!expandedHints)}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl">Hints & Guidance</h2>
              </div>
              {expandedHints ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedHints && (
              <div className="space-y-3">
                {project.hints.map((hint) => (
                  <div key={hint.step} className={`p-4 rounded-lg border ${
                    hint.difficulty === 'easy' ? 'border-green-200 bg-green-50' :
                    hint.difficulty === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                        hint.difficulty === 'easy' ? 'bg-green-200 text-green-700' :
                        hint.difficulty === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                        'bg-red-200 text-red-700'
                      }`}>
                        {hint.step}
                      </span>
                      <h4 className="font-medium flex-1">{hint.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded capitalize ${
                        hint.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        hint.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {hint.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">{hint.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Timeline - NEW */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-6">Project Timeline</h2>
            <div className="space-y-4">
              {project.timeline.map((phase, index) => (
                <div key={index} className="relative pl-8 pb-4 last:pb-0">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  {index < project.timeline.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{phase.phase}</h4>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {phase.duration}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phase.tasks.map((task, i) => (
                        <span key={i} className="px-2 py-1 bg-muted text-xs rounded">
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Impact - NEW */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8 text-purple-600" />
              <h2 className="text-2xl">Portfolio Impact</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-purple-900 mb-2">Skills You'll Prove</h4>
                <div className="flex flex-wrap gap-2">
                  {project.portfolioImpact.skillsProven.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-900 mb-1">Project Level</h4>
                <span className="px-3 py-1 bg-purple-200 text-purple-900 text-sm rounded-lg font-medium inline-block">
                  {project.portfolioImpact.projectLevel}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-900 mb-2">Career Impact</h4>
                <p className="text-sm text-purple-700">{project.portfolioImpact.portfolioStrength}</p>
              </div>
            </div>
          </div>

          {/* Mentor Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-4">Recommended Mentors</h2>
            <p className="text-sm text-muted-foreground mb-6">Get expert guidance for this project</p>

            <div className="space-y-4">
              {project.recommendedMentors.map((mentor) => (
                <div key={mentor.id} className="border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 text-lg font-medium">
                      {mentor.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{mentor.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{mentor.role}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{mentor.rating}</span>
                        <span className="text-sm text-muted-foreground ml-2">${mentor.rate}/hr</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                        <p className="text-xs text-blue-900">
                          <span className="font-medium">Why relevant:</span> {mentor.whyRelevant}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mentor.expertise.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-muted text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/mentors/${mentor.id}/book`)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Book Mentor
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-6">Submission</h2>

            {projectStatus === 'not_started' && (
              <div className="text-center py-8">
                <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Ready to start?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Make sure you've reviewed the requirements and filled skill gaps
                </p>
                <button
                  onClick={() => setProjectStatus('in_progress')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Start Project
                </button>
              </div>
            )}

            {projectStatus === 'in_progress' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    Keep working on your project. Submit when you're ready for review!
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">GitHub Repository URL *</label>
                  <input
                    type="text"
                    placeholder="https://github.com/username/project"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Live Demo URL (optional)</label>
                  <input
                    type="text"
                    placeholder="https://project-demo.com"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                    onClick={() => setProjectStatus('submitted')}
                  >
                    <Upload className="w-4 h-4" />
                    Submit for Review
                  </button>
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors">
                    Save Draft
                  </button>
                </div>
              </div>
            )}

            {(projectStatus === 'submitted' || projectStatus === 'completed') && project.submission && (
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 ${
                  projectStatus === 'completed' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <p className={`text-sm ${
                    projectStatus === 'completed' ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {projectStatus === 'completed'
                      ? 'Your project has been reviewed and completed!'
                      : 'Your project is under review. You will be notified when feedback is available.'}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5" />
                    <div>
                      <div className="text-sm font-medium">GitHub Repository</div>
                      <a href={project.submission.githubUrl} className="text-xs text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        {project.submission.githubUrl}
                      </a>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>

                {project.submission.demoUrl && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5" />
                      <div>
                        <div className="text-sm font-medium">Live Demo</div>
                        <a href={project.submission.demoUrl} className="text-xs text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                          {project.submission.demoUrl}
                        </a>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Review & Feedback */}
          {projectStatus === 'completed' && project.review && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl mb-6">Review & Feedback</h2>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0 text-lg font-medium">
                  {project.review.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="font-medium">{project.review.reviewer}</h4>
                      <p className="text-sm text-muted-foreground">{project.review.role}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-3xl font-semibold text-green-600">
                        <Star className="w-8 h-8 fill-current" />
                        {project.review.score}
                      </div>
                      <p className="text-xs text-muted-foreground">{project.review.reviewDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <p className="text-sm italic">"{project.review.overallFeedback}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3 text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {project.review.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-yellow-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {project.review.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  Suggestions
                </h4>
                <ul className="space-y-2">
                  {project.review.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-4">Score Breakdown</h4>
                <div className="space-y-3">
                  {project.review.breakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{item.category}</span>
                        <span className="text-sm font-medium">{item.score}/{item.max}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${(item.score / item.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Community Discussion */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">Community Discussion</h2>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Ask Question
              </button>
            </div>

            <div className="space-y-3">
              {project.discussions.map((discussion) => (
                <div key={discussion.id} className="p-4 bg-muted rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">{discussion.topic}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{discussion.user}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{discussion.replies} replies</span>
                        </div>
                        <span>•</span>
                        <span>{discussion.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - 40% (2 cols) - Sticky Sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-32 space-y-6">
            {/* Quick Navigation */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-medium mb-4">Quick Navigation</h3>
              <nav className="space-y-2 text-sm">
                <a href="#skills" className="block text-muted-foreground hover:text-primary transition-colors">Required Skills</a>
                <a href="#problem" className="block text-muted-foreground hover:text-primary transition-colors">Problem Statement</a>
                <a href="#requirements" className="block text-muted-foreground hover:text-primary transition-colors">Requirements</a>
                <a href="#output" className="block text-muted-foreground hover:text-primary transition-colors">Expected Output</a>
                <a href="#timeline" className="block text-muted-foreground hover:text-primary transition-colors">Timeline</a>
                <a href="#mentors" className="block text-muted-foreground hover:text-primary transition-colors">Mentors</a>
                <a href="#submission" className="block text-muted-foreground hover:text-primary transition-colors">Submission</a>
              </nav>
            </div>

            {/* Your Progress */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-5">
              <h3 className="font-medium mb-4">Your Progress</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Skill Readiness</span>
                  <span className="font-medium text-lg">{readinessPercentage}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                    style={{ width: `${readinessPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{projectStatus.replace('_', ' ')}</span>
                </div>
                {projectStatus === 'completed' && project.review && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Final Score</span>
                    <span className="font-medium text-green-600">{project.review.score}/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-medium mb-4">Next Steps</h3>
              <div className="space-y-3">
                {blockingSkills > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Fix skill gaps</p>
                      <p className="text-xs text-red-700">Complete {blockingSkills} missing/weak skills</p>
                    </div>
                  </div>
                )}
                {blockingSkills === 0 && projectStatus === 'not_started' && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Ready to start!</p>
                      <p className="text-xs text-green-700">All prerequisites completed</p>
                    </div>
                  </div>
                )}
                {projectStatus === 'in_progress' && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Play className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Build the project</p>
                      <p className="text-xs text-blue-700">Follow requirements and timeline</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Book a mentor</p>
                    <p className="text-xs text-purple-700">Get expert guidance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Courses - 2 Column Grid */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-medium mb-4">Related Courses</h3>
              <div className="space-y-3">
                {sortedCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      highlightedCourseId === course.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-muted-foreground hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm flex-1">{course.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded whitespace-nowrap ${
                        course.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        course.priority === 'Important' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {course.priority === 'Critical' ? '🔴' : course.priority === 'Important' ? '🟡' : '🟢'} {course.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{course.reason}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span>{course.level}</span>
                      <span>•</span>
                      <span>{course.duration}</span>
                    </div>
                    {course.enrolled && course.progress > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary font-medium">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {course.skillsCovered.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-muted text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        course.enrolled
                          ? 'bg-primary text-primary-foreground hover:opacity-90'
                          : 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      {course.enrolled ? 'Continue' : 'Enroll'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
