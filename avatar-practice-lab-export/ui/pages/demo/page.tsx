import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, CheckCircle, Building2, Mail, Phone, User, 
  MessageSquare, CheckCircle2, Calendar, Users, BarChart3, Shield, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import MarketingNav from '@/components/layout/marketing-nav';
import logoImg from '@/assets/logo.png';

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    teamSize: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'demo_request' })
      });
      if (!res.ok) throw new Error('Failed to submit');
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const teamSizeOptions = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ];

  const benefits = [
    { icon: Calendar, title: 'Personalized Demo', desc: 'Tailored to your organization\'s needs' },
    { icon: Users, title: 'Team Onboarding', desc: 'See how teams use the platform' },
    { icon: BarChart3, title: 'Analytics Overview', desc: 'Track progress and ROI' },
    { icon: Shield, title: 'Enterprise Security', desc: 'SSO, compliance, and more' },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <MarketingNav />
        <div className="pt-[120px] flex items-center justify-center px-6 min-h-screen">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-[#ee7e65]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#ee7e65]" />
            </div>
            <h1 className="text-3xl font-bold text-[#000000] mb-4">Thank You!</h1>
            <p className="text-gray-500 mb-8">
              We've received your demo request. Our team will reach out within 24 hours to schedule a personalized demo.
            </p>
            <Link to="/">
              <Button className="bg-[#ee7e65] hover:bg-[#e06d54] text-white">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-[100px] lg:pt-[120px] pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#042c4c] to-[#000000]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(238,126,101,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(118,140,156,0.1),transparent_50%)]" />
        
        <div className="max-w-5xl mx-auto text-center relative px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <Building2 className="w-4 h-4 text-[#ee7e65]" />
            Enterprise Solutions
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white tracking-tight">
            Book a
            <span className="text-[#ee7e65]"> personalized demo</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
            See how Hiready can transform your organization's interview preparation. Get a walkthrough with our team.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="#demo-form">
              <Button size="lg" className="w-full sm:w-auto bg-[#ee7e65] hover:bg-[#e06d54] text-white px-8 h-14 text-base font-semibold shadow-xl shadow-[#ee7e65]/30 group">
                Request a Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                <Calendar className="w-4 h-4" />
                View Pricing
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-6 justify-center text-white/60 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#ee7e65]" />
              <span>Free consultation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#ee7e65]" />
              <span>Response within 24h</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Benefits */}
            <div className="lg:sticky lg:top-[120px]">
              <h2 className="text-2xl font-bold text-[#000000] mb-6">
                What you'll get in your demo
              </h2>

              <div className="space-y-5 mb-10">
                {benefits.map((benefit, i) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#ee7e65] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#000000] mb-1">{benefit.title}</h3>
                        <p className="text-gray-500 text-sm">{benefit.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#f8f9fb] rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ee7e65]" />
                  <span className="font-semibold text-[#000000]">Quick Response</span>
                </div>
                <p className="text-gray-500 text-sm">
                  Our team typically responds within 24 hours to schedule your personalized demo.
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div id="demo-form" className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 scroll-mt-24">
              <h2 className="text-xl font-bold text-[#000000] mb-6">Request a Demo</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#000000] mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#000000] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#f8f9fb]"
                      placeholder="John Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#000000] mb-2">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#000000] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#f8f9fb]"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#000000] mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#000000] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#f8f9fb]"
                      placeholder="Acme Inc"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#000000] mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#000000] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#f8f9fb]"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#000000] mb-2">
                    Team Size
                  </label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#f8f9fb]"
                  >
                    <option value="">Select team size</option>
                    {teamSizeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#000000] mb-2">
                    How can we help?
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#000000] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#f8f9fb] resize-none"
                      placeholder="Tell us about your needs..."
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-[#ee7e65] hover:bg-[#e06d54] text-white h-14 rounded-xl font-semibold shadow-lg shadow-[#ee7e65]/25 flex items-center justify-center gap-2 text-base"
                >
                  {submitMutation.isPending ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Request Demo
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#000000] text-white py-8 px-6">
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
