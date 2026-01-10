import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2,
  Star,
  ChevronRight,
  BarChart3,
  Target,
  MessageSquare,
  Zap,
  TrendingUp,
  Award,
  Shield,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingNav from '@/components/layout/marketing-nav';
import dashboardImg from '@/assets/screenshots/dashboard.jpg';
import practiceRolesImg from '@/assets/screenshots/practice-roles.jpg';
import resultsImg from '@/assets/screenshots/results.jpg';
import caseStudyImg from '@/assets/screenshots/case-study.jpg';

export default function HomePage() {
  const stats = [
    { value: '10K+', label: 'Interviews Practiced' },
    { value: '85%', label: 'Report Improved Confidence' },
    { value: '4.8', label: 'User Rating', icon: Star },
  ];

  const steps = [
    { num: '1', title: 'Paste your job link', desc: 'Drop a LinkedIn URL or paste the job description', icon: Briefcase },
    { num: '2', title: 'Practice with AI', desc: '10-minute realistic interview with instant responses', icon: MessageSquare },
    { num: '3', title: 'Get your score', desc: 'Detailed feedback and personalized improvement plan', icon: BarChart3 },
  ];

  const benefits = [
    { icon: Target, title: 'Role-Specific Questions', desc: 'AI analyzes your JD to generate questions that match what real interviewers ask' },
    { icon: MessageSquare, title: 'Natural Conversation', desc: 'Voice-based practice that feels like a real interview, not a quiz' },
    { icon: BarChart3, title: 'Actionable Feedback', desc: 'Get scores across 8 dimensions with specific tips to improve each one' },
    { icon: Shield, title: 'All Interview Types', desc: 'HR, Technical, Behavioral, Case Studies - practice them all in one place' },
  ];

  const testimonials = [
    { quote: "Practiced for 3 days before my Google interview. Got the offer!", name: "Priya S.", role: "Software Engineer", rating: 5 },
    { quote: "The feedback was so detailed - knew exactly what to fix.", name: "Rahul K.", role: "Product Manager", rating: 5 },
    { quote: "Way better than practicing with friends. More realistic.", name: "Ananya M.", role: "Data Analyst", rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfc]">
      <MarketingNav />

      <section className="pt-[120px] pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#042c4c] via-[#042c4c] to-[#0a3d62]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-[#ee7e65]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#768c9c]/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <Zap className="w-4 h-4 text-[#ee7e65]" />
            Free AI-powered interview practice
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
            Practice interviews.
            <br />
            <span className="text-[#ee7e65]">Land the job.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste any job description and practice a realistic AI interview in 10 minutes. Get instant feedback and know exactly where you stand.
          </p>
          
          <div className="flex justify-center mb-14">
            <Link to="/readycheck">
              <Button size="lg" className="bg-[#ee7e65] hover:bg-[#e06a50] text-white px-10 h-14 text-base font-semibold shadow-xl shadow-[#ee7e65]/30 border-0 group">
                Start Preparing
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/10">
                {stat.icon && <stat.icon className="w-4 h-4 text-amber-400 fill-amber-400" />}
                <span className="font-bold text-white text-lg">{stat.value}</span>
                <span className="text-white/60 text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-white relative -mt-8 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#ee7e65] text-sm font-semibold tracking-wider uppercase mb-3">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#042c4c] mb-4">
              Ready in 3 simple steps
            </h2>
            <p className="text-[#6c8194] text-lg max-w-lg mx-auto">No credit card needed. Start practicing in under a minute.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-[#fbfbfc] rounded-2xl p-8 text-center border border-gray-100 hover:border-[#ee7e65]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#ee7e65]/10 h-full">
                  <div className="w-16 h-16 bg-[#042c4c] text-white rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <div className="text-[#ee7e65] text-sm font-bold mb-2">Step {step.num}</div>
                  <h3 className="font-bold text-[#042c4c] text-xl mb-3">{step.title}</h3>
                  <p className="text-[#6c8194] leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 text-[#768c9c]/50 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-[#fbfbfc]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#ee7e65] text-sm font-semibold tracking-wider uppercase mb-3">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#042c4c] mb-4">
              Why candidates love Hiready
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-[#042c4c]/20 transition-all duration-300 hover:shadow-xl group flex gap-5">
                  <div className="w-14 h-14 bg-[#042c4c] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#ee7e65] transition-colors duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#042c4c] text-lg mb-2">{b.title}</h3>
                    <p className="text-[#6c8194] leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#ee7e65] text-sm font-semibold tracking-wider uppercase mb-3">Platform Preview</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#042c4c] mb-4">
              See Hiready in Action
            </h2>
            <p className="text-[#6c8194] text-lg max-w-lg mx-auto">A comprehensive platform built for serious interview preparation</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-[#042c4c]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end p-6">
                <div className="text-white">
                  <h3 className="font-bold text-lg mb-1">Your Dashboard</h3>
                  <p className="text-white/80 text-sm">Track readiness, practice time, and active jobs at a glance</p>
                </div>
              </div>
              <img src={dashboardImg} alt="Dashboard" className="w-full h-auto group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-[#042c4c]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end p-6">
                <div className="text-white">
                  <h3 className="font-bold text-lg mb-1">Practice by Role</h3>
                  <p className="text-white/80 text-sm">21+ role kits across Operations, Consulting, Data, Finance & more</p>
                </div>
              </div>
              <img src={practiceRolesImg} alt="Practice by Role" className="w-full h-auto group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-[#042c4c]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end p-6">
                <div className="text-white">
                  <h3 className="font-bold text-lg mb-1">Case Study Sessions</h3>
                  <p className="text-white/80 text-sm">Realistic case interviews with AI avatar interviewers</p>
                </div>
              </div>
              <img src={caseStudyImg} alt="Case Study Session" className="w-full h-auto group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-[#042c4c]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end p-6">
                <div className="text-white">
                  <h3 className="font-bold text-lg mb-1">Detailed Results</h3>
                  <p className="text-white/80 text-sm">8-dimension scoring with actionable feedback and improvement plans</p>
                </div>
              </div>
              <img src={resultsImg} alt="Interview Results" className="w-full h-auto group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-[#042c4c] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-[#ee7e65]/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/20">
            <BarChart3 className="w-4 h-4 text-[#ee7e65]" />
            HIREADY INDEX™
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Get Your Readiness Score
          </h2>
          <p className="text-white/60 mb-10 max-w-xl mx-auto text-lg">
            A comprehensive score showing exactly how prepared you are. Know your strengths and fix your gaps.
          </p>
          
          <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md mx-auto mb-10 shadow-2xl">
            <div className="relative mb-6">
              <div className="text-7xl sm:text-8xl font-bold text-[#042c4c] mb-1">78</div>
              <div className="absolute -top-4 -right-4">
                <div className="w-14 h-14 bg-[#ee7e65] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ee7e65]/30">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
            <div className="text-[#6c8194] font-semibold mb-8 text-lg">Nearly Interview Ready</div>
            <div className="space-y-4">
              {[
                { skill: 'Clarity & Structure', value: 85 },
                { skill: 'Technical Depth', value: 72 },
                { skill: 'Communication', value: 78 },
                { skill: 'Problem Solving', value: 75 }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[#6c8194] text-sm w-32 text-left font-medium">{item.skill}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#042c4c] to-[#768c9c] h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-[#042c4c] font-bold text-sm w-8">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <Link to="/readycheck">
            <Button size="lg" className="bg-[#ee7e65] hover:bg-[#e06a50] text-white px-10 h-14 text-base font-semibold shadow-xl shadow-[#ee7e65]/30 group">
              Get Your Score Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#ee7e65] text-sm font-semibold tracking-wider uppercase mb-3">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#042c4c] mb-4">
              What our users say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#fbfbfc] rounded-2xl p-7 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[#042c4c] mb-6 leading-relaxed">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-[#042c4c]">{t.name}</div>
                  <div className="text-[#6c8194] text-sm">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-[#fbfbfc] to-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ee7e65] rounded-2xl mb-6 shadow-xl shadow-[#ee7e65]/30">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#042c4c] mb-5">
            Your next interview could be <span className="text-[#ee7e65]">the one.</span>
          </h2>
          <p className="text-[#6c8194] mb-10 text-lg max-w-lg mx-auto">
            Start practicing now — it only takes 10 minutes to see how ready you are.
          </p>
          <Link to="/readycheck">
            <Button size="lg" className="bg-[#042c4c] hover:bg-[#0a3d62] text-white px-12 h-16 text-lg font-semibold shadow-xl shadow-[#042c4c]/20 group">
              Start Preparing
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-sm text-[#6c8194] mt-8 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            No credit card required
          </p>
        </div>
      </section>

      <footer className="bg-[#042c4c] text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Hiready</span>
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <Link to="/features" className="hover:text-white transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/enterprise" className="hover:text-white transition-colors">Enterprise</Link>
            <Link to="/demo" className="hover:text-white transition-colors">Book a Demo</Link>
          </div>
          <div className="text-sm text-white/40">
            © {new Date().getFullYear()} Hiready
          </div>
        </div>
      </footer>
    </div>
  );
}
