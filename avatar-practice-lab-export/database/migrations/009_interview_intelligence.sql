-- Interview Intelligence Tables Migration
-- Created: 2026-01-04
-- Adds: companies, question_patterns, company_role_blueprints, job_practice_links, user_skill_memory

-- Companies table for company-specific interview patterns
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  tier TEXT DEFAULT 'other',
  archetype TEXT,
  tags JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Question Patterns - templated questions with probe trees
CREATE TABLE IF NOT EXISTS question_patterns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  role_category TEXT,
  interview_type TEXT,
  template TEXT NOT NULL,
  probe_tree JSONB,
  tags JSONB,
  source_type TEXT DEFAULT 'curated',
  source_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company Role Blueprints - company-specific interview configurations
CREATE TABLE IF NOT EXISTS company_role_blueprints (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR REFERENCES companies(id) ON DELETE CASCADE,
  role_category TEXT NOT NULL,
  seniority TEXT,
  skill_focus JSONB,
  question_pattern_ids JSONB,
  rubric_overrides JSONB,
  interview_rounds JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Practice Links - connects saved jobs to practice sessions
CREATE TABLE IF NOT EXISTS job_practice_links (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  job_target_id VARCHAR NOT NULL REFERENCES job_targets(id) ON DELETE CASCADE,
  interview_config_id INTEGER REFERENCES interview_configs(id) ON DELETE SET NULL,
  interview_session_id INTEGER REFERENCES interview_sessions(id) ON DELETE SET NULL,
  exercise_session_id INTEGER REFERENCES exercise_sessions(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Skill Memory - tracks user improvement over time per dimension
CREATE TABLE IF NOT EXISTS user_skill_memory (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role_category TEXT,
  dimension TEXT NOT NULL,
  baseline_score REAL,
  latest_score REAL,
  trend JSONB,
  common_issues JSONB,
  resolved_issues JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_patterns_role ON question_patterns(role_category);
CREATE INDEX IF NOT EXISTS idx_question_patterns_type ON question_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_company_blueprints_company ON company_role_blueprints(company_id);
CREATE INDEX IF NOT EXISTS idx_job_practice_links_job ON job_practice_links(job_target_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_memory_user ON user_skill_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_memory_dimension ON user_skill_memory(dimension);
