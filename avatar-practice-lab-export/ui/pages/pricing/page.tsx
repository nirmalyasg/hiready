import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Check, Calendar, Zap, Crown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Perfect for trying out Hiready',
      icon: Zap,
      features: [
        '3 practice interviews per month',
        'Basic feedback & scoring',
        'Behavioral interview type',
        'Email support',
      ],
      cta: 'Start Free',
      ctaLink: '/readycheck',
      popular: false,
    },
    {
      name: 'Pro',
      price: '19',
      period: '/month',
      description: 'For serious job seekers',
      icon: Crown,
      features: [
        'Unlimited practice interviews',
        'All interview types (Behavioral, Technical, Case, HR)',
        'Detailed 8-dimension feedback',
        'Resume analysis & personalized questions',
        'Progress tracking & analytics',
        'Priority email support',
      ],
      cta: 'Get Pro',
      ctaLink: '/register',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and organizations',
      icon: Building2,
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'SSO & advanced security',
        'Custom role kits & branding',
        'Admin dashboard & analytics',
        'Dedicated customer success',
        'API access',
      ],
      cta: 'Contact Sales',
      ctaLink: '/demo',
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit cards, debit cards, and UPI payments.',
    },
    {
      q: 'Is there a student discount?',
      a: 'Yes! Students get 50% off Pro plans. Contact us with your student email to get the discount.',
    },
    {
      q: 'Can I switch plans?',
      a: 'You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfc]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#042c4c] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-[#042c4c] text-xl tracking-tight">Hiready</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/features" className="text-[#6c8194] hover:text-[#042c4c] text-sm font-medium">Features</Link>
            <Link to="/pricing" className="text-[#ee7e65] text-sm font-semibold">Pricing</Link>
            <Link to="/enterprise" className="text-[#6c8194] hover:text-[#042c4c] text-sm font-medium">Enterprise</Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-[#6c8194]">Sign In</Button>
            </Link>
            <Link to="/readycheck">
              <Button size="sm" className="bg-[#ee7e65] hover:bg-[#e06a50] text-white">Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#042c4c] via-[#042c4c] to-[#0a3d62]" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-[#ee7e65]/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
            Simple, transparent
            <br />
            <span className="text-[#ee7e65]">pricing</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Choose the plan that works for you. Start free and upgrade when you're ready.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 bg-white -mt-8 rounded-t-[2rem]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <div 
                  key={i} 
                  className={`rounded-2xl p-8 border-2 transition-all relative ${
                    plan.popular 
                      ? 'border-[#ee7e65] bg-white shadow-xl shadow-[#ee7e65]/10' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ee7e65] text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.popular ? 'bg-[#ee7e65]' : 'bg-[#042c4c]'
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#042c4c] text-xl">{plan.name}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#042c4c]">
                      {plan.price === 'Custom' ? '' : '$'}{plan.price}
                    </span>
                    <span className="text-[#6c8194]">{plan.period}</span>
                  </div>
                  
                  <p className="text-[#6c8194] mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[#042c4c] text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to={plan.ctaLink}>
                    <Button 
                      className={`w-full h-12 font-semibold ${
                        plan.popular 
                          ? 'bg-[#ee7e65] hover:bg-[#e06a50] text-white shadow-lg shadow-[#ee7e65]/25' 
                          : 'bg-[#042c4c] hover:bg-[#0a3d62] text-white'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-[#fbfbfc]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#042c4c] mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-[#042c4c] mb-2">{faq.q}</h3>
                <p className="text-[#6c8194]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 bg-[#042c4c]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Need a custom solution?
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Contact our team for enterprise pricing and custom packages.
          </p>
          <Link to="/demo">
            <Button size="lg" className="bg-[#ee7e65] hover:bg-[#e06a50] text-white px-10 h-14 text-base font-semibold shadow-xl shadow-[#ee7e65]/30 gap-2">
              <Calendar className="w-4 h-4" />
              Book a Demo
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
            © {new Date().getFullYear()} Hiready
          </div>
        </div>
      </footer>
    </div>
  );
}
