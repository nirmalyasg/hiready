-- Job Screening Agent - Tables for job discovery and catalog management
-- This enables automated job screening from external sources like Coresignal

-- Job Screening Agents - User-configured search agents
CREATE TABLE IF NOT EXISTS job_screening_agents (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Search criteria
    search_keywords TEXT[], -- Array of role/title keywords to search
    locations TEXT[], -- Array of locations (cities, countries, remote)
    experience_min INTEGER DEFAULT 0, -- Minimum years of experience
    experience_max INTEGER DEFAULT 99, -- Maximum years of experience
    company_sizes TEXT[], -- small, medium, large, enterprise
    industries TEXT[], -- tech, finance, healthcare, etc.
    job_types TEXT[], -- full-time, part-time, contract, remote
    excluded_companies TEXT[], -- Companies to exclude from results

    -- Agent settings
    is_active BOOLEAN DEFAULT true,
    run_frequency VARCHAR(50) DEFAULT 'daily', -- daily, weekly, manual
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,

    -- Statistics
    total_jobs_found INTEGER DEFAULT 0,
    jobs_found_last_run INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Job Catalog - Discovered jobs from external sources
CREATE TABLE IF NOT EXISTS job_catalog (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source information
    source VARCHAR(50) NOT NULL DEFAULT 'coresignal', -- coresignal, linkedin, etc.
    external_id VARCHAR(255), -- ID from the source
    source_url TEXT,

    -- Job details
    role_title TEXT NOT NULL,
    company_name TEXT,
    company_id VARCHAR(255), -- Company ID from source
    company_logo_url TEXT,
    company_size VARCHAR(50),
    company_industry TEXT,

    -- Location
    location TEXT,
    city TEXT,
    country TEXT,
    is_remote BOOLEAN DEFAULT false,

    -- Job specifics
    job_description TEXT,
    experience_required TEXT,
    experience_years_min INTEGER,
    experience_years_max INTEGER,
    employment_type VARCHAR(50), -- full-time, part-time, contract
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10),

    -- Skills and requirements
    required_skills TEXT[],
    preferred_skills TEXT[],

    -- AI-parsed fields
    jd_parsed JSONB,

    -- Metadata
    posted_at TIMESTAMP,
    expires_at TIMESTAMP,
    discovered_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_seen_at TIMESTAMP DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT true,

    -- Deduplication
    fingerprint VARCHAR(255), -- Hash for deduplication

    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Agent-Job relationship - Which agent found which jobs
CREATE TABLE IF NOT EXISTS job_screening_agent_results (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR NOT NULL REFERENCES job_screening_agents(id) ON DELETE CASCADE,
    job_catalog_id VARCHAR NOT NULL REFERENCES job_catalog(id) ON DELETE CASCADE,
    discovered_at TIMESTAMP DEFAULT NOW() NOT NULL,

    UNIQUE(agent_id, job_catalog_id)
);

-- User Job Catalog Interactions - Track user interest in catalog jobs
CREATE TABLE IF NOT EXISTS user_job_catalog_interactions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    job_catalog_id VARCHAR NOT NULL REFERENCES job_catalog(id) ON DELETE CASCADE,

    -- Interaction types
    is_saved BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    is_applied BOOLEAN DEFAULT false,
    notes TEXT,

    -- If user saved to their job targets
    job_target_id VARCHAR REFERENCES job_targets(id) ON DELETE SET NULL,

    viewed_at TIMESTAMP,
    saved_at TIMESTAMP,
    applied_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

    UNIQUE(user_id, job_catalog_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_catalog_source ON job_catalog(source);
CREATE INDEX IF NOT EXISTS idx_job_catalog_location ON job_catalog(location);
CREATE INDEX IF NOT EXISTS idx_job_catalog_role_title ON job_catalog(role_title);
CREATE INDEX IF NOT EXISTS idx_job_catalog_company_name ON job_catalog(company_name);
CREATE INDEX IF NOT EXISTS idx_job_catalog_fingerprint ON job_catalog(fingerprint);
CREATE INDEX IF NOT EXISTS idx_job_catalog_discovered_at ON job_catalog(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_catalog_is_active ON job_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_job_screening_agents_user_id ON job_screening_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_job_screening_agents_is_active ON job_screening_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_user_job_catalog_interactions_user_id ON user_job_catalog_interactions(user_id);

COMMENT ON TABLE job_screening_agents IS 'User-configured agents for automated job discovery';
COMMENT ON TABLE job_catalog IS 'Jobs discovered from external sources like Coresignal';
COMMENT ON TABLE job_screening_agent_results IS 'Links agents to the jobs they discovered';
COMMENT ON TABLE user_job_catalog_interactions IS 'User interactions with catalog jobs (save, hide, apply)';
