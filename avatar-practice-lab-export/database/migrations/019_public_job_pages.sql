-- Public Job Pages - Individual public pages for jobs with practice links
-- Created from catalog jobs for public access and practice routing

CREATE TABLE IF NOT EXISTS public_job_pages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source reference
    job_catalog_id VARCHAR REFERENCES job_catalog(id) ON DELETE SET NULL,

    -- URL slug for public access
    slug VARCHAR(255) NOT NULL UNIQUE,

    -- Job details (copied from catalog for independence)
    role_title TEXT NOT NULL,
    company_name TEXT,
    company_logo_url TEXT,
    company_industry TEXT,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    job_description TEXT,
    experience_required TEXT,
    employment_type VARCHAR(50),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10),
    required_skills TEXT[],

    -- Page settings
    is_published BOOLEAN DEFAULT true,
    custom_title TEXT, -- Optional custom page title
    custom_description TEXT, -- Optional custom description for SEO
    practice_cta_text VARCHAR(255) DEFAULT 'Practice for This Interview',

    -- Creator tracking
    created_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,

    -- Analytics
    view_count INTEGER DEFAULT 0,
    practice_click_count INTEGER DEFAULT 0,

    -- Timestamps
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Track user interactions with public job pages
CREATE TABLE IF NOT EXISTS public_job_page_analytics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    job_page_id VARCHAR NOT NULL REFERENCES public_job_pages(id) ON DELETE CASCADE,

    -- Event type: 'view', 'practice_click', 'share'
    event_type VARCHAR(50) NOT NULL,

    -- Optional user reference (if logged in)
    user_id VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,

    -- Session/visitor tracking
    session_id VARCHAR,
    ip_hash VARCHAR(64), -- Hashed IP for privacy
    user_agent TEXT,
    referrer TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_job_pages_slug ON public_job_pages(slug);
CREATE INDEX IF NOT EXISTS idx_public_job_pages_is_published ON public_job_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_public_job_pages_catalog_id ON public_job_pages(job_catalog_id);
CREATE INDEX IF NOT EXISTS idx_public_job_pages_created_by ON public_job_pages(created_by);
CREATE INDEX IF NOT EXISTS idx_public_job_page_analytics_job_page_id ON public_job_page_analytics(job_page_id);
CREATE INDEX IF NOT EXISTS idx_public_job_page_analytics_event_type ON public_job_page_analytics(event_type);

COMMENT ON TABLE public_job_pages IS 'Public-facing job pages with practice links for interview preparation';
COMMENT ON TABLE public_job_page_analytics IS 'Analytics tracking for public job page views and interactions';
