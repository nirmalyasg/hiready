-- Initial seed data for Avatar Practice Lab

-- Insert default user for testing
INSERT INTO users (id, username, password, email, display_name) 
VALUES (1, 'demo', 'demo123', 'demo@example.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- Insert skills
INSERT INTO skills (id, name, description, definition, level, category) VALUES
(70, 'Performance Feedback', 'Having difficult performance conversations', 'The ability to give clear, constructive feedback while maintaining trust', 1, 'Leadership'),
(71, 'Crisis Management', 'Handling urgent situations under pressure', 'Managing high-pressure situations while maintaining clarity and calm', 2, 'Leadership'),
(72, 'Project Clarity', 'Clarifying vague requirements', 'Ability to navigate ambiguity and establish clear expectations', 2, 'Communication'),
(73, 'Executive Communication', 'Presenting to senior leadership', 'Communicating complex information clearly to executives', 3, 'Communication'),
(74, 'Conflict Resolution', 'Navigating cross-team disagreements', 'Resolving conflicts while preserving relationships', 2, 'Collaboration'),
(75, 'Stakeholder Management', 'Handling customer escalations', 'Managing external relationships during difficult situations', 2, 'Communication'),
(76, 'Coordination', 'Multi-stakeholder project coordination', 'Aligning multiple teams toward shared goals', 3, 'Collaboration'),
(77, 'Resilience', 'Recovering from setbacks', 'Maintaining composure and forward momentum after failures', 2, 'Personal Growth')
ON CONFLICT (id) DO NOTHING;

-- Insert Impromptu Communication skill with framework mappings
INSERT INTO skills (id, name, description, definition, level, category, is_active, framework_mapping, reference_source, assessment_dimensions, scoring_model_logic) VALUES
(105, 'Impromptu Communication & Thinking on Your Feet', 
 'The ability to organize thoughts quickly and communicate them clearly in unprepared situations while demonstrating sound reasoning and audience awareness.',
 'The ability to organize thoughts quickly and communicate them clearly, logically, and confidently in unprepared situations—while demonstrating sound reasoning, situational awareness, and audience relevance. This skill reflects how effectively an individual thinks, structures, and expresses ideas in real time under time and cognitive pressure.',
 2, 'Communication', true,
 'Pyramid Principle (Minto) for structure, Recognition-Primed Decision Model (Klein) for thinking under pressure, Critical Thinking Models (Paul & Elder) for reasoning, Executive Presence (Hewlett) for delivery',
 'Pyramid Principle, Recognition-Primed Decision Making, Critical Thinking Models, Executive Presence Framework',
 'Articulation & Clarity; Structured Thinking; Critical Thinking & Reasoning; Content Depth & Knowledge Access; Composure & Presence Under Pressure; Audience Awareness',
 'Score each dimension 1-100 based on behavioral evidence. Articulation & Clarity: clear expression, simple language, minimal fillers. Structured Thinking: organized flow, mental frameworks. Critical Thinking: logical responses, supported viewpoints. Content Depth: relevant experience, informed perspective. Composure: calm tone, smooth recovery from pauses. Audience Awareness: adapted responses, appropriate tone.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  definition = EXCLUDED.definition,
  framework_mapping = EXCLUDED.framework_mapping,
  reference_source = EXCLUDED.reference_source,
  assessment_dimensions = EXCLUDED.assessment_dimensions,
  scoring_model_logic = EXCLUDED.scoring_model_logic;

-- Reset skills sequence
SELECT setval('skills_id_seq', GREATEST((SELECT MAX(id) FROM skills), 105));

-- Insert scenarios
INSERT INTO scenarios (id, skill_id, name, description, context, instructions, avatar_name, avatar_role, difficulty, duration) VALUES
(28, 70, 'Missed Deadline Review', 'A critical deliverable was missed without escalation, causing delays and raising concerns about reliability.', 'Arjun enters anxious, embarrassed, mildly defensive. He initially offers surface-level reasons and reveals deeper issues only when the manager shows empathy.', 'Opening: Begin slightly defensive; offer surface-level explanations. Mid: Reveal deeper blockers only if manager is empathetic. Late: Shift to honest reflection; collaborate on solutions. End: Summarize commitments; express willingness to improve.', 'Arjun Mehta', 'Team Member', 'Medium', 5),
(29, 71, 'Emergency Product Fix', 'A severe production bug is impacting users, causing escalations and leadership pressure.', 'Ravi enters overwhelmed and frustrated. He starts blunt and reactive but softens with structured calmness.', 'Opening: Show urgency & frustration; push back on unrealistic expectations. Mid: Reveal technical constraints. Late: Move toward partnership when manager provides structure. End: Align on next steps and communication plan.', 'Ravi Shankar', 'Engineering Lead', 'Hard', 8),
(30, 72, 'Unclear Project Scope', 'Requirements are vague, expectations shift, and the team member feels hesitant and insecure.', 'Meera feels unsure, anxious, and fearful of making mistakes. She reveals deeper blockers only when the manager uses patience and structure.', 'Opening: Offer hesitant responses, express confusion. Mid: Reveal contradictions in stakeholder inputs. Late: Become more confident as manager provides clarity. End: Align on deliverables and expectations.', 'Meera Kapoor', 'Team Member', 'Hard', 6),
(31, 73, 'Revenue Decline Analysis', 'The company has experienced a sudden 15% drop in revenue. Senior leadership expects immediate clarity on root causes.', 'The CEO, Dev, is impatient and results-driven. He interrupts quickly, pushes for depth, and softens only when he senses competence.', 'Opening: Ask directly for the reason behind the decline; interrupt vague explanations. Mid: Challenge assumptions, push for data. Late: Shift toward discussing solutions. End: Request a clear, time-bound recovery plan.', 'Dev Prakash', 'CEO', 'Hard', 10),
(32, 74, 'Cross-Functional Conflict', 'The marketing and product teams disagree on release timing and feature scope. Tension is rising.', 'Maya from Marketing enters feeling frustrated and under pressure. She begins assertive and emotional, but softens when heard.', 'Opening: Start assertive; express frustration about delays. Mid: Share detailed concerns; challenge prioritization. Late: Become balanced and explore compromise. End: Agree on aligned next steps.', 'Maya Singh', 'Senior Marketing Lead', 'Medium', 7),
(33, 75, 'Crisis Communication', 'A major system outage has impacted customers. They are frustrated and demanding immediate answers.', 'The client, Daniel, is upset and anxious. He begins tense and suspicious, softening only when the manager is transparent.', 'Opening: Express frustration; demand clarity. Mid: Question reliability, express impact. Late: Begin to soften and collaborate. End: Confirm expectations for follow-up.', 'Daniel Roberts', 'Client', 'Medium', 6),
(34, 76, 'Multi-Stakeholder Rollout', 'You are coordinating a feature rollout involving development, QA, sales, and support.', 'Sanjay enters stressed by shifting priorities. He starts defensive but becomes cooperative with structured dialogue.', 'Opening: Highlight conflicts in dependencies. Mid: Share details about bottlenecks. Late: Become collaborative; propose sequencing options. End: Agree on rollout steps.', 'Sanjay Rao', 'Development Team Member', 'Hard', 8),
(35, 77, 'Handling Project Setbacks', 'A major project has been delayed by 3 weeks due to technical issues. The client is unhappy.', 'Priyanka enters frustrated and disappointed. She begins firm but becomes constructive if the manager is calm and proactive.', 'Opening: Start firm and frustrated. Mid: Challenge reasoning; probe for root causes. Late: Shift to collaborative problem-solving. End: Align on next steps and communication strategy.', 'Priyanka Sen', 'Senior Manager', 'Medium', 7)
ON CONFLICT (id) DO NOTHING;

-- Reset scenarios sequence
SELECT setval('scenarios_id_seq', GREATEST((SELECT MAX(id) FROM scenarios), 35));

-- Insert personas
INSERT INTO personas (id, persona, description) VALUES
(1, 'Skeptical', 'Questions everything, needs evidence'),
(2, 'Supportive', 'Encouraging, open to ideas'),
(3, 'Impatient', 'Time-conscious, wants quick answers'),
(4, 'Analytical', 'Data-driven, detail-oriented'),
(5, 'Emotional', 'Responds to feelings, empathetic'),
(6, 'Defensive', 'Protective, guarded')
ON CONFLICT (id) DO NOTHING;

-- Reset personas sequence
SELECT setval('personas_id_seq', GREATEST((SELECT MAX(id) FROM personas), 6));

-- Insert tones
INSERT INTO tones (id, tone, description) VALUES
(1, 'Professional', 'Formal, business-appropriate'),
(2, 'Casual', 'Relaxed, friendly'),
(3, 'Assertive', 'Direct, confident'),
(4, 'Empathetic', 'Understanding, compassionate'),
(5, 'Urgent', 'Pressing, time-sensitive')
ON CONFLICT (id) DO NOTHING;

-- Reset tones sequence
SELECT setval('tones_id_seq', GREATEST((SELECT MAX(id) FROM tones), 5));

-- Insert avatars
INSERT INTO avatars (id, name, ethnicity, gender, role, image_url) VALUES
('Dexter_Lawyer_Sitting_public', 'Dexter', 'American', 'Male', 'Manager', 'https://files2.heygen.ai/avatar/v3/e20ac0c902184ff793e75ae4e139b7dc_45600/preview_target.webp'),
('Elenora_IT_Sitting_public', 'Elenora', 'German', 'Female', 'Manager', 'https://files2.heygen.ai/avatar/v3/cbd4a69890a040e6a0d54088e606a559_45610/preview_talk_3.webp'),
('June_HR_public', 'June', 'Asian', 'Female', 'Manager', 'https://files2.heygen.ai/avatar/v3/74447a27859a456c955e01f21ef18216_45620/preview_talk_1.webp'),
('Silas_CustomerSupport_public', 'Silas', 'British', 'Male', 'Customer', 'https://files2.heygen.ai/avatar/v3/a1ed8c71e4bf4e6cb9071d2b7cd71e4e_45660/preview_talk_1.webp'),
('Wayne_20240711', 'Wayne', 'Asian', 'Male', 'Customer', 'https://files2.heygen.ai/avatar/v3/a3fdb0c652024f79984aaec11ebf2694_34350/preview_target.webp'),
('37f4d912aa564663a1cf8d63acd0e1ab', 'Katrina', 'French', 'Female', 'Manager', 'https://files2.heygen.ai/avatar/v3/37f4d912aa564663a1cf8d63acd0e1ab/full/2.2/preview_target.webp')
ON CONFLICT (id) DO NOTHING;

-- =====================
-- Admin Users and Roles
-- =====================

-- Insert admin user (password is bcrypt hash of 'admin123')
INSERT INTO auth_users (id, username, email, password_hash, first_name, last_name)
VALUES ('admin-user-001', 'admin', 'admin@avatarpracticelab.com', '$2b$10$rOzJqQZQZYZQ6Y7vCvXxM.YG0AvF7oJXzGnr7vQrGQZYZQ6Y7vCv', 'System', 'Admin')
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Assign admin role to admin user (find by username)
INSERT INTO user_roles (auth_user_id, role, assigned_at)
SELECT id, 'admin', NOW() FROM auth_users WHERE username = 'admin'
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'admin';

-- =====================
-- Budget Guards (Default Limits)
-- =====================

INSERT INTO budget_guards (guard_type, limit_value, currency, is_active, fallback_action, description) VALUES
('max_cost_per_session', 2.00, 'USD', true, 'warn', 'Maximum cost allowed per individual session'),
('max_daily_cost', 100.00, 'USD', true, 'warn', 'Maximum total cost per day across all users'),
('max_daily_cost_per_org', 50.00, 'USD', true, 'warn', 'Maximum daily cost per organization'),
('max_tavily_per_user_day', 20, 'USD', true, 'disable_feature', 'Maximum Tavily API calls per user per day'),
('max_heygen_minutes_per_user_day', 30, 'USD', true, 'warn', 'Maximum HeyGen streaming minutes per user per day')
ON CONFLICT (guard_type) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  description = EXCLUDED.description;

-- =====================
-- Admin Settings (Defaults)
-- =====================

INSERT INTO admin_settings (key, value, category, description) VALUES
('default_media_mode', '"both"'::jsonb, 'media', 'Default media mode for new users (voice, video, or both)'),
('heygen_warmup_enabled', 'true'::jsonb, 'features', 'Whether to pre-warm HeyGen sessions for faster startup'),
('max_session_duration_minutes', '30'::jsonb, 'features', 'Maximum allowed session duration in minutes'),
('skill_assessment_enabled', 'true'::jsonb, 'features', 'Whether to run skill assessments after sessions'),
('openai_model_chat', '"gpt-4o"'::jsonb, 'api', 'OpenAI model for chat completions'),
('openai_model_analysis', '"gpt-4o"'::jsonb, 'api', 'OpenAI model for session analysis'),
('tavily_search_depth', '"advanced"'::jsonb, 'api', 'Tavily search depth (basic or advanced)')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- =====================
-- Presentation Skill (ID 104)
-- =====================

INSERT INTO skills (id, name, description, definition, level, category, is_active, framework_mapping, reference_source, assessment_dimensions, scoring_model_logic) VALUES
(104, 'Effective Presentation & Communication in Groups', 
 'The ability to present ideas clearly and engagingly to groups, maintaining audience attention and adapting delivery based on feedback.',
 'The skill of structuring and delivering presentations that effectively communicate key messages, engage audiences, and achieve presentation objectives through clear articulation, visual integration, and responsive delivery.',
 2, 'Communication', true,
 'Presentation Zen (Reynolds), Slide:ology (Duarte), Talk Like TED (Gallo), Executive Presence (Hewlett)',
 'Presentation Zen, Slide:ology, Talk Like TED, Executive Presence Framework',
 'Content Structure & Organization; Delivery & Speaking Skills; Audience Engagement; Visual Integration; Response to Questions',
 'Score each dimension 1-100 based on behavioral evidence. Content Structure: logical flow, clear opening/closing, key message clarity. Delivery: pace, volume, eye contact, body language. Audience Engagement: interaction, energy, reading the room. Visual Integration: slide design, visual aids usage. Response Quality: handling questions, adaptability.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  definition = EXCLUDED.definition,
  framework_mapping = EXCLUDED.framework_mapping,
  reference_source = EXCLUDED.reference_source,
  assessment_dimensions = EXCLUDED.assessment_dimensions,
  scoring_model_logic = EXCLUDED.scoring_model_logic;

-- Reset skills sequence to max
SELECT setval('skills_id_seq', GREATEST((SELECT MAX(id) FROM skills), 105));
