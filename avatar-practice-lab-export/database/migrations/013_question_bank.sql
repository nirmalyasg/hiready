-- Question Bank table for storing generated and curated interview questions
-- This enables question reuse across job targets and interview sessions

CREATE TABLE IF NOT EXISTS question_bank (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  role_kit_id integer REFERENCES role_kits(id) ON DELETE SET NULL,
  company_id varchar REFERENCES companies(id) ON DELETE SET NULL,
  interview_type text,
  question text NOT NULL,
  question_type text NOT NULL,
  topic text,
  follow_ups jsonb,
  assessment_dimension text,
  jd_source_topics jsonb,
  difficulty text DEFAULT 'medium',
  usage_count integer DEFAULT 0,
  avg_rating real,
  source_type text DEFAULT 'generated',
  source_job_target_id varchar REFERENCES job_targets(id) ON DELETE SET NULL,
  source_session_id integer,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS question_bank_role_kit_idx ON question_bank(role_kit_id);
CREATE INDEX IF NOT EXISTS question_bank_company_idx ON question_bank(company_id);
CREATE INDEX IF NOT EXISTS question_bank_interview_type_idx ON question_bank(interview_type);
CREATE INDEX IF NOT EXISTS question_bank_question_type_idx ON question_bank(question_type);
CREATE INDEX IF NOT EXISTS question_bank_is_active_idx ON question_bank(is_active);
