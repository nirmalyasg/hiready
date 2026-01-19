import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Target, 
  BarChart3, 
  User, 
  LogOut, 
  ChevronLeft,
  Briefcase,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNav from './mobile-bottom-nav';
import logoImg from '@/assets/logo.png';

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
    { href: '/hiready-index', label: 'Hiready Index', icon: Award },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
  ];

  const isActive = (href: string) => {
    const path = location.pathname;
    
    if (path.startsWith('/interview/results')) {
      return href === '/avatar/results';
    }
    
    return path === href || path.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      <aside className={cn(
        "hidden lg:block fixed top-0 left-0 h-full bg-[#000000] z-50 transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-60"
      )}>
        <div className="flex flex-col h-full">
          <div className={cn(
            "h-16 flex items-center px-5",
            collapsed && "justify-center px-0"
          )}>
            <Link to="/" className={cn("flex items-center gap-2.5", collapsed && "hidden")}>
              <img src={logoImg} alt="Hiready" className="h-8 brightness-0 invert" />
            </Link>
            {collapsed && (
              <Link to="/">
                <div className="w-9 h-9 bg-[#24c4b8] rounded-xl flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
              </Link>
            )}
          </div>

          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
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
                      ? "bg-[#24c4b8] text-white shadow-lg shadow-[#24c4b8]/20" 
                      : "text-gray-400 hover:text-white hover:bg-white/10",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className={cn(collapsed && "hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 mt-auto">
            {isLoading ? (
              <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className={cn("space-y-1", collapsed && "space-y-1")}>
                <Link
                  to="/profile"
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all",
                    isActive('/profile')
                      ? "bg-[#24c4b8] text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName || 'User'}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#cb6ce6] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn("flex-1 min-w-0", collapsed && "hidden")}>
                    <p className="text-sm font-medium truncate">
                      {user.firstName || user.username || 'Profile'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm",
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
                  "flex items-center justify-center gap-2 px-4 py-2.5 bg-[#24c4b8] text-white rounded-xl text-sm font-medium hover:bg-[#1db0a5] transition-colors",
                  collapsed && "px-3"
                )}
              >
                <User className="w-4 h-4" />
                <span className={cn(collapsed && "hidden")}>Sign in</span>
              </Link>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-10 border-t border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>

      <main className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "lg:pl-20" : "lg:pl-60",
        "pb-20 lg:pb-0"
      )}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}

export default SidebarLayout;
