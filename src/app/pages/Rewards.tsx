import { Trophy, Star, Award, Gift, TrendingUp, Zap, Target } from 'lucide-react';

export function Rewards() {
  const userRewards = {
    totalRice: 2450,
    weeklyEarned: 180,
    streak: 23,
    level: 12,
    nextLevelRice: 500
  };

  const badges = [
    {
      id: 1,
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      earned: true,
      earnedDate: 'Mar 1, 2025',
      rarity: 'common'
    },
    {
      id: 2,
      name: 'React Master',
      description: 'Complete all React courses',
      icon: '⚛️',
      earned: true,
      earnedDate: 'Jan 15, 2026',
      rarity: 'rare'
    },
    {
      id: 3,
      name: '30-Day Streak',
      description: 'Learn for 30 consecutive days',
      icon: '🔥',
      earned: false,
      progress: 23,
      total: 30,
      rarity: 'epic'
    },
    {
      id: 4,
      name: 'Project Pioneer',
      description: 'Submit 10 projects',
      icon: '🚀',
      earned: true,
      earnedDate: 'Feb 28, 2026',
      rarity: 'rare'
    },
    {
      id: 5,
      name: 'Community Helper',
      description: 'Answer 50 questions',
      icon: '🤝',
      earned: false,
      progress: 32,
      total: 50,
      rarity: 'rare'
    },
    {
      id: 6,
      name: 'Perfect Score',
      description: 'Get 100% on a project',
      icon: '💯',
      earned: true,
      earnedDate: 'Mar 10, 2026',
      rarity: 'epic'
    },
    {
      id: 7,
      name: 'Early Bird',
      description: 'Complete lessons before 8 AM 10 times',
      icon: '🌅',
      earned: false,
      progress: 5,
      total: 10,
      rarity: 'common'
    },
    {
      id: 8,
      name: 'Mentor Favorite',
      description: 'Receive 5-star rating from 3 mentors',
      icon: '⭐',
      earned: true,
      earnedDate: 'Apr 1, 2026',
      rarity: 'legendary'
    }
  ];

  const rewardShop = [
    {
      id: 1,
      name: '1-Month Pro Subscription',
      description: 'Access all premium features for 30 days',
      cost: 500,
      icon: Star,
      category: 'subscription'
    },
    {
      id: 2,
      name: 'Free Mentor Session',
      description: 'One complimentary session with any mentor',
      cost: 800,
      icon: Gift,
      category: 'mentoring'
    },
    {
      id: 3,
      name: 'Course Unlock',
      description: 'Unlock any premium course',
      cost: 600,
      icon: Award,
      category: 'course'
    },
    {
      id: 4,
      name: 'Certificate Frame',
      description: 'Digital certificate with premium design',
      cost: 300,
      icon: Trophy,
      category: 'certificate'
    },
    {
      id: 5,
      name: 'Profile Badge',
      description: 'Special badge for your profile',
      cost: 200,
      icon: Zap,
      category: 'cosmetic'
    },
    {
      id: 6,
      name: 'Career Consultation',
      description: '30-minute career guidance session',
      cost: 1000,
      icon: Target,
      category: 'career'
    }
  ];

  const recentActivity = [
    { action: 'Completed lesson', rice: 50, time: '2 hours ago' },
    { action: 'Daily login bonus', rice: 10, time: '1 day ago' },
    { action: 'Project submitted', rice: 100, time: '2 days ago' },
    { action: 'Helped community member', rice: 20, time: '3 days ago' }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-400 bg-gray-50';
      case 'rare':
        return 'border-blue-400 bg-blue-50';
      case 'epic':
        return 'border-purple-400 bg-purple-50';
      case 'legendary':
        return 'border-yellow-400 bg-yellow-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Rewards & Achievements</h1>
        <p className="text-muted-foreground">Earn rice, unlock badges, and redeem rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <div className="text-3xl font-semibold text-yellow-900">{userRewards.totalRice.toLocaleString()}</div>
              <div className="text-xs text-yellow-700">Total Rice</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-3xl font-semibold text-green-900">+{userRewards.weeklyEarned}</div>
              <div className="text-xs text-green-700">This Week</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-3xl font-semibold text-purple-900">Level {userRewards.level}</div>
              <div className="text-xs text-purple-700">Current Level</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-3xl font-semibold text-orange-900">{userRewards.streak}</div>
              <div className="text-xs text-orange-700">Day Streak</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-6">Your Badges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-lg border-2 p-5 ${
                    badge.earned
                      ? getRarityColor(badge.rarity)
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{badge.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{badge.name}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded capitalize ${
                          badge.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-900' :
                          badge.rarity === 'epic' ? 'bg-purple-200 text-purple-900' :
                          badge.rarity === 'rare' ? 'bg-blue-200 text-blue-900' :
                          'bg-gray-200 text-gray-900'
                        }`}>
                          {badge.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                      {badge.earned ? (
                        <p className="text-xs text-green-600">Earned on {badge.earnedDate}</p>
                      ) : badge.progress !== undefined ? (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-primary">{badge.progress}/{badge.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                              style={{ width: `${(badge.progress / badge.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not yet earned</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-6">Reward Shop</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewardShop.map((reward) => {
                const Icon = reward.icon;
                const canAfford = userRewards.totalRice >= reward.cost;
                return (
                  <div
                    key={reward.id}
                    className={`rounded-lg border-2 p-5 ${
                      canAfford
                        ? 'border-primary bg-primary/5 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    } transition-shadow cursor-pointer`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{reward.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Trophy className="w-4 h-4" />
                            <span className="font-medium">{reward.cost}</span>
                          </div>
                          <button
                            disabled={!canAfford}
                            className={`px-4 py-1 text-sm rounded-lg transition-colors ${
                              canAfford
                                ? 'bg-primary text-primary-foreground hover:opacity-90'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'Redeem' : 'Not Enough Rice'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 sticky top-8">
            <h3 className="mb-4">Level Progress</h3>
            <div className="text-center mb-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold mb-2">
                {userRewards.level}
              </div>
              <p className="text-sm text-muted-foreground">Current Level</p>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Next Level</span>
                <span className="text-primary">{userRewards.nextLevelRice} rice needed</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Earn more rice to level up and unlock exclusive rewards!
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.action}</div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 font-medium">
                    <Trophy className="w-4 h-4" />
                    <span>+{activity.rice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="mb-3">Ways to Earn Rice</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Complete lessons</span>
                  <span className="text-muted-foreground"> - 50 rice</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Submit projects</span>
                  <span className="text-muted-foreground"> - 100 rice</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Daily login</span>
                  <span className="text-muted-foreground"> - 10 rice</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Help community</span>
                  <span className="text-muted-foreground"> - 20 rice</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
