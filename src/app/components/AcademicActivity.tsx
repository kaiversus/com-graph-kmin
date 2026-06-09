import { FileText, MessageCircle, Mic, Users, ExternalLink, ArrowUpRight } from 'lucide-react';

interface Article {
  title: string;
  platform: string;
  date: string;
  views: number;
  likes: number;
  url: string;
}

interface Contribution {
  type: string;
  count: number;
  description: string;
}

interface Speaking {
  title: string;
  event: string;
  date: string;
  attendees?: number;
  url?: string;
}

interface Membership {
  name: string;
  role: string;
  since: string;
  status: 'active' | 'alumni';
}

interface AcademicActivityProps {
  articles: Article[];
  contributions: Contribution[];
  speaking: Speaking[];
  memberships: Membership[];
  onItemClick: (type: string, item: any) => void;
}

export function AcademicActivity({
  articles,
  contributions,
  speaking,
  memberships,
  onItemClick
}: AcademicActivityProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Academic & Community Activity</h2>
        <p className="text-sm text-muted-foreground">Intellectual contributions and community involvement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Articles</span>
          </div>
          <div className="text-2xl font-semibold text-blue-900">{articles.length}</div>
          <div className="text-xs text-blue-600 mt-1">Published</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Contributions</span>
          </div>
          <div className="text-2xl font-semibold text-green-900">
            {contributions.reduce((sum, c) => sum + c.count, 0)}
          </div>
          <div className="text-xs text-green-600 mt-1">Total activities</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Speaking</span>
          </div>
          <div className="text-2xl font-semibold text-purple-900">{speaking.length}</div>
          <div className="text-xs text-purple-600 mt-1">Events</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Memberships</span>
          </div>
          <div className="text-2xl font-semibold text-orange-900">
            {memberships.filter(m => m.status === 'active').length}
          </div>
          <div className="text-xs text-orange-600 mt-1">Active groups</div>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Articles & Writing
            </h3>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {articles.slice(0, 3).map((article, index) => (
              <button
                key={index}
                onClick={() => onItemClick('article', article)}
                className="w-full bg-muted rounded-lg p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm mb-1">{article.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span>{article.platform}</span>
                      <span>•</span>
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">{article.views.toLocaleString()} views</span>
                      <span className="text-muted-foreground">{article.likes} likes</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Community Contributions
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contributions.map((contribution, index) => (
              <button
                key={index}
                onClick={() => onItemClick('contribution', contribution)}
                className="bg-muted rounded-lg p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{contribution.type}</span>
                  <span className="text-xl font-semibold text-primary">{contribution.count}</span>
                </div>
                <p className="text-xs text-muted-foreground">{contribution.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-600" />
              Speaking & Workshops
            </h3>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {speaking.map((event, index) => (
              <button
                key={index}
                onClick={() => onItemClick('speaking', event)}
                className="w-full bg-muted rounded-lg p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm mb-1">{event.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span>{event.event}</span>
                      <span>•</span>
                      <span>{event.date}</span>
                    </div>
                    {event.attendees && (
                      <div className="text-xs text-muted-foreground">
                        {event.attendees} attendees
                      </div>
                    )}
                  </div>
                  {event.url && <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Memberships & Groups
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {memberships.map((membership, index) => (
              <button
                key={index}
                onClick={() => onItemClick('membership', membership)}
                className="bg-muted rounded-lg p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium">{membership.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    membership.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {membership.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{membership.role}</p>
                <p className="text-xs text-muted-foreground">Since {membership.since}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
