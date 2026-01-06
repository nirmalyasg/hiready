import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Target, BarChart3, User, LogOut, LogIn, Menu, X, Briefcase, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import a3cendLogo from '@/assets/a3cend-logo.png';

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
}

export default function ModernDashboardLayout({ children }: ModernDashboardLayoutProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/interview', label: 'Practice', icon: Target },
    { href: '/avatar/dashboard', label: 'Dashboard', icon: Home },
    { href: '/avatar/results', label: 'Results', icon: BarChart3 },
    { href: '/jobs', label: 'Jobs', icon: FolderKanban },
  ];

  return (
    <div className="min-h-screen bg-brand-background">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src={a3cendLogo} alt="A3CEND" className="h-8" />
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-sm font-semibold text-brand-dark tracking-tight">AI Practice Lab</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-brand-dark text-white shadow-md" 
                        : "text-brand-muted hover:text-brand-dark hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-full">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.firstName || 'User'}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-brand-dark/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-brand-dark" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-brand-dark hidden lg:block">
                      {user.firstName || user.username || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      window.location.href = '/';
                    }}
                    className="flex items-center justify-center w-9 h-9 text-brand-muted hover:text-brand-accent hover:bg-brand-accent/10 rounded-full transition-all duration-200"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white rounded-xl text-sm font-semibold hover:bg-brand-accent/90 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Link>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 text-brand-dark hover:bg-gray-50 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-brand-dark text-white shadow-md" 
                        : "text-brand-muted hover:text-brand-dark hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="pt-3 mt-3 border-t border-gray-100">
                {isAuthenticated && user && (
                  <button
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      window.location.href = '/';
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-accent hover:bg-brand-accent/10 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
                )}
                
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-accent text-white rounded-xl text-sm font-semibold hover:bg-brand-accent/90 transition-all duration-200"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
