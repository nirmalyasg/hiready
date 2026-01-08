import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Play,
  CheckCircle2,
  Sparkles,
  Menu,
  X,
  Star,
  ChevronRight,
  BarChart3,
  Target,
  MessageSquare,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = [
    { value: '10K+', label: 'Interviews Practiced' },
    { value: '85%', label: 'Report Improved Confidence' },
    { value: '4.8', label: 'User Rating', icon: Star },
  ];

  const steps = [
    { num: '1', title: 'Paste your job link', desc: 'Drop a LinkedIn URL or paste the JD' },
    { num: '2', title: 'Practice with AI', desc: '10-min realistic interview simulation' },
    { num: '3', title: 'Get your score', desc: 'Instant feedback & improvement plan' },
  ];

  const benefits = [
    { icon: Target, title: 'Role-Specific', desc: 'Tailored to your exact job description' },
    { icon: MessageSquare, title: 'Real Questions', desc: 'Based on actual interview patterns' },
    { icon: BarChart3, title: 'Detailed Feedback', desc: 'Know exactly where to improve' },
    { icon: Users, title: 'All Round Types', desc: 'HR, Technical, Behavioral, Case' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ee7e65] rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#042c4c] text-lg">Hiready</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/employer/login" className="text-gray-600 hover:text-[#042c4c] text-sm font-medium">
              For Employers
            </Link>
            {isAuthenticated ? (
              <Link to="/avatar/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
            )}
            <Link to="/readycheck">
              <Button size="sm" className="bg-[#ee7e65] hover:bg-[#e06a50]">
                Start Free
              </Button>
            </Link>
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-3">
            <Link to="/employer/login" className="block py-2 text-gray-600">For Employers</Link>
            {isAuthenticated ? (
              <Link to="/avatar/dashboard" className="block py-2 text-gray-600">Dashboard</Link>
            ) : (
              <Link to="/login" className="block py-2 text-gray-600">Sign In</Link>
            )}
            <Link to="/readycheck">
              <Button className="w-full bg-[#ee7e65] hover:bg-[#e06a50]">Start Free Interview</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#ee7e65]/10 text-[#ee7e65] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Play className="w-3.5 h-3.5" />
            Free interview practice
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#042c4c] leading-tight mb-6">
            Practice interviews.
            <br />
            <span className="text-[#ee7e65]">Land the job.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Paste any job description and practice a realistic AI interview in 10 minutes. Get instant feedback and know exactly where you stand.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link to="/readycheck">
              <Button size="lg" className="w-full sm:w-auto bg-[#ee7e65] hover:bg-[#e06a50] text-white px-8 h-12 text-base">
                Start Free Interview
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-base">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-sm text-gray-500">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {stat.icon && <stat.icon className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                <span className="font-semibold text-[#042c4c]">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#042c4c] mb-3">
              Ready in 3 simple steps
            </h2>
            <p className="text-gray-600">No credit card. No signup required to start.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative bg-[#f8f9fb] rounded-2xl p-6 text-center">
                <div className="w-10 h-10 bg-[#ee7e65] text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-[#042c4c] text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#042c4c] mb-3">
              Why candidates love Hiready
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-[#042c4c]/5 rounded-lg flex items-center justify-center mb-3">
                  <b.icon className="w-5 h-5 text-[#042c4c]" />
                </div>
                <h3 className="font-semibold text-[#042c4c] mb-1">{b.title}</h3>
                <p className="text-gray-600 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiready Index Preview */}
      <section className="py-16 px-4 sm:px-6 bg-[#042c4c]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Get Your Hiready Index™
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            A comprehensive score that shows exactly how ready you are for the interview. Know your strengths, fix your gaps.
          </p>
          
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 sm:p-8 max-w-md mx-auto mb-8">
            <div className="text-6xl sm:text-7xl font-bold text-white mb-2">78</div>
            <div className="text-[#ee7e65] font-medium mb-4">Nearly Ready</div>
            <div className="space-y-3">
              {['Clarity & Structure', 'Technical Depth', 'Communication', 'Problem Solving'].map((skill, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white/70 text-sm w-32 text-left">{skill}</span>
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-[#ee7e65] h-2 rounded-full" 
                      style={{ width: `${70 + Math.random() * 25}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Link to="/readycheck">
            <Button size="lg" className="bg-[#ee7e65] hover:bg-[#e06a50] text-white px-8">
              Get Your Score Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#042c4c] mb-4">
            Your next interview could be the one.
          </h2>
          <p className="text-gray-600 mb-8">
            Start practicing now — it only takes 10 minutes.
          </p>
          <Link to="/readycheck">
            <Button size="lg" className="bg-[#ee7e65] hover:bg-[#e06a50] text-white px-10 h-14 text-lg">
              Start Free Interview
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-500" />
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#ee7e65] rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-[#042c4c]">Hiready</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/employer/login" className="hover:text-[#042c4c]">For Employers</Link>
            <a href="mailto:support@hiready.in" className="hover:text-[#042c4c]">Contact</a>
          </div>
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} Hiready
          </div>
        </div>
      </footer>
    </div>
  );
}
