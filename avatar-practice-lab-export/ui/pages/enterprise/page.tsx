import { Link } from 'react-router-dom';
import { 
  ArrowRight, Building2, Users, Shield, BarChart3, 
  Zap, Target, Briefcase, Award, TrendingUp, CheckCircle2, Calendar, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingNav from '@/components/layout/marketing-nav';
import logoImg from '@/assets/logo.png';

export default function EnterprisePage() {
  const features = [
    { icon: Users, title: 'Unlimited Team Access', desc: 'Add your entire organization with volume pricing' },
    { icon: Shield, title: 'SSO & Security', desc: 'SAML SSO, SOC2 compliance, and enterprise-grade security' },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Track team performance, readiness metrics, and ROI' },
    { icon: Target, title: 'Custom Role Kits', desc: 'Build interview scenarios specific to your roles' },
    { icon: Zap, title: 'Priority Support', desc: 'Dedicated customer success manager and SLA' },
    { icon: Briefcase, title: 'Custom Branding', desc: 'White-label the platform with your brand' },
  ];

  const useCases = [
    { 
      title: 'Campus Recruiting', 
      desc: 'Prepare candidates at scale before they interview with your company',
      icon: Award,
      color: 'from-[#cb6ce6] to-[#6b1fad]'
    },
    { 
      title: 'Internal Mobility', 
      desc: 'Help employees prepare for internal role transitions',
      icon: TrendingUp,
      color: 'from-[#24c4b8] to-[#1a9e94]'
    },
    { 
      title: 'L&D Programs', 
      desc: 'Integrate interview practice into your learning curriculum',
      icon: Target,
      color: 'from-[#9b4dca] to-[#6b1fad]'
    },
  ];

  const stats = [
    { value: '85%', label: 'Candidates report higher confidence' },
    { value: '40%', label: 'Faster time-to-hire' },
    { value: '3x', label: 'More practice sessions completed' },
  ];

  const logos = ['Deloitte', 'Accenture', 'McKinsey', 'BCG', 'Infosys', 'TCS', 'Wipro', 'Cognizant'];

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-[100px] lg:pt-[120px] pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(203,108,230,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(36,196,184,0.1),transparent_50%)]" />
        
        <div className="max-w-5xl mx-auto text-center relative px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <Building2 className="w-4 h-4 text-[#24c4b8]" />
            Enterprise Solutions
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white tracking-tight">
            Interview prep at
            <br />
            <span className="text-[#24c4b8]">enterprise scale</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Empower your entire organization with AI-powered interview practice. Custom solutions for L&D, recruiting, and talent development teams.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/demo">
              <Button size="lg" className="w-full sm:w-auto bg-[#24c4b8] hover:bg-[#1db0a5] text-white px-8 h-14 text-base font-semibold shadow-xl shadow-[#24c4b8]/30 group">
                Book a Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                <Play className="w-4 h-4" />
                View Pricing
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 justify-center text-white/60 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              <span>Custom implementation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              <span>Dedicated support</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              <span>SLA guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-[#6b1fad] mb-2">{stat.value}</div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 px-6 bg-[#f8f7fc] border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-gray-500 text-sm mb-6">Trusted by leading organizations</p>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {logos.map((logo, i) => (
              <div key={i} className="text-[#1a1a2e]/25 font-bold text-lg hover:text-[#6b1fad]/50 transition-colors">{logo}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#6b1fad] text-sm font-semibold tracking-wider uppercase mb-3">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4">
              Built for enterprise needs
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-[#f8f7fc] rounded-2xl p-6 border border-gray-100 hover:border-[#6b1fad]/30 hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="w-12 h-12 bg-[#6b1fad] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#24c4b8] transition-colors">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-[#1a1a2e] text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-500">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 bg-[#f8f7fc]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#6b1fad] text-sm font-semibold tracking-wider uppercase mb-3">Use Cases</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4">
              How enterprises use Hiready
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, i) => {
              const Icon = useCase.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`w-16 h-16 bg-gradient-to-br ${useCase.color} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-[#1a1a2e] text-xl mb-3">{useCase.title}</h3>
                  <p className="text-gray-500">{useCase.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(203,108,230,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(36,196,184,0.08),transparent_50%)]" />
        
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Ready to transform your organization?
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Get a personalized demo and see how Hiready can help your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" className="w-full sm:w-auto bg-[#24c4b8] hover:bg-[#1db0a5] text-white px-10 h-14 text-base font-semibold shadow-xl shadow-[#24c4b8]/30 group">
                Book a Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2">
                <Calendar className="w-4 h-4" />
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a2e] border-t border-white/10 text-white py-8 px-6">
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
