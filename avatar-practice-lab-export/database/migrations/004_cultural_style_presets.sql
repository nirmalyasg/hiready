-- Migration: Add Cultural Style Presets for Intercultural Communication Practice
-- This adds support for GlobeSmart-based cultural conversation style presets

-- Create the cultural_style_presets table
CREATE TABLE IF NOT EXISTS cultural_style_presets (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  user_facing_description TEXT,
  globesmart_profile JSONB,
  behavior_rules JSONB,
  typical_user_learnings JSONB,
  accent_guidance JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add cultural_preset_id column to roleplay_session
ALTER TABLE roleplay_session 
ADD COLUMN IF NOT EXISTS cultural_preset_id VARCHAR;

-- Add cultural_preset_id column to transcripts
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS cultural_preset_id VARCHAR;

-- Add cultural_preset_id column to heygen_sessions
ALTER TABLE heygen_sessions 
ADD COLUMN IF NOT EXISTS cultural_preset_id VARCHAR;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cultural_presets_is_default ON cultural_style_presets(is_default);
CREATE INDEX IF NOT EXISTS idx_cultural_presets_is_active ON cultural_style_presets(is_active);
