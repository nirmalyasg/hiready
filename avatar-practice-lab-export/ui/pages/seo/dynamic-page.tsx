import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ChevronRight, ArrowRight, Sparkles, Building2, Briefcase, Target } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#042c4c]"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
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

  return (
    <>
      <div className="min-h-screen bg-white">
        <header className="bg-[#042c4c] text-white py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">Hiready</Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/mock-interview" className="hover:text-[#ee7e65] transition-colors">Mock Interview</Link>
              <Link to="/interview-preparation" className="hover:text-[#ee7e65] transition-colors">Interview Prep</Link>
              <Link to="/interview" className="bg-[#ee7e65] hover:bg-[#d96a52] px-4 py-2 rounded-lg transition-colors">
                Start Practice
              </Link>
            </nav>
          </div>
        </header>

        <nav className="bg-gray-100 py-3 border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-[#042c4c]">Home</Link>
              <ChevronRight className="w-4 h-4" />
              {page.pageType === 'role_prep' && (
                <>
                  <Link to="/interview-preparation" className="hover:text-[#042c4c]">Interview Prep</Link>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
              {page.pageType === 'company_prep' && (
                <>
                  <Link to="/interview-preparation" className="hover:text-[#042c4c]">Interview Prep</Link>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
              {page.pageType === 'company_role' && (
                <>
                  <Link to="/interview-preparation" className="hover:text-[#042c4c]">Interview Prep</Link>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
              <span className="text-[#042c4c] font-medium">{page.h1}</span>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            {pageTypeIcons[page.pageType]}
            <h1 className="text-4xl md:text-5xl font-bold text-[#042c4c] leading-tight">
              {page.h1}
            </h1>
          </div>

          <article className="prose prose-lg max-w-none">
            {sections.map((section, index) => (
              <section key={section.id} className="mb-12">
                {section.headingType === 'h2' ? (
                  <h2 className="text-2xl md:text-3xl font-bold text-[#042c4c] mb-4 mt-8">
                    {section.heading}
                  </h2>
                ) : (
                  <h3 className="text-xl md:text-2xl font-semibold text-[#042c4c] mb-3 mt-6">
                    {section.heading}
                  </h3>
                )}
                
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>

                {section.isCta && (
                  <Card className="mt-6 border-2 border-[#ee7e65] bg-gradient-to-r from-[#042c4c] to-[#0a4a7a]">
                    <CardContent className="p-6">
                      <Button 
                        onClick={() => handleCtaClick(section)}
                        className="w-full md:w-auto bg-[#ee7e65] hover:bg-[#d96a52] text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2"
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
            <section className="mt-16 pt-8 border-t">
              <h2 className="text-2xl font-bold text-[#042c4c] mb-6">Related Resources</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedLinks.map((link, index) => (
                  <Link 
                    key={index}
                    to={`/${link.slug}`}
                    className="group p-4 border rounded-lg hover:border-[#ee7e65] hover:shadow-md transition-all"
                  >
                    <span className="text-[#042c4c] group-hover:text-[#ee7e65] font-medium flex items-center gap-2">
                      {link.anchorText}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        <footer className="bg-[#042c4c] text-white py-12 mt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Hiready</h3>
                <p className="text-gray-300 text-sm">
                  AI-powered interview practice platform. Prepare with real interview simulations and get actionable feedback.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Interview Prep</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><Link to="/mock-interview" className="hover:text-white">Mock Interview</Link></li>
                  <li><Link to="/interview-preparation" className="hover:text-white">Interview Preparation</Link></li>
                  <li><Link to="/practice/behavioral-interview" className="hover:text-white">Behavioral Interview</Link></li>
                  <li><Link to="/practice/technical-interview" className="hover:text-white">Technical Interview</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">By Role</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><Link to="/prepare/software-engineer-interview" className="hover:text-white">Software Engineer</Link></li>
                  <li><Link to="/prepare/data-analyst-interview" className="hover:text-white">Data Analyst</Link></li>
                  <li><Link to="/prepare/product-manager-interview" className="hover:text-white">Product Manager</Link></li>
                  <li><Link to="/prepare/data-scientist-interview" className="hover:text-white">Data Scientist</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><Link to="/features" className="hover:text-white">Features</Link></li>
                  <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link to="/enterprise" className="hover:text-white">Enterprise</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
              © {new Date().getFullYear()} Hiready. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
