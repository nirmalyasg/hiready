-- Role Interview Structure Defaults seed data (56 configs: 19 archetypes x 3 seniority levels - some combos)
-- These define phase structures and scoring weights per archetype + seniority

DELETE FROM role_interview_structure_defaults;

INSERT INTO role_interview_structure_defaults (role_archetype_id, seniority, phases_json, emphasis_weights_json)
VALUES
-- Core Software Engineer
('core_software_engineer', 'entry', 
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["coding", "debugging", "coding_only"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "coding": 0.45, "problem_solving": 0.3, "system_thinking": 0.05}'::jsonb),
('core_software_engineer', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["coding", "debugging", "design_light"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "coding": 0.45, "problem_solving": 0.3, "system_thinking": 0.2}'::jsonb),
('core_software_engineer', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["coding", "debugging", "design_light"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "coding": 0.45, "problem_solving": 0.3, "system_thinking": 0.2}'::jsonb),

-- Data Analyst
('data_analyst', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["sql", "analytics_case", "insight_storytelling"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "sql": 0.35, "analysis": 0.35, "metrics": 0.2}'::jsonb),
('data_analyst', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["sql", "analytics_case", "insight_storytelling"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "sql": 0.35, "analysis": 0.35, "metrics": 0.2}'::jsonb),
('data_analyst', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["sql", "analytics_case", "insight_storytelling"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "sql": 0.35, "analysis": 0.35, "metrics": 0.2}'::jsonb),

-- Data Engineer
('data_engineer', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["sql", "data_modeling", "pipelines_reliability"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "sql": 0.25, "data_modeling": 0.3, "reliability": 0.25, "tradeoffs": 0.2}'::jsonb),
('data_engineer', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["sql", "data_modeling", "pipelines_reliability"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "sql": 0.25, "data_modeling": 0.3, "reliability": 0.25, "tradeoffs": 0.2}'::jsonb),
('data_engineer', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["sql", "data_modeling", "pipelines_reliability"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "sql": 0.25, "data_modeling": 0.3, "reliability": 0.25, "tradeoffs": 0.2}'::jsonb),

-- Data Scientist
('data_scientist', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["stats", "experiment_design", "product_sense"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "stats": 0.25, "experiment_design": 0.3, "analysis": 0.25, "product_sense": 0.2}'::jsonb),
('data_scientist', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["stats", "experiment_design", "product_sense"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "stats": 0.25, "experiment_design": 0.3, "analysis": 0.25, "product_sense": 0.2}'::jsonb),
('data_scientist', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["stats", "experiment_design", "product_sense"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "stats": 0.25, "experiment_design": 0.3, "analysis": 0.25, "product_sense": 0.2}'::jsonb),

-- ML Engineer
('ml_engineer', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["ml_fundamentals", "ml_system_design", "evaluation_debugging"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "ml_fundamentals": 0.25, "system_thinking": 0.25, "evaluation": 0.25, "mlops": 0.25}'::jsonb),
('ml_engineer', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["ml_fundamentals", "ml_system_design", "evaluation_debugging"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "ml_fundamentals": 0.25, "system_thinking": 0.25, "evaluation": 0.25, "mlops": 0.25}'::jsonb),
('ml_engineer', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["ml_fundamentals", "ml_system_design", "evaluation_debugging"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "ml_fundamentals": 0.25, "system_thinking": 0.25, "evaluation": 0.25, "mlops": 0.25}'::jsonb),

-- Infra/Platform
('infra_platform', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),
('infra_platform', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),
('infra_platform', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),

-- Security Engineer
('security_engineer', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),
('security_engineer', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),
('security_engineer', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),

-- QA/Test Engineer
('qa_test_engineer', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),
('qa_test_engineer', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),
('qa_test_engineer', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["scenario", "debugging", "design"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "scenario_reasoning": 0.35, "debugging": 0.25, "system_thinking": 0.2}'::jsonb),

-- Product Manager
('product_manager', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('product_manager', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('product_manager', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),

-- Technical Program Manager
('technical_program_manager', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('technical_program_manager', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('technical_program_manager', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),

-- Product Designer
('product_designer', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["portfolio", "design_case", "critique"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "design_thinking": 0.45, "craft": 0.2, "collaboration": 0.2}'::jsonb),
('product_designer', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["portfolio", "design_case", "critique"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "design_thinking": 0.45, "craft": 0.2, "collaboration": 0.2}'::jsonb),
('product_designer', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["portfolio", "design_case", "critique"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "design_thinking": 0.45, "craft": 0.2, "collaboration": 0.2}'::jsonb),

-- Marketing/Growth
('marketing_growth', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('marketing_growth', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('marketing_growth', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),

-- Sales/Account
('sales_account', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["roleplay", "case", "objections"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.25, "structured_thinking": 0.2, "role_fit": 0.15, "roleplay": 0.5, "process": 0.15, "negotiation": 0.1}'::jsonb),
('sales_account', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["roleplay", "case", "objections"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.25, "structured_thinking": 0.2, "role_fit": 0.15, "roleplay": 0.5, "process": 0.15, "negotiation": 0.1}'::jsonb),
('sales_account', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["roleplay", "case", "objections"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.25, "structured_thinking": 0.2, "role_fit": 0.15, "roleplay": 0.5, "process": 0.15, "negotiation": 0.1}'::jsonb),

-- Customer Success
('customer_success', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["roleplay", "case", "objections"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.25, "structured_thinking": 0.2, "role_fit": 0.15, "roleplay": 0.5, "process": 0.15, "negotiation": 0.1}'::jsonb),
('customer_success', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["roleplay", "case", "objections"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.25, "structured_thinking": 0.2, "role_fit": 0.15, "roleplay": 0.5, "process": 0.15, "negotiation": 0.1}'::jsonb),
('customer_success', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["roleplay", "case", "objections"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.25, "structured_thinking": 0.2, "role_fit": 0.15, "roleplay": 0.5, "process": 0.15, "negotiation": 0.1}'::jsonb),

-- BizOps/Strategy
('bizops_strategy', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('bizops_strategy', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('bizops_strategy', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),

-- Operations General
('operations_general', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["case", "analysis", "execution"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.2, "structured_thinking": 0.2, "role_fit": 0.15, "analysis": 0.4, "execution": 0.25, "risk": 0.15}'::jsonb),
('operations_general', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["case", "analysis", "execution"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.2, "structured_thinking": 0.2, "role_fit": 0.15, "analysis": 0.4, "execution": 0.25, "risk": 0.15}'::jsonb),
('operations_general', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["case", "analysis", "execution"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.2, "structured_thinking": 0.2, "role_fit": 0.15, "analysis": 0.4, "execution": 0.25, "risk": 0.15}'::jsonb),

-- Finance & Strategy
('finance_strategy', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["case", "analysis", "execution"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.2, "structured_thinking": 0.2, "role_fit": 0.15, "analysis": 0.4, "execution": 0.25, "risk": 0.15}'::jsonb),
('finance_strategy', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["case", "analysis", "execution"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.2, "structured_thinking": 0.2, "role_fit": 0.15, "analysis": 0.4, "execution": 0.25, "risk": 0.15}'::jsonb),
('finance_strategy', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["case", "analysis", "execution"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.2, "structured_thinking": 0.2, "role_fit": 0.15, "analysis": 0.4, "execution": 0.25, "risk": 0.15}'::jsonb),

-- Consulting General
('consulting_general', 'entry',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 7}, {"name": "Core Assessment", "mins": 30, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 10}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('consulting_general', 'mid',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 10}, {"name": "Core Assessment", "mins": 35, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 12}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb),
('consulting_general', 'senior',
  '[{"name": "Intro", "mins": 3}, {"name": "Resume Deep Dive", "mins": 12}, {"name": "Core Assessment", "mins": 40, "subphases": ["case", "metrics", "execution"]}, {"name": "Behavioral", "mins": 15}, {"name": "Wrap-up", "mins": 3}]'::jsonb,
  '{"communication": 0.15, "structured_thinking": 0.2, "role_fit": 0.15, "case": 0.45, "metrics": 0.25, "execution": 0.2, "prioritization": 0.1}'::jsonb);
