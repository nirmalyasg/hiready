-- Migration: Interview Progress Tracking & Hiready Index
-- Adds tables for tracking interview attempts, Hiready Index snapshots, and share links

-- Add assignment_id and attempt_number to interview_sessions
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS assignment_id INTEGER,
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;

-- Interview Assignments - Tracks user's progress on role/JD + interview type combinations
CREATE TABLE IF NOT EXISTS interview_assignments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role_kit_id INTEGER REFERENCES role_kits(id) ON DELETE SET NULL,
  job_target_id VARCHAR REFERENCES job_targets(id) ON DELETE SET NULL,
  interview_type TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  latest_session_id INTEGER REFERENCES interview_sessions(id) ON DELETE SET NULL,
  best_session_id INTEGER REFERENCES interview_sessions(id) ON DELETE SET NULL,
  latest_score REAL,
  best_score REAL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_interview_assignments_user ON interview_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_assignments_role_kit ON interview_assignments(role_kit_id);
CREATE INDEX IF NOT EXISTS idx_interview_assignments_job_target ON interview_assignments(job_target_id);
CREATE INDEX IF NOT EXISTS idx_interview_assignments_user_role ON interview_assignments(user_id, role_kit_id, interview_type);
CREATE INDEX IF NOT EXISTS idx_interview_assignments_user_job ON interview_assignments(user_id, job_target_id, interview_type);

-- Hiready Index Snapshots - Computed index values per session
CREATE TABLE IF NOT EXISTS hiready_index_snapshots (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role_kit_id INTEGER REFERENCES role_kits(id) ON DELETE SET NULL,
  job_target_id VARCHAR REFERENCES job_targets(id) ON DELETE SET NULL,
  interview_session_id INTEGER REFERENCES interview_sessions(id) ON DELETE SET NULL,
  index_value REAL NOT NULL,
  weighted_scores JSONB,
  consolidated_index REAL,
  is_latest BOOLEAN DEFAULT FALSE,
  is_best BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_hiready_snapshots_user ON hiready_index_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_hiready_snapshots_user_role ON hiready_index_snapshots(user_id, role_kit_id);
CREATE INDEX IF NOT EXISTS idx_hiready_snapshots_user_job ON hiready_index_snapshots(user_id, job_target_id);
CREATE INDEX IF NOT EXISTS idx_hiready_snapshots_latest ON hiready_index_snapshots(user_id, is_latest) WHERE is_latest = TRUE;

-- Hiready Share Links - Shareable links for users to share their scores
CREATE TABLE IF NOT EXISTS hiready_share_links (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role_kit_id INTEGER REFERENCES role_kits(id) ON DELETE SET NULL,
  job_target_id VARCHAR REFERENCES job_targets(id) ON DELETE SET NULL,
  token VARCHAR NOT NULL UNIQUE,
  snapshot_id INTEGER REFERENCES hiready_index_snapshots(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_hiready_share_links_token ON hiready_share_links(token);
CREATE INDEX IF NOT EXISTS idx_hiready_share_links_user ON hiready_share_links(user_id);

-- Add foreign key from interview_sessions.assignment_id to interview_assignments.id
-- Note: Using DO block to handle case where constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interview_sessions_assignment_id_fkey'
    AND table_name = 'interview_sessions'
  ) THEN
    ALTER TABLE interview_sessions 
    ADD CONSTRAINT interview_sessions_assignment_id_fkey 
    FOREIGN KEY (assignment_id) REFERENCES interview_assignments(id) ON DELETE SET NULL;
  END IF;
END $$;
