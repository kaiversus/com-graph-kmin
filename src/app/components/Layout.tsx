import { Outlet, NavLink } from 'react-router';
import { LayoutDashboard, BookOpen, FolderKanban, Users, User, Bell, Settings, MessageCircle, Trophy, Map, Gift, Network, ClipboardCheck } from 'lucide-react';

export function Layout() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/mentors', icon: Users, label: 'Mentors' },
    { to: '/community', icon: MessageCircle, label: 'Community' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/learning-path', icon: Map, label: 'Path' },
    { to: '/rewards', icon: Gift, label: 'Rewards' },
    { to: '/portfolio', icon: User, label: 'Portfolio' },
    { to: '/skill-graph', icon: Network, label: 'Skill Graph' },
    { to: '/assessment', icon: ClipboardCheck, label: 'Assessment' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  <span>C</span>
                </div>
                <h2 className="text-lg">COM Platform</h2>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-muted rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <NavLink to="/settings" className="p-2 hover:bg-muted rounded-lg">
                <Settings className="w-5 h-5" />
              </NavLink>
              <NavLink to="/portfolio" className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm cursor-pointer">
                AM
              </NavLink>
            </div>
          </div>
        </div>
      </header>

      <div className="md:hidden border-b border-border">
        <nav className="flex overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-4 py-3 min-w-max ${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
