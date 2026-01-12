import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
  MousePointerClick
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

  if (loading && !pages.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#042c4c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#042c4c]">SEO Page Management</h1>
            <p className="text-gray-600 mt-1">Generate, publish, and monitor SEO pages</p>
          </div>
          <Link to="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-[#042c4c]" />
                  <div>
                    <p className="text-2xl font-bold text-[#042c4c]">{analytics.totalPages}</p>
                    <p className="text-sm text-gray-600">Total Pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Check className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{analytics.publishedPages}</p>
                    <p className="text-sm text-gray-600">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{analytics.totalViews}</p>
                    <p className="text-sm text-gray-600">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MousePointerClick className="w-8 h-8 text-[#ee7e65]" />
                  <div>
                    <p className="text-2xl font-bold text-[#ee7e65]">{analytics.totalPracticeStarts}</p>
                    <p className="text-sm text-gray-600">Practice Starts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Generate Pillar Pages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => generatePage('pillar', 'mock-interview')}
                disabled={!!generating}
                className="w-full"
              >
                {generating === 'mock-interview' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Mock Interview Page
              </Button>
              <Button 
                onClick={() => generatePage('pillar', 'interview-preparation')}
                disabled={!!generating}
                className="w-full"
              >
                {generating === 'interview-preparation' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Interview Preparation Page
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Batch Generate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => generatePage('batch', 'role_prep')}
                disabled={!!generating}
                className="w-full"
                variant="outline"
              >
                {generating === 'role_prep' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Role Pages (5)
              </Button>
              <Button 
                onClick={() => generatePage('batch', 'company_prep')}
                disabled={!!generating}
                className="w-full"
                variant="outline"
              >
                {generating === 'company_prep' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Company Pages (5)
              </Button>
              <Button 
                onClick={() => generatePage('batch', 'skill_practice')}
                disabled={!!generating}
                className="w-full"
                variant="outline"
              >
                {generating === 'skill_practice' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Skill Pages (5)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Generate Individual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select 
                className="w-full p-2 border rounded"
                onChange={(e) => e.target.value && generatePage('role', e.target.value)}
                disabled={!!generating}
              >
                <option value="">Select Role...</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <select 
                className="w-full p-2 border rounded"
                onChange={(e) => e.target.value && generatePage('company', e.target.value)}
                disabled={!!generating}
              >
                <option value="">Select Company...</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All SEO Pages</CardTitle>
              <div className="flex gap-2">
                <select 
                  className="p-2 border rounded text-sm"
                  value={filter.status || ''}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <select 
                  className="p-2 border rounded text-sm"
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
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Title</th>
                    <th className="text-left p-3">Slug</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Views</th>
                    <th className="text-right p-3">Starts</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map(page => (
                    <tr key={page.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="flex items-center gap-2 text-gray-600">
                          {pageTypeIcons[page.pageType]}
                          {pageTypeLabels[page.pageType]}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate" title={page.title}>
                        {page.h1}
                      </td>
                      <td className="p-3 text-gray-500 font-mono text-xs">
                        /{page.slug}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          page.status === 'published' ? 'bg-green-100 text-green-800' :
                          page.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">{page.viewCount}</td>
                      <td className="p-3 text-right">{page.practiceStarts}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant={page.status === 'published' ? 'outline' : 'default'}
                            onClick={() => togglePublish(page.id, page.status)}
                          >
                            {page.status === 'published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          {page.status === 'published' && (
                            <a 
                              href={`/${page.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-100 rounded"
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
                <div className="text-center py-12 text-gray-500">
                  No SEO pages found. Generate some pages to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
