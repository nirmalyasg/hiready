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
  Zap,
  Rocket,
  TrendingUp,
  Award
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
    { num: '1', title: 'Paste your job link', desc: 'Drop a LinkedIn URL or paste the JD', color: 'from-violet-500 to-purple-600' },
    { num: '2', title: 'Practice with AI', desc: '10-min realistic interview simulation', color: 'from-blue-500 to-cyan-500' },
    { num: '3', title: 'Get your score', desc: 'Instant feedback & improvement plan', color: 'from-emerald-500 to-teal-500' },
  ];

  const benefits = [
    { icon: Target, title: 'Role-Specific', desc: 'Tailored to your exact job description', color: 'bg-gradient-to-br from-violet-500 to-purple-600' },
    { icon: MessageSquare, title: 'Real Questions', desc: 'Based on actual interview patterns', color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
    { icon: BarChart3, title: 'Detailed Feedback', desc: 'Know exactly where to improve', color: 'bg-gradient-to-br from-orange-500 to-pink-500' },
    { icon: Users, title: 'All Round Types', desc: 'HR, Technical, Behavioral, Case', color: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-xl">Hiready</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/employer/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              For Employers
            </Link>
            {isAuthenticated ? (
              <Link to="/avatar/dashboard">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">Sign In</Button>
              </Link>
            )}
            <Link to="/readycheck">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-200 border-0">
                Start Free
              </Button>
            </Link>
          </div>

          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-3">
            <Link to="/employer/login" className="block py-2 text-gray-600">For Employers</Link>
            {isAuthenticated ? (
              <Link to="/avatar/dashboard" className="block py-2 text-gray-600">Dashboard</Link>
            ) : (
              <Link to="/login" className="block py-2 text-gray-600">Sign In</Link>
            )}
            <Link to="/readycheck">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg">Start Free Interview</Button>
            </Link>
          </div>
        )}
      </nav>

      <section className="pt-28 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-violet-200/50 shadow-sm">
            <Zap className="w-4 h-4 text-violet-600" />
            Free AI interview practice
            <Rocket className="w-4 h-4 text-indigo-600" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-gray-900">Practice interviews.</span>
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">Land the job.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Paste any job description and practice a realistic AI interview in 10 minutes. Get instant feedback and know exactly where you stand.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/readycheck">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 h-14 text-base shadow-xl shadow-violet-200 border-0 group">
                Start Free Interview
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base border-2 border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-700">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-sm">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-gray-100">
                {stat.icon && <stat.icon className="w-4 h-4 text-amber-500 fill-amber-500" />}
                <span className="font-bold text-gray-900">{stat.value}</span>
                <span className="text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-blue-200/50">
              HOW IT WORKS
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">
              Ready in 3 simple steps
            </h2>
            <p className="text-gray-600 text-lg">No credit card. No signup required to start.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-violet-200 transition-all hover:shadow-xl hover:shadow-violet-100 group">
                <div className={`w-14 h-14 bg-gradient-to-br ${step.color} text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {step.num}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 text-gray-300 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">
              Why candidates <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">love</span> Hiready
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-violet-200 transition-all hover:shadow-xl hover:shadow-violet-100 group">
                <div className={`w-12 h-12 ${b.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <b.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
                <p className="text-gray-500 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-white/20">
            <BarChart3 className="w-4 h-4" />
            HIREADY INDEX
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            Get Your Hiready Index
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto text-lg">
            A comprehensive score that shows exactly how ready you are for the interview. Know your strengths, fix your gaps.
          </p>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md mx-auto mb-8 border border-white/20 shadow-2xl">
            <div className="relative">
              <div className="text-7xl sm:text-8xl font-bold text-white mb-2 drop-shadow-lg">78</div>
              <div className="absolute -top-2 -right-2">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-white/80 font-medium mb-6 text-lg">Nearly Ready</div>
            <div className="space-y-3">
              {['Clarity & Structure', 'Technical Depth', 'Communication', 'Problem Solving'].map((skill, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white/70 text-sm w-32 text-left">{skill}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${70 + i * 5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Link to="/readycheck">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 px-8 h-14 text-base font-semibold shadow-xl group">
              Get Your Score Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-white to-violet-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-6 shadow-xl shadow-orange-200">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
            Your next interview could be <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">the one.</span>
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Start practicing now — it only takes 10 minutes.
          </p>
          <Link to="/readycheck">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-12 h-16 text-lg shadow-xl shadow-violet-200 group">
              Start Free Interview
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            No credit card required
          </p>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Hiready</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <Link to="/employer/login" className="hover:text-white transition-colors">For Employers</Link>
            <a href="mailto:support@hiready.in" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Hiready
          </div>
        </div>
      </footer>
    </div>
  );
}
