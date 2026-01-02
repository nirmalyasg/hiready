import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Target, 
  BarChart3, 
  Briefcase, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft,
  Sparkles,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import a3cendLogo from '@/assets/a3cend-logo.png';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/avatar/dashboard', label: 'Dashboard', icon: Home },
    { href: '/avatar/start', label: 'Practice', icon: Target },
    { href: '/interview', label: 'Interviews', icon: Briefcase },
    { href: '/avatar/results', label: 'Results', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={a3cendLogo} alt="A3CEND" className="h-7" />
          <span className="text-sm font-bold text-brand-dark">Practice Lab</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 flex items-center justify-center text-brand-dark hover:bg-gray-50 rounded-xl transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-brand-dark z-50 transition-all duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-20" : "lg:w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "h-16 lg:h-20 flex items-center border-b border-white/10 px-5",
            collapsed && "lg:justify-center lg:px-0"
          )}>
            <Link to="/" className={cn("flex items-center gap-3", collapsed && "lg:hidden")}>
              <div className="w-9 h-9 bg-brand-accent rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Practice Lab</span>
            </Link>
            {collapsed && (
              <Link to="/" className="hidden lg:flex">
                <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </Link>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                    active 
                      ? "bg-white text-brand-dark shadow-lg" 
                      : "text-white/70 hover:text-white hover:bg-white/10",
                    collapsed && "lg:justify-center lg:px-0"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", active && "text-brand-accent")} />
                  <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            {isLoading ? (
              <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className={cn("space-y-3", collapsed && "lg:space-y-2")}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2",
                  collapsed && "lg:justify-center lg:px-0"
                )}>
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName || 'User'}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-accent/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-brand-accent" />
                    </div>
                  )}
                  <div className={cn("flex-1 min-w-0", collapsed && "lg:hidden")}>
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
                    "w-full flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-brand-accent hover:bg-white/5 rounded-xl transition-colors text-sm",
                    collapsed && "lg:justify-center lg:px-0"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  <span className={cn(collapsed && "lg:hidden")}>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 bg-brand-accent text-white rounded-xl font-semibold hover:bg-brand-accent/90 transition-colors",
                  collapsed && "lg:px-3"
                )}
              >
                <User className="w-4 h-4" />
                <span className={cn(collapsed && "lg:hidden")}>Sign in</span>
              </Link>
            )}
          </div>

          {/* Collapse Toggle - Desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center h-12 border-t border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen pt-16 lg:pt-0 transition-all duration-300",
        collapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
