import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Briefcase, 
  Target,
  Play,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Users,
  Zap,
  Brain,
  Trophy,
  Clock,
  Star
} from 'lucide-react';

interface SeoSection {
  id: string;
  headingType: 'h2' | 'h3';
  heading: string;
  content: string;
  isCta: boolean;
  ctaType?: string;
  ctaLink?: string;
}

interface SeoPage {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  pageType: string;
  jsonLd: Record<string, unknown>;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

interface RelatedLink {
  slug: string;
  title: string;
  anchorText: string;
  linkType: string;
}

export default function DynamicSeoPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState<SeoPage | null>(null);
  const [sections, setSections] = useState<SeoSection[]>([]);
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const derivedSlug = (() => {
    if (params['*']) return params['*'];
    if (params.companySlug && params.roleSlug) {
      return `interview/${params.companySlug}/${params.roleSlug}`;
    }
    if (params.slug) {
      const path = location.pathname;
      if (path.startsWith('/prepare/')) return `prepare/${params.slug}`;
      if (path.startsWith('/practice/')) return `practice/${params.slug}`;
      if (path.startsWith('/company/')) return `company/${params.slug}/interview`;
      return params.slug;
    }
    return location.pathname.slice(1);
  })();

  const isPillarPage = page?.pageType === 'pillar';
  const isMockInterviewPage = derivedSlug === 'mock-interview';

  useEffect(() => {
    async function fetchPage() {
      if (!derivedSlug) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/seo/page-by-slug/${derivedSlug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Page not found');
          } else {
            setError('Failed to load page');
          }
          return;
        }
        
        const data = await response.json();
        setPage(data.page);
        setSections(data.sections);
        setRelatedLinks(data.relatedLinks || []);
      } catch (err) {
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPage();
  }, [derivedSlug]);

  useEffect(() => {
    if (page) {
      const originalTitle = document.title;
      document.title = page.metaTitle || page.title;
      
      const createdElements: Element[] = [];
      
      const updateMeta = (name: string, content: string, isProperty = false) => {
        const attr = isProperty ? 'property' : 'name';
        let meta = document.querySelector(`meta[${attr}="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attr, name);
          document.head.appendChild(meta);
          createdElements.push(meta);
        }
        meta.setAttribute('content', content);
      };
      
      updateMeta('description', page.metaDescription || '');
      updateMeta('og:title', page.ogTitle || page.metaTitle || page.title, true);
      updateMeta('og:description', page.ogDescription || page.metaDescription || '', true);
      updateMeta('og:type', 'website', true);
      if (page.ogImageUrl) updateMeta('og:image', page.ogImageUrl, true);
      
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      const createdCanonical = !canonical;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `https://hiready.com/${page.slug}`;
      
      let script: Element | null = null;
      if (page.jsonLd) {
        script = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
        if (!script) {
          script = document.createElement('script');
          script.setAttribute('type', 'application/ld+json');
          script.setAttribute('data-seo', 'true');
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(page.jsonLd);
      }
      
      fetch('/api/seo/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoPageId: page.id,
          eventType: 'page_view',
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          sessionId: sessionStorage.getItem('seo_session_id') || crypto.randomUUID()
        })
      }).catch(() => {});
      
      if (!sessionStorage.getItem('seo_session_id')) {
        sessionStorage.setItem('seo_session_id', crypto.randomUUID());
      }
      
      return () => {
        document.title = originalTitle;
        createdElements.forEach(el => el.remove());
        if (createdCanonical && canonical) canonical.remove();
        if (script) script.remove();
      };
    }
  }, [page]);

  const trackAndNavigate = (path: string, eventType: string = 'cta_click') => {
    if (page) {
      fetch('/api/seo/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoPageId: page.id,
          eventType: eventType === 'practice_start' ? 'practice_start' : 'cta_click',
          eventData: { ctaLink: path },
          sessionId: sessionStorage.getItem('seo_session_id')
        })
      }).catch(() => {});
    }
    navigate(path);
  };

  const handleCtaClick = (section: SeoSection) => {
    if (page) {
      fetch('/api/seo/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoPageId: page.id,
          eventType: section.ctaType === 'practice_start' ? 'practice_start' : 'cta_click',
          eventData: { ctaType: section.ctaType, ctaLink: section.ctaLink },
          sessionId: sessionStorage.getItem('seo_session_id')
        })
      }).catch(() => {});
    }
    
    if (section.ctaLink) {
      navigate(section.ctaLink);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000000]"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfc]">
        <h1 className="text-2xl font-bold text-[#000000] mb-4">Page Not Found</h1>
        <p className="text-[#6c8194] mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const pageTypeIcons: Record<string, React.ReactNode> = {
    pillar: <Target className="w-8 h-8 text-[#ee7e65]" />,
    role_prep: <Briefcase className="w-8 h-8 text-[#ee7e65]" />,
    company_prep: <Building2 className="w-8 h-8 text-[#ee7e65]" />,
    company_role: <Sparkles className="w-8 h-8 text-[#ee7e65]" />,
    skill_practice: <Target className="w-8 h-8 text-[#ee7e65]" />
  };

  const howItWorksSteps = [
    { icon: Target, title: "Choose Your Focus", desc: "Select your target role, company, or skill to practice" },
    { icon: MessageSquare, title: "Practice with AI", desc: "Engage in realistic interview simulations with AI avatars" },
    { icon: BarChart3, title: "Get Feedback", desc: "Receive detailed analysis and actionable improvement tips" }
  ];

  const benefits = isMockInterviewPage ? [
    { icon: Brain, title: "AI-Powered Realism", desc: "Practice with interviewers that adapt to your responses" },
    { icon: Clock, title: "Practice Anytime", desc: "24/7 access to unlimited practice sessions" },
    { icon: Trophy, title: "Track Progress", desc: "See your improvement over time with detailed metrics" },
    { icon: Zap, title: "Instant Feedback", desc: "Get actionable insights immediately after each session" }
  ] : [
    { icon: Briefcase, title: "Role-Specific Prep", desc: "Tailored content for your target position" },
    { icon: Building2, title: "Company Research", desc: "Learn what top companies look for in candidates" },
    { icon: Users, title: "Expert Insights", desc: "Strategies from interview coaches and hiring managers" },
    { icon: Star, title: "Proven Methods", desc: "Frameworks that have helped thousands succeed" }
  ];

  const trustedCompanies = ["Google", "Amazon", "Meta", "Microsoft", "Apple", "Netflix"];

  if (isPillarPage) {
    return (
      <>
        <div className="min-h-screen bg-white">
          <header className="bg-[#000000] text-white py-4 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
              <Link to="/" className="text-2xl font-bold">Hiready</Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/mock-interview" className="hover:text-[#ee7e65] transition-colors">Mock Interview</Link>
                <Link to="/interview-preparation" className="hover:text-[#ee7e65] transition-colors">Interview Prep</Link>
                <Link to="/readycheck" className="bg-[#ee7e65] hover:bg-[#ee7e65] px-4 py-2 rounded-lg transition-colors">
                  Start Free Practice
                </Link>
              </nav>
            </div>
          </header>

          <section className="bg-gradient-to-br from-[#000000] via-[#000000]/90 to-[#000000] text-white py-20 md:py-28 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-10 w-72 h-72 bg-[#ee7e65] rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#ee7e65] rounded-full blur-3xl"></div>
            </div>
            <div className="max-w-6xl mx-auto px-4 relative z-10">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#ee7e65]" />
                  <span className="text-[#ee7e65] font-medium text-sm uppercase tracking-wider">AI-Powered Practice</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  {page.h1}
                </h1>
                <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
                  {page.metaDescription}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => trackAndNavigate('/readycheck', 'practice_start')}
                    className="bg-[#ee7e65] hover:bg-[#ee7e65] text-white font-semibold py-4 px-8 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#ee7e65]/30"
                  >
                    <Play className="w-5 h-5" />
                    Start Free Practice
                  </Button>
                  <Button 
                    onClick={() => trackAndNavigate('/interview')}
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold py-4 px-8 rounded-xl text-lg"
                  >
                    Explore Interview Types
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#fbfbfc] py-8 border-b border-[#768c9c]/20">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                <span className="text-[#6c8194] text-sm font-medium">Trusted by candidates from</span>
                <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                  {trustedCompanies.map((company) => (
                    <span key={company} className="text-[#768c9c] font-semibold text-lg">{company}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[#000000] mb-4">How It Works</h2>
                <p className="text-[#6c8194] text-lg max-w-2xl mx-auto">Get interview-ready in three simple steps</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {howItWorksSteps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="bg-white rounded-2xl p-8 border-2 border-[#768c9c]/20 hover:border-[#ee7e65]/30 hover:shadow-xl transition-all group">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#ee7e65] to-[#ee7e65] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#000000] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-bold text-[#000000] mb-3">{step.title}</h3>
                      <p className="text-[#6c8194]">{step.desc}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                        <ArrowRight className="w-8 h-8 text-[#768c9c]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 md:py-20 bg-[#fbfbfc]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[#000000] mb-4">
                  {isMockInterviewPage ? "Why Practice With AI?" : "Why Prepare With Us?"}
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-[#000000]/10 rounded-xl flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-[#000000]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#000000] mb-2">{benefit.title}</h3>
                      <p className="text-[#6c8194] text-sm">{benefit.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <article className="py-16 md:py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4">
              {sections.map((section, index) => (
                <section key={section.id} className={`mb-12 ${index > 0 ? 'pt-8 border-t border-[#768c9c]/20' : ''}`}>
                  {section.headingType === 'h2' ? (
                    <h2 className="text-2xl md:text-3xl font-bold text-[#000000] mb-6">
                      {section.heading}
                    </h2>
                  ) : (
                    <h3 className="text-xl md:text-2xl font-semibold text-[#000000] mb-4">
                      {section.heading}
                    </h3>
                  )}
                  
                  <div className="text-[#6c8194] leading-relaxed text-lg whitespace-pre-wrap">
                    {section.content}
                  </div>

                  {section.isCta && (
                    <div className="mt-8 p-8 bg-gradient-to-r from-[#000000] to-[#000000]/90 rounded-2xl">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-white">
                          <h4 className="text-xl font-bold mb-2">Ready to practice?</h4>
                          <p className="text-white/70">Start your first mock interview in under 2 minutes</p>
                        </div>
                        <Button 
                          onClick={() => handleCtaClick(section)}
                          className="bg-[#ee7e65] hover:bg-[#ee7e65] text-white font-semibold py-3 px-8 rounded-xl flex items-center gap-2 whitespace-nowrap"
                        >
                          Start Practice Now
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </article>

          <section className="py-20 bg-gradient-to-br from-[#000000] via-[#000000]/90 to-[#000000] text-white">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Ace Your Interview?</h2>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Join thousands of candidates who improved their interview skills with AI-powered practice
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => trackAndNavigate('/readycheck', 'practice_start')}
                  className="bg-[#ee7e65] hover:bg-[#ee7e65] text-white font-semibold py-4 px-10 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  Start Free Practice
                </Button>
                <Button 
                  onClick={() => trackAndNavigate('/pricing')}
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold py-4 px-10 rounded-xl text-lg"
                >
                  View Pricing
                </Button>
              </div>
              <p className="text-[#768c9c] text-sm mt-6">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                No credit card required for free trial
              </p>
            </div>
          </section>

          {relatedLinks.length > 0 && (
            <section className="py-16 bg-[#fbfbfc]">
              <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-2xl font-bold text-[#000000] mb-8 text-center">Explore More Resources</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedLinks.map((link, index) => (
                    <Link 
                      key={index}
                      to={`/${link.slug}`}
                      className="group bg-white p-6 rounded-xl border-2 border-[#768c9c]/20 hover:border-[#ee7e65] hover:shadow-lg transition-all"
                    >
                      <span className="text-[#000000] group-hover:text-[#ee7e65] font-semibold text-lg flex items-center gap-2">
                        {link.anchorText}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          <footer className="bg-[#000000] text-white py-12">
            <div className="max-w-6xl mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Hiready</h3>
                  <p className="text-[#768c9c] text-sm">
                    AI-powered interview practice platform. Prepare with real interview simulations and get actionable feedback.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Interview Prep</h4>
                  <ul className="space-y-2 text-sm text-[#768c9c]">
                    <li><Link to="/mock-interview" className="hover:text-white transition-colors">Mock Interview</Link></li>
                    <li><Link to="/interview-preparation" className="hover:text-white transition-colors">Interview Preparation</Link></li>
                    <li><Link to="/practice/behavioral-interview" className="hover:text-white transition-colors">Behavioral Interview</Link></li>
                    <li><Link to="/practice/technical-interview" className="hover:text-white transition-colors">Technical Interview</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">By Role</h4>
                  <ul className="space-y-2 text-sm text-[#768c9c]">
                    <li><Link to="/prepare/software-engineer-interview" className="hover:text-white transition-colors">Software Engineer</Link></li>
                    <li><Link to="/prepare/data-analyst-interview" className="hover:text-white transition-colors">Data Analyst</Link></li>
                    <li><Link to="/prepare/product-manager-interview" className="hover:text-white transition-colors">Product Manager</Link></li>
                    <li><Link to="/prepare/data-scientist-interview" className="hover:text-white transition-colors">Data Scientist</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Product</h4>
                  <ul className="space-y-2 text-sm text-[#768c9c]">
                    <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                    <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                    <li><Link to="/enterprise" className="hover:text-white transition-colors">Enterprise</Link></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-[#768c9c]/30 mt-8 pt-8 text-center text-sm text-[#6c8194]">
                © {new Date().getFullYear()} Hiready. All rights reserved.
              </div>
            </div>
          </footer>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#768c9c]/20 shadow-lg md:hidden z-50">
            <Button 
              onClick={() => trackAndNavigate('/readycheck', 'practice_start')}
              className="w-full bg-[#ee7e65] hover:bg-[#ee7e65] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Free Practice
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <header className="bg-[#000000] text-white py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">Hiready</Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/mock-interview" className="hover:text-[#ee7e65] transition-colors">Mock Interview</Link>
              <Link to="/interview-preparation" className="hover:text-[#ee7e65] transition-colors">Interview Prep</Link>
              <Link to="/readycheck" className="bg-[#ee7e65] hover:bg-[#ee7e65] px-4 py-2 rounded-lg transition-colors">
                Start Practice
              </Link>
            </nav>
          </div>
        </header>

        <nav className="bg-[#fbfbfc] py-3 border-b border-[#768c9c]/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-[#6c8194]">
              <Link to="/" className="hover:text-[#000000]">Home</Link>
              <ChevronRight className="w-4 h-4" />
              {(page.pageType === 'role_prep' || page.pageType === 'company_prep' || page.pageType === 'company_role') && (
                <>
                  <Link to="/interview-preparation" className="hover:text-[#000000]">Interview Prep</Link>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
              <span className="text-[#000000] font-medium">{page.h1}</span>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            {pageTypeIcons[page.pageType]}
            <h1 className="text-4xl md:text-5xl font-bold text-[#000000] leading-tight">
              {page.h1}
            </h1>
          </div>

          <div className="mb-8 p-6 bg-gradient-to-r from-[#000000] to-[#000000]/90 rounded-2xl text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Ready to practice?</h2>
                <p className="text-white/70">Start a realistic mock interview now</p>
              </div>
              <Button 
                onClick={() => trackAndNavigate('/readycheck', 'practice_start')}
                className="bg-[#ee7e65] hover:bg-[#ee7e65] text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Practice
              </Button>
            </div>
          </div>

          <article className="prose prose-lg max-w-none">
            {sections.map((section, index) => (
              <section key={section.id} className="mb-12">
                {section.headingType === 'h2' ? (
                  <h2 className="text-2xl md:text-3xl font-bold text-[#000000] mb-4 mt-8">
                    {section.heading}
                  </h2>
                ) : (
                  <h3 className="text-xl md:text-2xl font-semibold text-[#000000] mb-3 mt-6">
                    {section.heading}
                  </h3>
                )}
                
                <div className="text-[#6c8194] leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>

                {section.isCta && (
                  <Card className="mt-6 border-2 border-[#ee7e65] bg-gradient-to-r from-[#000000] to-[#000000]/90">
                    <CardContent className="p-6">
                      <Button 
                        onClick={() => handleCtaClick(section)}
                        className="w-full md:w-auto bg-[#ee7e65] hover:bg-[#ee7e65] text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2"
                      >
                        Start Practice Now
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </section>
            ))}
          </article>

          {relatedLinks.length > 0 && (
            <section className="mt-16 pt-8 border-t border-[#768c9c]/20">
              <h2 className="text-2xl font-bold text-[#000000] mb-6">Related Resources</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedLinks.map((link, index) => (
                  <Link 
                    key={index}
                    to={`/${link.slug}`}
                    className="group p-4 border border-[#768c9c]/20 rounded-lg hover:border-[#ee7e65] hover:shadow-md transition-all"
                  >
                    <span className="text-[#000000] group-hover:text-[#ee7e65] font-medium flex items-center gap-2">
                      {link.anchorText}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        <footer className="bg-[#000000] text-white py-12 mt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Hiready</h3>
                <p className="text-[#768c9c] text-sm">
                  AI-powered interview practice platform. Prepare with real interview simulations and get actionable feedback.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Interview Prep</h4>
                <ul className="space-y-2 text-sm text-[#768c9c]">
                  <li><Link to="/mock-interview" className="hover:text-white transition-colors">Mock Interview</Link></li>
                  <li><Link to="/interview-preparation" className="hover:text-white transition-colors">Interview Preparation</Link></li>
                  <li><Link to="/practice/behavioral-interview" className="hover:text-white transition-colors">Behavioral Interview</Link></li>
                  <li><Link to="/practice/technical-interview" className="hover:text-white transition-colors">Technical Interview</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">By Role</h4>
                <ul className="space-y-2 text-sm text-[#768c9c]">
                  <li><Link to="/prepare/software-engineer-interview" className="hover:text-white transition-colors">Software Engineer</Link></li>
                  <li><Link to="/prepare/data-analyst-interview" className="hover:text-white transition-colors">Data Analyst</Link></li>
                  <li><Link to="/prepare/product-manager-interview" className="hover:text-white transition-colors">Product Manager</Link></li>
                  <li><Link to="/prepare/data-scientist-interview" className="hover:text-white transition-colors">Data Scientist</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-[#768c9c]">
                  <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link to="/enterprise" className="hover:text-white transition-colors">Enterprise</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-[#768c9c]/30 mt-8 pt-8 text-center text-sm text-[#6c8194]">
              © {new Date().getFullYear()} Hiready. All rights reserved.
            </div>
          </div>
        </footer>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#768c9c]/20 shadow-lg md:hidden z-50">
          <Button 
            onClick={() => trackAndNavigate('/readycheck', 'practice_start')}
            className="w-full bg-[#ee7e65] hover:bg-[#ee7e65] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Practice
          </Button>
        </div>
      </div>
    </>
  );
}
