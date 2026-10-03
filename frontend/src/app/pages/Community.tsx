import { useState } from 'react';
import { Search, Plus, MessageCircle, ThumbsUp, Eye, CheckCircle, TrendingUp, Filter, Star } from 'lucide-react';

export function Community() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');

  const tags = ['all', 'react', 'nodejs', 'javascript', 'typescript', 'css', 'database', 'career'];

  const questions = [
    {
      id: 1,
      title: 'How to optimize React performance with large lists?',
      author: 'Alex Morgan',
      tags: ['react', 'performance'],
      views: 234,
      replies: 12,
      upvotes: 45,
      answered: true,
      time: '2 hours ago',
      excerpt: 'I have a React component rendering a list of 10,000 items and it\'s very slow. What are the best practices for optimizing this?'
    },
    {
      id: 2,
      title: 'Best practices for JWT token storage?',
      author: 'John Doe',
      tags: ['nodejs', 'security'],
      views: 189,
      replies: 8,
      upvotes: 32,
      answered: true,
      time: '5 hours ago',
      excerpt: 'Should I store JWT tokens in localStorage, sessionStorage, or cookies? What are the security implications?'
    },
    {
      id: 3,
      title: 'TypeScript generics vs any - when to use which?',
      author: 'Jane Smith',
      tags: ['typescript'],
      views: 156,
      replies: 5,
      upvotes: 28,
      answered: false,
      time: '1 day ago',
      excerpt: 'I\'m confused about when to use generics vs the any type in TypeScript. Can someone explain the differences?'
    },
    {
      id: 4,
      title: 'How to structure a Node.js project for scalability?',
      author: 'Mike Johnson',
      tags: ['nodejs', 'architecture'],
      views: 312,
      replies: 15,
      upvotes: 67,
      answered: true,
      time: '1 day ago',
      excerpt: 'What\'s the recommended folder structure and architecture patterns for a large-scale Node.js application?'
    },
    {
      id: 5,
      title: 'CSS Grid vs Flexbox - which one should I use?',
      author: 'Emily Watson',
      tags: ['css', 'design'],
      views: 445,
      replies: 22,
      upvotes: 89,
      answered: true,
      time: '2 days ago',
      excerpt: 'I keep hearing about Grid and Flexbox. When should I use one over the other for layouts?'
    },
    {
      id: 6,
      title: 'PostgreSQL vs MongoDB for my project?',
      author: 'David Kim',
      tags: ['database'],
      views: 278,
      replies: 11,
      upvotes: 54,
      answered: false,
      time: '2 days ago',
      excerpt: 'I\'m building an e-commerce platform. Should I use PostgreSQL or MongoDB? What factors should I consider?'
    },
    {
      id: 7,
      title: 'How to prepare for technical interviews?',
      author: 'Lisa Anderson',
      tags: ['career', 'interview'],
      views: 567,
      replies: 28,
      upvotes: 124,
      answered: true,
      time: '3 days ago',
      excerpt: 'I have a technical interview coming up. What should I focus on to prepare effectively?'
    },
    {
      id: 8,
      title: 'Understanding async/await vs Promises',
      author: 'James Park',
      tags: ['javascript', 'async'],
      views: 198,
      replies: 9,
      upvotes: 41,
      answered: false,
      time: '3 days ago',
      excerpt: 'When should I use async/await versus traditional Promise chains? Are there performance differences?'
    }
  ];

  const topContributors = [
    { name: 'Sarah Chen', answers: 127, bestAnswers: 45, reputation: 2340 },
    { name: 'Michael Rodriguez', answers: 98, bestAnswers: 32, reputation: 1890 },
    { name: 'Emily Watson', answers: 76, bestAnswers: 28, reputation: 1456 }
  ];

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || q.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    if (sortBy === 'popular') return b.upvotes - a.upvotes;
    if (sortBy === 'unanswered') return a.answered === b.answered ? 0 : a.answered ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">Q&A Community</h1>
          <p className="text-muted-foreground">Ask questions, share knowledge, and learn together</p>
        </div>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Ask Question
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                {['recent', 'popular', 'unanswered'].map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort as typeof sortBy)}
                    className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                      sortBy === sort
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded text-sm capitalize whitespace-nowrap transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {sortedQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <ThumbsUp className="w-5 h-5 mb-1" />
                      <span className="text-sm font-medium">{question.upvotes}</span>
                    </div>
                    <div className={`flex flex-col items-center ${question.answered ? 'text-green-600' : ''}`}>
                      {question.answered ? <CheckCircle className="w-5 h-5 mb-1" /> : <MessageCircle className="w-5 h-5 mb-1" />}
                      <span className="text-sm font-medium">{question.replies}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="mb-2 hover:text-primary transition-colors">{question.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{question.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {question.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-muted text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="ml-auto flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{question.views}</span>
                        </div>
                        <span className="text-xs">{question.author}</span>
                        <span className="text-xs">{question.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 sticky top-8">
            <h3 className="mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Contributors
            </h3>
            <div className="space-y-4">
              {topContributors.map((contributor, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium mb-1">{contributor.name}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>{contributor.answers} answers</div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>{contributor.bestAnswers} best answers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{contributor.reputation.toLocaleString()} reputation</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="mb-3">Community Guidelines</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Be respectful and constructive</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Search before asking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Provide context and code samples</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Mark helpful answers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
