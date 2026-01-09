import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Menu,
  X,
  Star,
  ChevronRight,
  BarChart3,
  Target,
  MessageSquare,
  Users,
  Zap
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
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-lg">Hiready</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/employer/login" className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
              For Employers
            </Link>
            {isAuthenticated ? (
              <Link to="/avatar/dashboard">
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">Sign In</Button>
              </Link>
            )}
            <Link to="/readycheck">
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
                Start Free
              </Button>
            </Link>
          </div>

          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-3">
            <Link to="/employer/login" className="block py-2 text-slate-600">For Employers</Link>
            {isAuthenticated ? (
              <Link to="/avatar/dashboard" className="block py-2 text-slate-600">Dashboard</Link>
            ) : (
              <Link to="/login" className="block py-2 text-slate-600">Sign In</Link>
            )}
            <Link to="/readycheck">
              <Button className="w-full bg-slate-900 hover:bg-slate-800">Start Free Interview</Button>
            </Link>
          </div>
        )}
      </nav>

      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Free AI interview practice
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Practice interviews.
            <br />
            <span className="text-slate-500">Land the job.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Paste any job description and practice a realistic AI interview in 10 minutes. Get instant feedback and know exactly where you stand.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link to="/readycheck">
              <Button size="lg" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 h-12 text-base">
                Start Free Interview
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-base border-slate-200 hover:border-slate-300 text-slate-700">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-sm text-slate-500">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {stat.icon && <stat.icon className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                <span className="font-semibold text-slate-900">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              HOW IT WORKS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Ready in 3 simple steps
            </h2>
            <p className="text-slate-600">No credit card. No signup required to start.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative bg-white rounded-lg p-6 text-center border border-slate-200 hover:border-slate-300 transition-all">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-semibold text-lg mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-medium text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 text-slate-300 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Why candidates love Hiready
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-all">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                  <b.icon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">{b.title}</h3>
                <p className="text-slate-500 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <BarChart3 className="w-3.5 h-3.5" />
            HIREADY INDEX
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Get Your Hiready Index
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            A comprehensive score that shows exactly how ready you are for the interview. Know your strengths, fix your gaps.
          </p>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 sm:p-8 max-w-md mx-auto mb-8 border border-white/10">
            <div className="text-6xl sm:text-7xl font-bold text-white mb-2">78</div>
            <div className="text-white/70 font-medium mb-4">Nearly Ready</div>
            <div className="space-y-3">
              {['Clarity & Structure', 'Technical Depth', 'Communication', 'Problem Solving'].map((skill, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white/60 text-sm w-32 text-left">{skill}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full" 
                      style={{ width: `${70 + i * 5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Link to="/readycheck">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8">
              Get Your Score Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Your next interview could be the one.
          </h2>
          <p className="text-slate-600 mb-8">
            Start practicing now — it only takes 10 minutes.
          </p>
          <Link to="/readycheck">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-10 h-14 text-lg">
              Start Free Interview
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-slate-500 mt-4">
            <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-500" />
            No credit card required
          </p>
        </div>
      </section>

      <footer className="bg-slate-50 border-t border-slate-200 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Hiready</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/employer/login" className="hover:text-slate-900 transition-colors">For Employers</Link>
            <a href="mailto:support@hiready.in" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} Hiready
          </div>
        </div>
      </footer>
    </div>
  );
}
