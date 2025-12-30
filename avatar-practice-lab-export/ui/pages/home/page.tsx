import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Target, Brain, ArrowRight, User, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import a3cendLogo from '@/assets/a3cend-logo.png';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-light/5 to-white flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 sm:gap-4">
            <img src={a3cendLogo} alt="A3CEND" className="h-7 sm:h-9" />
            <div className="h-5 sm:h-6 w-px bg-brand-light/40" />
            <span className="text-sm sm:text-lg font-medium text-brand-dark tracking-wide">AI Practice Lab</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/avatar/dashboard"
                  className="text-brand-dark/70 hover:text-brand-primary font-medium"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-light/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-brand-primary" />
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
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-brand-dark/70 hover:text-brand-primary font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/avatar/start"
                  className="bg-brand-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-accent/90 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-brand-dark hover:bg-brand-light/10 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-brand-light/20 bg-white px-4 py-4 space-y-3">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-brand-light/20">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.firstName || 'User'} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-light/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-primary" />
                    </div>
                  )}
                  <span className="font-medium text-brand-dark">{user.firstName || user.username || 'User'}</span>
                </div>
                <Link to="/avatar/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-brand-dark font-medium">
                  Dashboard
                </Link>
                <Link to="/avatar/start" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-brand-dark font-medium">
                  Practice
                </Link>
                <button
                  onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/'; }}
                  className="w-full text-left py-2 text-brand-dark/70"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-brand-dark font-medium">
                  Sign in
                </Link>
                <Link to="/avatar/start" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center bg-brand-accent text-white py-3 rounded-lg font-medium">
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-14 flex-1">
        <section className="text-center max-w-4xl mx-auto mb-8 sm:mb-16 md:mb-20">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-brand-dark mb-3 sm:mb-5 md:mb-6 leading-tight">
            Practice Real Conversations<br className="hidden sm:block" /><span className="sm:hidden"> </span>Before They Happen
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-brand-dark/70 mb-5 sm:mb-8 md:mb-10 max-w-2xl mx-auto">
            Voice-based AI practice lab for thinking clearly, speaking confidently, and handling difficult conversations.
          </p>
          <Link
            to="/avatar/start"
            className="inline-flex items-center gap-2 bg-brand-accent text-white px-6 sm:px-8 py-2.5 sm:py-4 rounded-xl text-sm sm:text-lg font-medium hover:bg-brand-accent/90 transition-colors shadow-lg shadow-brand-accent/30"
          >
            Start Practicing
            <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
          </Link>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 md:gap-6 lg:gap-8 max-w-5xl mx-auto mb-8 sm:mb-16 md:mb-20">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-brand-light/20 flex items-start gap-3 sm:block">
            <div className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 bg-brand-light/20 rounded-lg sm:rounded-xl flex items-center justify-center sm:mb-4 md:mb-6 flex-shrink-0">
              <MessageSquare className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-brand-dark mb-0.5 sm:mb-2 md:mb-3">Voice-First Practice</h3>
              <p className="text-xs sm:text-sm md:text-base text-brand-dark/70">
                Speak naturally with an AI avatar that responds in real-time.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-brand-light/20 flex items-start gap-3 sm:block">
            <div className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 bg-brand-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center sm:mb-4 md:mb-6 flex-shrink-0">
              <Target className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-brand-accent" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-brand-dark mb-0.5 sm:mb-2 md:mb-3">Real Scenarios</h3>
              <p className="text-xs sm:text-sm md:text-base text-brand-dark/70">
                Practice feedback, conflict, and stakeholder conversations.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-brand-light/20 flex items-start gap-3 sm:block">
            <div className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 bg-brand-accent-light/20 rounded-lg sm:rounded-xl flex items-center justify-center sm:mb-4 md:mb-6 flex-shrink-0">
              <Brain className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-brand-accent" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-brand-dark mb-0.5 sm:mb-2 md:mb-3">AI Feedback</h3>
              <p className="text-xs sm:text-sm md:text-base text-brand-dark/70">
                Personalized analysis on clarity, presence, and handling tension.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center max-w-3xl mx-auto px-2 hidden sm:block">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark mb-4 sm:mb-5 md:mb-6">
            Not a chatbot. Not a language app.
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-brand-dark/70 mb-6 sm:mb-8 md:mb-10">
            This is a safe, realistic environment where you practice how you think, speak, 
            listen, and respond in real-life conversations. The AI plays the role of the 
            other person. The app plays the role of your coach.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-light/20 rounded-full text-brand-dark text-xs sm:text-sm">Workplace & Leadership</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-light/20 rounded-full text-brand-dark text-xs sm:text-sm">Difficult Feedback</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-light/20 rounded-full text-brand-dark text-xs sm:text-sm">Conflict Resolution</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-light/20 rounded-full text-brand-dark text-xs sm:text-sm">Interview Prep</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-light/20 rounded-full text-brand-dark text-xs sm:text-sm">Personal Growth</span>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 border-t border-brand-light/20 pb-20 sm:pb-12 mt-auto">
        <div className="text-center space-y-2">
          <div className="text-brand-dark/70 text-xs sm:text-sm">
            AI Practice Lab - Practice conversations before they happen
          </div>
          <div className="text-brand-dark/50 text-xs">
            © {new Date().getFullYear()} Ascend Business Solutions Pvt Ltd. All rights reserved.
          </div>
        </div>
      </footer>

      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
}
