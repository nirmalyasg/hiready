-- Seed data for tones table
-- Run: psql $DATABASE_URL -f database/seeds/tones.sql

INSERT INTO tones (id, tone, description) VALUES
(1, 'Supportive', 'Encouraging and reassuring, focused on providing confidence and comfort.'),
(2, 'Challenging', 'Pushes ideas and assumptions, encouraging deeper thought and reflection.'),
(3, 'Analytical', 'Breaks down information logically and objectively, focusing on facts and reasoning.'),
(4, 'Urgent', 'Communicates with emphasis on speed, importance, and immediate attention.'),
(5, 'Diplomatic', 'Carefully balances perspectives to maintain harmony and avoid conflict.'),
(6, 'Strong', 'n/a')
ON CONFLICT (id) DO UPDATE SET tone = EXCLUDED.tone, description = EXCLUDED.description;

-- Reset sequence
SELECT setval('tones_id_seq', (SELECT MAX(id) FROM tones));
