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
  Star,
  Download,
  Share2,
  FileText,
  Award,
  TrendingUp,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const howItWorksSteps = [
    {
      step: '1',
      title: 'Upload your job description',
      description: 'Or choose from our Role Library with 15+ pre-built interview kits.'
    },
    {
      step: '2',
      title: 'Practice with AI interviewer',
      description: 'Face realistic interviews across HR, behavioral, technical, and case rounds.'
    },
    {
      step: '3',
      title: 'Get your Hiready Index™',
      description: 'A measurable scorecard of your readiness with detailed insights.'
    },
  ];

  const indexMetrics = [
    { name: 'Clarity', icon: MessageSquare },
    { name: 'Confidence', icon: Shield },
    { name: 'Structure', icon: Target },
    { name: 'Problem-Solving', icon: Brain },
    { name: 'Role Fit', icon: Briefcase },
  ];

  const interviewTypes = [
    { 
      icon: Code, 
      title: 'Technical', 
      description: 'Coding problems, system design, and technical discussions',
      color: 'bg-[#042c4c]'
    },
    { 
      icon: Briefcase, 
      title: 'Case Studies', 
      description: 'Business cases, product cases, and structured problem-solving',
      color: 'bg-[#ee7e65]'
    },
    { 
      icon: MessageSquare, 
      title: 'Behavioral', 
      description: 'STAR stories, leadership examples, and competency questions',
      color: 'bg-[#768c9c]'
    },
    { 
      icon: Users, 
      title: 'HR & Culture', 
      description: 'Motivation, culture fit, and career alignment discussions',
      color: 'bg-[#6c8194]'
    },
  ];

  return (
    <div className="min-h-screen bg-brand-dark overflow-hidden">
      <header className="relative z-50">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Hiready</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/readycheck" className="text-white/70 hover:text-white font-medium transition-colors">
              Practice
            </Link>
            <Link to="/interview" className="text-white/70 hover:text-white font-medium transition-colors">
              Role Library
            </Link>
            <Link to="/employer/login" className="text-white/70 hover:text-white font-medium transition-colors">
              For Employers
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
                  to="/readycheck"
                  className="px-6 py-2.5 bg-brand-accent text-white rounded-full font-semibold hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/30"
                >
                  Start Free Interview
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

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-brand-dark/95 backdrop-blur-xl border-t border-white/10 p-6 space-y-4">
            <Link to="/readycheck" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
              Practice
            </Link>
            <Link to="/interview" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
              Role Library
            </Link>
            <Link to="/employer/login" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white font-medium">
              For Employers
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
                <Link to="/readycheck" onClick={() => setMobileMenuOpen(false)} className="block w-full py-3 bg-brand-accent text-white text-center rounded-xl font-semibold">
                  Start Free Interview
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-light/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-medium mb-6">
              <Award className="w-4 h-4 text-brand-accent" />
              Your Interview Readiness Index
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Your CV tells your story.
              <span className="block text-brand-accent">Hiready shows your readiness.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Practice real interviews, get your Readiness Scorecard, and show the world how prepared you are.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/readycheck"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-accent text-white rounded-2xl font-semibold text-lg hover:bg-brand-accent/90 transition-all shadow-xl shadow-brand-accent/30 group"
              >
                <Play className="w-5 h-5" />
                Start Free Interview
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/share/example"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                <FileText className="w-5 h-5" />
                View Scorecard Example
              </Link>
            </div>

            <div className="relative max-w-3xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/30 to-brand-light/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-left">
                    <div className="text-white/60 text-sm mb-1">Hiready Index™</div>
                    <div className="text-5xl font-bold text-white">81<span className="text-2xl text-white/60">/100</span></div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium text-sm">Ready to Interview</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {indexMetrics.map((metric, idx) => {
                    const IconComponent = metric.icon;
                    return (
                      <div key={idx} className="text-center">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <IconComponent className="w-5 h-5 text-brand-accent" />
                        </div>
                        <div className="text-xs text-white/60">{metric.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
              How Hiready Works
            </h2>
            <p className="text-lg text-brand-muted max-w-2xl mx-auto">
              Get started in minutes. Practice, measure, and prove your readiness.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {howItWorksSteps.map((item, idx) => (
              <div key={idx} className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="absolute -top-4 left-6 w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-3 mt-2">{item.title}</h3>
                <p className="text-brand-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/readycheck"
              className="inline-flex items-center gap-2 text-brand-accent font-semibold text-lg hover:gap-3 transition-all"
            >
              Try Your First Interview
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 rounded-full text-brand-accent text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                Why Practice Matters
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6">
                Every interview is practice for the next one.
              </h2>
              <p className="text-lg text-brand-muted mb-8">
                Build confidence through repetition. Hiready lets you rehearse HR, case, technical, and behavioral interviews anytime. Each session enhances your real-world performance.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {interviewTypes.map((type, idx) => {
                  const IconComponent = type.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-brand-dark text-sm">{type.title}</div>
                        <div className="text-xs text-brand-muted">{type.description.split(',')[0]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/readycheck"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-xl font-semibold hover:bg-brand-accent/90 transition-colors"
              >
                Practice a Skill Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/20 to-brand-light/10 rounded-3xl blur-2xl transform rotate-3" />
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-brand-muted mb-1">Practice Progress</div>
                    <div className="text-2xl font-bold text-brand-dark">12 Sessions</div>
                  </div>
                  <div className="text-3xl font-bold text-green-600">+23%</div>
                </div>
                <div className="space-y-3">
                  {['Clarity', 'Confidence', 'Structure'].map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-brand-muted">{skill}</span>
                        <span className="font-medium text-brand-dark">{75 + idx * 8}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-accent rounded-full transition-all"
                          style={{ width: `${75 + idx * 8}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/30 to-brand-light/20 rounded-3xl blur-2xl transform -rotate-3" />
                <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                  <div className="text-center mb-6">
                    <div className="text-white/60 text-sm mb-2">Hiready Index™ Score</div>
                    <div className="text-6xl font-bold text-white mb-2">84</div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm font-medium">Interview Ready</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Clarity 88%', 'Confidence 82%', 'Structure 86%', 'Role Fit 80%'].map((item, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg px-3 py-2 text-center">
                        <span className="text-white/80 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-accent/20 rounded-full text-brand-accent text-sm font-medium mb-4">
                <BarChart3 className="w-4 h-4" />
                The Hiready Index
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Every response. Every insight. Quantified.
              </h2>
              <p className="text-lg text-white/60 mb-8">
                The Hiready Index measures what really matters in interviews – clarity, confidence, communication, and problem-solving. Watch your readiness grow with every session.
              </p>
              
              <Link
                to="/readycheck"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-xl font-semibold hover:bg-brand-accent/90 transition-colors"
              >
                Generate My Index
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-4">
                <Share2 className="w-4 h-4" />
                Scorecard & Sharing
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6">
                Turn your practice into proof.
              </h2>
              <p className="text-lg text-brand-muted mb-8">
                Get a personalized Readiness Scorecard after each interview – complete with strengths, insights, and improvement plan. Attach it to your CV or share it with recruiters.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-brand-dark hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Download Scorecard PDF
                </button>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-brand-dark hover:bg-gray-50 transition-colors">
                  <Share2 className="w-4 h-4" />
                  Copy Share Link
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div>
                    <div className="text-sm text-brand-muted">Your shareable link</div>
                    <div className="font-medium text-brand-dark">hiready.app/share/abc123</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/10 to-brand-accent/10 rounded-3xl blur-2xl transform rotate-3" />
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-brand-dark p-6 text-center">
                  <div className="text-white/60 text-sm mb-1">Readiness Scorecard</div>
                  <div className="text-3xl font-bold text-white">Product Manager</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-muted">Overall Index</span>
                    <span className="text-2xl font-bold text-brand-dark">84/100</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Clarity & Structure', score: 88 },
                      { label: 'Problem Solving', score: 82 },
                      { label: 'Role Fit Evidence', score: 80 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-brand-muted">{item.label}</span>
                        <span className="font-medium text-brand-dark">{item.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/20 to-brand-light/10 rounded-3xl blur-2xl transform -rotate-3" />
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-brand-dark rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-brand-dark">Acme Corp</div>
                    <div className="text-sm text-brand-muted">3 open positions</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {['Senior PM - 12 candidates', 'Data Analyst - 8 candidates', 'UX Designer - 5 candidates'].map((job, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-brand-dark">{job}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-dark/10 rounded-full text-brand-dark text-sm font-medium mb-4">
                <Building2 className="w-4 h-4" />
                For Employers
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6">
                Hire smarter with Hiready.
              </h2>
              <p className="text-lg text-brand-muted mb-8">
                Automate candidate screening with structured AI interviews. Get instant Readiness Summaries and see how each applicant performs in real conversation.
              </p>
              
              <div className="space-y-3 mb-8">
                {[
                  'AI-suggested assessments per job role',
                  'Automated candidate scoring and summaries',
                  'Insightful analytics dashboard',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-brand-muted">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/employer/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-xl font-semibold hover:bg-brand-dark/90 transition-colors"
              >
                Learn More for Employers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 rounded-full text-brand-accent text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            Join the Community
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
            Join 10,000+ professionals improving their readiness with Hiready.
          </h2>
          <p className="text-lg text-brand-muted mb-8 max-w-2xl mx-auto">
            Real professionals, real results. From students to mid-career leaders, Hiready users report higher confidence, clarity, and success in real interviews.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { stat: '10,000+', label: 'Interviews Completed' },
              { stat: '87%', label: 'Report Higher Confidence' },
              { stat: '4.8/5', label: 'User Satisfaction' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-brand-accent mb-1">{item.stat}</div>
                <div className="text-sm text-brand-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-brand-dark to-[#0a3d5c] rounded-3xl p-10 lg:p-16">
            <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Show, don't tell — prove you're interview-ready.
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Attach your Hiready Scorecard. Let your performance speak.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/readycheck"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-brand-accent text-white rounded-2xl font-semibold text-lg hover:bg-brand-accent/90 transition-all shadow-xl shadow-brand-accent/30 group"
              >
                <Play className="w-5 h-5" />
                Get My Readiness Score
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/employer/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-5 bg-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                Book Employer Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-brand-dark border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">Hiready</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/readycheck" className="text-white/60 hover:text-white text-sm transition-colors">
                For Candidates
              </Link>
              <Link to="/employer/login" className="text-white/60 hover:text-white text-sm transition-colors">
                For Employers
              </Link>
              <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">
                Sign In
              </Link>
            </div>
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Hiready. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
