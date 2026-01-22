/**
 * Open Job Search Service
 *
 * Provides job search functionality using free/open APIs:
 * - JSearch API (RapidAPI) - primary source
 * - Adzuna API - secondary source
 * - RemoteOK API - for remote jobs
 * - Web scraping fallback
 */

import crypto from 'crypto';

// API Keys - configure in environment
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;

export interface JobSearchParams {
  query?: string;
  location?: string;
  country?: string;
  remote?: boolean;
  employmentType?: string; // full-time, part-time, contract
  experienceLevel?: string; // entry, mid, senior
  datePosted?: string; // today, 3days, week, month
  limit?: number;
  page?: number;
}

export interface JobResult {
  id: string;
  title: string;
  company_name?: string;
  company_logo_url?: string;
  location?: string;
  city?: string;
  country?: string;
  description?: string;
  url?: string;
  employment_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  skills?: string[];
  posted_at?: string;
  is_remote?: boolean;
  source: string;
}

export interface JobSearchResponse {
  success: boolean;
  jobs: JobResult[];
  total: number;
  source: string;
  error?: string;
}

/**
 * Generate a fingerprint for job deduplication
 */
export function generateJobFingerprint(job: {
  roleTitle: string;
  companyName?: string | null;
  location?: string | null;
}): string {
  const normalizedTitle = (job.roleTitle || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedCompany = (job.companyName || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedLocation = (job.location || '').toLowerCase().trim().replace(/\s+/g, ' ');

  const data = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Parse experience level from various formats
 */
export function parseExperienceYears(experienceText?: string): { min: number; max: number } {
  if (!experienceText) return { min: 0, max: 99 };

  const text = experienceText.toLowerCase();

  const rangeMatch = text.match(/(\d+)\s*[-to]\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
  }

  const plusMatch = text.match(/(\d+)\+/);
  if (plusMatch) {
    return { min: parseInt(plusMatch[1]), max: 99 };
  }

  const singleMatch = text.match(/(\d+)\s*year/);
  if (singleMatch) {
    const years = parseInt(singleMatch[1]);
    return { min: years, max: years + 2 };
  }

  if (text.includes('entry') || text.includes('junior') || text.includes('fresher')) {
    return { min: 0, max: 2 };
  }
  if (text.includes('mid') || text.includes('intermediate')) {
    return { min: 2, max: 5 };
  }
  if (text.includes('senior') || text.includes('lead')) {
    return { min: 5, max: 10 };
  }
  if (text.includes('principal') || text.includes('staff') || text.includes('director')) {
    return { min: 8, max: 99 };
  }

  return { min: 0, max: 99 };
}

/**
 * Extract skills from job description
 */
export function extractSkillsFromDescription(description?: string): string[] {
  if (!description) return [];

  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', '.net', 'nextjs',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'devops',
    'machine learning', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'spark', 'hadoop',
    'api', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'git', 'linux',
    'leadership', 'communication', 'problem-solving', 'teamwork', 'analytical'
  ];

  const descLower = description.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => descLower.includes(skill));

  return [...new Set(foundSkills)];
}

/**
 * Search jobs using JSearch API (RapidAPI)
 */
async function searchJSearchAPI(params: JobSearchParams): Promise<JobSearchResponse> {
  if (!JSEARCH_API_KEY) {
    return { success: false, jobs: [], total: 0, source: 'jsearch', error: 'JSearch API key not configured' };
  }

  try {
    const queryParts = [params.query || 'software engineer'];
    if (params.location) queryParts.push(`in ${params.location}`);

    const searchParams = new URLSearchParams({
      query: queryParts.join(' '),
      page: String(params.page || 1),
      num_pages: '1',
    });

    if (params.remote) searchParams.append('remote_jobs_only', 'true');
    if (params.employmentType) searchParams.append('employment_types', params.employmentType.toUpperCase());
    if (params.datePosted) searchParams.append('date_posted', params.datePosted);

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${searchParams.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': JSEARCH_API_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const data = await response.json();

    const jobs: JobResult[] = (data.data || []).map((job: any) => ({
      id: job.job_id || crypto.randomUUID(),
      title: job.job_title,
      company_name: job.employer_name,
      company_logo_url: job.employer_logo,
      location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country,
      city: job.job_city,
      country: job.job_country,
      description: job.job_description,
      url: job.job_apply_link || job.job_google_link,
      employment_type: job.job_employment_type,
      experience_level: job.job_required_experience?.required_experience_in_months
        ? `${Math.round(job.job_required_experience.required_experience_in_months / 12)} years`
        : job.job_required_experience?.experience_mentioned ? 'Experience required' : null,
      salary_min: job.job_min_salary,
      salary_max: job.job_max_salary,
      salary_currency: job.job_salary_currency || 'USD',
      skills: job.job_required_skills || extractSkillsFromDescription(job.job_description),
      posted_at: job.job_posted_at_datetime_utc,
      is_remote: job.job_is_remote,
      source: 'jsearch',
    }));

    return {
      success: true,
      jobs,
      total: data.data?.length || 0,
      source: 'jsearch',
    };
  } catch (error) {
    console.error('[JSearch] Error:', error);
    return { success: false, jobs: [], total: 0, source: 'jsearch', error: String(error) };
  }
}

/**
 * Search jobs using Adzuna API
 */
async function searchAdzunaAPI(params: JobSearchParams): Promise<JobSearchResponse> {
  if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
    return { success: false, jobs: [], total: 0, source: 'adzuna', error: 'Adzuna API not configured' };
  }

  try {
    const country = (params.country || 'us').toLowerCase();
    const page = params.page || 1;

    const searchParams = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_API_KEY,
      results_per_page: String(params.limit || 20),
      what: params.query || 'software engineer',
    });

    if (params.location) searchParams.append('where', params.location);

    const response = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = await response.json();

    const jobs: JobResult[] = (data.results || []).map((job: any) => ({
      id: job.id || crypto.randomUUID(),
      title: job.title,
      company_name: job.company?.display_name,
      location: job.location?.display_name,
      city: job.location?.area?.[0],
      country: country.toUpperCase(),
      description: job.description,
      url: job.redirect_url,
      employment_type: job.contract_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: 'USD',
      skills: extractSkillsFromDescription(job.description),
      posted_at: job.created,
      is_remote: job.title?.toLowerCase().includes('remote') || job.description?.toLowerCase().includes('remote'),
      source: 'adzuna',
    }));

    return {
      success: true,
      jobs,
      total: data.count || jobs.length,
      source: 'adzuna',
    };
  } catch (error) {
    console.error('[Adzuna] Error:', error);
    return { success: false, jobs: [], total: 0, source: 'adzuna', error: String(error) };
  }
}

/**
 * Search remote jobs using RemoteOK API (free, no key needed)
 */
async function searchRemoteOKAPI(params: JobSearchParams): Promise<JobSearchResponse> {
  try {
    const response = await fetch('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'HiReady Job Search Bot',
      },
    });

    if (!response.ok) {
      throw new Error(`RemoteOK API error: ${response.status}`);
    }

    const data = await response.json();

    // First item is metadata, skip it
    const jobsData = Array.isArray(data) ? data.slice(1) : [];

    // Filter by query if provided
    const query = (params.query || '').toLowerCase();
    let filteredJobs = jobsData;

    if (query) {
      filteredJobs = jobsData.filter((job: any) =>
        job.position?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    const jobs: JobResult[] = filteredJobs.slice(0, params.limit || 20).map((job: any) => ({
      id: job.id || crypto.randomUUID(),
      title: job.position,
      company_name: job.company,
      company_logo_url: job.company_logo,
      location: job.location || 'Remote',
      description: job.description,
      url: job.url,
      employment_type: 'Full-time',
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: 'USD',
      skills: job.tags || [],
      posted_at: job.date,
      is_remote: true,
      source: 'remoteok',
    }));

    return {
      success: true,
      jobs,
      total: filteredJobs.length,
      source: 'remoteok',
    };
  } catch (error) {
    console.error('[RemoteOK] Error:', error);
    return { success: false, jobs: [], total: 0, source: 'remoteok', error: String(error) };
  }
}

/**
 * Generate mock job data for development/testing
 */
function getMockJobs(params: JobSearchParams): JobSearchResponse {
  const query = params.query || 'Software Engineer';
  const location = params.location || 'Remote';

  const companies = [
    { name: 'TechCorp Inc.', industry: 'Technology', size: 'large' },
    { name: 'StartupXYZ', industry: 'Technology', size: 'startup' },
    { name: 'Enterprise Solutions', industry: 'Financial Services', size: 'enterprise' },
    { name: 'Global Tech Partners', industry: 'Consulting', size: 'large' },
    { name: 'Innovate Labs', industry: 'Healthcare Tech', size: 'medium' },
    { name: 'DataDriven Co', industry: 'Data Analytics', size: 'medium' },
    { name: 'CloudFirst Systems', industry: 'Cloud Computing', size: 'large' },
    { name: 'AI Ventures', industry: 'Artificial Intelligence', size: 'startup' },
  ];

  const levels = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Principal'];
  const types = ['Full-time', 'Contract', 'Part-time'];

  const mockJobs: JobResult[] = [];

  for (let i = 0; i < (params.limit || 10); i++) {
    const company = companies[i % companies.length];
    const level = levels[i % levels.length];
    const type = types[i % types.length];
    const isRemote = params.remote || Math.random() > 0.5;

    mockJobs.push({
      id: crypto.randomUUID(),
      title: `${level} ${query}`,
      company_name: company.name,
      location: isRemote ? 'Remote' : location,
      city: isRemote ? '' : location.split(',')[0],
      country: 'United States',
      description: `We are looking for a ${level} ${query} to join our ${company.industry} team at ${company.name}.

Requirements:
- ${level === 'Junior' ? '0-2' : level === 'Mid-level' ? '2-5' : level === 'Senior' ? '5-8' : '8+'} years of experience
- Strong problem-solving skills
- Experience with modern technologies
- Excellent communication skills

What we offer:
- Competitive salary
- Health benefits
- ${isRemote ? 'Fully remote work' : 'Hybrid work options'}
- Professional development opportunities`,
      url: `https://example.com/jobs/${i}`,
      employment_type: type,
      experience_level: level,
      salary_min: level === 'Junior' ? 60000 : level === 'Mid-level' ? 90000 : level === 'Senior' ? 130000 : 170000,
      salary_max: level === 'Junior' ? 90000 : level === 'Mid-level' ? 130000 : level === 'Senior' ? 180000 : 250000,
      salary_currency: 'USD',
      skills: ['javascript', 'typescript', 'react', 'node.js', 'sql'].slice(0, 3 + (i % 3)),
      posted_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      is_remote: isRemote,
      source: 'mock',
    });
  }

  return {
    success: true,
    jobs: mockJobs,
    total: mockJobs.length,
    source: 'mock',
  };
}

/**
 * Main job search function - tries multiple sources
 */
export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  console.log('[JobSearch] Searching with params:', params);

  // Try JSearch first (best quality)
  if (JSEARCH_API_KEY) {
    const result = await searchJSearchAPI(params);
    if (result.success && result.jobs.length > 0) {
      console.log(`[JobSearch] Found ${result.jobs.length} jobs from JSearch`);
      return result;
    }
  }

  // Try Adzuna second
  if (ADZUNA_APP_ID && ADZUNA_API_KEY) {
    const result = await searchAdzunaAPI(params);
    if (result.success && result.jobs.length > 0) {
      console.log(`[JobSearch] Found ${result.jobs.length} jobs from Adzuna`);
      return result;
    }
  }

  // For remote jobs, try RemoteOK (free, no API key needed)
  if (params.remote) {
    const result = await searchRemoteOKAPI(params);
    if (result.success && result.jobs.length > 0) {
      console.log(`[JobSearch] Found ${result.jobs.length} jobs from RemoteOK`);
      return result;
    }
  }

  // Try RemoteOK anyway as fallback
  const remoteOKResult = await searchRemoteOKAPI(params);
  if (remoteOKResult.success && remoteOKResult.jobs.length > 0) {
    console.log(`[JobSearch] Found ${remoteOKResult.jobs.length} jobs from RemoteOK (fallback)`);
    return remoteOKResult;
  }

  // Fall back to mock data
  console.log('[JobSearch] Using mock data as fallback');
  return getMockJobs(params);
}

/**
 * Get a single job by ID (not typically supported by aggregator APIs)
 */
export async function getJobById(jobId: string): Promise<JobResult | null> {
  // This would need to be implemented per-source if needed
  // For now, return null as aggregator APIs typically don't support this
  return null;
}

export default {
  searchJobs,
  getJobById,
  generateJobFingerprint,
  parseExperienceYears,
  extractSkillsFromDescription,
};
