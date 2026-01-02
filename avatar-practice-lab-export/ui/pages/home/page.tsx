import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Target, 
  Brain, 
  ArrowRight, 
  User, 
  LogOut, 
  Menu, 
  X,
  Mic,
  Video,
  Sparkles,
  CheckCircle2,
  Play
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import a3cendLogo from '@/assets/a3cend-logo.png';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-dark overflow-hidden">
      {/* Header */}
      <header className="relative z-50">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Practice Lab</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/avatar/start" className="text-white/70 hover:text-white font-medium transition-colors">
              Practice
            </Link>
            <Link to="/interview" className="text-white/70 hover:text-white font-medium transition-colors">
              Interviews
            </Link>
            {isAuthenticated ? (
              <Link to="/avatar/dashboard" className="text-white/70 hover:text-white font-medium transition-colors">
                Dashboard
              </Link>
            ) : null}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.firstName || 'User'} className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-accent flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-white">{user.firstName || user.username}</span>
                </div>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-white/70 hover:text-white font-medium transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/avatar/start"
                  className="px-6 py-2.5 bg-brand-accent text-white rounded-full font-semibold hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/30"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-brand-dark/95 backdrop-blur-xl border-t border-white/10 p-6 space-y-4">
            <Link to="/avatar/start" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
              Practice
            </Link>
            <Link to="/interview" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
              Interviews
            </Link>
            {isAuthenticated && (
              <Link to="/avatar/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
                Dashboard
              </Link>
            )}
            <div className="pt-4 border-t border-white/10">
              {isAuthenticated ? (
                <button
                  onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/'; }}
                  className="w-full py-3 text-brand-accent font-medium text-left"
                >
                  Sign out
                </button>
              ) : (
                <Link to="/avatar/start" onClick={() => setMobileMenuOpen(false)} className="block w-full py-3 bg-brand-accent text-white text-center rounded-xl font-semibold">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-32 lg:pt-24 lg:pb-40">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-light/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-medium mb-8">
              <Mic className="w-4 h-4 text-brand-accent" />
              Voice-First AI Practice
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Practice Real
              <span className="block text-brand-accent">Conversations</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-xl">
              Build confidence by rehearsing difficult conversations with AI avatars. 
              Get instant feedback on clarity, tone, and delivery.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/avatar/start"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-accent text-white rounded-2xl font-semibold text-lg hover:bg-brand-accent/90 transition-all shadow-xl shadow-brand-accent/30 group"
              >
                <Play className="w-5 h-5" />
                Start Practicing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/interview"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                <Video className="w-5 h-5" />
                Interview Prep
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
              Why Practice Lab?
            </h2>
            <p className="text-lg text-brand-muted max-w-2xl mx-auto">
              A safe space to practice, make mistakes, and improve before the real conversation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-3">Voice-First</h3>
                <p className="text-brand-muted leading-relaxed">
                  Speak naturally with AI avatars that understand context, emotion, and respond in real-time.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-light/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-3">Real Scenarios</h3>
                <p className="text-brand-muted leading-relaxed">
                  Practice feedback conversations, negotiations, conflicts, and interviews with realistic AI personas.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-3">AI Coaching</h3>
                <p className="text-brand-muted leading-relaxed">
                  Get personalized feedback on what you said, how you said it, and how to improve next time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6">
                Practice What Matters
              </h2>
              <p className="text-lg text-brand-muted mb-8">
                From everyday workplace conversations to high-stakes interviews, 
                we've got you covered.
              </p>
              
              <div className="space-y-4">
                {[
                  'Giving & receiving feedback',
                  'Difficult conversations',
                  'Job interviews',
                  'Negotiations',
                  'Conflict resolution',
                  'Public speaking'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-brand-dark font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/avatar/start"
                className="inline-flex items-center gap-2 mt-8 text-brand-accent font-semibold hover:gap-3 transition-all"
              >
                Explore all scenarios
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/20 to-brand-dark/10 rounded-3xl blur-2xl" />
              <div className="relative bg-brand-dark rounded-3xl p-8 lg:p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Ready to start?</h3>
                  <p className="text-white/60 mb-8">
                    No setup required. Just start talking.
                  </p>
                  <Link
                    to="/avatar/start"
                    className="inline-flex items-center justify-center w-full py-4 bg-white text-brand-dark rounded-xl font-semibold hover:bg-white/90 transition-colors"
                  >
                    Begin Practice Session
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">Practice Lab</span>
          </div>
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Ascend Business Solutions. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
