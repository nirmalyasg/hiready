-- Create presentation scenarios table
CREATE TABLE IF NOT EXISTS presentation_scenarios (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_slides INTEGER NOT NULL,
  slides_data JSONB NOT NULL,
  extracted_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create presentation feedback table
CREATE TABLE IF NOT EXISTS presentation_feedback (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES roleplay_session(id) ON DELETE CASCADE NOT NULL,
  presentation_scenario_id INTEGER REFERENCES presentation_scenarios(id) ON DELETE CASCADE NOT NULL,
  overall_score REAL NOT NULL,
  communication_score REAL NOT NULL,
  communication_feedback TEXT,
  delivery_score REAL NOT NULL,
  delivery_feedback TEXT,
  subject_matter_score REAL NOT NULL,
  subject_matter_feedback TEXT,
  slide_coverage JSONB,
  strengths JSONB,
  improvements JSONB,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_presentation_scenarios_user_id ON presentation_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_feedback_session_id ON presentation_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_presentation_feedback_scenario_id ON presentation_feedback(presentation_scenario_id);
