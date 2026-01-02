-- Migration 010: Job Targets and Career Memory
-- This migration adds job-centric practice tracking capabilities

-- Job Targets table - Real jobs users are preparing for
CREATE TABLE IF NOT EXISTS job_targets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'manual',
  job_url TEXT,
  company_name TEXT,
  role_title TEXT NOT NULL,
  location TEXT,
  jd_text TEXT,
  jd_parsed JSONB,
  status TEXT NOT NULL DEFAULT 'saved',
  readiness_score INTEGER,
  last_practiced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User Skill Patterns table - Career memory tracking
CREATE TABLE IF NOT EXISTS user_skill_patterns (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  occurrences INTEGER DEFAULT 1,
  avg_score REAL,
  trend TEXT DEFAULT 'stagnant',
  last_seen_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add job_target_id to interview_configs if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interview_configs' AND column_name = 'job_target_id'
  ) THEN
    ALTER TABLE interview_configs ADD COLUMN job_target_id VARCHAR REFERENCES job_targets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add job_target_id to exercise_sessions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercise_sessions' AND column_name = 'job_target_id'
  ) THEN
    ALTER TABLE exercise_sessions ADD COLUMN job_target_id VARCHAR REFERENCES job_targets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_targets_user_id ON job_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_job_targets_status ON job_targets(status);
CREATE INDEX IF NOT EXISTS idx_user_skill_patterns_user_id ON user_skill_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_patterns_dimension ON user_skill_patterns(dimension);
