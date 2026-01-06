-- Seed Data: Interview Practice Lab
-- Default rubric and starter role kits

-- Insert default interview rubric (8 dimensions as per spec)
INSERT INTO interview_rubrics (name, description, dimensions, scoring_guide, is_default) VALUES
(
    'General Interview Rubric',
    'Default rubric for evaluating interview performance across 8 key dimensions',
    '[
        {"name": "Clarity & Structure", "description": "How clearly and logically the candidate organizes their responses", "weight": 1.0},
        {"name": "Depth & Evidence", "description": "Specificity of answers with concrete examples and data", "weight": 1.0},
        {"name": "Problem Solving Approach", "description": "Logical reasoning and structured thinking when addressing challenges", "weight": 1.0},
        {"name": "Role Fit", "description": "Alignment between candidate experience/skills and job requirements", "weight": 1.0},
        {"name": "Confidence & Composure", "description": "Poise under pressure and self-assurance in delivery", "weight": 1.0},
        {"name": "Communication Hygiene", "description": "Minimal filler words, appropriate pace, concise responses", "weight": 1.0},
        {"name": "Ownership & Impact", "description": "Clear articulation of personal contributions and measurable results", "weight": 1.0},
        {"name": "Consistency & Honesty", "description": "Coherent narrative without contradictions, authentic responses", "weight": 1.0}
    ]'::jsonb,
    '[
        {"dimension": "Clarity & Structure", "scores": [
            {"score": 1, "description": "Responses are disorganized, hard to follow, rambling"},
            {"score": 3, "description": "Answers are reasonably structured but could be more focused"},
            {"score": 5, "description": "Crystal clear, well-organized responses with logical flow"}
        ]},
        {"dimension": "Depth & Evidence", "scores": [
            {"score": 1, "description": "Vague answers with no specific examples or data"},
            {"score": 3, "description": "Some examples provided but lacking in detail or impact metrics"},
            {"score": 5, "description": "Rich examples with specific numbers, outcomes, and context"}
        ]},
        {"dimension": "Problem Solving Approach", "scores": [
            {"score": 1, "description": "No clear methodology, jumps to conclusions"},
            {"score": 3, "description": "Shows some structure but misses key considerations"},
            {"score": 5, "description": "Systematic approach with clear reasoning and alternatives considered"}
        ]},
        {"dimension": "Role Fit", "scores": [
            {"score": 1, "description": "Experience seems misaligned with role requirements"},
            {"score": 3, "description": "Some relevant experience but gaps in key areas"},
            {"score": 5, "description": "Strong match between background and job needs"}
        ]},
        {"dimension": "Confidence & Composure", "scores": [
            {"score": 1, "description": "Nervous, uncertain, easily flustered"},
            {"score": 3, "description": "Generally composed but shows some hesitation"},
            {"score": 5, "description": "Calm, confident, handles pressure well"}
        ]},
        {"dimension": "Communication Hygiene", "scores": [
            {"score": 1, "description": "Excessive fillers, poor pacing, overly long responses"},
            {"score": 3, "description": "Occasional fillers, mostly appropriate length"},
            {"score": 5, "description": "Crisp delivery, minimal fillers, well-paced"}
        ]},
        {"dimension": "Ownership & Impact", "scores": [
            {"score": 1, "description": "Uses \"we\" exclusively, unclear personal contribution"},
            {"score": 3, "description": "Some clarity on role but impact not quantified"},
            {"score": 5, "description": "Clear \"I did X which resulted in Y\" with metrics"}
        ]},
        {"dimension": "Consistency & Honesty", "scores": [
            {"score": 1, "description": "Contradictions in story, evasive answers"},
            {"score": 3, "description": "Mostly consistent with minor unclear points"},
            {"score": 5, "description": "Fully consistent narrative, handles probes honestly"}
        ]}
    ]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Insert starter role kits with role_archetype_id links
INSERT INTO role_kits (name, level, domain, description, default_interview_types, skills_focus, estimated_duration, track_tags, role_archetype_id, is_active) VALUES
-- Software Engineering
('Software Engineer - Entry Level', 'entry', 'software', 
 'Entry-level software engineering role focusing on coding fundamentals, problem-solving, and learning ability',
 '["technical", "hr"]'::jsonb,
 '["Data Structures", "Algorithms", "Coding", "Problem Solving", "Collaboration"]'::jsonb,
 30, '["Technical", "Engineering"]'::jsonb, 'core_software_engineer', true),

('Software Engineer - Mid Level', 'mid', 'software', 
 'Mid-level software engineering role emphasizing system design, code quality, and team contribution',
 '["technical", "hiring_manager"]'::jsonb,
 '["System Design", "Code Review", "Architecture", "Mentoring", "Technical Leadership"]'::jsonb,
 30, '["Technical", "Engineering"]'::jsonb, 'core_software_engineer', true),

('Infrastructure Engineer - Entry Level', 'entry', 'software', 
 'DevOps/SRE/platform engineering: reliability, automation, and systems',
 '["technical", "hiring_manager", "behavioral"]'::jsonb,
 '["Linux", "Networking", "Reliability", "Automation", "Cloud"]'::jsonb,
 30, '["Technical", "Infrastructure"]'::jsonb, 'infra_platform', true),

('QA Engineer - Entry Level', 'entry', 'software', 
 'Quality engineering: test strategy, automation, and defect triage',
 '["technical", "hiring_manager", "behavioral"]'::jsonb,
 '["Test Strategy", "Automation", "Debugging", "Risk Analysis"]'::jsonb,
 30, '["Technical", "QA"]'::jsonb, 'qa_test_engineer', true),

('Security Engineer - Mid Level', 'mid', 'software', 
 'Security engineering across appsec, cloud security, and security operations',
 '["technical", "hiring_manager", "behavioral"]'::jsonb,
 '["Security Fundamentals", "Threat Modeling", "Risk Assessment", "Incident Response"]'::jsonb,
 30, '["Technical", "Security"]'::jsonb, 'security_engineer', true),

-- Data & Analytics
('Data Analyst - Entry Level', 'entry', 'data', 
 'Entry-level data analyst focusing on SQL, data visualization, and analytical thinking',
 '["technical", "hr"]'::jsonb,
 '["SQL", "Data Visualization", "Excel", "Statistical Analysis", "Business Acumen"]'::jsonb,
 30, '["Technical", "Analytics"]'::jsonb, 'data_analyst', true),

('Data Scientist - Mid Level', 'mid', 'data', 
 'Mid-level data science role covering machine learning, statistical modeling, and stakeholder communication',
 '["technical", "hiring_manager"]'::jsonb,
 '["Machine Learning", "Statistical Modeling", "Python", "Communication", "Business Impact"]'::jsonb,
 30, '["Technical", "Analytics", "AI/ML"]'::jsonb, 'data_scientist', true),

('Data Engineer - Entry Level', 'entry', 'data', 
 'Build and maintain data pipelines, ETL processes, and data infrastructure',
 '["technical", "hiring_manager", "behavioral"]'::jsonb,
 '["SQL", "ETL/ELT", "Data Modeling", "Python", "Debugging"]'::jsonb,
 30, '["Technical", "Data Engineering"]'::jsonb, 'data_engineer', true),

('ML Engineer - Mid Level', 'mid', 'data', 
 'Build and deploy machine learning models in production systems',
 '["technical", "hiring_manager", "behavioral"]'::jsonb,
 '["ML Fundamentals", "Model Evaluation", "MLOps", "Python", "System Design"]'::jsonb,
 30, '["Technical", "AI/ML"]'::jsonb, 'ml_engineer', true),

-- Product & Design
('Product Manager - Entry Level', 'entry', 'product', 
 'Associate/entry-level PM role focusing on user research, prioritization, and cross-functional collaboration',
 '["hiring_manager", "hr"]'::jsonb,
 '["User Research", "Prioritization", "Stakeholder Management", "Communication", "Metrics"]'::jsonb,
 30, '["Product", "Strategy"]'::jsonb, 'product_manager', true),

('UX Designer - Entry Level', 'entry', 'design', 
 'Entry-level UX design role covering user research, wireframing, and design thinking',
 '["hiring_manager", "hr"]'::jsonb,
 '["User Research", "Wireframing", "Prototyping", "Design Thinking", "Usability Testing"]'::jsonb,
 30, '["Design", "UX"]'::jsonb, 'product_designer', true),

-- Sales & Marketing
('Sales Development Rep', 'entry', 'sales', 
 'Entry-level sales role focusing on prospecting, communication, and handling objections',
 '["hiring_manager", "hr"]'::jsonb,
 '["Prospecting", "Communication", "Objection Handling", "CRM", "Persistence"]'::jsonb,
 30, '["Sales", "Business Development"]'::jsonb, 'sales_account', true),

('Marketing Associate', 'entry', 'marketing', 
 'Entry-level marketing role covering campaign management, content creation, and analytics',
 '["hiring_manager", "hr"]'::jsonb,
 '["Content Creation", "Social Media", "Analytics", "Campaign Management", "Creativity"]'::jsonb,
 30, '["Marketing", "Growth"]'::jsonb, 'marketing_growth', true),

-- Operations & Support
('Customer Success Associate', 'entry', 'customer_success', 
 'Entry-level customer success role focusing on client relationships, problem-solving, and communication',
 '["hiring_manager", "hr"]'::jsonb,
 '["Customer Communication", "Problem Solving", "Product Knowledge", "Empathy", "Retention"]'::jsonb,
 30, '["Customer Success", "Support"]'::jsonb, 'customer_success', true),

('Operations Analyst', 'entry', 'operations', 
 'Entry-level operations role covering process improvement, data analysis, and project coordination',
 '["hiring_manager", "hr"]'::jsonb,
 '["Process Improvement", "Data Analysis", "Project Management", "Communication", "Attention to Detail"]'::jsonb,
 30, '["Operations", "Strategy"]'::jsonb, 'operations_general', true),

('BizOps Analyst - Entry Level', 'entry', 'operations', 
 'Business operations and strategy: structured problem solving and stakeholder alignment',
 '["case", "hiring_manager", "behavioral"]'::jsonb,
 '["Analysis", "Strategy", "Stakeholder Management", "Prioritization"]'::jsonb,
 30, '["Operations", "Strategy"]'::jsonb, 'bizops_strategy', true),

-- Consulting & Finance
('Business Analyst', 'entry', 'consulting', 
 'Entry-level BA role focusing on requirements gathering, problem structuring, and stakeholder communication',
 '["hiring_manager", "technical"]'::jsonb,
 '["Requirements Analysis", "Problem Structuring", "Stakeholder Communication", "Documentation", "SQL"]'::jsonb,
 30, '["Consulting", "Business"]'::jsonb, 'consulting_general', true),

('Financial Analyst', 'entry', 'finance', 
 'Entry-level finance role covering financial modeling, analysis, and presentation skills',
 '["hiring_manager", "technical"]'::jsonb,
 '["Financial Modeling", "Excel", "Valuation", "Presentation", "Attention to Detail"]'::jsonb,
 30, '["Finance", "Analytics"]'::jsonb, 'finance_strategy', true),

-- HR & People
('HR Coordinator', 'entry', 'hr', 
 'Entry-level HR role focusing on employee relations, recruitment support, and HR operations',
 '["hr", "hiring_manager"]'::jsonb,
 '["Employee Relations", "Recruitment", "HR Operations", "Communication", "Confidentiality"]'::jsonb,
 30, '["HR", "People Operations"]'::jsonb, 'operations_general', true),

('Recruiter - Entry Level', 'entry', 'recruiting', 
 'Entry-level recruiter role covering sourcing, candidate experience, and pipeline management',
 '["hr", "hiring_manager"]'::jsonb,
 '["Sourcing", "Candidate Experience", "Pipeline Management", "Communication", "Negotiation"]'::jsonb,
 30, '["HR", "Talent Acquisition"]'::jsonb, 'operations_general', true),

-- Management
('Team Lead - Software', 'mid', 'engineering_management', 
 'First-time engineering manager role focusing on team leadership, project delivery, and technical mentorship',
 '["panel", "hiring_manager"]'::jsonb,
 '["Team Leadership", "Project Management", "Technical Mentorship", "Hiring", "Performance Management"]'::jsonb,
 30, '["Management", "Engineering"]'::jsonb, 'technical_program_manager', true)

ON CONFLICT DO NOTHING;

-- Update role kits to reference the default rubric
UPDATE role_kits 
SET default_rubric_id = (SELECT id FROM interview_rubrics WHERE is_default = true LIMIT 1)
WHERE default_rubric_id IS NULL;
