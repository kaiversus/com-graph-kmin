import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router';
import { LayoutDashboard, BookOpen, FolderKanban, Users, User, Bell, Settings, MessageCircle, Trophy, Map, Gift, Network, ClipboardCheck, ChevronDown, Sun, Moon, Compass, ShieldCheck } from 'lucide-react';

export function Layout() {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {
        // ignore storage errors (e.g. private browsing)
      }
      return next;
    });
  };

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
    { to: '/skill-graph/explore', icon: Compass, label: 'Skill Explorer' },
    { to: '/skill-graph/admin', icon: ShieldCheck, label: 'Skill Graph Admin' },
    { to: '/assessment', icon: ClipboardCheck, label: 'Assessment' }
  ];

  // Longest matching prefix wins, so /skill-graph/admin isn't claimed by /skill-graph
  const matches = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`);
  const activeItem = [...navItems].sort((a, b) => b.to.length - a.to.length).find(item => matches(item.to)) ?? navItems[0];
  // An item whose path is a parent of another item's path only matches exactly
  const hasChildItem = (to: string) => navItems.some(o => o.to !== to && o.to.startsWith(`${to}/`));

  useEffect(() => {
    if (!navOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navOpen]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                <span>C</span>
              </div>
              <h2 className="text-lg hidden sm:block">COM Platform</h2>
            </div>

            <div className="hidden md:block relative" ref={navRef}>
              <button
                onClick={() => setNavOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
              >
                <activeItem.icon className="w-4 h-4" />
                <span>{activeItem.label}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${navOpen ? 'rotate-180' : ''}`} />
              </button>

              {navOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-1.5 z-20">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.to === activeItem.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/' || hasChildItem(item.to)}
                        className={`flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className="p-2 hover:bg-muted rounded-lg"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
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
                end={item.to === '/' || hasChildItem(item.to)}
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
