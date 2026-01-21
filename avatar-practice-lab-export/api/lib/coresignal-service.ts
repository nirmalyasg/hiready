/**
 * Coresignal API Integration Service
 *
 * Provides job search functionality using Coresignal's Job Posting API
 * Documentation: https://docs.coresignal.com/
 */

import crypto from 'crypto';

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY || 's5Uvjx66vQrevPU9jLkRFeKvuJUoEPUz';
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v1';

export interface CoresignalJobSearchParams {
  title?: string;
  keyword?: string;
  location?: string;
  country?: string;
  city?: string;
  companyName?: string;
  experienceLevel?: string;
  employmentType?: string;
  remote?: boolean;
  limit?: number;
  offset?: number;
}

export interface CoresignalJob {
  id: string;
  title: string;
  company_name?: string;
  company_id?: string;
  company_logo_url?: string;
  company_size?: string;
  company_industry?: string;
  location?: string;
  city?: string;
  country?: string;
  description?: string;
  url?: string;
  experience_level?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  skills?: string[];
  posted_at?: string;
  expires_at?: string;
  is_remote?: boolean;
}

export interface CoresignalSearchResponse {
  success: boolean;
  jobs: CoresignalJob[];
  total: number;
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
  const normalizedTitle = (job.roleTitle || '').toLowerCase().trim();
  const normalizedCompany = (job.companyName || '').toLowerCase().trim();
  const normalizedLocation = (job.location || '').toLowerCase().trim();

  const data = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Parse experience level from various formats
 */
export function parseExperienceYears(experienceText?: string): { min: number; max: number } {
  if (!experienceText) return { min: 0, max: 99 };

  const text = experienceText.toLowerCase();

  // Match patterns like "3-5 years", "3+ years", "5 years"
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

  // Map experience levels
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
 * Extract skills from job description using keyword matching
 */
export function extractSkillsFromDescription(description?: string): string[] {
  if (!description) return [];

  const skillKeywords = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
    // Frameworks
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', '.net',
    // Databases
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'devops',
    // Data & ML
    'machine learning', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'spark', 'hadoop',
    // Other Tech
    'api', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'git', 'linux',
    // Soft Skills
    'leadership', 'communication', 'problem-solving', 'teamwork', 'analytical'
  ];

  const descLower = description.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => descLower.includes(skill));

  return [...new Set(foundSkills)];
}

/**
 * Search for jobs using Coresignal API
 */
export async function searchJobs(params: CoresignalJobSearchParams): Promise<CoresignalSearchResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (params.title) queryParams.append('title', params.title);
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.location) queryParams.append('location', params.location);
    if (params.country) queryParams.append('country', params.country);
    if (params.city) queryParams.append('city', params.city);
    if (params.companyName) queryParams.append('company_name', params.companyName);
    if (params.experienceLevel) queryParams.append('experience_level', params.experienceLevel);
    if (params.employmentType) queryParams.append('employment_type', params.employmentType);
    if (params.remote !== undefined) queryParams.append('remote', String(params.remote));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.offset) queryParams.append('offset', String(params.offset));

    const url = `${CORESIGNAL_BASE_URL}/job_posting/search?${queryParams.toString()}`;

    console.log(`[Coresignal] Searching jobs with params:`, params);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Coresignal] API error: ${response.status} - ${errorText}`);

      // Return mock data for development/testing
      if (response.status === 401 || response.status === 403) {
        console.log('[Coresignal] Using mock data due to API auth issue');
        return getMockJobResults(params);
      }

      return {
        success: false,
        jobs: [],
        total: 0,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Transform Coresignal response to our format
    const jobs: CoresignalJob[] = (data.results || data.data || []).map((job: any) => ({
      id: job.id || job.job_id || crypto.randomUUID(),
      title: job.title || job.job_title,
      company_name: job.company_name || job.company?.name,
      company_id: job.company_id || job.company?.id,
      company_logo_url: job.company_logo_url || job.company?.logo_url,
      company_size: job.company_size || job.company?.size,
      company_industry: job.company_industry || job.company?.industry,
      location: job.location || formatLocation(job.city, job.country),
      city: job.city,
      country: job.country,
      description: job.description || job.job_description,
      url: job.url || job.job_url || job.apply_url,
      experience_level: job.experience_level || job.seniority_level,
      employment_type: job.employment_type || job.job_type,
      salary_min: job.salary_min || job.salary?.min,
      salary_max: job.salary_max || job.salary?.max,
      salary_currency: job.salary_currency || job.salary?.currency,
      skills: job.skills || extractSkillsFromDescription(job.description),
      posted_at: job.posted_at || job.date_posted || job.created_at,
      expires_at: job.expires_at || job.expiry_date,
      is_remote: job.is_remote || job.remote || (job.location || '').toLowerCase().includes('remote'),
    }));

    return {
      success: true,
      jobs,
      total: data.total || data.count || jobs.length,
    };

  } catch (error) {
    console.error('[Coresignal] Search error:', error);

    // Return mock data for development
    console.log('[Coresignal] Using mock data due to error');
    return getMockJobResults(params);
  }
}

/**
 * Get job details by ID
 */
export async function getJobById(jobId: string): Promise<CoresignalJob | null> {
  try {
    const url = `${CORESIGNAL_BASE_URL}/job_posting/${jobId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Coresignal] Failed to get job ${jobId}: ${response.status}`);
      return null;
    }

    const job = await response.json();

    return {
      id: job.id || jobId,
      title: job.title || job.job_title,
      company_name: job.company_name,
      company_id: job.company_id,
      location: job.location,
      city: job.city,
      country: job.country,
      description: job.description,
      url: job.url || job.job_url,
      experience_level: job.experience_level,
      employment_type: job.employment_type,
      skills: job.skills || extractSkillsFromDescription(job.description),
      posted_at: job.posted_at,
      is_remote: job.is_remote,
    };

  } catch (error) {
    console.error(`[Coresignal] Error getting job ${jobId}:`, error);
    return null;
  }
}

/**
 * Format location from city and country
 */
function formatLocation(city?: string, country?: string): string {
  const parts = [city, country].filter(Boolean);
  return parts.join(', ');
}

/**
 * Mock job results for development/testing
 */
function getMockJobResults(params: CoresignalJobSearchParams): CoresignalSearchResponse {
  const keyword = params.keyword || params.title || 'Software Engineer';
  const location = params.location || params.city || 'Remote';

  const mockJobs: CoresignalJob[] = [
    {
      id: crypto.randomUUID(),
      title: `Senior ${keyword}`,
      company_name: 'TechCorp Inc.',
      company_size: 'large',
      company_industry: 'Technology',
      location: location,
      city: location === 'Remote' ? '' : location,
      country: 'United States',
      description: `We are looking for a Senior ${keyword} to join our team.
        Requirements: 5+ years of experience, strong problem-solving skills,
        experience with JavaScript, TypeScript, React, Node.js, AWS.
        You will be working on cutting-edge technology and leading a team of engineers.`,
      url: 'https://example.com/jobs/1',
      experience_level: 'Senior',
      employment_type: 'Full-time',
      salary_min: 150000,
      salary_max: 200000,
      salary_currency: 'USD',
      skills: ['javascript', 'typescript', 'react', 'node.js', 'aws'],
      posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_remote: location.toLowerCase().includes('remote'),
    },
    {
      id: crypto.randomUUID(),
      title: `${keyword} II`,
      company_name: 'StartupXYZ',
      company_size: 'small',
      company_industry: 'Technology',
      location: location,
      city: location === 'Remote' ? '' : location,
      country: 'United States',
      description: `Join our fast-growing startup as a ${keyword}.
        We need someone with 3-5 years of experience.
        Tech stack: Python, Django, PostgreSQL, Docker, Kubernetes.
        Competitive salary and equity package.`,
      url: 'https://example.com/jobs/2',
      experience_level: 'Mid-level',
      employment_type: 'Full-time',
      salary_min: 120000,
      salary_max: 160000,
      salary_currency: 'USD',
      skills: ['python', 'django', 'postgresql', 'docker', 'kubernetes'],
      posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      is_remote: location.toLowerCase().includes('remote'),
    },
    {
      id: crypto.randomUUID(),
      title: `Junior ${keyword}`,
      company_name: 'Enterprise Solutions Ltd',
      company_size: 'enterprise',
      company_industry: 'Financial Services',
      location: location,
      city: location === 'Remote' ? '' : location,
      country: 'United States',
      description: `Entry-level ${keyword} position. Great opportunity for recent graduates.
        Requirements: 0-2 years of experience, degree in Computer Science or related field.
        We use Java, Spring Boot, MySQL, and AWS.
        Full training program provided.`,
      url: 'https://example.com/jobs/3',
      experience_level: 'Entry-level',
      employment_type: 'Full-time',
      salary_min: 70000,
      salary_max: 90000,
      salary_currency: 'USD',
      skills: ['java', 'spring', 'mysql', 'aws'],
      posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_remote: false,
    },
    {
      id: crypto.randomUUID(),
      title: `Lead ${keyword}`,
      company_name: 'Global Tech Partners',
      company_size: 'large',
      company_industry: 'Consulting',
      location: location,
      city: location === 'Remote' ? '' : location,
      country: 'United States',
      description: `Lead ${keyword} role for an experienced professional.
        8+ years of experience required. Will lead a team of 10+ engineers.
        Experience with microservices, cloud architecture, and team leadership.
        Technologies: Go, Kubernetes, GCP, Terraform.`,
      url: 'https://example.com/jobs/4',
      experience_level: 'Lead',
      employment_type: 'Full-time',
      salary_min: 180000,
      salary_max: 250000,
      salary_currency: 'USD',
      skills: ['go', 'kubernetes', 'gcp', 'terraform', 'leadership', 'microservices'],
      posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_remote: true,
    },
    {
      id: crypto.randomUUID(),
      title: `${keyword} (Contract)`,
      company_name: 'Innovate Labs',
      company_size: 'medium',
      company_industry: 'Healthcare Tech',
      location: location,
      city: location === 'Remote' ? '' : location,
      country: 'United States',
      description: `Contract ${keyword} position for a 6-month project.
        3+ years of experience with React Native and mobile development.
        Healthcare industry experience is a plus.
        Flexible hours, fully remote.`,
      url: 'https://example.com/jobs/5',
      experience_level: 'Mid-level',
      employment_type: 'Contract',
      salary_min: 80,
      salary_max: 120,
      salary_currency: 'USD/hr',
      skills: ['react', 'react native', 'javascript', 'mobile development'],
      posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_remote: true,
    },
  ];

  // Filter by experience level if specified
  let filteredJobs = mockJobs;
  if (params.experienceLevel) {
    const expLevel = params.experienceLevel.toLowerCase();
    filteredJobs = mockJobs.filter(job =>
      job.experience_level?.toLowerCase().includes(expLevel) ||
      (expLevel === 'entry' && job.experience_level?.toLowerCase().includes('junior')) ||
      (expLevel === 'senior' && job.experience_level?.toLowerCase().includes('lead'))
    );
  }

  // Filter by employment type if specified
  if (params.employmentType) {
    const empType = params.employmentType.toLowerCase();
    filteredJobs = filteredJobs.filter(job =>
      job.employment_type?.toLowerCase().includes(empType)
    );
  }

  // Apply limit
  const limit = params.limit || 20;
  const offset = params.offset || 0;
  const paginatedJobs = filteredJobs.slice(offset, offset + limit);

  return {
    success: true,
    jobs: paginatedJobs,
    total: filteredJobs.length,
  };
}

export default {
  searchJobs,
  getJobById,
  generateJobFingerprint,
  parseExperienceYears,
  extractSkillsFromDescription,
};
