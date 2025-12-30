-- Migration: Add admin, analytics, and missing core tables
-- Date: 2025-12-22
-- This migration adds all tables that were defined in schema.ts but missing from migrations

-- =====================
-- Session Storage (for Express sessions)
-- =====================

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- =====================
-- Auth Users Table
-- =====================

CREATE TABLE IF NOT EXISTS auth_users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR NOT NULL UNIQUE,
  email VARCHAR UNIQUE,
  password_hash VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add auth_user_id to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id VARCHAR REFERENCES auth_users(id);

-- =====================
-- Presentation Sessions Table (missing from 006)
-- =====================

CREATE TABLE IF NOT EXISTS presentation_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  presentation_scenario_id INTEGER NOT NULL REFERENCES presentation_scenarios(id) ON DELETE CASCADE,
  session_uid TEXT NOT NULL UNIQUE,
  duration INTEGER DEFAULT 0,
  slides_covered INTEGER DEFAULT 0,
  total_slides INTEGER DEFAULT 0,
  transcript TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_presentation_sessions_user_id ON presentation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_sessions_scenario_id ON presentation_sessions(presentation_scenario_id);

-- Update presentation_feedback to reference presentation_sessions (add column if missing)
ALTER TABLE presentation_feedback ADD COLUMN IF NOT EXISTS presentation_session_id INTEGER REFERENCES presentation_sessions(id) ON DELETE CASCADE;
ALTER TABLE presentation_feedback ADD COLUMN IF NOT EXISTS skill_assessment JSONB;
ALTER TABLE presentation_feedback ADD COLUMN IF NOT EXISTS document_analysis JSONB;

-- Update presentation_scenarios to add missing columns
ALTER TABLE presentation_scenarios ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE presentation_scenarios ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE presentation_scenarios ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE presentation_scenarios ADD COLUMN IF NOT EXISTS document_analysis JSONB;

-- =====================
-- Custom Scenarios (User-Created)
-- =====================

CREATE TABLE IF NOT EXISTS custom_scenarios (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  user_description TEXT NOT NULL,
  blueprint JSONB NOT NULL,
  user_role TEXT,
  avatar_role TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_scenarios_user_id ON custom_scenarios(user_id);

-- Add custom_scenario_id to transcripts table if not exists
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS custom_scenario_id INTEGER REFERENCES custom_scenarios(id) ON DELETE SET NULL;

-- =====================
-- Custom Scenario Skill Mappings
-- =====================

CREATE TABLE IF NOT EXISTS custom_scenario_skill_mappings (
  id SERIAL PRIMARY KEY,
  custom_scenario_id INTEGER NOT NULL REFERENCES custom_scenarios(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  confidence_score REAL NOT NULL DEFAULT 0,
  ai_rationale TEXT,
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_by_user_id VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  dimension_weights JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_scenario_skill_mappings_scenario ON custom_scenario_skill_mappings(custom_scenario_id);
CREATE INDEX IF NOT EXISTS idx_custom_scenario_skill_mappings_skill ON custom_scenario_skill_mappings(skill_id);

-- =====================
-- Admin Tables
-- =====================

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  auth_user_id VARCHAR NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'learner',
  assigned_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_roles_auth_user_id ON user_roles(auth_user_id);

-- User Login Events
CREATE TABLE IF NOT EXISTS user_login_events (
  id SERIAL PRIMARY KEY,
  auth_user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  session_id VARCHAR,
  ip_address VARCHAR,
  user_agent TEXT,
  occurred_at TIMESTAMP DEFAULT NOW() NOT NULL,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_user_login_events_auth_user_id ON user_login_events(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_events_occurred_at ON user_login_events(occurred_at);

-- API Usage Events (for cost tracking)
CREATE TABLE IF NOT EXISTS api_usage_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  auth_user_id VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  session_id INTEGER REFERENCES roleplay_session(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  operation TEXT NOT NULL,
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  request_units REAL DEFAULT 1,
  unit_cost REAL DEFAULT 0,
  estimated_cost REAL DEFAULT 0,
  currency VARCHAR DEFAULT 'USD',
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  occurred_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_usage_events_service ON api_usage_events(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_occurred_at ON api_usage_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_user_id ON api_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_auth_user_id ON api_usage_events(auth_user_id);

-- Session Journey Events (for funnel analytics)
CREATE TABLE IF NOT EXISTS session_journey_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  auth_user_id VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  session_id INTEGER REFERENCES roleplay_session(id) ON DELETE SET NULL,
  step TEXT NOT NULL,
  mode TEXT,
  device TEXT,
  language VARCHAR,
  avatar_id VARCHAR,
  metadata JSONB,
  occurred_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_journey_events_step ON session_journey_events(step);
CREATE INDEX IF NOT EXISTS idx_session_journey_events_occurred_at ON session_journey_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_session_journey_events_auth_user_id ON session_journey_events(auth_user_id);

-- Budget Guards
CREATE TABLE IF NOT EXISTS budget_guards (
  id SERIAL PRIMARY KEY,
  guard_type TEXT NOT NULL UNIQUE,
  limit_value REAL NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  fallback_action TEXT DEFAULT 'warn',
  description TEXT,
  updated_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Budget Alerts
CREATE TABLE IF NOT EXISTS budget_alerts (
  id SERIAL PRIMARY KEY,
  guard_id INTEGER REFERENCES budget_guards(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  threshold_percent REAL,
  current_value REAL,
  limit_value REAL,
  message TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  occurred_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_guard_id ON budget_alerts(guard_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_occurred_at ON budget_alerts(occurred_at);

-- Admin Settings
CREATE TABLE IF NOT EXISTS admin_settings (
  key VARCHAR PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User Media Preferences
CREATE TABLE IF NOT EXISTS user_media_preferences (
  id SERIAL PRIMARY KEY,
  auth_user_id VARCHAR NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
  media_mode TEXT NOT NULL DEFAULT 'both',
  effective_from TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_media_preferences_auth_user_id ON user_media_preferences(auth_user_id);

-- API Cost Daily Rollup (for aggregated cost reporting)
CREATE TABLE IF NOT EXISTS api_cost_daily_rollup (
  id SERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  total_requests INTEGER DEFAULT 0,
  total_tokens_in INTEGER DEFAULT 0,
  total_tokens_out INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0,
  currency VARCHAR DEFAULT 'USD',
  computed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_cost_daily_rollup_service ON api_cost_daily_rollup(service);
CREATE INDEX IF NOT EXISTS idx_api_cost_daily_rollup_date ON api_cost_daily_rollup(date);
