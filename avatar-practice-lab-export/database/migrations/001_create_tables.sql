-- Avatar Practice Lab Database Schema
-- Run this script to create all required tables

-- =====================
-- Core Tables
-- =====================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  definition TEXT NOT NULL,
  level INTEGER NOT NULL,
  parent_skill_id INTEGER,
  category TEXT DEFAULT 'General',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- =====================
-- Avatar Practice Lab Tables
-- =====================

CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES skills(id),
  name VARCHAR NOT NULL,
  description TEXT,
  context TEXT,
  instructions TEXT,
  avatar_name VARCHAR,
  avatar_role VARCHAR,
  difficulty TEXT,
  duration NUMERIC
);

CREATE TABLE IF NOT EXISTS scenario_skills (
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (scenario_id, skill_id)
);

CREATE TABLE IF NOT EXISTS personas (
  id SERIAL PRIMARY KEY,
  persona VARCHAR NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS tones (
  id SERIAL PRIMARY KEY,
  tone VARCHAR NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS avatars (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  look VARCHAR,
  ethnicity VARCHAR,
  gender VARCHAR,
  role VARCHAR,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- Session Management Tables
-- =====================

CREATE TABLE IF NOT EXISTS roleplay_session (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  avatar_id VARCHAR NOT NULL REFERENCES avatars(id),
  knowledge_id VARCHAR,
  transcript_id VARCHAR,
  start_time TIMESTAMP DEFAULT NOW() NOT NULL,
  end_time TIMESTAMP DEFAULT NOW(),
  duration INTEGER,
  audio_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  avatar_id VARCHAR,
  knowledge_id VARCHAR,
  start_time TIMESTAMP DEFAULT NOW() NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS transcripts (
  id VARCHAR PRIMARY KEY,
  avatar_id VARCHAR NOT NULL,
  knowledge_id VARCHAR,
  context TEXT,
  instructions TEXT,
  scenario TEXT,
  skill TEXT,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  session_id VARCHAR NOT NULL REFERENCES roleplay_session(id) ON DELETE CASCADE,
  ai_session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  skill_id INTEGER,
  scenario_id INTEGER REFERENCES scenarios(id) ON DELETE SET NULL,
  session_type VARCHAR DEFAULT 'streaming_avatar'
);

CREATE TABLE IF NOT EXISTS transcript_messages (
  id TEXT PRIMARY KEY,
  transcript_id TEXT NOT NULL REFERENCES transcripts(id),
  messages JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_session_analysis (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES roleplay_session(id),
  session_type TEXT DEFAULT 'audio_roleplay' NOT NULL,
  transcript_id VARCHAR REFERENCES transcripts(id),
  overall_score INTEGER NOT NULL,
  user_talk_time REAL NOT NULL,
  other_talk_time REAL NOT NULL,
  user_talk_percentage REAL NOT NULL,
  filler_words JSONB NOT NULL,
  weak_words JSONB NOT NULL,
  sentence_openers JSONB NOT NULL,
  active_listening BOOLEAN NOT NULL,
  engagement_level INTEGER NOT NULL,
  questions_asked INTEGER NOT NULL,
  acknowledgments INTEGER NOT NULL,
  interruptions INTEGER NOT NULL,
  average_pacing REAL NOT NULL,
  pacing_variation JSONB NOT NULL,
  tone JSONB NOT NULL,
  pause_count INTEGER NOT NULL,
  average_pause_length REAL NOT NULL,
  strengths JSONB NOT NULL,
  growth_areas JSONB NOT NULL,
  follow_up_questions JSONB NOT NULL,
  summary TEXT NOT NULL,
  pronunciation_issues JSONB NOT NULL,
  pronunciation_suggestions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================
-- HeyGen Session Management Tables
-- =====================

CREATE TABLE IF NOT EXISTS heygen_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id INTEGER REFERENCES scenarios(id) ON DELETE SET NULL,
  avatar_id VARCHAR REFERENCES avatars(id),
  heygen_session_id VARCHAR,
  status TEXT NOT NULL DEFAULT 'active',
  mode TEXT NOT NULL DEFAULT 'voice',
  quality TEXT DEFAULT 'low',
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT NOW(),
  session_duration_sec INTEGER DEFAULT 360,
  actual_duration_sec INTEGER,
  end_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heygen_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id INTEGER REFERENCES scenarios(id) ON DELETE SET NULL,
  avatar_id VARCHAR REFERENCES avatars(id),
  status TEXT NOT NULL DEFAULT 'queued',
  mode TEXT NOT NULL DEFAULT 'voice',
  priority SMALLINT DEFAULT 0,
  queued_at TIMESTAMP DEFAULT NOW() NOT NULL,
  assigned_at TIMESTAMP,
  expires_at TIMESTAMP,
  assigned_session_id INTEGER REFERENCES heygen_sessions(id) ON DELETE SET NULL,
  estimated_wait_sec INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- Indexes for Performance
-- =====================

CREATE INDEX IF NOT EXISTS idx_scenarios_skill_id ON scenarios(skill_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_roleplay_session_user_id ON roleplay_session(user_id);
CREATE INDEX IF NOT EXISTS idx_heygen_sessions_user_id ON heygen_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_heygen_sessions_status ON heygen_sessions(status);
CREATE INDEX IF NOT EXISTS idx_heygen_queue_user_id ON heygen_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_heygen_queue_status ON heygen_queue(status);
