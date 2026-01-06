-- Role Task Blueprints seed data
-- Task prompts, expected signals, and probe trees for each role archetype

INSERT INTO role_task_blueprints (role_archetype_id, task_type, difficulty_band, prompt_template, expected_signals_json, probe_tree_json, tags_json)
VALUES
-- Core Software Engineer
('core_software_engineer', 'coding_explain', 'entry-mid', 'Solve: {{problem_statement}}. Talk through your approach before coding.', 
  '["states approach", "chooses data structures", "mentions complexity", "checks edge cases"]'::jsonb,
  '["What edge cases will you test?", "What is time/space complexity?", "If inputs get 10x, what breaks?"]'::jsonb,
  '["coding", "dsa", "explain"]'::jsonb),

('core_software_engineer', 'debugging', 'entry-mid', 'Here is code with a failing test. Explain how you would debug it step-by-step.',
  '["forms hypotheses", "adds targeted tests", "finds root cause", "verifies fix"]'::jsonb,
  '["Why start there?", "Show a minimal failing input.", "How prevent regression?"]'::jsonb,
  '["debugging", "tests", "reasoning"]'::jsonb),

('core_software_engineer', 'code_modification', 'entry-mid', 'Modify this code to meet a new requirement: {{requirement}}. Explain your changes.',
  '["understands requirement", "updates logic safely", "handles edge cases", "verifies"]'::jsonb,
  '["How would you test this?", "Any performance concerns?", "Any alternative approach?"]'::jsonb,
  '["modification", "requirements"]'::jsonb),

('core_software_engineer', 'code_review', 'mid-senior', 'Review this snippet as if it''s a PR. What risks or improvements do you see?',
  '["correctness risks", "readability", "performance", "security basics"]'::jsonb,
  '["Which change is highest impact?", "Any edge cases?", "How would you test it?"]'::jsonb,
  '["code_review", "quality"]'::jsonb),

-- Data Analyst
('data_analyst', 'sql_case', 'entry-mid', 'Given tables {{schema}}, write SQL to answer: {{question}}. Explain joins and assumptions.',
  '["correct joins", "handles nulls", "validates counts", "clear explanation"]'::jsonb,
  '["Why this join type?", "How would you QA results?", "Any edge cases?"]'::jsonb,
  '["sql", "analytics"]'::jsonb),

('data_analyst', 'metrics_investigation', 'entry-mid', 'A key metric dropped by {{percent}}%. What would you investigate first?',
  '["defines metric", "segments", "hypotheses", "validates data"]'::jsonb,
  '["Which segments first?", "What data quality checks?", "What experiment next?"]'::jsonb,
  '["metrics", "investigation"]'::jsonb),

('data_analyst', 'insight_storytelling', 'entry-mid', 'You found an insight: {{insight}}. Present it to a non-technical stakeholder in 2 minutes.',
  '["clear story", "business impact", "next actions", "confidence/limits"]'::jsonb,
  '["What is the recommendation?", "How confident are you?", "What could be wrong?"]'::jsonb,
  '["storytelling", "stakeholders"]'::jsonb),

-- Product Manager
('product_manager', 'case_interview', 'entry-mid', 'Case: {{case_prompt}}. First restate the problem and your approach.',
  '["structures approach", "clarifying questions", "assumptions", "drives to recommendation"]'::jsonb,
  '["What data do you need?", "What are key drivers?", "What risks to your plan?"]'::jsonb,
  '["case", "structure"]'::jsonb),

('product_manager', 'metrics_case', 'entry-mid', 'Metric: {{metric}} moved by {{delta}}. How do you diagnose and respond?',
  '["defines metric", "funnels/segments", "hypotheses", "action plan"]'::jsonb,
  '["What would you check first?", "How to validate?", "What tradeoffs?"]'::jsonb,
  '["metrics", "diagnosis"]'::jsonb),

('product_manager', 'execution_scenario', 'entry-mid', 'Scenario: {{scenario}}. What would you do in the first 2 weeks?',
  '["prioritizes", "success metrics", "stakeholder plan", "iteration"]'::jsonb,
  '["What would you NOT do?", "How measure success?", "How handle disagreement?"]'::jsonb,
  '["execution", "stakeholders"]'::jsonb),

-- Product Designer
('product_designer', 'portfolio_walkthrough', 'all', 'Walk me through a project from your portfolio: {{project}}. Focus on problem, process, and outcomes.',
  '["problem framing", "user research", "iterations", "impact"]'::jsonb,
  '["What would you do differently?", "How did you handle constraints?", "How did you collaborate?"]'::jsonb,
  '["portfolio", "design"]'::jsonb),

('product_designer', 'design_case', 'entry-mid', 'Design a solution for: {{prompt}}. Think aloud, ask clarifying questions, then propose flows.',
  '["clarifies users", "defines success", "generates options", "tradeoffs"]'::jsonb,
  '["Who is the user?", "What is MVP?", "How measure success?"]'::jsonb,
  '["design_case", "ux"]'::jsonb),

('product_designer', 'critique', 'entry-mid', 'Critique this interface: {{ui_description}}. What works, what doesn''t, and what would you change?',
  '["observes issues", "prioritizes", "ties to user goals", "practical fixes"]'::jsonb,
  '["What is highest priority?", "Any accessibility issues?", "Any risks?"]'::jsonb,
  '["critique", "ui"]'::jsonb),

-- Data Engineer
('data_engineer', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- Data Scientist  
('data_scientist', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- ML Engineer
('ml_engineer', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- Infra/Platform
('infra_platform', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- Security Engineer
('security_engineer', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- QA/Test Engineer
('qa_test_engineer', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- TPM
('technical_program_manager', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- Marketing/Growth
('marketing_growth', 'case_interview', 'entry-mid', 'Case: {{case_prompt}}. First restate the problem and your approach.',
  '["structures approach", "clarifying questions", "assumptions", "drives to recommendation"]'::jsonb,
  '["What data do you need?", "What are key drivers?", "What risks to your plan?"]'::jsonb,
  '["case", "structure"]'::jsonb),

('marketing_growth', 'metrics_case', 'entry-mid', 'Metric: {{metric}} moved by {{delta}}. How do you diagnose and respond?',
  '["defines metric", "funnels/segments", "hypotheses", "action plan"]'::jsonb,
  '["What would you check first?", "How to validate?", "What tradeoffs?"]'::jsonb,
  '["metrics", "diagnosis"]'::jsonb),

-- Sales/Account
('sales_account', 'roleplay_discovery', 'entry-mid', 'Roleplay: I''m a prospect. Start discovery for {{product_context}}.',
  '["asks questions", "listens", "maps needs", "next steps"]'::jsonb,
  '["Why is this important?", "What''s current workaround?", "Decision process?"]'::jsonb,
  '["roleplay", "discovery"]'::jsonb),

('sales_account', 'objection_roleplay', 'entry-mid', 'Roleplay: Handle this objection: ''{{objection}}''.',
  '["acknowledges", "clarifies", "responds with value", "confirms"]'::jsonb,
  '["What would you ask?", "What proof points?", "What next step?"]'::jsonb,
  '["roleplay", "objection"]'::jsonb),

('sales_account', 'account_plan_case', 'mid', 'Create a 30-60-90 day plan for {{account_type}}. Focus on adoption/value/renewal.',
  '["prioritizes", "success metrics", "stakeholders", "risk plan"]'::jsonb,
  '["How measure value?", "Where can it fail?", "Escalation path?"]'::jsonb,
  '["account_plan", "cs"]'::jsonb),

-- Customer Success
('customer_success', 'roleplay_discovery', 'entry-mid', 'Roleplay: I''m a prospect. Start discovery for {{product_context}}.',
  '["asks questions", "listens", "maps needs", "next steps"]'::jsonb,
  '["Why is this important?", "What''s current workaround?", "Decision process?"]'::jsonb,
  '["roleplay", "discovery"]'::jsonb),

('customer_success', 'objection_roleplay', 'entry-mid', 'Roleplay: Handle this objection: ''{{objection}}''.',
  '["acknowledges", "clarifies", "responds with value", "confirms"]'::jsonb,
  '["What would you ask?", "What proof points?", "What next step?"]'::jsonb,
  '["roleplay", "objection"]'::jsonb),

('customer_success', 'account_plan_case', 'mid', 'Create a 30-60-90 day plan for {{account_type}}. Focus on adoption/value/renewal.',
  '["prioritizes", "success metrics", "stakeholders", "risk plan"]'::jsonb,
  '["How measure value?", "Where can it fail?", "Escalation path?"]'::jsonb,
  '["account_plan", "cs"]'::jsonb),

-- BizOps/Strategy
('bizops_strategy', 'case_interview', 'entry-mid', 'Case: {{case_prompt}}. First restate the problem and your approach.',
  '["structures approach", "clarifying questions", "assumptions", "drives to recommendation"]'::jsonb,
  '["What data do you need?", "What are key drivers?", "What risks to your plan?"]'::jsonb,
  '["case", "structure"]'::jsonb),

('bizops_strategy', 'metrics_case', 'entry-mid', 'Metric: {{metric}} moved by {{delta}}. How do you diagnose and respond?',
  '["defines metric", "funnels/segments", "hypotheses", "action plan"]'::jsonb,
  '["What would you check first?", "How to validate?", "What tradeoffs?"]'::jsonb,
  '["metrics", "diagnosis"]'::jsonb),

('bizops_strategy', 'execution_scenario', 'entry-mid', 'Scenario: {{scenario}}. What would you do in the first 2 weeks?',
  '["prioritizes", "success metrics", "stakeholder plan", "iteration"]'::jsonb,
  '["What would you NOT do?", "How measure success?", "How handle disagreement?"]'::jsonb,
  '["execution", "stakeholders"]'::jsonb),

-- Operations
('operations_general', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- Finance & Strategy
('finance_strategy', 'behavioral_star', 'all', 'Tell me about a time you faced {{situation}}. What did you do and what happened?',
  '["clear context", "specific actions", "impact", "reflection"]'::jsonb,
  '["What was your role?", "Outcome?", "What would you do differently?"]'::jsonb,
  '["behavioral", "ownership"]'::jsonb),

-- Consulting
('consulting_general', 'case_interview', 'entry-mid', 'Case: {{case_prompt}}. First restate the problem and your approach.',
  '["structures approach", "clarifying questions", "assumptions", "drives to recommendation"]'::jsonb,
  '["What data do you need?", "What are key drivers?", "What risks to your plan?"]'::jsonb,
  '["case", "structure"]'::jsonb),

('consulting_general', 'metrics_case', 'entry-mid', 'Metric: {{metric}} moved by {{delta}}. How do you diagnose and respond?',
  '["defines metric", "funnels/segments", "hypotheses", "action plan"]'::jsonb,
  '["What would you check first?", "How to validate?", "What tradeoffs?"]'::jsonb,
  '["metrics", "diagnosis"]'::jsonb),

('consulting_general', 'execution_scenario', 'entry-mid', 'Scenario: {{scenario}}. What would you do in the first 2 weeks?',
  '["prioritizes", "success metrics", "stakeholder plan", "iteration"]'::jsonb,
  '["What would you NOT do?", "How measure success?", "How handle disagreement?"]'::jsonb,
  '["execution", "stakeholders"]'::jsonb)

ON CONFLICT (role_archetype_id, task_type, difficulty_band) DO UPDATE SET
  prompt_template = EXCLUDED.prompt_template,
  expected_signals_json = EXCLUDED.expected_signals_json,
  probe_tree_json = EXCLUDED.probe_tree_json,
  tags_json = EXCLUDED.tags_json,
  updated_at = NOW();
