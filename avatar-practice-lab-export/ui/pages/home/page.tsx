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
    <div className="min-h-screen bg-brand-background flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={a3cendLogo} alt="A3CEND" className="h-8" />
            <div className="h-6 w-px bg-gray-200" />
            <span className="text-sm font-semibold text-brand-dark tracking-tight">AI Practice Lab</span>
          </Link>
          
          <div className="hidden sm:flex items-center gap-4">
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/avatar/dashboard"
                  className="text-brand-muted hover:text-brand-dark font-medium transition-colors"
                >
                  Dashboard
                </Link>
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
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-brand-muted hover:text-brand-dark font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/avatar/start"
                  className="bg-brand-accent text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-accent/90 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden flex items-center justify-center w-10 h-10 text-brand-dark hover:bg-gray-50 rounded-xl transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.firstName || 'User'} className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-dark/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-dark" />
                    </div>
                  )}
                  <span className="font-semibold text-brand-dark">{user.firstName || user.username || 'User'}</span>
                </div>
                <Link to="/avatar/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-brand-dark font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Dashboard
                </Link>
                <Link to="/avatar/start" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-brand-dark font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Practice
                </Link>
                <button
                  onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/'; }}
                  className="w-full text-left py-3 px-4 text-brand-accent font-medium rounded-xl hover:bg-brand-accent/10 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-brand-dark font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Sign in
                </Link>
                <Link to="/avatar/start" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center bg-brand-accent text-white py-3 rounded-xl font-semibold shadow-md">
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-20 flex-1">
        <section className="text-center max-w-4xl mx-auto mb-12 sm:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark mb-4 sm:mb-6 leading-tight">
            Practice Real Conversations<br className="hidden sm:block" /><span className="sm:hidden"> </span>Before They Happen
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-brand-muted mb-8 sm:mb-10 max-w-2xl mx-auto">
            Voice-based AI practice lab for thinking clearly, speaking confidently, and handling difficult conversations.
          </p>
          <Link
            to="/avatar/start"
            className="inline-flex items-center gap-2 bg-brand-accent text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Practicing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12 sm:mb-20">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="w-14 h-14 bg-brand-dark/10 rounded-xl flex items-center justify-center mb-5">
              <MessageSquare className="w-7 h-7 text-brand-dark" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">Voice-First Practice</h3>
            <p className="text-sm sm:text-base text-brand-muted">
              Speak naturally with an AI avatar that responds in real-time.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="w-14 h-14 bg-brand-accent/10 rounded-xl flex items-center justify-center mb-5">
              <Target className="w-7 h-7 text-brand-accent" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">Real Scenarios</h3>
            <p className="text-sm sm:text-base text-brand-muted">
              Practice feedback, conflict, and stakeholder conversations.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 sm:col-span-2 md:col-span-1">
            <div className="w-14 h-14 bg-brand-light/20 rounded-xl flex items-center justify-center mb-5">
              <Brain className="w-7 h-7 text-brand-light" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">AI Feedback</h3>
            <p className="text-sm sm:text-base text-brand-muted">
              Personalized analysis on clarity, presence, and handling tension.
            </p>
          </div>
        </section>

        <section className="text-center max-w-3xl mx-auto hidden sm:block">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-6">
            Not a chatbot. Not a language app.
          </h2>
          <p className="text-base md:text-lg text-brand-muted mb-8">
            This is a safe, realistic environment where you practice how you think, speak, 
            listen, and respond in real-life conversations. The AI plays the role of the 
            other person. The app plays the role of your coach.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-gray-100 rounded-full text-brand-dark text-sm font-medium">Workplace & Leadership</span>
            <span className="px-4 py-2 bg-gray-100 rounded-full text-brand-dark text-sm font-medium">Difficult Feedback</span>
            <span className="px-4 py-2 bg-gray-100 rounded-full text-brand-dark text-sm font-medium">Conflict Resolution</span>
            <span className="px-4 py-2 bg-gray-100 rounded-full text-brand-dark text-sm font-medium">Interview Prep</span>
            <span className="px-4 py-2 bg-gray-100 rounded-full text-brand-dark text-sm font-medium">Personal Growth</span>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 pb-20 sm:pb-0 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center space-y-2">
            <div className="text-brand-muted text-sm">
              AI Practice Lab - Practice conversations before they happen
            </div>
            <div className="text-brand-muted/70 text-xs">
              © {new Date().getFullYear()} Ascend Business Solutions Pvt Ltd. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
}
