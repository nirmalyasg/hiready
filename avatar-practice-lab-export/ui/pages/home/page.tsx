import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2,
  Star,
  BarChart3,
  Target,
  MessageSquare,
  Zap,
  TrendingUp,
  Award,
  Shield,
  Briefcase,
  GraduationCap,
  Building2,
  Clock,
  Brain,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingNav from '@/components/layout/marketing-nav';
import dashboardImg from '@/assets/screenshots/dashboard.jpg';
import logoImg from '@/assets/logo.png';

export default function HomePage() {
  const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb'];
  
  const metrics = [
    { value: '10,000+', label: 'Practice Sessions', icon: MessageSquare },
    { value: '85%', label: 'Report Higher Confidence', icon: TrendingUp },
    { value: '4.8', label: 'User Rating', icon: Star },
  ];

  const personas = [
    { 
      icon: GraduationCap, 
      title: 'Students & Fresh Grads', 
      desc: 'Nail your first job interview with AI-powered practice',
      color: 'from-[#cb6ce6] to-[#cb6ce6]'
    },
    { 
      icon: Briefcase, 
      title: 'Career Switchers', 
      desc: 'Transition confidently with role-specific preparation',
      color: 'from-[#24c4b8] to-[#1a9e94]'
    },
    { 
      icon: Building2, 
      title: 'Enterprise Teams', 
      desc: 'Scale interview prep across your entire organization',
      color: 'from-[#cb6ce6] to-[#4a1578]'
    },
  ];

  const steps = [
    { 
      num: '01', 
      title: 'Paste your job description', 
      desc: 'Drop a LinkedIn URL or paste the JD directly',
      icon: Target
    },
    { 
      num: '02', 
      title: 'Practice with AI', 
      desc: 'Natural voice conversation with smart follow-ups',
      icon: MessageSquare
    },
    { 
      num: '03', 
      title: 'Get detailed feedback', 
      desc: '8-dimension scoring with improvement tips',
      icon: BarChart3
    },
  ];

  const features = [
    { 
      icon: Target, 
      title: 'JD-Powered Questions', 
      desc: 'AI analyzes your job description to generate questions real interviewers ask'
    },
    { 
      icon: MessageSquare, 
      title: 'Voice Conversations', 
      desc: 'Practice speaking naturally, not typing — just like real interviews'
    },
    { 
      icon: BarChart3, 
      title: 'Detailed Scoring', 
      desc: 'Get scores across 8 dimensions with specific, actionable feedback'
    },
    { 
      icon: Brain, 
      title: 'All Interview Types', 
      desc: 'Behavioral, Technical, Case Study, HR — practice them all'
    },
    { 
      icon: Clock, 
      title: 'Quick Sessions', 
      desc: '10-minute focused practice that fits your busy schedule'
    },
    { 
      icon: Shield, 
      title: 'Safe to Fail', 
      desc: 'Make mistakes, learn, and improve before the real thing'
    },
  ];

  const testimonials = [
    { 
      quote: "Practiced for 3 days before my Google interview. The feedback was so specific — I knew exactly what to fix. Got the offer!", 
      name: "Priya S.", 
      role: "Software Engineer",
      company: "Google",
      rating: 5,
      avatar: "PS"
    },
    { 
      quote: "The AI picked up on my nervous habits and helped me fix them. Way more useful than practicing with friends.", 
      name: "Rahul K.", 
      role: "Product Manager",
      company: "Amazon",
      rating: 5,
      avatar: "RK"
    },
    { 
      quote: "Used it before every round of my interviews. The role-specific questions were spot on.", 
      name: "Ananya M.", 
      role: "Data Analyst",
      company: "Microsoft",
      rating: 5,
      avatar: "AM"
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero Section - Split Layout */}
      <section className="pt-[100px] lg:pt-[120px] pb-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#1a0a2e] to-[#000000]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(203,108,230,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(36,196,184,0.1),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 lg:py-20">
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
                <Zap className="w-4 h-4 text-[#24c4b8]" />
                AI-Powered Interview Practice
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] mb-6 text-white tracking-tight">
                Practice interviews.
                <br />
                <span className="text-[#24c4b8]">Land the job.</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-white/70 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Paste any job description. Practice a realistic AI interview in 10 minutes. Get instant, actionable feedback.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link to="/readycheck">
                  <Button size="lg" className="w-full sm:w-auto bg-[#24c4b8] hover:bg-[#1db0a5] text-white px-8 h-14 text-base font-semibold shadow-xl shadow-[#24c4b8]/30 border-0 group">
                    Start Free Practice
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-4 justify-center lg:justify-start text-white/60 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
                  <span>3 free sessions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
                  <span>Setup in 60 seconds</span>
                </div>
              </div>
            </div>
            
            {/* Right: Product Preview */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[#cb6ce6]/20 to-[#24c4b8]/20 rounded-3xl blur-2xl" />
                
                {/* Main image container */}
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-3 shadow-2xl">
                  <img 
                    src={dashboardImg} 
                    alt="Hiready Dashboard" 
                    className="w-full rounded-xl shadow-lg"
                  />
                  
                  {/* Floating score card */}
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#cb6ce6] to-[#cb6ce6] rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#000000]">78</div>
                        <div className="text-xs text-gray-500">Readiness Score</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating badge */}
                  <div className="absolute -top-3 -right-3 bg-[#24c4b8] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Live Practice
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave transition */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Social Proof - Companies */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8 font-medium">
            Candidates practicing for interviews at top companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
            {companies.map((company) => (
              <span key={company} className="text-xl font-semibold text-[#000000]/25 hover:text-[#cb6ce6]/60 transition-colors">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Band */}
      <section className="py-16 bg-[#f8f7fc]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {metrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#cb6ce6]/10 rounded-xl mb-4">
                    <Icon className="w-6 h-6 text-[#cb6ce6]" />
                  </div>
                  <div className="text-4xl font-bold text-[#000000] mb-1">{metric.value}</div>
                  <div className="text-gray-500">{metric.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-4">
              Built for everyone preparing for interviews
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Whether you're just starting out or leading a team, Hiready adapts to your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {personas.map((persona, i) => {
              const Icon = persona.icon;
              return (
                <div key={i} className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${persona.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <div className={`w-14 h-14 bg-gradient-to-br ${persona.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#000000] mb-2">{persona.title}</h3>
                  <p className="text-gray-500">{persona.desc}</p>
                  <ChevronRight className="w-5 h-5 text-gray-400 absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#f8f7fc]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#cb6ce6] text-sm font-semibold tracking-wider uppercase mb-3">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-4">
              Ready in 3 simple steps
            </h2>
            <p className="text-lg text-gray-500">No signup required. Start practicing in under a minute.</p>
          </div>
          
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#cb6ce6]/20 via-[#cb6ce6]/20 to-[#24c4b8]/20 -translate-y-1/2" />
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative text-center group">
                    <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl shadow-[#cb6ce6]/5 mb-6 group-hover:shadow-2xl group-hover:shadow-[#24c4b8]/10 transition-all duration-300">
                      <Icon className="w-9 h-9 text-[#cb6ce6] group-hover:text-[#24c4b8] transition-colors" />
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#24c4b8] rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {step.num.replace('0', '')}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#000000] mb-2">{step.title}</h3>
                    <p className="text-gray-500">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/readycheck">
              <Button size="lg" className="bg-[#9b4dca] hover:bg-[#8a3db8] text-white px-8 h-14 text-base font-semibold shadow-xl group">
                Try It Now — It's Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#cb6ce6] text-sm font-semibold tracking-wider uppercase mb-3">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-4">
              Everything you need to ace interviews
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="group bg-[#f8f7fc] rounded-2xl p-7 border border-gray-100 hover:bg-white hover:border-[#cb6ce6]/20 hover:shadow-xl transition-all duration-300">
                  <div className="w-12 h-12 bg-[#cb6ce6] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#24c4b8] transition-colors duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#000000] mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Readiness Score Showcase */}
      <section className="py-24 bg-gradient-to-br from-[#000000] via-[#1a0a2e] to-[#000000] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(203,108,230,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(36,196,184,0.08),transparent_50%)]" />
        
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <BarChart3 className="w-4 h-4 text-[#24c4b8]" />
                HIREADY INDEX
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                Know exactly how ready you are
              </h2>
              <p className="text-white/70 mb-8 text-lg leading-relaxed">
                Our proprietary scoring system evaluates you across 8 key dimensions. See your strengths, identify gaps, and get a clear improvement roadmap.
              </p>
              
              <div className="space-y-4">
                {[
                  'Clarity & Structure',
                  'Evidence & Examples',
                  'Problem Solving',
                  'Communication Style'
                ].map((skill, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#24c4b8]" />
                    <span className="text-white/80">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-auto">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-[#000000] mb-1">78</div>
                  <div className="text-gray-500 font-medium">Nearly Interview Ready</div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { skill: 'Clarity', value: 85 },
                    { skill: 'Evidence', value: 72 },
                    { skill: 'Communication', value: 78 },
                    { skill: 'Problem Solving', value: 75 }
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-500 font-medium">{item.skill}</span>
                        <span className="text-[#cb6ce6] font-bold">{item.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-gradient-to-r from-[#cb6ce6] to-[#24c4b8] rounded-full" 
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Link to="/readycheck" className="block">
                    <Button className="w-full bg-[#24c4b8] hover:bg-[#1db0a5] text-white h-12 font-semibold shadow-lg shadow-[#24c4b8]/25">
                      Get Your Score
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#cb6ce6]/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#24c4b8]/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#cb6ce6] text-sm font-semibold tracking-wider uppercase mb-3">Success Stories</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-4">
              Real results from real candidates
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#f8f7fc] rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[#000000] mb-6 leading-relaxed text-lg">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#cb6ce6] to-[#cb6ce6] rounded-full flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-[#000000]">{t.name}</div>
                    <div className="text-gray-500 text-sm">{t.role} at {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-b from-[#f8f7fc] to-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#24c4b8] to-[#1a9e94] rounded-2xl mb-6 shadow-xl shadow-[#24c4b8]/30">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-5">
            Your next interview could be <span className="text-[#24c4b8]">the one.</span>
          </h2>
          <p className="text-gray-500 mb-10 text-lg max-w-lg mx-auto">
            Start practicing now — it only takes 10 minutes to see where you stand.
          </p>
          <Link to="/readycheck">
            <Button size="lg" className="bg-[#9b4dca] hover:bg-[#8a3db8] text-white px-12 h-16 text-lg font-semibold shadow-xl shadow-[#9b4dca]/20 group">
              Start Free Practice
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-8 flex items-center justify-center gap-6">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              3 free sessions
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              Cancel anytime
            </span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000000] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Hiready" className="h-8 brightness-0 invert" />
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <Link to="/features" className="hover:text-white transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/enterprise" className="hover:text-white transition-colors">Enterprise</Link>
            <Link to="/demo" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-white/40">
            2025 Hiready. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
