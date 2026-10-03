import { Flame, Clock, Calendar, TrendingUp, Target } from 'lucide-react';

interface ActivitySignalsProps {
  streak: number;
  totalLearningTime: number;
  weeklyFrequency: number;
  consistencyTrend: number[];
}

export function ActivitySignals({ streak, totalLearningTime, weeklyFrequency, consistencyTrend }: ActivitySignalsProps) {
  const maxTrend = Math.max(...consistencyTrend);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Activity Signals</h2>
        <p className="text-sm text-muted-foreground">Behavioral learning data reflecting discipline and engagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-orange-900">{streak}</div>
              <div className="text-xs text-orange-700">Day Streak</div>
            </div>
          </div>
          <div className="text-xs text-orange-600 mt-2">
            Keep going! 🔥
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-blue-900">{totalLearningTime}h</div>
              <div className="text-xs text-blue-700">Total Time</div>
            </div>
          </div>
          <div className="text-xs text-blue-600 mt-2">
            This month: +12h
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-purple-900">{weeklyFrequency}x</div>
              <div className="text-xs text-purple-700">Per Week</div>
            </div>
          </div>
          <div className="text-xs text-purple-600 mt-2">
            Highly active
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-green-900">+18%</div>
              <div className="text-xs text-green-700">Growth</div>
            </div>
          </div>
          <div className="text-xs text-green-600 mt-2">
            vs last month
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm">Consistency Trend (Last 12 Weeks)</h3>
          <span className="text-xs text-muted-foreground">Hours per week</span>
        </div>
        <div className="flex items-end gap-1 h-32">
          {consistencyTrend.map((value, index) => (
            <div
              key={index}
              className="flex-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group"
              style={{ height: `${(value / maxTrend) * 100}%` }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Week {index + 1}: {value}h
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>12 weeks ago</span>
          <span>Now</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Weekly Goal</span>
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">12h / 15h target</span>
              <span className="text-primary">80%</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                style={{ width: '80%' }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">3h more to reach your goal!</p>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Best Streak</span>
          </div>
          <div className="text-2xl font-semibold mb-1">45 days</div>
          <p className="text-xs text-muted-foreground">Feb 1 - Mar 17, 2026</p>
        </div>
      </div>
    </div>
  );
}
