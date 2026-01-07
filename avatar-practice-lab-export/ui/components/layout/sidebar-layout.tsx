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
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className={cn(
        "hidden lg:block fixed top-0 left-0 h-full bg-[#042c4c] z-50 transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "h-20 flex items-center border-b border-white/10 px-5",
            collapsed && "justify-center px-0"
          )}>
            <Link to="/" className={cn("flex items-center gap-3", collapsed && "hidden")}>
              <div className="w-9 h-9 bg-[#ee7e65] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Practice Lab</span>
            </Link>
            {collapsed && (
              <Link to="/">
                <div className="w-10 h-10 bg-[#ee7e65] rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </Link>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                    active 
                      ? "bg-white text-[#042c4c] shadow-lg" 
                      : "text-white/70 hover:text-white hover:bg-white/10",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", active && "text-[#ee7e65]")} />
                  <span className={cn(collapsed && "hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            {isLoading ? (
              <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className={cn("space-y-3", collapsed && "space-y-2")}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2",
                  collapsed && "justify-center px-0"
                )}>
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName || 'User'}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#ee7e65]/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#ee7e65]" />
                    </div>
                  )}
                  <div className={cn("flex-1 min-w-0", collapsed && "hidden")}>
                    <p className="text-sm font-medium text-white truncate">
                      {user.firstName || user.username || 'User'}
                    </p>
                    <p className="text-xs text-white/50 truncate">{user.email || 'Active'}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-[#ee7e65] hover:bg-white/5 rounded-xl transition-colors text-sm",
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
                  "flex items-center justify-center gap-2 px-4 py-3 bg-[#ee7e65] text-white rounded-xl font-semibold hover:bg-[#e06a50] transition-colors",
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
            className="flex items-center justify-center h-12 border-t border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "lg:pl-20" : "lg:pl-64",
        "pb-20 lg:pb-0" // Bottom padding for mobile nav
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
