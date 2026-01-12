import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { 
  FileText, 
  BarChart3, 
  RefreshCw, 
  Check, 
  X, 
  ExternalLink,
  Loader2,
  Building2,
  Briefcase,
  Target,
  Sparkles,
  Eye,
  MousePointerClick,
  Zap,
  ArrowLeft,
  TrendingUp,
  Layers,
  Calendar
} from 'lucide-react';

interface SeoPageSummary {
  id: string;
  pageType: string;
  slug: string;
  title: string;
  h1: string;
  status: 'draft' | 'published' | 'archived';
  lastGeneratedAt: string | null;
  publishedAt: string | null;
  viewCount: number;
  practiceStarts: number;
  createdAt: string;
}

interface Analytics {
  totalPages: number;
  publishedPages: number;
  totalViews: number;
  totalPracticeStarts: number;
  pagesByType: { pageType: string; count: number }[];
  topPages: SeoPageSummary[];
}

interface Role {
  id: string;
  name: string;
  category: string;
}

interface Company {
  id: string;
  name: string;
  sector: string;
  tier: string;
}

export default function SeoAdminPage() {
  const [pages, setPages] = useState<SeoPageSummary[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ status?: string; pageType?: string }>({});

  useEffect(() => {
    fetchData();
  }, [filter]);

  async function fetchData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.pageType) params.set('pageType', filter.pageType);
      
      const [pagesRes, analyticsRes, rolesRes, companiesRes] = await Promise.all([
        fetch(`/api/seo/pages?${params}`),
        fetch('/api/seo/analytics/summary'),
        fetch('/api/seo/data/roles'),
        fetch('/api/seo/data/companies?tier=top50')
      ]);
      
      const pagesData = await pagesRes.json();
      const analyticsData = await analyticsRes.json();
      const rolesData = await rolesRes.json();
      const companiesData = await companiesRes.json();
      
      setPages(pagesData.pages);
      setAnalytics(analyticsData);
      setRoles(rolesData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching SEO data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePage(type: string, id?: string) {
    try {
      setGenerating(id || type);
      let url = '';
      let options: RequestInit = { method: 'POST' };
      
      if (type === 'pillar') {
        url = `/api/seo/generate/pillar/${id}`;
      } else if (type === 'role') {
        url = `/api/seo/generate/role/${id}`;
      } else if (type === 'company') {
        url = `/api/seo/generate/company/${id}`;
      } else if (type === 'skill') {
        url = `/api/seo/generate/skill/${id}`;
      } else if (type === 'batch') {
        url = '/api/seo/generate/batch';
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageType: id, limit: 5 })
        };
      }
      
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (response.ok) {
        alert(`Generated: ${result.slug || result.summary?.success + ' pages'}`);
        fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating page:', error);
      alert('Failed to generate page');
    } finally {
      setGenerating(null);
    }
  }

  async function togglePublish(pageId: string, currentStatus: string) {
    try {
      const action = currentStatus === 'published' ? 'unpublish' : 'publish';
      const response = await fetch(`/api/seo/pages/${pageId}/${action}`, { method: 'PATCH' });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  }

  const pageTypeIcons: Record<string, React.ReactNode> = {
    pillar: <Target className="w-4 h-4" />,
    role_prep: <Briefcase className="w-4 h-4" />,
    company_prep: <Building2 className="w-4 h-4" />,
    company_role: <Sparkles className="w-4 h-4" />,
    skill_practice: <Target className="w-4 h-4" />
  };

  const pageTypeLabels: Record<string, string> = {
    pillar: 'Pillar',
    role_prep: 'Role Prep',
    company_prep: 'Company Prep',
    company_role: 'Company + Role',
    skill_practice: 'Skill Practice'
  };

  const pageTypeColors: Record<string, string> = {
    pillar: 'bg-[#cb6ce6]',
    role_prep: 'bg-[#24c4b8]',
    company_prep: 'bg-[#e2a9f1]',
    company_role: 'bg-[#cb6ce6]',
    skill_practice: 'bg-[#24c4b8]'
  };

  if (loading && !pages.length) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#cb6ce6]" />
          <p className="text-black/60">Loading SEO dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-black">hi<span className="text-[#24c4b8]">ready</span></span>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <Link to="/features" className="text-sm text-black/70 hover:text-black transition-colors">Features</Link>
                <Link to="/pricing" className="text-sm text-black/70 hover:text-black transition-colors">Pricing</Link>
                <Link to="/enterprise" className="text-sm text-black/70 hover:text-black transition-colors">Enterprise</Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center gap-2 px-4 py-2 border border-black/20 rounded-lg text-sm text-black/70 hover:border-black/40 transition-colors">
                <Calendar className="w-4 h-4" />
                Book a Demo
              </button>
              <Link to="/login" className="text-sm text-black/70 hover:text-black transition-colors">Sign In</Link>
              <Link 
                to="/readycheck" 
                className="px-5 py-2 bg-[#24c4b8] hover:bg-[#1fb3a7] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Start Preparing
              </Link>
            </div>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#cb6ce6] via-[#24c4b8] to-[#e2a9f1]"></div>
      </header>

      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">SEO Page Management</h1>
                <p className="text-white/60 text-sm">Generate, publish, and monitor SEO pages</p>
              </div>
            </div>
            <Button 
              onClick={fetchData} 
              variant="outline" 
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-gradient-to-br from-[#cb6ce6] to-[#e2a9f1] rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <FileText className="w-6 h-6 opacity-80" />
                <Layers className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-3xl font-bold">{analytics.totalPages}</p>
              <p className="text-white/80 text-sm mt-1">Total Pages</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#24c4b8] to-[#3dd9cd] rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <Check className="w-6 h-6 opacity-80" />
                <TrendingUp className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-3xl font-bold">{analytics.publishedPages}</p>
              <p className="text-white/80 text-sm mt-1">Published</p>
            </div>
            
            <div className="bg-black rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <Eye className="w-6 h-6 opacity-80" />
                <BarChart3 className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-3xl font-bold">{analytics.totalViews.toLocaleString()}</p>
              <p className="text-white/60 text-sm mt-1">Total Views</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#e2a9f1] to-[#cb6ce6] rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <MousePointerClick className="w-6 h-6 opacity-80" />
                <Zap className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-3xl font-bold">{analytics.totalPracticeStarts}</p>
              <p className="text-white/80 text-sm mt-1">Practice Starts</p>
            </div>
          </div>
        )}

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-[#24c4b8] rounded-full"></div>
            <h2 className="text-xl font-bold text-black">Generate Pages</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-black/10 rounded-2xl p-6 hover:border-[#cb6ce6]/40 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#cb6ce6]/10 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#cb6ce6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Pillar Pages</h3>
                  <p className="text-xs text-black/50">Core landing pages</p>
                </div>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => generatePage('pillar', 'mock-interview')}
                  disabled={!!generating}
                  className="w-full py-3 px-4 bg-[#24c4b8] hover:bg-[#1fb3a7] text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === 'mock-interview' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Mock Interview Page
                </button>
                <button 
                  onClick={() => generatePage('pillar', 'interview-preparation')}
                  disabled={!!generating}
                  className="w-full py-3 px-4 bg-[#24c4b8] hover:bg-[#1fb3a7] text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === 'interview-preparation' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Interview Preparation Page
                </button>
              </div>
            </div>

            <div className="border border-black/10 rounded-2xl p-6 hover:border-[#cb6ce6]/40 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#e2a9f1]/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#cb6ce6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Batch Generate</h3>
                  <p className="text-xs text-black/50">5 pages at once</p>
                </div>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => generatePage('batch', 'role_prep')}
                  disabled={!!generating}
                  className="w-full py-3 px-4 border-2 border-[#cb6ce6] text-[#cb6ce6] hover:bg-[#cb6ce6] hover:text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === 'role_prep' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Role Pages (5)
                </button>
                <button 
                  onClick={() => generatePage('batch', 'company_prep')}
                  disabled={!!generating}
                  className="w-full py-3 px-4 border-2 border-[#cb6ce6] text-[#cb6ce6] hover:bg-[#cb6ce6] hover:text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === 'company_prep' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Company Pages (5)
                </button>
                <button 
                  onClick={() => generatePage('batch', 'skill_practice')}
                  disabled={!!generating}
                  className="w-full py-3 px-4 border-2 border-[#cb6ce6] text-[#cb6ce6] hover:bg-[#cb6ce6] hover:text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === 'skill_practice' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Skill Pages (5)
                </button>
              </div>
            </div>

            <div className="border border-black/10 rounded-2xl p-6 hover:border-[#cb6ce6]/40 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#24c4b8]/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#24c4b8]" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Individual Pages</h3>
                  <p className="text-xs text-black/50">Select specific items</p>
                </div>
              </div>
              <div className="space-y-3">
                <select 
                  className="w-full p-3 border-2 border-black/10 rounded-xl text-black bg-white focus:border-[#24c4b8] focus:outline-none transition-colors"
                  onChange={(e) => e.target.value && generatePage('role', e.target.value)}
                  disabled={!!generating}
                  defaultValue=""
                >
                  <option value="" disabled>Select Role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <select 
                  className="w-full p-3 border-2 border-black/10 rounded-xl text-black bg-white focus:border-[#24c4b8] focus:outline-none transition-colors"
                  onChange={(e) => e.target.value && generatePage('company', e.target.value)}
                  disabled={!!generating}
                  defaultValue=""
                >
                  <option value="" disabled>Select Company...</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#cb6ce6] rounded-full"></div>
              <h2 className="text-xl font-bold text-black">All SEO Pages</h2>
              <span className="text-sm text-black/40">({pages.length} pages)</span>
            </div>
            <div className="flex gap-3">
              <select 
                className="py-2 px-4 border border-black/10 rounded-xl text-sm bg-white focus:border-[#cb6ce6] focus:outline-none"
                value={filter.status || ''}
                onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <select 
                className="py-2 px-4 border border-black/10 rounded-xl text-sm bg-white focus:border-[#cb6ce6] focus:outline-none"
                value={filter.pageType || ''}
                onChange={(e) => setFilter({ ...filter, pageType: e.target.value || undefined })}
              >
                <option value="">All Types</option>
                <option value="pillar">Pillar</option>
                <option value="role_prep">Role Prep</option>
                <option value="company_prep">Company Prep</option>
                <option value="company_role">Company + Role</option>
                <option value="skill_practice">Skill Practice</option>
              </select>
            </div>
          </div>
          
          <div className="border border-black/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-black/[0.02] border-b border-black/10">
                  <th className="text-left p-4 text-xs font-semibold text-black/60 uppercase tracking-wider">Type</th>
                  <th className="text-left p-4 text-xs font-semibold text-black/60 uppercase tracking-wider">Title</th>
                  <th className="text-left p-4 text-xs font-semibold text-black/60 uppercase tracking-wider">Slug</th>
                  <th className="text-left p-4 text-xs font-semibold text-black/60 uppercase tracking-wider">Status</th>
                  <th className="text-right p-4 text-xs font-semibold text-black/60 uppercase tracking-wider">Views</th>
                  <th className="text-right p-4 text-xs font-semibold text-black/60 uppercase tracking-wider">Starts</th>
                  <th className="text-right p-4 text-xs font-semibold text-black/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {pages.map(page => (
                  <tr key={page.id} className="hover:bg-[#e2a9f1]/5 transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs font-medium ${pageTypeColors[page.pageType]}`}>
                        {pageTypeIcons[page.pageType]}
                        {pageTypeLabels[page.pageType]}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-black max-w-xs truncate" title={page.title}>
                        {page.h1}
                      </p>
                    </td>
                    <td className="p-4">
                      <code className="text-xs text-black/50 bg-black/5 px-2 py-1 rounded">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        page.status === 'published' 
                          ? 'bg-[#24c4b8]/10 text-[#24c4b8]' 
                          : page.status === 'draft' 
                            ? 'bg-[#cb6ce6]/10 text-[#cb6ce6]' 
                            : 'bg-black/5 text-black/40'
                      }`}>
                        {page.status === 'published' && <Check className="w-3 h-3" />}
                        {page.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-medium text-black">{page.viewCount}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-medium text-[#cb6ce6]">{page.practiceStarts}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => togglePublish(page.id, page.status)}
                          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                            page.status === 'published'
                              ? 'border border-black/20 text-black/60 hover:bg-black/5'
                              : 'bg-[#24c4b8] text-white hover:bg-[#1fb3a7]'
                          }`}
                        >
                          {page.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        {page.status === 'published' && (
                          <a 
                            href={`/${page.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-black/5 rounded-lg text-black/40 hover:text-black transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-[#e2a9f1]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#cb6ce6]" />
                </div>
                <p className="text-black/60 mb-2">No SEO pages found</p>
                <p className="text-sm text-black/40">Generate some pages to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
