-- Hiready Platform Enhancement Migration
-- Adds employer workspace, subscriptions, payments, and Hiready Index tables

-- =====================
-- Employer Workspace Tables
-- =====================

-- Employer companies (distinct from interview intelligence companies table)
CREATE TABLE IF NOT EXISTS employer_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  owner_user_id VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Company team members
CREATE TABLE IF NOT EXISTS employer_company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES employer_companies(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Employer job postings with assessment configuration
CREATE TABLE IF NOT EXISTS employer_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES employer_companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  jd_text TEXT,
  jd_url TEXT,
  role_kit_id INTEGER REFERENCES role_kits(id) ON DELETE SET NULL,
  role_archetype_id VARCHAR,
  assessment_config JSONB DEFAULT '{"interviewTypes": ["hr", "technical"], "totalDuration": 45}',
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  apply_link_slug VARCHAR UNIQUE,
  candidate_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Candidates who applied via employer assessment links
CREATE TABLE IF NOT EXISTS employer_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES employer_jobs(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  hiready_index_score INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'reviewed', 'shortlisted', 'rejected')),
  completed_interview_types JSONB DEFAULT '[]',
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewer_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- =====================
-- Subscription & Payment Tables
-- =====================

-- User subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'role_pack', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
  role_context JSONB,
  job_target_id VARCHAR REFERENCES job_targets(id) ON DELETE SET NULL,
  role_kit_id INTEGER REFERENCES role_kits(id) ON DELETE SET NULL,
  unlocked_interview_types JSONB DEFAULT '[]',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_ref TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'captured', 'failed', 'refunded')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- Hiready Index Tables
-- =====================

-- Consolidated Hiready Index per role/job (aggregates multiple interview sessions)
CREATE TABLE IF NOT EXISTS hiready_role_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  job_target_id VARCHAR REFERENCES job_targets(id) ON DELETE CASCADE,
  role_kit_id INTEGER REFERENCES role_kits(id) ON DELETE SET NULL,
  employer_job_id UUID REFERENCES employer_jobs(id) ON DELETE SET NULL,
  overall_score INTEGER NOT NULL,
  dimension_scores JSONB NOT NULL,
  completed_interview_types JSONB NOT NULL DEFAULT '[]',
  total_sessions INTEGER DEFAULT 0,
  session_breakdown JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  readiness_level TEXT CHECK (readiness_level IN ('not_ready', 'developing', 'ready', 'strong', 'exceptional')),
  share_token VARCHAR UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  last_updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, COALESCE(job_target_id, ''), COALESCE(role_kit_id, 0))
);

-- =====================
-- Extend Existing Tables
-- =====================

-- Add user_type to auth_users for candidate vs employer distinction
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'candidate' CHECK (user_type IN ('candidate', 'employer', 'both'));
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS google_access_token TEXT;

-- Add source tracking and trial status to interview_sessions
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'self_practice' CHECK (source_type IN ('self_practice', 'employer_assessment', 'campaign'));
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS source_employer_job_id UUID REFERENCES employer_jobs(id) ON DELETE SET NULL;
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS source_campaign TEXT;
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT TRUE;

-- Add interview type tracking to interview_configs
ALTER TABLE interview_configs ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE;

-- =====================
-- Indexes for Performance
-- =====================

CREATE INDEX IF NOT EXISTS idx_employer_jobs_company ON employer_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_slug ON employer_jobs(apply_link_slug);
CREATE INDEX IF NOT EXISTS idx_employer_candidates_job ON employer_candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_employer_candidates_user ON employer_candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_hiready_role_index_user ON hiready_role_index(user_id);
CREATE INDEX IF NOT EXISTS idx_hiready_role_index_share ON hiready_role_index(share_token);
