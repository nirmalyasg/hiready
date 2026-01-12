import { Link } from 'react-router-dom';
import { ArrowRight, Check, Calendar, Zap, Crown, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingNav from '@/components/layout/marketing-nav';
import logoImg from '@/assets/logo.png';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Perfect for trying out Hiready',
      icon: Zap,
      currency: '',
      features: [
        '1 free interview',
        'Basic feedback & scoring',
        'Behavioral interview type',
        'Email support',
      ],
      cta: 'Start Free',
      ctaLink: '/readycheck',
      popular: false,
    },
    {
      name: 'Interview Set',
      price: '199',
      period: 'one-time',
      description: 'For a specific role',
      icon: Zap,
      currency: '₹',
      features: [
        'All interview rounds (HR, Technical, Case)',
        'Detailed feedback & scoring',
        'Lifetime access to this set',
        'Shareable scorecard',
      ],
      cta: 'Buy Now',
      ctaLink: '/register',
      popular: false,
    },
    {
      name: 'Unlimited',
      price: '499',
      period: '/month',
      description: 'Unlimited access to everything',
      icon: Crown,
      currency: '₹',
      features: [
        'Unlimited interviews for all roles',
        'All companies & interview types',
        'Detailed 8-dimension feedback',
        'Resume analysis & personalized questions',
        'Progress tracking & analytics',
        'Priority support',
      ],
      cta: 'Get Unlimited',
      ctaLink: '/register',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and organizations',
      icon: Building2,
      currency: '',
      features: [
        'Everything in Unlimited',
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
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-[100px] lg:pt-[120px] pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(203,108,230,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(36,196,184,0.1),transparent_50%)]" />
        
        <div className="max-w-4xl mx-auto text-center relative px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <Crown className="w-4 h-4 text-[#24c4b8]" />
            Pricing Plans
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white tracking-tight">
            Simple, transparent
            <br />
            <span className="text-[#24c4b8]">pricing</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
            Choose the plan that works for you. Start free and upgrade when you're ready.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/readycheck">
              <Button size="lg" className="w-full sm:w-auto bg-[#24c4b8] hover:bg-[#1db0a5] text-white px-8 h-14 text-base font-semibold shadow-xl shadow-[#24c4b8]/30 group">
                Start Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                <Calendar className="w-4 h-4" />
                Contact Sales
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 justify-center text-white/60 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#24c4b8]" />
              <span>Student discounts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6 bg-[#f8f7fc]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <div 
                  key={i} 
                  className={`rounded-2xl p-8 border-2 transition-all hover:shadow-xl hover:-translate-y-1 relative bg-white ${
                    plan.popular 
                      ? 'border-[#24c4b8] shadow-xl shadow-[#24c4b8]/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#24c4b8] text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.popular ? 'bg-[#24c4b8]' : 'bg-[#6b1fad]'
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1a1a2e] text-xl">{plan.name}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#1a1a2e]">
                      {plan.currency}{plan.price}
                    </span>
                    <span className="text-gray-500"> {plan.period}</span>
                  </div>
                  
                  <p className="text-gray-500 mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#24c4b8] flex-shrink-0 mt-0.5" />
                        <span className="text-[#1a1a2e] text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to={plan.ctaLink}>
                    <Button 
                      className={`w-full h-12 font-semibold group ${
                        plan.popular 
                          ? 'bg-[#24c4b8] hover:bg-[#1db0a5] text-white shadow-lg shadow-[#24c4b8]/25' 
                          : 'bg-[#6b1fad] hover:bg-[#5a1a91] text-white'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[#6b1fad] text-sm font-semibold tracking-wider uppercase mb-3">FAQ</span>
            <h2 className="text-3xl font-bold text-[#1a1a2e]">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#f8f7fc] rounded-2xl p-6 border border-gray-100 hover:border-[#6b1fad]/30 transition-all">
                <h3 className="font-semibold text-[#1a1a2e] mb-2">{faq.q}</h3>
                <p className="text-gray-500">{faq.a}</p>
              </div>
            ))}
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
            Need a custom solution?
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Contact our team for enterprise pricing and custom packages.
          </p>
          <Link to="/demo">
            <Button size="lg" className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white px-10 h-14 text-base font-semibold shadow-xl shadow-[#24c4b8]/30 gap-2 group">
              <Calendar className="w-4 h-4" />
              Book a Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
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
