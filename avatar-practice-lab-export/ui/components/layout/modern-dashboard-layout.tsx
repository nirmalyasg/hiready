import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Target, BarChart3, User, LogOut, LogIn, Menu, X } from 'lucide-react';
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
    { href: '/avatar/dashboard', label: 'Dashboard', icon: Home },
    { href: '/avatar/start', label: 'Practice', icon: Target },
    { href: '/avatar/results', label: 'Results', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-light/5 to-white">
      <header className="bg-white border-b border-brand-light/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3">
              <img src={a3cendLogo} alt="A3CEND" className="h-7" />
              <div className="h-5 w-px bg-brand-light/40" />
              <span className="text-sm font-medium text-brand-dark tracking-wide">AI Practice Lab</span>
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
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-brand-light/20 text-brand-dark" 
                        : "text-brand-dark/70 hover:bg-brand-light/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.firstName || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 hidden lg:block">
                      {user.firstName || user.username || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      window.location.href = '/';
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-brand-dark/60 hover:text-brand-dark hover:bg-brand-light/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:bg-brand-accent/90 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Link>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-brand-light/20 text-brand-dark" 
                        : "text-brand-dark/70 hover:bg-brand-light/10"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              {isAuthenticated && user && (
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-dark/70 hover:bg-brand-light/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              )}
              
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-primary"
                >
                  <LogIn className="w-5 h-5" />
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
