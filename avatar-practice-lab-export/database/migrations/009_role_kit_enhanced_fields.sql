-- Migration: Add enhanced fields to role_kits table
-- Adds role_context, core_competencies, and typical_questions columns

ALTER TABLE role_kits ADD COLUMN IF NOT EXISTS role_context TEXT;
ALTER TABLE role_kits ADD COLUMN IF NOT EXISTS core_competencies JSONB;
ALTER TABLE role_kits ADD COLUMN IF NOT EXISTS typical_questions JSONB;
