import { useState } from 'react';
import { Search, Filter, Clock, BookOpen, Star, TrendingUp } from 'lucide-react';

export function Courses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'frontend', 'backend', 'fullstack', 'database', 'devops'];

  const courses = [
    {
      id: 1,
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts including hooks, context, performance optimization, and design patterns.',
      category: 'frontend',
      level: 'Advanced',
      duration: '8 weeks',
      lessons: 25,
      enrolled: true,
      progress: 68,
      rating: 4.8,
      students: 1234,
      thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-600'
    },
    {
      id: 2,
      title: 'System Design Fundamentals',
      description: 'Learn to design scalable systems, understand architecture patterns, and ace system design interviews.',
      category: 'fullstack',
      level: 'Intermediate',
      duration: '6 weeks',
      lessons: 20,
      enrolled: true,
      progress: 45,
      rating: 4.9,
      students: 2341,
      thumbnail: 'bg-gradient-to-br from-purple-500 to-pink-600'
    },
    {
      id: 3,
      title: 'Node.js & Express Mastery',
      description: 'Build powerful backend applications with Node.js, Express, authentication, and RESTful APIs.',
      category: 'backend',
      level: 'Intermediate',
      duration: '10 weeks',
      lessons: 34,
      enrolled: true,
      progress: 82,
      rating: 4.7,
      students: 1876,
      thumbnail: 'bg-gradient-to-br from-green-500 to-emerald-600'
    },
    {
      id: 4,
      title: 'TypeScript Complete Guide',
      description: 'From basics to advanced: types, generics, decorators, and integrating TypeScript with React.',
      category: 'frontend',
      level: 'Intermediate',
      duration: '5 weeks',
      lessons: 18,
      enrolled: false,
      progress: 0,
      rating: 4.8,
      students: 3421,
      thumbnail: 'bg-gradient-to-br from-blue-600 to-indigo-600'
    },
    {
      id: 5,
      title: 'Database Design & SQL',
      description: 'Master relational database design, SQL queries, optimization, and working with PostgreSQL.',
      category: 'database',
      level: 'Beginner',
      duration: '6 weeks',
      lessons: 22,
      enrolled: false,
      progress: 0,
      rating: 4.6,
      students: 1654,
      thumbnail: 'bg-gradient-to-br from-orange-500 to-red-600'
    },
    {
      id: 6,
      title: 'Docker & Kubernetes Basics',
      description: 'Learn containerization with Docker and orchestration with Kubernetes for modern deployments.',
      category: 'devops',
      level: 'Intermediate',
      duration: '7 weeks',
      lessons: 26,
      enrolled: false,
      progress: 0,
      rating: 4.7,
      students: 987,
      thumbnail: 'bg-gradient-to-br from-cyan-500 to-blue-600'
    },
    {
      id: 7,
      title: 'MongoDB & NoSQL',
      description: 'Work with document databases, schema design, aggregation pipelines, and performance optimization.',
      category: 'database',
      level: 'Intermediate',
      duration: '5 weeks',
      lessons: 19,
      enrolled: false,
      progress: 0,
      rating: 4.5,
      students: 1432,
      thumbnail: 'bg-gradient-to-br from-green-600 to-teal-600'
    },
    {
      id: 8,
      title: 'Full-Stack JavaScript',
      description: 'Build complete applications from frontend to backend using the JavaScript ecosystem.',
      category: 'fullstack',
      level: 'Advanced',
      duration: '12 weeks',
      lessons: 42,
      enrolled: false,
      progress: 0,
      rating: 4.9,
      students: 2876,
      thumbnail: 'bg-gradient-to-br from-yellow-500 to-orange-600'
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const enrolledCourses = courses.filter(c => c.enrolled);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Courses</h1>
        <p className="text-muted-foreground">Explore our courses and continue your learning journey</p>
      </div>

      {enrolledCourses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl mb-4">Continue Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className={`h-32 ${course.thumbnail} flex items-center justify-center`}>
                  <BookOpen className="w-12 h-12 text-white opacity-50" />
                </div>
                <div className="p-5">
                  <h4 className="mb-2">{course.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                    <span className="ml-auto">{course.lessons} lessons</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <button className="w-full mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                    Continue Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">All Courses</h2>
          <span className="text-sm text-muted-foreground">{filteredCourses.length} courses found</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className={`h-32 ${course.thumbnail} flex items-center justify-center`}>
                <BookOpen className="w-12 h-12 text-white opacity-50" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="flex-1">{course.title}</h4>
                  <span className="px-2 py-1 bg-muted text-xs rounded whitespace-nowrap ml-2">
                    {course.level}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons} lessons</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{course.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{course.students.toLocaleString()} students</span>
                </div>
                <button className="w-full px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                  Enroll Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
