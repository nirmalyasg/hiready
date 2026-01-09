import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Target, 
  BarChart3, 
  User, 
  LogOut, 
  ChevronLeft,
  Sparkles,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNav from './mobile-bottom-nav';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { href: '/avatar/dashboard', label: 'Dashboard', icon: Home },
    { href: '/interview', label: 'Practice', icon: Target },
    { href: '/avatar/results', label: 'Results', icon: BarChart3 },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
  ];

  const isActive = (href: string) => {
    const path = location.pathname;
    
    // Special case: /interview/results should highlight Results, not Practice
    if (path.startsWith('/interview/results')) {
      return href === '/avatar/results';
    }
    
    return path === href || path.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className={cn(
        "hidden lg:block fixed top-0 left-0 h-full bg-gradient-to-b from-violet-900 via-indigo-900 to-purple-900 z-50 transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-60"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "h-16 flex items-center px-5",
            collapsed && "justify-center px-0"
          )}>
            <Link to="/" className={cn("flex items-center gap-2.5", collapsed && "hidden")}>
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold tracking-tight">Hiready</span>
            </Link>
            {collapsed && (
              <Link to="/">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/30">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </Link>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active 
                      ? "bg-white/15 text-white shadow-lg shadow-violet-900/20" 
                      : "text-violet-200 hover:text-white hover:bg-white/10",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className={cn(collapsed && "hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 mt-auto">
            {isLoading ? (
              <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className={cn("space-y-2", collapsed && "space-y-2")}>
                <div className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5",
                  collapsed && "justify-center px-0"
                )}>
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={cn("flex-1 min-w-0", collapsed && "hidden")}>
                    <p className="text-sm font-medium text-white truncate">
                      {user.firstName || user.username || 'User'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-violet-300 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  <span className={cn(collapsed && "hidden")}>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors",
                  collapsed && "px-3"
                )}
              >
                <User className="w-4 h-4" />
                <span className={cn(collapsed && "hidden")}>Sign in</span>
              </Link>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-10 border-t border-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "lg:pl-20" : "lg:pl-60",
        "pb-20 lg:pb-0"
      )}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default SidebarLayout;
