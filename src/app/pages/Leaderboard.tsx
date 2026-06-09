import { useState } from 'react';
import { Trophy, TrendingUp, Award, Flame, Star, Calendar } from 'lucide-react';

export function Leaderboard() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all-time'>('week');
  const [category, setCategory] = useState<'overall' | 'courses' | 'projects' | 'community'>('overall');

  const leaderboardData = {
    week: [
      { rank: 1, name: 'Alex Morgan', avatar: 'AM', score: 2850, courses: 2, projects: 1, streak: 23, change: '+2' },
      { rank: 2, name: 'Sarah Chen', avatar: 'SC', score: 2720, courses: 3, projects: 0, streak: 18, change: '0' },
      { rank: 3, name: 'John Doe', avatar: 'JD', score: 2650, courses: 1, projects: 2, streak: 15, change: '+1' },
      { rank: 4, name: 'Jane Smith', avatar: 'JS', score: 2580, courses: 2, projects: 1, streak: 20, change: '-1' },
      { rank: 5, name: 'Mike Johnson', avatar: 'MJ', score: 2490, courses: 1, projects: 1, streak: 12, change: '+3' },
      { rank: 6, name: 'Emily Watson', avatar: 'EW', score: 2420, courses: 2, projects: 0, streak: 16, change: '-1' },
      { rank: 7, name: 'David Kim', avatar: 'DK', score: 2350, courses: 1, projects: 1, streak: 14, change: '+2' },
      { rank: 8, name: 'Lisa Anderson', avatar: 'LA', score: 2280, courses: 1, projects: 1, streak: 11, change: '0' },
      { rank: 9, name: 'James Park', avatar: 'JP', score: 2210, courses: 2, projects: 0, streak: 9, change: '+1' },
      { rank: 10, name: 'Maria Garcia', avatar: 'MG', score: 2140, courses: 1, projects: 1, streak: 13, change: '-2' }
    ]
  };

  const currentUser = {
    rank: 1,
    name: 'Alex Morgan',
    avatar: 'AM',
    score: 2850,
    courses: 2,
    projects: 1,
    streak: 23,
    change: '+2'
  };

  const achievements = [
    { icon: Flame, label: 'Longest Streak', value: '23 days', color: 'text-orange-600' },
    { icon: Trophy, label: 'Total Points', value: '12,450', color: 'text-yellow-600' },
    { icon: Award, label: 'Badges Earned', value: '15', color: 'text-purple-600' },
    { icon: TrendingUp, label: 'Rank This Month', value: '#1', color: 'text-green-600' }
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">See how you rank among the community</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <div key={index} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-muted rounded-lg ${achievement.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{achievement.value}</div>
                  <div className="text-xs text-muted-foreground">{achievement.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex gap-2">
                {(['week', 'month', 'all-time'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                      timeframe === tf
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tf.replace('-', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(['overall', 'courses', 'projects', 'community'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                      category === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {leaderboardData.week.map((user, index) => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    user.name === currentUser.name
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="text-2xl w-12 text-center font-semibold">
                    {getRankBadge(user.rank)}
                  </div>

                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {user.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{user.name}</h4>
                      {user.name === currentUser.name && (
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        <span>{user.score.toLocaleString()} pts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{user.streak} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        <span>{user.courses} courses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{user.projects} projects</span>
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm font-medium ${getChangeColor(user.change)}`}>
                    {user.change !== '0' && user.change}
                    {user.change === '0' && '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 sticky top-8">
            <h3 className="mb-4">Your Stats</h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <div className="text-3xl font-semibold text-primary mb-1">
                  {getRankBadge(currentUser.rank)}
                </div>
                <div className="text-sm text-muted-foreground">Current Rank</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Points</span>
                  <span className="font-medium">{currentUser.score.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Courses Completed</span>
                  <span className="font-medium">{currentUser.courses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Projects Done</span>
                  <span className="font-medium">{currentUser.projects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Learning Streak</span>
                  <span className="font-medium flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    {currentUser.streak} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rank Change</span>
                  <span className={`font-medium ${getChangeColor(currentUser.change)}`}>
                    {currentUser.change}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
            <h3 className="mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              How to Rank Up
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Complete courses and lessons</span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Submit high-quality projects</span>
              </li>
              <li className="flex items-start gap-2">
                <Flame className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Maintain learning streaks</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Help community members</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
