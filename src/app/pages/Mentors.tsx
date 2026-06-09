import { useState } from 'react';
import { Search, Star, Calendar, Video, Filter, Clock, Award } from 'lucide-react';

export function Mentors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('all');

  const expertiseAreas = ['all', 'frontend', 'backend', 'fullstack', 'devops', 'system-design'];

  const mentors = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Senior Frontend Engineer',
      company: 'Google',
      expertise: ['React', 'TypeScript', 'Performance'],
      rating: 4.9,
      sessions: 127,
      rate: 80,
      availability: 'Available',
      avatar: 'bg-gradient-to-br from-blue-500 to-purple-600',
      category: 'frontend'
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      role: 'Tech Lead',
      company: 'Microsoft',
      expertise: ['System Design', 'Architecture', 'Cloud'],
      rating: 4.8,
      sessions: 93,
      rate: 100,
      availability: 'Available',
      avatar: 'bg-gradient-to-br from-green-500 to-teal-600',
      category: 'system-design'
    },
    {
      id: 3,
      name: 'Emily Watson',
      role: 'Staff Engineer',
      company: 'Netflix',
      expertise: ['Node.js', 'Microservices', 'API Design'],
      rating: 4.7,
      sessions: 156,
      rate: 90,
      availability: 'Busy',
      avatar: 'bg-gradient-to-br from-red-500 to-pink-600',
      category: 'backend'
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Full-Stack Architect',
      company: 'Amazon',
      expertise: ['React', 'Node.js', 'AWS', 'DynamoDB'],
      rating: 4.9,
      sessions: 201,
      rate: 120,
      availability: 'Available',
      avatar: 'bg-gradient-to-br from-yellow-500 to-orange-600',
      category: 'fullstack'
    },
    {
      id: 5,
      name: 'Lisa Anderson',
      role: 'DevOps Engineer',
      company: 'Meta',
      expertise: ['Docker', 'Kubernetes', 'CI/CD'],
      rating: 4.8,
      sessions: 78,
      rate: 85,
      availability: 'Available',
      avatar: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      category: 'devops'
    },
    {
      id: 6,
      name: 'James Park',
      role: 'Principal Engineer',
      company: 'Stripe',
      expertise: ['React', 'Next.js', 'Web Performance'],
      rating: 5.0,
      sessions: 189,
      rate: 150,
      availability: 'Busy',
      avatar: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      category: 'frontend'
    }
  ];

  const upcomingSessions = [
    {
      mentor: 'Sarah Chen',
      topic: 'React Performance Optimization',
      date: 'Apr 24, 2026',
      time: '3:00 PM',
      platform: 'Google Meet',
      status: 'Confirmed'
    },
    {
      mentor: 'Michael Rodriguez',
      topic: 'System Design Review',
      date: 'Apr 26, 2026',
      time: '10:00 AM',
      platform: 'Zoom',
      status: 'Confirmed'
    }
  ];

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          mentor.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesExpertise = selectedExpertise === 'all' || mentor.category === selectedExpertise;
    return matchesSearch && matchesExpertise;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Mentors</h1>
        <p className="text-muted-foreground">Connect with experienced professionals for guidance and career growth</p>
      </div>

      {upcomingSessions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl mb-4">Upcoming Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session, index) => (
              <div key={index} className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4>{session.topic}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{session.mentor}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    {session.status}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{session.date} at {session.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="w-4 h-4" />
                    <span>{session.platform}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                    Join Session
                  </button>
                  <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                    Reschedule
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
              placeholder="Search mentors by name or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {expertiseAreas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedExpertise(area)}
                className={`px-4 py-2 rounded-lg text-sm capitalize whitespace-nowrap transition-colors ${
                  selectedExpertise === area
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {area.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">All Mentors</h2>
          <span className="text-sm text-muted-foreground">{filteredMentors.length} mentors found</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <div key={mentor.id} className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full ${mentor.avatar} flex items-center justify-center text-white text-xl flex-shrink-0`}>
                  {mentor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="truncate">{mentor.name}</h4>
                  <p className="text-sm text-muted-foreground">{mentor.role}</p>
                  <p className="text-sm text-muted-foreground">{mentor.company}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {mentor.expertise.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-muted text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{mentor.rating}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-sm mb-1">{mentor.sessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm">${mentor.rate}/hour</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  mentor.availability === 'Available'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {mentor.availability}
                </span>
              </div>

              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                Book Session
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
