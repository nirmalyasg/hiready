-- Migration: Add role fields to custom_scenarios table
-- Created: 2025-12-17

ALTER TABLE custom_scenarios
ADD COLUMN IF NOT EXISTS user_role TEXT,
ADD COLUMN IF NOT EXISTS avatar_role TEXT;

-- Add comment for documentation
COMMENT ON COLUMN custom_scenarios.user_role IS 'The role the user plays in the scenario (e.g., "Product Manager", "Team Lead")';
COMMENT ON COLUMN custom_scenarios.avatar_role IS 'The role the AI avatar plays in the scenario (e.g., "Engineering Lead", "CEO")';
