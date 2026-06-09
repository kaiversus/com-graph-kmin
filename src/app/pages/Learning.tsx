import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Play, Pause, ChevronDown, ChevronRight, CheckCircle, Book, FileText,
  Award, MessageCircle, ThumbsUp, Share2, Bookmark, Lightbulb, Eye,
  EyeOff, Globe, SkipForward, SkipBack, MessageSquare, Sparkles,
  Clock, Code, Image, Info, Languages, PenTool, Menu, X, ExternalLink,
  TrendingUp, Target, Maximize2
} from 'lucide-react';

interface LearningItem {
  id: string;
  type: 'lesson' | 'quiz' | 'project';
  title: string;
  duration?: string;
  completed: boolean;
}

interface Section {
  id: string;
  title: string;
  items: LearningItem[];
  expanded: boolean;
}

interface Chapter {
  id: string;
  title: string;
  sections: Section[];
  items?: LearningItem[];
  expanded: boolean;
}

interface Part {
  id: string;
  title: string;
  chapters: Chapter[];
  expanded: boolean;
}

export function Learning() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [focusMode, setFocusMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const [selectedText, setSelectedText] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [expandedParts, setExpandedParts] = useState<string[]>(['part-1']);
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['chapter-1-1']);

  // Course structure with 4-level hierarchy
  const courseStructure: Part[] = [
    {
      id: 'part-1',
      title: 'Part 1: React Fundamentals',
      expanded: true,
      chapters: [
        {
          id: 'chapter-1-1',
          title: 'Chapter 1: Getting Started',
          expanded: true,
          sections: [
            {
              id: 'section-1-1-1',
              title: 'Section 1: Introduction',
              expanded: true,
              items: [
                { id: 'lesson-1', type: 'lesson', title: 'What is React?', duration: '12:30', completed: true },
                { id: 'lesson-2', type: 'lesson', title: 'Setting up your environment', duration: '8:45', completed: true },
                { id: 'lesson-3', type: 'lesson', title: 'Your first React component', duration: '15:20', completed: false }
              ]
            },
            {
              id: 'section-1-1-2',
              title: 'Section 2: JSX Basics',
              expanded: false,
              items: [
                { id: 'lesson-4', type: 'lesson', title: 'Understanding JSX', duration: '10:15', completed: false },
                { id: 'quiz-1', type: 'quiz', title: 'JSX Quiz', completed: false }
              ]
            }
          ],
          items: []
        },
        {
          id: 'chapter-1-2',
          title: 'Chapter 2: Components Deep Dive',
          expanded: false,
          items: [
            { id: 'lesson-5', type: 'lesson', title: 'Functional Components', duration: '18:30', completed: false },
            { id: 'lesson-6', type: 'lesson', title: 'Props and State', duration: '22:10', completed: false }
          ],
          sections: []
        }
      ]
    },
    {
      id: 'part-2',
      title: 'Part 2: Advanced Patterns',
      expanded: false,
      chapters: [
        {
          id: 'chapter-2-1',
          title: 'Chapter 3: Hooks',
          expanded: false,
          items: [
            { id: 'lesson-7', type: 'lesson', title: 'useState and useEffect', duration: '25:00', completed: false },
            { id: 'project-1', type: 'project', title: 'Build a Todo App', completed: false }
          ],
          sections: []
        }
      ]
    }
  ];

  const currentLesson = {
    id: 'lesson-3',
    title: 'Your first React component',
    description: 'Learn how to create and structure your first React component using functional syntax. We\'ll cover component basics, JSX, and how to render components.',
    type: 'video' as 'video' | 'text',
    duration: '15:20',
    videoUrl: 'https://example.com/video.mp4',
    skills: ['React Basics', 'JSX', 'Components'],
    concepts: ['Component Structure', 'Rendering', 'Props'],
    content: `
# Your First React Component

React components are the building blocks of any React application. In this lesson, we'll create a simple component and understand its structure.

## What is a Component?

A component is a reusable piece of UI that can contain its own logic and styling. Think of components as custom HTML elements.

\`\`\`jsx
function Welcome() {
  return <h1>Hello, React!</h1>;
}
\`\`\`

## Key Points

- Components must return JSX
- Component names start with capital letters
- Components can be reused throughout your app

Let's build your first component step by step!
    `,
    completed: false,
    lastWatchedAt: 320 // seconds
  };

  const relatedSkills = [
    { id: 1, name: 'React Basics', progress: 45, status: 'in-progress' },
    { id: 2, name: 'JSX', progress: 30, status: 'in-progress' },
    { id: 3, name: 'Components', progress: 20, status: 'learning' }
  ];

  const discussions = [
    {
      id: 1,
      user: 'Sarah Chen',
      avatar: 'SC',
      question: 'What\'s the difference between function and class components?',
      answer: 'Function components are the modern way to write React. They\'re simpler and work with Hooks.',
      upvotes: 24,
      replies: 8,
      isBestAnswer: true,
      time: '2 hours ago'
    },
    {
      id: 2,
      user: 'Mike Johnson',
      avatar: 'MJ',
      question: 'Can I use multiple return statements in a component?',
      answer: null,
      upvotes: 12,
      replies: 5,
      isBestAnswer: false,
      time: '5 hours ago'
    }
  ];

  const roadmapSnapshot = [
    { id: 1, title: 'Introduction', status: 'completed', isCurrent: false },
    { id: 2, title: 'Setup Environment', status: 'completed', isCurrent: false },
    { id: 3, title: 'First Component', status: 'current', isCurrent: true },
    { id: 4, title: 'Understanding JSX', status: 'locked', isCurrent: false },
    { id: 5, title: 'JSX Quiz', status: 'locked', isCurrent: false }
  ];

  const togglePart = (partId: string) => {
    setExpandedParts(prev =>
      prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId]
    );
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev =>
      prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
    );
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString();
    if (text) {
      setSelectedText(text);
      setShowTranslation(true);
    }
  };

  const handleMarkComplete = () => {
    // Mark lesson as complete and show skill progress feedback
    alert('Lesson completed! You improved: React Basics +5%, JSX +3%');
  };

  const getItemIcon = (type: string, completed: boolean) => {
    if (completed) return <CheckCircle className="w-4 h-4 text-green-600" />;

    switch (type) {
      case 'lesson':
        return <Play className="w-4 h-4 text-muted-foreground" />;
      case 'quiz':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      case 'project':
        return <Award className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Book className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/courses')} className="text-sm text-primary hover:underline">
            ← Back to Course
          </button>
          <h1 className="font-medium hidden md:block">React Fundamentals</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'English' : 'Tiếng Việt'}
          </button>
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted flex items-center gap-2"
          >
            {focusMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>
          <button
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="md:hidden p-2 border border-border rounded-lg hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Layout - 3 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT - Course Navigation (20%) */}
        {!focusMode && (
          <div className={`${showMobileNav ? 'fixed inset-0 z-50 bg-background' : 'hidden'} md:flex md:w-1/5 flex-col border-r border-border overflow-y-auto`}>
            <div className="p-4 border-b border-border flex items-center justify-between md:hidden">
              <h2 className="font-medium">Course Navigation</h2>
              <button onClick={() => setShowMobileNav(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {courseStructure.map((part) => (
                <div key={part.id}>
                  <button
                    onClick={() => togglePart(part.id)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-lg text-left"
                  >
                    {expandedParts.includes(part.id) ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm">{part.title}</span>
                  </button>

                  {expandedParts.includes(part.id) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {part.chapters.map((chapter) => (
                        <div key={chapter.id}>
                          <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-lg text-left"
                          >
                            {expandedChapters.includes(chapter.id) ? (
                              <ChevronDown className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="text-sm">{chapter.title}</span>
                          </button>

                          {expandedChapters.includes(chapter.id) && (
                            <div className="ml-4 mt-1 space-y-1">
                              {/* Chapter-level items */}
                              {chapter.items?.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setShowMobileNav(false)}
                                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm ${
                                    item.id === currentLesson.id
                                      ? 'bg-primary/10 text-primary'
                                      : 'hover:bg-muted'
                                  }`}
                                >
                                  {getItemIcon(item.type, item.completed)}
                                  <span className="flex-1 truncate">{item.title}</span>
                                  {item.duration && (
                                    <span className="text-xs text-muted-foreground">{item.duration}</span>
                                  )}
                                </button>
                              ))}

                              {/* Sections */}
                              {chapter.sections.map((section) => (
                                <div key={section.id}>
                                  <div className="text-xs font-medium text-muted-foreground px-2 py-1 mt-2">
                                    {section.title}
                                  </div>
                                  {section.items.map((item) => (
                                    <button
                                      key={item.id}
                                      onClick={() => setShowMobileNav(false)}
                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm ${
                                        item.id === currentLesson.id
                                          ? 'bg-primary/10 text-primary'
                                          : 'hover:bg-muted'
                                      }`}
                                    >
                                      {getItemIcon(item.type, item.completed)}
                                      <span className="flex-1 truncate">{item.title}</span>
                                      {item.duration && (
                                        <span className="text-xs text-muted-foreground">{item.duration}</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CENTER - Learning Content (60%) */}
        <div className={`flex-1 overflow-y-auto ${focusMode ? 'max-w-4xl mx-auto' : ''}`}>
          <div className="p-6 max-w-4xl mx-auto">
            {/* Lesson Header */}
            <div className="mb-6">
              <h1 className="text-3xl mb-2">{currentLesson.title}</h1>
              <p className="text-muted-foreground mb-4">{currentLesson.description}</p>
              <div className="flex flex-wrap gap-2">
                {currentLesson.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg">
                    {skill}
                  </span>
                ))}
                {currentLesson.concepts.map((concept, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-lg">
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            {/* Video Player */}
            {currentLesson.type === 'video' && (
              <div className="bg-black rounded-lg overflow-hidden mb-6 aspect-video relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                  <div className="text-center text-white">
                    <Play className="w-20 h-20 mx-auto mb-4 opacity-70" />
                    <p className="text-lg">Video Player</p>
                    <p className="text-sm opacity-70">Resume from {Math.floor(currentLesson.lastWatchedAt / 60)}:{(currentLesson.lastWatchedAt % 60).toString().padStart(2, '0')}</p>
                  </div>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-4 text-white">
                    <button className="hover:scale-110 transition-transform">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <div className="flex-1 h-1 bg-white/30 rounded-full">
                      <div className="h-1 bg-white rounded-full" style={{ width: '40%' }} />
                    </div>
                    <span className="text-sm">6:20 / 15:20</span>
                    <select className="bg-white/20 rounded px-2 py-1 text-sm">
                      <option>1x</option>
                      <option>1.25x</option>
                      <option>1.5x</option>
                      <option>2x</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Text Content */}
            <div
              className="prose prose-lg max-w-none mb-6"
              onMouseUp={handleTextSelection}
            >
              <div className="bg-card border border-border rounded-lg p-6">
                {currentLesson.content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-bold mb-3 mt-6">{line.slice(3)}</h2>;
                  }
                  if (line.startsWith('```')) {
                    return null;
                  }
                  if (line.includes('function Welcome')) {
                    return (
                      <pre key={i} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                        <code>{`function Welcome() {\n  return <h1>Hello, React!</h1>;\n}`}</code>
                      </pre>
                    );
                  }
                  if (line.trim().startsWith('- ')) {
                    return <li key={i} className="ml-6">{line.slice(2)}</li>;
                  }
                  if (line.trim()) {
                    return <p key={i} className="mb-4">{line}</p>;
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Translation Popup */}
            {showTranslation && selectedText && (
              <div className="fixed bottom-20 right-6 bg-card border-2 border-primary shadow-xl rounded-lg p-4 max-w-sm z-40">
                <div className="flex items-start justify-between mb-2">
                  <Languages className="w-5 h-5 text-primary" />
                  <button onClick={() => setShowTranslation(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Selected:</p>
                  <p className="text-sm text-muted-foreground italic">"{selectedText}"</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Vietnamese:</p>
                  <p className="text-sm">"[Bản dịch tiếng Việt]"</p>
                </div>
                <button className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90">
                  Save to Notes
                </button>
              </div>
            )}

            {/* AI Assistant */}
            {showAI && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">AI Learning Assistant</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ask me anything about this lesson!
                    </p>
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white resize-none"
                      rows={3}
                      placeholder="e.g., Can you explain JSX in simple terms?"
                    />
                    <div className="flex gap-2 mt-2">
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                        Ask AI
                      </button>
                      <button
                        onClick={() => setShowAI(false)}
                        className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-purple-200 pt-4 mt-4">
                  <p className="text-sm font-medium mb-2">Quick Actions:</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1 bg-white border border-purple-200 rounded-lg text-sm hover:bg-purple-50">
                      Explain this concept
                    </button>
                    <button className="px-3 py-1 bg-white border border-purple-200 rounded-lg text-sm hover:bg-purple-50">
                      Summarize lesson
                    </button>
                    <button className="px-3 py-1 bg-white border border-purple-200 rounded-lg text-sm hover:bg-purple-50">
                      Suggest next steps
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Your Notes</h3>
                <span className="text-xs text-muted-foreground ml-auto">Auto-saved</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                rows={4}
                placeholder="Take notes here... You can save translations and highlights."
              />
            </div>

            {/* Lesson Actions */}
            <div className="flex items-center justify-between gap-4 mb-8 sticky bottom-0 bg-background py-4 border-t border-border">
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted flex items-center gap-2">
                <SkipBack className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                onClick={handleMarkComplete}
                className="flex-1 max-w-xs px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center justify-center gap-2 font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Completed
              </button>
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted flex items-center gap-2">
                <span className="hidden sm:inline">Next</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Discussion Section */}
            <div className="border-t border-border pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">Lesson Discussion</h2>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ask Question
                </button>
              </div>

              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <div key={discussion.id} className="bg-card border border-border rounded-lg p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                        {discussion.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{discussion.user}</h4>
                            <p className="text-sm text-muted-foreground">{discussion.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 px-3 py-1 border border-border rounded-lg hover:bg-muted text-sm">
                              <ThumbsUp className="w-4 h-4" />
                              {discussion.upvotes}
                            </button>
                          </div>
                        </div>
                        <p className="font-medium mb-2">{discussion.question}</p>
                        {discussion.answer && (
                          <div className={`mt-3 p-3 rounded-lg ${
                            discussion.isBestAnswer ? 'bg-green-50 border border-green-200' : 'bg-muted'
                          }`}>
                            {discussion.isBestAnswer && (
                              <div className="flex items-center gap-1 text-green-700 text-sm font-medium mb-1">
                                <CheckCircle className="w-4 h-4" />
                                Best Answer
                              </div>
                            )}
                            <p className="text-sm">{discussion.answer}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <button className="hover:text-primary flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {discussion.replies} replies
                          </button>
                          <button className="hover:text-primary">Reply</button>
                          <button className="hover:text-primary">Share</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - Support Panel (20%) */}
        {!focusMode && (
          <div className="hidden lg:flex lg:w-1/5 flex-col border-l border-border overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="font-medium mb-3 text-sm">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowAI(true)}
                    className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ask AI Assistant
                  </button>
                  <button className="w-full px-3 py-2 border border-border rounded-lg hover:bg-muted flex items-center gap-2 text-sm">
                    <Bookmark className="w-4 h-4" />
                    Bookmark
                  </button>
                  <button className="w-full px-3 py-2 border border-border rounded-lg hover:bg-muted flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* Snapshot Roadmap */}
              <div>
                <h3 className="font-medium mb-3 text-sm">Your Progress</h3>
                <div className="space-y-2">
                  {roadmapSnapshot.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg text-sm flex items-center gap-2 ${
                        item.isCurrent
                          ? 'bg-primary/10 border border-primary text-primary'
                          : item.status === 'completed'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                      {item.status === 'current' && <Play className="w-4 h-4" />}
                      {item.status === 'locked' && <Lock className="w-4 h-4" />}
                      <span className="flex-1 truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Skill Graph */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">Related Skills</h3>
                  <button className="text-xs text-primary hover:underline flex items-center gap-1">
                    View Full
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="bg-muted rounded-lg p-4 mb-3">
                  <div className="space-y-3">
                    {relatedSkills.map((skill) => (
                      <div key={skill.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <span className="text-xs text-muted-foreground">{skill.progress}%</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              skill.status === 'in-progress' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${skill.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">After this lesson</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    You'll improve: <strong>React Basics +5%</strong>, <strong>JSX +3%</strong>
                  </p>
                </div>
              </div>

              {/* Skill Snapshot */}
              <div>
                <h3 className="font-medium mb-3 text-sm">Lesson Impact</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-muted-foreground">Concepts covered:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-muted-foreground">Est. time:</span>
                    <span className="font-medium">15 min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-muted-foreground">XP reward:</span>
                    <span className="font-medium">50 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
