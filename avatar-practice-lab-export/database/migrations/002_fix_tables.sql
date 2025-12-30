-- Fixed tables for Avatar Practice Lab

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
  session_id INTEGER NOT NULL REFERENCES roleplay_session(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
