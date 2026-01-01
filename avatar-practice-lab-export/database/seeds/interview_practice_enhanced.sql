-- Seed Data: Interview Practice Lab - Enhanced Flagship Role Kits
-- Based on production-grade prompt stack specification

-- =============================================================================
-- SWE Entry - Role-Specific Rubric
-- =============================================================================
INSERT INTO interview_rubrics (name, description, dimensions, scoring_guide, is_default) VALUES
(
    'SWE Entry - Technical Round Rubric',
    'Software Engineer Entry Level - Technical interview evaluation rubric with 7 weighted dimensions',
    '[
        {"name": "Problem Solving", "description": "Ability to decompose problems, plan approach, and handle complexity", "weight": 0.22},
        {"name": "Fundamentals Depth", "description": "Knowledge of data structures, algorithms, and CS concepts", "weight": 0.20},
        {"name": "Communication Structure", "description": "Clarity of explanation, logical flow, ability to explain technical concepts", "weight": 0.15},
        {"name": "Specificity & Evidence", "description": "Use of concrete examples, numbers, and specific technical details", "weight": 0.15},
        {"name": "Edge Case Thinking", "description": "Consideration of edge cases, error handling, and robustness", "weight": 0.10},
        {"name": "Debugging Mindset", "description": "Systematic approach to finding and fixing issues", "weight": 0.10},
        {"name": "Consistency & Honesty", "description": "Coherent narrative, honest about limitations, no contradictions", "weight": 0.08}
    ]'::jsonb,
    '[
        {"dimension": "Problem Solving", "scores": [
            {"score": 1, "description": "Jumps to solution; unclear steps; cannot decompose problem"},
            {"score": 3, "description": "Has a plan but misses steps or considers only happy path"},
            {"score": 5, "description": "Breaks down clearly; considers alternatives; adjusts approach when stuck"}
        ]},
        {"dimension": "Fundamentals Depth", "scores": [
            {"score": 1, "description": "Major gaps in basic DS/Algo; incorrect complexity analysis"},
            {"score": 3, "description": "Knows basics but shallow on trade-offs or edge cases"},
            {"score": 5, "description": "Solid fundamentals; articulates trade-offs; correct complexity"}
        ]},
        {"dimension": "Communication Structure", "scores": [
            {"score": 1, "description": "Rambling; hard to follow; no structure"},
            {"score": 3, "description": "Understandable but could be more concise or organized"},
            {"score": 5, "description": "Clear, structured, concise; easy to follow reasoning"}
        ]},
        {"dimension": "Specificity & Evidence", "scores": [
            {"score": 1, "description": "Vague answers; no concrete examples or metrics"},
            {"score": 3, "description": "Some examples but lacking detail or quantification"},
            {"score": 5, "description": "Rich examples with specific details, numbers, outcomes"}
        ]},
        {"dimension": "Edge Case Thinking", "scores": [
            {"score": 1, "description": "Ignores edge cases; no error handling considered"},
            {"score": 3, "description": "Mentions some edge cases when prompted"},
            {"score": 5, "description": "Proactively identifies edge cases and handles them"}
        ]},
        {"dimension": "Debugging Mindset", "scores": [
            {"score": 1, "description": "Random guessing; no systematic approach"},
            {"score": 3, "description": "Some structure but misses obvious checks"},
            {"score": 5, "description": "Systematic: reproduce, isolate, hypothesize, verify"}
        ]},
        {"dimension": "Consistency & Honesty", "scores": [
            {"score": 1, "description": "Contradictions in story; evasive about gaps"},
            {"score": 3, "description": "Mostly consistent; minor unclear points"},
            {"score": 5, "description": "Fully consistent; honest about limitations; handles probes well"}
        ]}
    ]'::jsonb,
    false
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- Data Analyst Entry - Role-Specific Rubric
-- =============================================================================
INSERT INTO interview_rubrics (name, description, dimensions, scoring_guide, is_default) VALUES
(
    'Data Analyst Entry - Rubric',
    'Data Analyst Entry Level - Mixed interview evaluation rubric with 6 weighted dimensions',
    '[
        {"name": "Analytical Thinking", "description": "Structured approach to data problems, hypothesis formation", "weight": 0.22},
        {"name": "SQL Reasoning", "description": "Understanding of SQL concepts, query logic, data manipulation", "weight": 0.22},
        {"name": "Communication Structure", "description": "Clarity in explaining findings and methodology", "weight": 0.18},
        {"name": "Specificity & Evidence", "description": "Use of concrete examples and data-driven insights", "weight": 0.15},
        {"name": "Business Interpretation", "description": "Ability to translate data into business context", "weight": 0.15},
        {"name": "Consistency & Honesty", "description": "Coherent narrative without contradictions", "weight": 0.08}
    ]'::jsonb,
    '[
        {"dimension": "Analytical Thinking", "scores": [
            {"score": 1, "description": "Unstructured; jumps to conclusions without validation"},
            {"score": 3, "description": "Some structure; misses assumptions or validation steps"},
            {"score": 5, "description": "Clear structure, articulates assumptions, validates approach"}
        ]},
        {"dimension": "SQL Reasoning", "scores": [
            {"score": 1, "description": "Cannot explain basic joins or aggregations"},
            {"score": 3, "description": "Knows basics but struggles with complex queries"},
            {"score": 5, "description": "Clear understanding; can reason through complex queries"}
        ]},
        {"dimension": "Communication Structure", "scores": [
            {"score": 1, "description": "Hard to follow; no clear structure"},
            {"score": 3, "description": "Understandable but could be more organized"},
            {"score": 5, "description": "Clear, concise, well-structured explanations"}
        ]},
        {"dimension": "Specificity & Evidence", "scores": [
            {"score": 1, "description": "Vague; no concrete examples or metrics"},
            {"score": 3, "description": "Some examples but lacking specificity"},
            {"score": 5, "description": "Rich examples with specific metrics and outcomes"}
        ]},
        {"dimension": "Business Interpretation", "scores": [
            {"score": 1, "description": "Cannot connect data to business implications"},
            {"score": 3, "description": "Some business context but surface level"},
            {"score": 5, "description": "Strong business acumen; connects data to decisions"}
        ]},
        {"dimension": "Consistency & Honesty", "scores": [
            {"score": 1, "description": "Contradictions; evasive about gaps"},
            {"score": 3, "description": "Mostly consistent with minor unclear points"},
            {"score": 5, "description": "Fully consistent; honest about limitations"}
        ]}
    ]'::jsonb,
    false
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- Sales Entry - Role-Specific Rubric
-- =============================================================================
INSERT INTO interview_rubrics (name, description, dimensions, scoring_guide, is_default) VALUES
(
    'Sales Entry - Rubric',
    'Sales Executive Entry Level - Interview evaluation rubric with 6 weighted dimensions',
    '[
        {"name": "Communication & Rapport", "description": "Clarity, warmth, ability to build connection", "weight": 0.22},
        {"name": "Active Listening", "description": "Understanding needs, asking clarifying questions", "weight": 0.20},
        {"name": "Objection Handling", "description": "Composure and skill in addressing concerns", "weight": 0.18},
        {"name": "Persistence & Drive", "description": "Motivation, resilience, follow-through examples", "weight": 0.15},
        {"name": "Specificity & Evidence", "description": "Concrete examples of sales or persuasion success", "weight": 0.15},
        {"name": "Consistency & Honesty", "description": "Coherent narrative, authentic responses", "weight": 0.10}
    ]'::jsonb,
    '[
        {"dimension": "Communication & Rapport", "scores": [
            {"score": 1, "description": "Awkward; unable to build connection; unclear"},
            {"score": 3, "description": "Pleasant but generic; room for more warmth"},
            {"score": 5, "description": "Natural rapport; clear and engaging communication"}
        ]},
        {"dimension": "Active Listening", "scores": [
            {"score": 1, "description": "Interrupts; misses key points; talks over"},
            {"score": 3, "description": "Listens but misses nuance or clarification opportunities"},
            {"score": 5, "description": "Excellent listening; asks smart follow-ups; confirms understanding"}
        ]},
        {"dimension": "Objection Handling", "scores": [
            {"score": 1, "description": "Gets defensive; cannot address concerns"},
            {"score": 3, "description": "Handles basic objections but struggles under pressure"},
            {"score": 5, "description": "Calm under pressure; addresses concerns skillfully"}
        ]},
        {"dimension": "Persistence & Drive", "scores": [
            {"score": 1, "description": "No evidence of follow-through or resilience"},
            {"score": 3, "description": "Some examples but lack depth or specificity"},
            {"score": 5, "description": "Strong examples of persistence with measurable outcomes"}
        ]},
        {"dimension": "Specificity & Evidence", "scores": [
            {"score": 1, "description": "Vague claims; no concrete examples"},
            {"score": 3, "description": "Some examples but lacking metrics"},
            {"score": 5, "description": "Specific examples with numbers and clear outcomes"}
        ]},
        {"dimension": "Consistency & Honesty", "scores": [
            {"score": 1, "description": "Contradictions; oversells without substance"},
            {"score": 3, "description": "Mostly consistent with minor exaggerations"},
            {"score": 5, "description": "Authentic; consistent narrative; honest about challenges"}
        ]}
    ]'::jsonb,
    false
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- Update SWE Entry Role Kit with enhanced fields
-- =============================================================================
UPDATE role_kits 
SET 
    role_context = 'Entry-level software engineer role focused on programming fundamentals, problem solving, and the ability to explain code clearly. Candidate should demonstrate basic data structures and algorithms, debugging mindset, and clean reasoning. This is not a senior system design interview.',
    core_competencies = '["Programming Fundamentals", "Data Structures", "Algorithms", "Debugging", "Problem Decomposition", "Code Clarity", "Learning Agility"]'::jsonb,
    typical_questions = '[
        "Tell me about a project where you wrote significant code. What was your role?",
        "Walk me through how you would reverse a linked list.",
        "You have an array of integers. How would you find the two numbers that add up to a target?",
        "Describe a bug you spent a long time debugging. How did you finally find it?",
        "Explain the difference between a stack and a queue. When would you use each?",
        "How would you approach optimizing a slow database query?",
        "Tell me about a time you had to learn a new technology quickly."
    ]'::jsonb,
    description = 'Entry-level software engineering role focusing on coding fundamentals, problem-solving, and learning ability. Evaluates data structures, algorithms, debugging skills, and communication of technical concepts.'
WHERE name = 'Software Engineer - Entry Level' OR name LIKE 'Software Engineer - Entry%';

-- =============================================================================
-- Update Data Analyst Entry Role Kit with enhanced fields
-- =============================================================================
UPDATE role_kits 
SET 
    role_context = 'Entry-level data analyst role focused on SQL querying, basic analytical reasoning, and communicating insights clearly. Candidate should show structured thinking, comfort with metrics, and ability to interpret data in a business context.',
    core_competencies = '["SQL", "Analytical Reasoning", "Basic Statistics", "Data Interpretation", "Communication", "Business Acumen", "Attention to Detail"]'::jsonb,
    typical_questions = '[
        "Tell me about a time you used data to solve a problem or answer a question.",
        "How would you approach analyzing customer churn for an e-commerce business?",
        "Explain the difference between INNER JOIN and LEFT JOIN. When would you use each?",
        "You notice a sudden spike in website traffic. Walk me through how you would investigate.",
        "Describe a dashboard or report you created. What insights did it provide?",
        "How would you explain a complex data finding to a non-technical stakeholder?",
        "What metrics would you track to measure the success of a marketing campaign?"
    ]'::jsonb,
    description = 'Entry-level data analyst role focusing on SQL, data visualization, and analytical thinking. Evaluates structured reasoning, ability to interpret data, and communication of insights to stakeholders.'
WHERE name = 'Data Analyst - Entry Level' OR name LIKE 'Data Analyst%Entry%';

-- =============================================================================
-- Update Sales Entry Role Kit with enhanced fields
-- =============================================================================
UPDATE role_kits 
SET 
    role_context = 'Entry-level sales role focused on communication, listening, persistence, and structured selling. Candidate should demonstrate comfort with rejection, ability to understand customer needs, and disciplined follow-up. No advanced negotiation expected, but basic objection handling and clarity are critical.',
    core_competencies = '["Communication", "Active Listening", "Objection Handling", "Persistence", "Customer Focus", "Organization", "Resilience"]'::jsonb,
    typical_questions = '[
        "Tell me about a time you convinced someone to do something they were initially hesitant about.",
        "How do you handle rejection? Give me a specific example.",
        "Walk me through your approach to preparing for a sales call.",
        "A prospect says your product is too expensive. How do you respond?",
        "Describe your system for following up with leads.",
        "Tell me about your biggest sales win or persuasion success.",
        "How do you prioritize which prospects to focus on?"
    ]'::jsonb,
    description = 'Entry-level sales role focusing on prospecting, communication, and handling objections. Evaluates rapport building, active listening, resilience, and ability to articulate value.'
WHERE name = 'Sales Development Rep' OR name LIKE 'Sales%Entry%';

-- =============================================================================
-- Link role kits to their specific rubrics
-- =============================================================================
UPDATE role_kits 
SET default_rubric_id = (SELECT id FROM interview_rubrics WHERE name = 'SWE Entry - Technical Round Rubric' LIMIT 1)
WHERE name = 'Software Engineer - Entry Level' OR name LIKE 'Software Engineer - Entry%';

UPDATE role_kits 
SET default_rubric_id = (SELECT id FROM interview_rubrics WHERE name = 'Data Analyst Entry - Rubric' LIMIT 1)
WHERE name = 'Data Analyst - Entry Level' OR name LIKE 'Data Analyst%Entry%';

UPDATE role_kits 
SET default_rubric_id = (SELECT id FROM interview_rubrics WHERE name = 'Sales Entry - Rubric' LIMIT 1)
WHERE name = 'Sales Development Rep' OR name LIKE 'Sales%Entry%';
