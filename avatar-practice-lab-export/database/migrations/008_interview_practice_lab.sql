-- Migration: Interview Practice Lab Tables
-- Created: 2026-01-01

-- Role Kits - Pre-built interview role catalog
CREATE TABLE IF NOT EXISTS role_kits (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    level TEXT NOT NULL DEFAULT 'entry' CHECK (level IN ('entry', 'mid', 'senior')),
    domain VARCHAR NOT NULL,
    description TEXT,
    default_interview_types JSONB DEFAULT '["hr", "technical"]',
    default_rubric_id INTEGER,
    skills_focus JSONB,
    estimated_duration INTEGER DEFAULT 360,
    track_tags JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Interview Rubrics - Defines dimensions and scoring rules
CREATE TABLE IF NOT EXISTS interview_rubrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    dimensions JSONB NOT NULL,
    scoring_guide JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add foreign key for role_kits.default_rubric_id after interview_rubrics exists
ALTER TABLE role_kits 
    ADD CONSTRAINT fk_role_kits_rubric 
    FOREIGN KEY (default_rubric_id) 
    REFERENCES interview_rubrics(id) 
    ON DELETE SET NULL;

-- User Documents - Resume/JD uploads
CREATE TABLE IF NOT EXISTS user_documents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('resume', 'job_description', 'company_notes', 'other')),
    file_name VARCHAR NOT NULL,
    mime_type VARCHAR,
    s3_url TEXT,
    raw_text TEXT,
    parsed_json JSONB,
    source_hash VARCHAR,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User Profile Extracted - Derived interview profile from latest resume
CREATE TABLE IF NOT EXISTS user_profile_extracted (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
    latest_resume_doc_id INTEGER REFERENCES user_documents(id) ON DELETE SET NULL,
    headline TEXT,
    work_history JSONB,
    projects JSONB,
    skills_claimed JSONB,
    risk_flags JSONB,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Interview Configs - User's chosen interview settings for a session
CREATE TABLE IF NOT EXISTS interview_configs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    role_kit_id INTEGER REFERENCES role_kits(id) ON DELETE SET NULL,
    resume_doc_id INTEGER REFERENCES user_documents(id) ON DELETE SET NULL,
    jd_doc_id INTEGER REFERENCES user_documents(id) ON DELETE SET NULL,
    company_notes_doc_id INTEGER REFERENCES user_documents(id) ON DELETE SET NULL,
    interview_type TEXT NOT NULL DEFAULT 'hr' CHECK (interview_type IN ('hr', 'hiring_manager', 'technical', 'panel', 'case_study', 'behavioral', 'coding', 'sql', 'analytics', 'ml', 'case', 'system_design', 'product_sense', 'general', 'skill_practice')),
    style TEXT NOT NULL DEFAULT 'neutral' CHECK (style IN ('friendly', 'neutral', 'stress')),
    seniority TEXT NOT NULL DEFAULT 'entry' CHECK (seniority IN ('entry', 'mid', 'senior')),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Interview Plans - AI-generated plan used during runtime
CREATE TABLE IF NOT EXISTS interview_plans (
    id SERIAL PRIMARY KEY,
    interview_config_id INTEGER NOT NULL REFERENCES interview_configs(id) ON DELETE CASCADE,
    plan_json JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Interview Sessions - Links roleplay_session to interview-specific context
CREATE TABLE IF NOT EXISTS interview_sessions (
    id SERIAL PRIMARY KEY,
    roleplay_session_id INTEGER REFERENCES roleplay_session(id) ON DELETE CASCADE,
    interview_config_id INTEGER NOT NULL REFERENCES interview_configs(id) ON DELETE CASCADE,
    interview_plan_id INTEGER REFERENCES interview_plans(id) ON DELETE SET NULL,
    rubric_id INTEGER REFERENCES interview_rubrics(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'ended', 'analyzed')),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Interview Analysis - Extended analysis for interview sessions
CREATE TABLE IF NOT EXISTS interview_analysis (
    id SERIAL PRIMARY KEY,
    interview_session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    transcript_id VARCHAR REFERENCES transcripts(id) ON DELETE SET NULL,
    overall_recommendation TEXT CHECK (overall_recommendation IN ('strong_yes', 'yes', 'lean_yes', 'lean_no', 'no')),
    confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
    summary TEXT,
    dimension_scores JSONB,
    strengths JSONB,
    risks JSONB,
    role_fit_notes JSONB,
    better_answers JSONB,
    practice_plan JSONB,
    wins JSONB,
    improvements JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Interview Artifacts - Store structured outputs
CREATE TABLE IF NOT EXISTS interview_artifacts (
    id SERIAL PRIMARY KEY,
    interview_session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL CHECK (artifact_type IN ('improved_answers', 'question_list', 'action_plan', 'transcript_highlights')),
    artifact_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_doc_type ON user_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_interview_configs_user_id ON interview_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_config_id ON interview_sessions(interview_config_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_analysis_session_id ON interview_analysis(interview_session_id);
CREATE INDEX IF NOT EXISTS idx_role_kits_domain ON role_kits(domain);
CREATE INDEX IF NOT EXISTS idx_role_kits_level ON role_kits(level);
