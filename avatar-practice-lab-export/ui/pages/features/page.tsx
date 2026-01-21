import { Link } from 'react-router-dom';
import { 
  ArrowRight, Target, MessageSquare, BarChart3, 
  Zap, Video, Brain, FileText, Clock, Globe, Calendar, CheckCircle2,
  Play, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingNav from '@/components/layout/marketing-nav';
import logoImg from '@/assets/logo.png';

export default function FeaturesPage() {
  const mainFeatures = [
    { 
      icon: Target, 
      title: 'JD-Powered Questions', 
      desc: 'Paste any job description and get interview questions tailored to that specific role. Our AI analyzes requirements to generate realistic questions.',
      highlight: true
    },
    { 
      icon: MessageSquare, 
      title: 'Voice-Based Practice', 
      desc: 'Practice speaking naturally with AI interviewers. Get comfortable with verbal responses, not just written answers.',
      highlight: true
    },
    { 
      icon: BarChart3, 
      title: '8-Dimension Scoring', 
      desc: 'Get detailed feedback across Clarity, Structure, Evidence, Problem Solving, Role Fit, Confidence, Communication, and Consistency.',
      highlight: true
    },
    { 
      icon: Video, 
      title: 'AI Avatar Interviewers', 
      desc: 'Practice with realistic AI avatars that respond naturally, ask follow-ups, and adapt to your answers.'
    },
    { 
      icon: Brain, 
      title: 'Multiple Interview Types', 
      desc: 'Behavioral, Technical, Case Study, HR, and Coding interviews - all in one platform.'
    },
    { 
      icon: FileText, 
      title: 'Resume Analysis', 
      desc: 'Upload your resume and get personalized questions based on your experience and skills.'
    },
    { 
      icon: Clock, 
      title: 'Flexible Duration', 
      desc: 'Quick 10-minute sessions or full 45-minute mock interviews - practice on your schedule.'
    },
    { 
      icon: Globe, 
      title: 'Multi-Language Support', 
      desc: 'Practice in English, Hindi, Spanish, French, German, and 10+ other languages.'
    },
  ];

  const interviewTypes = [
    { name: 'Behavioral', desc: 'STAR format questions about past experiences', color: 'from-[#ee7e65] to-[#ee7e65]' },
    { name: 'Technical', desc: 'Role-specific technical knowledge assessment', color: 'from-[#ee7e65] to-[#031d33]' },
    { name: 'Case Study', desc: 'Business problem-solving and strategy', color: 'from-[#ee7e65] to-[#d66352]' },
    { name: 'HR Interview', desc: 'Culture fit, motivation, and career goals', color: 'from-[#768c9c] to-[#ee7e65]' },
    { name: 'Coding', desc: 'Live coding with AI code review', color: 'from-[#ee7e65] to-[#768c9c]' },
  ];

  const stats = [
    { value: '15+', label: 'Role Kits', icon: Target },
    { value: '8', label: 'Scoring Dimensions', icon: BarChart3 },
    { value: '22', label: 'Languages Supported', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-[100px] lg:pt-[120px] pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#042c4c] to-[#000000]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(238,126,101,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(118,140,156,0.1),transparent_50%)]" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <Zap className="w-4 h-4 text-[#ee7e65]" />
            Platform Features
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white tracking-tight">
            Everything you need to
            <br />
            <span className="text-[#ee7e65]">ace your interviews</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered interview practice with realistic scenarios, detailed feedback, and personalized improvement plans.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/readycheck">
              <Button size="lg" className="w-full sm:w-auto bg-[#ee7e65] hover:bg-[#e06d54] text-white px-8 h-14 text-base font-semibold shadow-xl shadow-[#ee7e65]/30 group">
                Start Preparing
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 justify-center text-white/60 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#ee7e65]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#ee7e65]" />
              <span>3 free sessions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-12 px-6 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#ee7e65]/10 rounded-xl mb-3">
                    <Icon className="w-6 h-6 text-[#ee7e65]" />
                  </div>
                  <div className="text-3xl font-bold text-[#000000] mb-1">{stat.value}</div>
                  <div className="text-gray-500 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#ee7e65] text-sm font-semibold tracking-wider uppercase mb-3">Core Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#000000]">
              Powerful interview preparation
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={i} 
                  className={`rounded-2xl p-6 border transition-all hover:shadow-xl hover:-translate-y-1 group ${
                    feature.highlight 
                      ? 'bg-[#000000] text-white border-[#000000]' 
                      : 'bg-white border-gray-100 hover:border-[#ee7e65]/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    feature.highlight 
                      ? 'bg-[#ee7e65]' 
                      : 'bg-[#ee7e65] group-hover:bg-[#ee7e65]'
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`font-bold text-lg mb-2 ${feature.highlight ? 'text-white' : 'text-[#000000]'}`}>
                    {feature.title}
                  </h3>
                  <p className={feature.highlight ? 'text-white/80' : 'text-gray-500'}>
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interview Types */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#ee7e65] text-sm font-semibold tracking-wider uppercase mb-3">Interview Types</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#000000]">
              Practice every interview type
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {interviewTypes.map((type, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl mx-auto mb-4 flex items-center justify-center`}>
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                <h3 className="font-bold text-[#000000] mb-2">{type.name}</h3>
                <p className="text-gray-500 text-sm">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#042c4c] to-[#000000]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(238,126,101,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(118,140,156,0.08),transparent_50%)]" />
        
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Start practicing today
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            No credit card required. Get your first interview score in 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/readycheck">
              <Button size="lg" className="w-full sm:w-auto bg-[#ee7e65] hover:bg-[#e06d54] text-white px-10 h-14 text-base font-semibold shadow-xl shadow-[#ee7e65]/30 group">
                Start Preparing
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2">
                <Calendar className="w-4 h-4" />
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000000] border-t border-white/10 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Hiready" className="h-8 brightness-0 invert" />
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <Link to="/features" className="hover:text-white transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/enterprise" className="hover:text-white transition-colors">Enterprise</Link>
          </div>
          <div className="text-sm text-white/40">
            © {new Date().getFullYear()} Hiready
          </div>
        </div>
      </footer>
    </div>
  );
}
