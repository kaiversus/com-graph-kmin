import { useParams, useNavigate } from 'react-router';
import { Clock, BookOpen, Star, Play, CheckCircle, Lock, MessageCircle, Users, Award, Circle } from 'lucide-react';

export function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const course = {
    id: 1,
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts including hooks, context, performance optimization, and design patterns. Build production-ready applications with confidence.',
    instructor: 'Sarah Chen',
    instructorRole: 'Senior Frontend Engineer @ Google',
    rating: 4.8,
    students: 1234,
    duration: '8 weeks',
    totalLessons: 25,
    completedLessons: 17,
    progress: 68,
    level: 'Advanced',
    thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    skills: ['React', 'Performance', 'Design Patterns', 'Advanced Hooks'],
    prerequisites: ['React Fundamentals', 'JavaScript ES6+'],
    certificate: true,
    enrolled: true
  };

  const modules = [
    {
      id: 1,
      title: 'Advanced Hooks',
      lessons: 6,
      completed: 6,
      duration: '2h 30m',
      locked: false,
      items: [
        { id: 1, title: 'Custom Hooks Deep Dive', duration: '25min', completed: true, type: 'video' },
        { id: 2, title: 'useReducer vs useState', duration: '20min', completed: true, type: 'video' },
        { id: 3, title: 'useCallback and useMemo', duration: '30min', completed: true, type: 'video' },
        { id: 4, title: 'useRef Advanced Patterns', duration: '22min', completed: true, type: 'video' },
        { id: 5, title: 'Custom Hook Library', duration: '35min', completed: true, type: 'exercise' },
        { id: 6, title: 'Advanced Hooks Quiz', duration: '15min', completed: true, type: 'quiz' }
      ]
    },
    {
      id: 2,
      title: 'Context API & State Management',
      lessons: 8,
      completed: 6,
      duration: '3h 15m',
      locked: false,
      items: [
        { id: 7, title: 'Context API Fundamentals', duration: '28min', completed: true, type: 'video' },
        { id: 8, title: 'Provider Pattern', duration: '25min', completed: true, type: 'video' },
        { id: 9, title: 'Context Performance', duration: '30min', completed: true, type: 'video' },
        { id: 10, title: 'Multiple Contexts', duration: '22min', completed: true, type: 'video' },
        { id: 11, title: 'Global State Management', duration: '35min', completed: true, type: 'video' },
        { id: 12, title: 'Building a Theme System', duration: '40min', completed: true, type: 'exercise' },
        { id: 13, title: 'State Management Quiz', duration: '15min', completed: false, type: 'quiz' },
        { id: 14, title: 'Context vs Redux', duration: '20min', completed: false, type: 'video' }
      ]
    },
    {
      id: 3,
      title: 'Performance Optimization',
      lessons: 7,
      completed: 3,
      duration: '2h 45m',
      locked: false,
      items: [
        { id: 15, title: 'React DevTools Profiler', duration: '25min', completed: true, type: 'video' },
        { id: 16, title: 'Memoization Techniques', duration: '30min', completed: true, type: 'video' },
        { id: 17, title: 'Code Splitting', duration: '28min', completed: true, type: 'video' },
        { id: 18, title: 'Lazy Loading', duration: '22min', completed: false, type: 'video' },
        { id: 19, title: 'Virtualization', duration: '35min', completed: false, type: 'video' },
        { id: 20, title: 'Performance Project', duration: '45min', completed: false, type: 'exercise' },
        { id: 21, title: 'Optimization Quiz', duration: '15min', completed: false, type: 'quiz' }
      ]
    },
    {
      id: 4,
      title: 'Design Patterns',
      lessons: 4,
      completed: 0,
      duration: '1h 50m',
      locked: true,
      items: [
        { id: 22, title: 'Compound Components', duration: '30min', completed: false, type: 'video' },
        { id: 23, title: 'Render Props', duration: '25min', completed: false, type: 'video' },
        { id: 24, title: 'Higher Order Components', duration: '28min', completed: false, type: 'video' },
        { id: 25, title: 'Patterns Quiz', duration: '12min', completed: false, type: 'quiz' }
      ]
    }
  ];

  const discussions = [
    { id: 1, user: 'John Doe', topic: 'When to use useReducer?', replies: 8, time: '2 hours ago' },
    { id: 2, user: 'Jane Smith', topic: 'Context performance issues', replies: 5, time: '5 hours ago' },
    { id: 3, user: 'Mike Johnson', topic: 'Custom hooks best practices', replies: 12, time: '1 day ago' }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'exercise':
        return <BookOpen className="w-4 h-4" />;
      case 'quiz':
        return <Award className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/courses')}
        className="text-sm text-primary hover:underline mb-4"
      >
        ← Back to Courses
      </button>

      <div className={`${course.thumbnail} rounded-lg p-8 text-white mb-8`}>
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/20 rounded text-sm">{course.level}</span>
            <span className="px-3 py-1 bg-white/20 rounded text-sm">{course.duration}</span>
          </div>
          <h1 className="text-4xl mb-4">{course.title}</h1>
          <p className="text-lg text-blue-100 mb-6">{course.description}</p>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div>{course.instructor}</div>
                <div className="text-blue-100 text-xs">{course.instructorRole}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-current" />
              <span>{course.rating}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{course.students.toLocaleString()} students</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">Your Progress</h2>
              <span className="text-primary">{course.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mb-2">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {course.completedLessons} of {course.totalLessons} lessons completed
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-6">Course Content</h2>
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="border border-border rounded-lg overflow-hidden">
                  <div className={`p-4 ${module.locked ? 'bg-muted' : 'bg-background'} cursor-pointer hover:bg-muted/50 transition-colors`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {module.locked ? (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <CheckCircle className={`w-5 h-5 ${module.completed === module.lessons ? 'text-green-600' : 'text-muted-foreground'}`} />
                        )}
                        <div>
                          <h3 className="font-medium">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {module.completed}/{module.lessons} lessons • {module.duration}
                          </p>
                        </div>
                      </div>
                      {!module.locked && (
                        <span className="text-sm text-primary">
                          {Math.round((module.completed / module.lessons) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {!module.locked && (
                    <div className="border-t border-border">
                      {module.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => navigate(`/courses/${course.id}/lesson/${item.id}`)}
                          className="p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            {item.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            )}
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              <span className="text-sm">{item.title}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{item.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">Discussions</h2>
              <button className="text-sm text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {discussions.map((discussion) => (
                <div key={discussion.id} className="p-4 bg-muted rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm mb-1">{discussion.topic}</h4>
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

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 sticky top-8">
            <h3 className="mb-4">Course Includes</h3>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{course.duration} of content</span>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span>{course.totalLessons} lessons</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span>Certificate of completion</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span>Community support</span>
              </div>
            </div>

            {course.enrolled ? (
              <button
                onClick={() => navigate(`/courses/${course.id}/lesson/3`)}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Continue Learning
              </button>
            ) : (
              <button className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                Enroll Now
              </button>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Skills You'll Gain</h3>
            <div className="flex flex-wrap gap-2">
              {course.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-muted text-sm rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Prerequisites</h3>
            <ul className="space-y-2 text-sm">
              {course.prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
