-- Migration: Add skill framework fields and dimension assessment tables
-- Date: 2025-12-16

-- Add framework columns to skills table
ALTER TABLE skills 
  ADD COLUMN IF NOT EXISTS framework_mapping TEXT,
  ADD COLUMN IF NOT EXISTS reference_source TEXT,
  ADD COLUMN IF NOT EXISTS assessment_dimensions TEXT,
  ADD COLUMN IF NOT EXISTS scoring_model_logic TEXT;

-- Create skill dimension assessments table (stores individual dimension scores per session)
CREATE TABLE IF NOT EXISTS skill_dimension_assessments (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES roleplay_session(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  dimension_name TEXT NOT NULL,
  score REAL NOT NULL,
  max_score REAL NOT NULL DEFAULT 5,
  evidence TEXT,
  framework_reference TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create skill assessment summary table (aggregated skill score per session)
CREATE TABLE IF NOT EXISTS skill_assessment_summary (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES roleplay_session(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  overall_skill_score REAL NOT NULL,
  framework_used TEXT,
  assessment_notes TEXT,
  strength_dimensions JSONB,
  improvement_dimensions JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_skill_dimension_assessments_session ON skill_dimension_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_skill_dimension_assessments_skill ON skill_dimension_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessment_summary_session ON skill_assessment_summary(session_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessment_summary_skill ON skill_assessment_summary(skill_id);
