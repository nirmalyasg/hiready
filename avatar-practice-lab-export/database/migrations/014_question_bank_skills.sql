-- Add skills_tested JSONB column to question_bank table
-- This allows storing multiple skills per question for multi-skill coverage tracking

ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS skills_tested jsonb DEFAULT '[]'::jsonb;

-- Add difficulty_band column with proper enum values
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS difficulty_band text CHECK (difficulty_band IN ('basic', 'intermediate', 'advanced', 'expert'));

-- Add role_context column to store role-specific framing
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS role_context jsonb DEFAULT '{}'::jsonb;

-- Create index for skills_tested to enable efficient skill coverage queries
CREATE INDEX IF NOT EXISTS question_bank_skills_tested_idx ON question_bank USING GIN (skills_tested);

-- Create index for difficulty_band queries
CREATE INDEX IF NOT EXISTS question_bank_difficulty_band_idx ON question_bank(difficulty_band);
