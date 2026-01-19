-- Add session duration tracking timestamps to interview_sessions
-- These enable accurate tracking of actual practice session duration

ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

COMMENT ON COLUMN interview_sessions.started_at IS 'Timestamp when the interview session actually started (user entered session)';
COMMENT ON COLUMN interview_sessions.completed_at IS 'Timestamp when the interview session ended';
