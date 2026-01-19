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
  Award,
  Layers,
  TrendingUp,
  Users
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

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navSections: NavSection[] = [
    {
      items: [
        { href: '/interview', label: 'Practice', icon: Target },
      ]
    },
    {
      title: 'PREPARE',
      items: [
        { href: '/jobs', label: 'Jobs', icon: Briefcase },
        { href: '/interview/roles', label: 'Roles', icon: Users },
        { href: '/interview/by-type', label: 'By Type', icon: Layers },
      ]
    },
    {
      title: 'PROGRESS',
      items: [
        { href: '/hiready-index', label: 'HiReady Index', icon: TrendingUp },
        { href: '/avatar/results', label: 'Results', icon: BarChart3 },
      ]
    },
  ];

  const isActive = (href: string) => {
    const path = location.pathname;
    
    if (path.startsWith('/interview/results')) {
      return href === '/avatar/results';
    }
    
    return path === href || path.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <aside className={cn(
        "hidden lg:block fixed top-0 left-0 h-full bg-[#042c4c] z-50 transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-60"
      )}>
        <div className="flex flex-col h-full">
          <div className={cn(
            "h-16 flex items-center px-5",
            collapsed && "justify-center px-0"
          )}>
            <Link to="/interview" className={cn("flex items-center gap-2.5", collapsed && "hidden")}>
              <img src={logoImg} alt="Hiready" className="h-8 brightness-0 invert" />
            </Link>
            {collapsed && (
              <Link to="/interview">
                <div className="w-9 h-9 bg-[#ee7e65] rounded-xl flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
              </Link>
            )}
          </div>

          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={cn(sectionIndex > 0 && "mt-5")}>
                {section.title && !collapsed && (
                  <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </p>
                )}
                {section.title && collapsed && (
                  <div className="h-px bg-white/10 mx-2 mb-2" />
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const isPractice = item.href === '/interview';
                    
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          active 
                            ? "bg-[#ee7e65] text-white shadow-lg shadow-[#ee7e65]/20" 
                            : isPractice
                              ? "text-white hover:bg-white/10"
                              : "text-[#768c9c] hover:text-white hover:bg-white/10",
                          collapsed && "justify-center px-0"
                        )}
                      >
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                        <span className={cn(collapsed && "hidden")}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
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
                      ? "bg-[#ee7e65] text-white"
                      : "text-[#768c9c] hover:text-white hover:bg-white/10",
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
                    <div className="w-7 h-7 rounded-full bg-[#ee7e65] flex items-center justify-center">
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
                    "w-full flex items-center gap-2.5 px-3 py-2 text-[#768c9c] hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm",
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
                  "flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ee7e65] text-white rounded-xl text-sm font-medium hover:bg-[#e06d54] transition-colors",
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
