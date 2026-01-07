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
  Sparkles,
  CheckCircle2,
  Play,
  Briefcase,
  Code,
  Users,
  BarChart3,
  Clock,
  Shield,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import practiceSelectionScreenshot from '@/assets/screenshots/interview-page.png';
import resultsScreenshot from '@/assets/screenshots/results-page.png';
import jobsScreenshot from '@/assets/screenshots/jobs-page.png';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = [
    { value: '15+', label: 'Role Kits' },
    { value: '4', label: 'Interview Types' },
    { value: '8', label: 'Scoring Dimensions' },
    { value: '10-15', label: 'Min Sessions' },
  ];

  const interviewTypes = [
    { 
      icon: Code, 
      title: 'Coding & Technical', 
      description: 'Practice coding problems, debugging, and technical discussions with AI feedback',
      color: 'bg-[#042c4c]'
    },
    { 
      icon: Briefcase, 
      title: 'Case & Problem Solving', 
      description: 'Master business cases, product cases, and structured problem-solving',
      color: 'bg-[#ee7e65]'
    },
    { 
      icon: MessageSquare, 
      title: 'Behavioral & Leadership', 
      description: 'Craft compelling STAR stories and demonstrate leadership qualities',
      color: 'bg-[#768c9c]'
    },
    { 
      icon: Users, 
      title: 'HR & Culture Fit', 
      description: 'Practice motivation questions, culture fit, and career alignment discussions',
      color: 'bg-[#6c8194]'
    },
  ];

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
            <Link to="/interview" className="text-white/70 hover:text-white font-medium transition-colors">
              Practice
            </Link>
            <Link to="/jobs" className="text-white/70 hover:text-white font-medium transition-colors">
              Jobs
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/avatar/dashboard" className="text-white/70 hover:text-white font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/avatar/results" className="text-white/70 hover:text-white font-medium transition-colors">
                  Results
                </Link>
              </>
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
                  to="/interview"
                  className="px-6 py-2.5 bg-brand-accent text-white rounded-full font-semibold hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/30"
                >
                  Get Started Free
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
            <Link to="/interview" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
              Practice
            </Link>
            <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
              Jobs
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/avatar/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
                  Dashboard
                </Link>
                <Link to="/avatar/results" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
                  Results
                </Link>
              </>
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
                <Link to="/interview" onClick={() => setMobileMenuOpen(false)} className="block w-full py-3 bg-brand-accent text-white text-center rounded-xl font-semibold">
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-light/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-medium mb-6">
                <Zap className="w-4 h-4 text-brand-accent" />
                AI-Powered Interview Practice
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Ace Your Next
                <span className="block text-brand-accent">Interview</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/60 mb-8 max-w-xl">
                Practice with AI interviewers that adapt to your role, provide real-time feedback, 
                and help you prepare for coding, case studies, behavioral, and HR rounds.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to="/interview"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-accent text-white rounded-2xl font-semibold text-lg hover:bg-brand-accent/90 transition-all shadow-xl shadow-brand-accent/30 group"
                >
                  <Play className="w-5 h-5" />
                  Start Practicing
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/jobs"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
                >
                  <Briefcase className="w-5 h-5" />
                  Import Job
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Screenshot */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/30 to-brand-light/20 rounded-3xl blur-2xl transform rotate-3" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src={practiceSelectionScreenshot} 
                  alt="Interview Practice Selection" 
                  className="w-full h-auto"
                />
              </div>
              <div className="hidden sm:block absolute -bottom-4 -right-4 bg-white rounded-xl p-3 shadow-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Session Complete</div>
                    <div className="text-sm font-semibold text-gray-900">8.5/10 Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interview Types Section */}
      <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
              Practice Every Interview Type
            </h2>
            <p className="text-lg text-brand-muted max-w-2xl mx-auto">
              From coding challenges to behavioral questions, we cover all the rounds you'll face.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {interviewTypes.map((type, idx) => {
              const IconComponent = type.icon;
              return (
                <Link
                  key={idx}
                  to="/interview"
                  className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className={`w-14 h-14 ${type.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-dark mb-2 group-hover:text-brand-accent transition-colors">
                    {type.title}
                  </h3>
                  <p className="text-sm text-brand-muted leading-relaxed">
                    {type.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results Dashboard Screenshot Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/10 to-brand-accent/10 rounded-3xl blur-2xl transform -rotate-3" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                  <img 
                    src={resultsScreenshot} 
                    alt="Interview Results Dashboard" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-4">
                <BarChart3 className="w-4 h-4" />
                Detailed Analytics
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6">
                8-Dimension Scoring & Actionable Feedback
              </h2>
              <p className="text-lg text-brand-muted mb-8">
                Get comprehensive analysis of your performance across 8 key dimensions, 
                with specific examples and improvement suggestions for each area.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  { label: 'Clarity & Structure', desc: 'How well you organize and present your thoughts' },
                  { label: 'Problem Solving', desc: 'Your approach to breaking down complex problems' },
                  { label: 'Communication Style', desc: 'Tone, pace, and confidence in delivery' },
                  { label: 'Role Fit Evidence', desc: 'How well you demonstrate relevant experience' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-brand-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                    </div>
                    <div>
                      <span className="font-medium text-brand-dark">{item.label}</span>
                      <span className="text-brand-muted"> - {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/interview"
                className="inline-flex items-center gap-2 text-brand-accent font-semibold hover:gap-3 transition-all"
              >
                Try a practice session
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Job Tracking Section */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ee7e65]/20 rounded-full text-[#ee7e65] text-sm font-medium mb-4">
                <Briefcase className="w-4 h-4" />
                Job-Specific Prep
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Practice for Your Target Jobs
              </h2>
              <p className="text-lg text-white/60 mb-8">
                Import job postings from LinkedIn, Indeed, or paste descriptions. 
                Get tailored interview questions based on actual job requirements.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Target, label: 'Job-Specific Questions' },
                  { icon: Brain, label: 'AI-Parsed Requirements' },
                  { icon: Clock, label: 'Track All Applications' },
                  { icon: Star, label: 'Company Insights' },
                ].map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <IconComponent className="w-5 h-5 text-brand-accent" />
                      <span className="text-white/80 text-sm font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ee7e65] text-white rounded-xl font-semibold hover:bg-[#e06a50] transition-colors"
              >
                <Briefcase className="w-5 h-5" />
                Import a Job
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ee7e65]/30 to-[#768c9c]/20 rounded-3xl blur-2xl transform rotate-3" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src={jobsScreenshot} 
                  alt="Job Tracking Dashboard" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
              How It Works
            </h2>
            <p className="text-lg text-brand-muted max-w-2xl mx-auto">
              Get started in minutes. No complex setup required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Choose Your Path',
                description: 'Select a role kit, interview type, or import a specific job you\'re applying for.'
              },
              {
                step: '02',
                title: 'Practice with AI',
                description: 'Have a realistic conversation with an AI interviewer that adapts to your responses.'
              },
              {
                step: '03',
                title: 'Get Detailed Feedback',
                description: 'Receive comprehensive analysis with scores, specific examples, and improvement tips.'
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-bold text-brand-accent/10 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-8">
                  <h3 className="text-xl font-bold text-brand-dark mb-3">{item.title}</h3>
                  <p className="text-brand-muted leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-brand-dark to-[#0a3d5c] rounded-3xl p-10 lg:p-16">
            <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Ace Your Interview?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Join thousands of professionals who've improved their interview skills with Practice Lab.
            </p>
            <Link
              to="/interview"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-brand-accent text-white rounded-2xl font-semibold text-lg hover:bg-brand-accent/90 transition-all shadow-xl shadow-brand-accent/30 group"
            >
              <Play className="w-5 h-5" />
              Start Your First Session
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">Practice Lab</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/interview" className="text-white/60 hover:text-white text-sm transition-colors">
                Practice
              </Link>
              <Link to="/jobs" className="text-white/60 hover:text-white text-sm transition-colors">
                Jobs
              </Link>
              <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">
                Sign In
              </Link>
            </div>
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Ascend Business Solutions
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
