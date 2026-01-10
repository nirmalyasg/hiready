import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, Building2, Users, Shield, BarChart3, 
  Zap, Target, Briefcase, Award, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingNav from '@/components/layout/marketing-nav';

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
      icon: Award
    },
    { 
      title: 'Internal Mobility', 
      desc: 'Help employees prepare for internal role transitions',
      icon: TrendingUp
    },
    { 
      title: 'L&D Programs', 
      desc: 'Integrate interview practice into your learning curriculum',
      icon: Target
    },
  ];

  const stats = [
    { value: '85%', label: 'Candidates report higher confidence' },
    { value: '40%', label: 'Faster time-to-hire' },
    { value: '3x', label: 'More practice sessions completed' },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfc]">
      <MarketingNav />

      <section className="pt-[120px] pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#042c4c] via-[#042c4c] to-[#0a3d62]" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-[#ee7e65]/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <Building2 className="w-4 h-4 text-[#ee7e65]" />
            Enterprise Solutions
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
            Interview prep at
            <br />
            <span className="text-[#ee7e65]">enterprise scale</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Empower your entire organization with AI-powered interview practice. Custom solutions for L&D, recruiting, and talent development teams.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" className="w-full sm:w-auto bg-[#ee7e65] hover:bg-[#e06a50] text-white px-8 h-14 text-base font-semibold shadow-xl shadow-[#ee7e65]/30 group">
                Book a Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base bg-white/10 border-white/30 text-white hover:bg-white/20">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 bg-white -mt-8 rounded-t-[2rem] relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-[#042c4c] mb-2">{stat.value}</div>
                <div className="text-[#6c8194]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#ee7e65] text-sm font-semibold tracking-wider uppercase mb-3">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#042c4c] mb-4">
              Built for enterprise needs
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-[#fbfbfc] rounded-2xl p-6 border border-gray-100 hover:border-[#ee7e65]/30 transition-all hover:shadow-lg group">
                  <div className="w-12 h-12 bg-[#042c4c] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#ee7e65] transition-colors">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-[#042c4c] text-lg mb-2">{feature.title}</h3>
                  <p className="text-[#6c8194]">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-[#fbfbfc]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#ee7e65] text-sm font-semibold tracking-wider uppercase mb-3">Use Cases</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#042c4c] mb-4">
              How enterprises use Hiready
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, i) => {
              const Icon = useCase.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 text-center hover:shadow-xl transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#042c4c] to-[#0a3d62] rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-[#042c4c] text-xl mb-3">{useCase.title}</h3>
                  <p className="text-[#6c8194]">{useCase.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 bg-[#042c4c]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Ready to transform your organization?
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Get a personalized demo and see how Hiready can help your team.
          </p>
          <Link to="/demo">
            <Button size="lg" className="bg-[#ee7e65] hover:bg-[#e06a50] text-white px-10 h-14 text-base font-semibold shadow-xl shadow-[#ee7e65]/30 group">
              Book a Demo
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-[#042c4c] border-t border-white/10 text-white py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Hiready</span>
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <Link to="/features" className="hover:text-white">Features</Link>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/enterprise" className="hover:text-white">Enterprise</Link>
          </div>
          <div className="text-sm text-white/40">
            © {new Date().getFullYear()} Hiready. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
