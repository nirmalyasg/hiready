import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Send, CheckCircle, Building2, Mail, Phone, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import MarketingNav from '@/components/layout/marketing-nav';

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

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fbfbfc]">
        <MarketingNav />
        <div className="pt-[120px] flex items-center justify-center px-4 min-h-screen">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#042c4c] mb-4">Thank You!</h1>
            <p className="text-[#6c8194] mb-8">
              We've received your demo request. Our team will reach out within 24 hours to schedule a personalized demo.
            </p>
            <Link to="/">
              <Button className="bg-[#042c4c] hover:bg-[#0a3d62] text-white">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfc]">
      <MarketingNav />

      <div className="pt-[120px] pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="lg:sticky lg:top-[120px]">
              <span className="inline-flex items-center gap-2 bg-[#ee7e65]/10 text-[#ee7e65] px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Building2 className="w-4 h-4" />
                Enterprise Solutions
              </span>
              <h1 className="text-4xl font-bold text-[#042c4c] mb-6">
                Book a Demo
              </h1>
              <p className="text-[#6c8194] text-lg mb-8 leading-relaxed">
                See how Hiready can transform your organization's interview preparation and hiring process. Get a personalized walkthrough with our team.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#042c4c] rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#042c4c]">Personalized Demo</h3>
                    <p className="text-[#6c8194] text-sm">Tailored to your organization's needs and use cases</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#042c4c] rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#042c4c]">Enterprise Features</h3>
                    <p className="text-[#6c8194] text-sm">SSO, analytics, custom branding, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#042c4c] rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#042c4c]">Pricing Discussion</h3>
                    <p className="text-[#6c8194] text-sm">Custom packages for teams of all sizes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
              <h2 className="text-xl font-bold text-[#042c4c] mb-6">Request a Demo</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#042c4c] mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#768c9c]" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#fbfbfc]"
                      placeholder="John Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#042c4c] mb-2">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#768c9c]" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#fbfbfc]"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#042c4c] mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#768c9c]" />
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#fbfbfc]"
                      placeholder="Acme Inc"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#042c4c] mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#768c9c]" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#fbfbfc]"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#042c4c] mb-2">
                    Team Size
                  </label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#fbfbfc]"
                  >
                    <option value="">Select team size</option>
                    {teamSizeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#042c4c] mb-2">
                    How can we help?
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-[#768c9c]" />
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#fbfbfc] resize-none"
                      placeholder="Tell us about your needs..."
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-[#ee7e65] hover:bg-[#e06a50] text-white py-4 rounded-xl font-semibold shadow-lg shadow-[#ee7e65]/25 flex items-center justify-center gap-2"
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

      <footer className="bg-[#042c4c] text-white py-8 px-4 sm:px-6">
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
            © {new Date().getFullYear()} Hiready
          </div>
        </div>
      </footer>
    </div>
  );
}
