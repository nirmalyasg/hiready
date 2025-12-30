-- Seed data for personas table
-- Run: psql $DATABASE_URL -f database/seeds/personas.sql

INSERT INTO personas (id, persona, description) VALUES
(1, 'Supportive but firm', 'Encourages others with positivity while setting clear boundaries and expectations.'),
(2, 'Skeptical but open-minded', 'Questions ideas critically but remains willing to listen and consider new evidence.'),
(3, 'Stressed but professional', 'Manages pressure while maintaining composure, professionalism, and focus on tasks.'),
(4, 'Cautious yet collaborative', 'Approaches situations carefully but works well with others to find safe solutions.'),
(5, 'Confident and assertive', 'Speaks with authority, takes initiative, and communicates decisions clearly.'),
(6, 'Empathetic and patient', 'Listens deeply, understands emotions, and gives others the time they need.'),
(7, 'Direct but respectful', 'Communicates honestly and clearly while remaining considerate of others'' feelings.'),
(8, 'Curious and open-minded', 'Eager to learn, ask questions, and explore new perspectives.'),
(9, 'Detail-oriented and analytical', 'Focuses on accuracy, patterns, and logical reasoning to ensure quality outcomes.'),
(10, 'Calm under pressure', 'Maintains steady focus, clear thinking, and resilience in stressful situations.'),
(11, 'Strong', 'n/a')
ON CONFLICT (id) DO UPDATE SET persona = EXCLUDED.persona, description = EXCLUDED.description;

-- Reset sequence
SELECT setval('personas_id_seq', (SELECT MAX(id) FROM personas));
