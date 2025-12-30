-- Migration Script: Development to Production Database
-- Run these statements in your Production Database SQL editor
-- Go to Database pane > Production Database > My data > Edit mode

-- =============================================
-- 1. TONES
-- =============================================
INSERT INTO tones (id, tone, description) VALUES
(1, 'Professional', 'Formal, business-appropriate'),
(2, 'Casual', 'Relaxed, friendly'),
(3, 'Assertive', 'Direct, confident'),
(4, 'Empathetic', 'Understanding, compassionate'),
(5, 'Urgent', 'Pressing, time-sensitive')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. PERSONAS
-- =============================================
INSERT INTO personas (id, persona, description) VALUES
(1, 'Skeptical', 'Questions everything, needs evidence'),
(2, 'Supportive', 'Encouraging, open to ideas'),
(3, 'Impatient', 'Time-conscious, wants quick answers'),
(4, 'Analytical', 'Data-driven, detail-oriented'),
(5, 'Emotional', 'Responds to feelings, empathetic'),
(6, 'Defensive', 'Protective, guarded')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. AVATARS
-- =============================================
INSERT INTO avatars (id, name, look, ethnicity, gender, role, image_url) VALUES
('Dexter_Lawyer_Sitting_public', 'Dexter', '', 'American', 'Male', 'Manager', 'https://files2.heygen.ai/avatar/v3/e20ac0c902184ff793e75ae4e139b7dc_45600/preview_target.webp'),
('Elenora_IT_Sitting_public', 'Elenora', '', 'German', 'Female', 'Manager', 'https://files2.heygen.ai/avatar/v3/cbd4a69890a040e6a0d54088e606a559_45610/preview_talk_3.webp'),
('June_HR_public', 'June', '', 'Asian', 'Female', 'Manager', 'https://files2.heygen.ai/avatar/v3/74447a27859a456c955e01f21ef18216_45620/preview_talk_1.webp'),
('Silas_CustomerSupport_public', 'Silas', '', 'British', 'Male', 'Customer', 'https://files2.heygen.ai/avatar/v3/a1ed8c71e4bf4e6cb9071d2b7cd71e4e_45660/preview_talk_1.webp'),
('37f4d912aa564663a1cf8d63acd0e1ab', 'Katrina', '', 'French', 'Female', 'Manager', 'https://files2.heygen.ai/avatar/v3/37f4d912aa564663a1cf8d63acd0e1ab/full/2.2/preview_target.webp'),
('Alessandra_Black_Suit_public', 'Aisha', 'in Black Suit', 'Indian', 'female', '', 'https://files2.heygen.ai/avatar/v3/ef3893cf0bf84411851d1f360a36462e_55310/preview_target.webp'),
('Amina_Black_Suit_public', 'Nadia', 'in Black Suit', 'Southeast Asian', 'female', '', 'https://files2.heygen.ai/avatar/v3/d457fb0050a046a683058666fa3b2252_55270/preview_talk_1.webp'),
('Anastasia_Black_Suit_public', 'Maya', 'in Black Suit', 'Middle Eastern', 'female', '', 'https://files2.heygen.ai/avatar/v3/c0fb0437a2b64fc991e68923af50e172_55290/preview_talk_1.webp'),
('Anthony_Black_Suit_public', 'Arjun', 'in Black Suit', 'Latinx', 'male', '', 'https://files2.heygen.ai/avatar/v3/c08ed6510bce4d45ada3ef491d6a08c1_55330/preview_talk_1.webp'),
('Bryan_FitnessCoach_public_', 'Kabir', 'Fitness Coach', 'East Asian', 'male', '', 'https://files2.heygen.ai/avatar/v3/7fbef4dd1d6641bc8777b26a6aaac85e_45580/preview_talk_1.webp'),
('Graham_Black_Shirt_public', 'Daniel', 'in Black Shirt', 'East Asian', 'male', '', 'https://files2.heygen.ai/avatar/v3/1bd0162ce985415092ed1f003aa90646_55350/preview_target.webp'),
('Katya_Black_Suit_public', 'Elena', 'in Black Suit', 'Indian', 'female', '', 'https://files2.heygen.ai/avatar/v3/da5cba6bc7b34c5ea139f77da98fdc04_55370/preview_talk_1.webp'),
('Marianne_Black_Suit_public', 'Ella', 'in Black Suit', 'Southeast Asian', 'female', '', 'https://files2.heygen.ai/avatar/v3/d5fc5662d26f49cf919979dc3acc2a72_55390/preview_talk_1.webp'),
('Pedro_Black_Suit_public', 'Yusuf', 'in Black Suit', 'Middle Eastern', 'male', '', 'https://files2.heygen.ai/avatar/v3/1273ddd881eb4114a792e56c8ebe8998_55410/preview_talk_1.webp'),
('Rika_Black_Suit_public', 'Rhea', 'in Black Suit', 'African-American', 'female', '', 'https://files2.heygen.ai/avatar/v3/6170f31327e2465095f0121c65a7cb1b_55430/preview_target.webp'),
('Shawn_Therapist_public_', 'Vikram', 'Therapist', 'Caucasian', 'male', '', 'https://files2.heygen.ai/avatar/v3/db2fb7fd0d044b908395a011166ab22d_45680/preview_target.webp'),
('Wayne_20240711', 'Wayne', '', '', 'male', '', 'https://files2.heygen.ai/avatar/v3/a3fdb0c652024f79984aaec11ebf2694_34350/preview_target.webp')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. AUTH USERS (password: user123)
-- =============================================
INSERT INTO auth_users (id, username, password_hash, email, first_name, last_name, created_at, updated_at) VALUES
('dbb8b873-631b-49d7-8e34-0c6987c6d889', 'agarcia', '$2b$10$.VSgpQkEiI5fUmA69OAY1usmbedhAuxsnqx5Owr0V/tCOxqMf.v2W', '', '', '', NOW(), NOW()),
('a6e8738c-e1fd-4f99-b8d2-2a9cffcce1cc', 'nirmalya', '$2b$10$.VSgpQkEiI5fUmA69OAY1usmbedhAuxsnqx5Owr0V/tCOxqMf.v2W', '', '', '', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. SKILLS (run these one by one if needed)
-- =============================================
INSERT INTO skills (id, name, description, category, is_active) VALUES
(70, 'Coaching for Performance', 'Driving accountability and improvement through structured conversations.', 'General', true),
(71, 'Crisis Communication & Decision Leadership', 'Communicating clearly and deciding confidently under pressure.', 'General', true),
(72, 'Clarity & Context Setting', 'Translates ambiguous expectations into clear goals, roles, and next steps.', 'General', true),
(73, 'Strategic Thinking & Insight', 'Identifying patterns, risks, and opportunities to guide decisions.', 'General', true),
(74, 'Cross-Functional Collaboration', 'Working effectively across teams, functions, and priorities.', 'General', true),
(75, 'Customer Communication Under Pressure', 'Maintaining trust with customers during escalations or crises.', 'General', true),
(76, 'Stakeholder Alignment & Orchestration', 'Coordinating diverse groups toward a unified plan.', 'General', true),
(77, 'Managing Setbacks & Recovery', 'Bouncing back and learning productively from failures.', 'General', true),
(78, 'Growth Mindset & Feedback Openness', 'Welcoming and applying feedback for continuous improvement.', 'General', true),
(79, 'Team Building & Collaboration', 'Building cohesive, high-trust teams that work well together.', 'General', true),
(80, 'Handling Difficult Customers', 'Resolving complaints while preserving relationships.', 'General', true),
(81, 'Decision Making Under Pressure', 'Choosing wisely when stakes are high and information is incomplete.', 'General', true),
(82, 'Conflict Navigation & Mediation', 'Helping individuals or teams resolve disagreements constructively.', 'General', true),
(83, 'Negotiation & Influence', 'Reaching agreements that create mutual value.', 'General', true),
(84, 'Giving Constructive Feedback', 'Delivering insights that inspire growth without causing defensiveness.', 'General', true),
(85, 'Coaching for Growth', 'Developing others through questioning, reflection, and empowerment.', 'General', true),
(86, 'Difficult Conversations', 'Handling sensitive topics with clarity and care.', 'General', true),
(87, 'Executive Presence & Gravitas', 'Commanding attention and credibility in high-stakes settings.', 'General', true),
(88, 'Vision Communication & Change Influence', 'Articulating ideas and inspiring others toward future possibilities.', 'General', true),
(89, 'Assertive Communication & Boundary Negotiation', 'Communicating needs clearly while maintaining relationships.', 'General', true),
(90, 'Stakeholder Communication', 'Tailoring messages across audiences to align and inform.', 'General', true),
(91, 'Delivering Bad News', 'Sharing unwelcome information with honesty and care.', 'General', true),
(92, 'Providing Constructive Criticism', 'Offering balanced feedback that drives positive change.', 'General', true),
(93, 'Delegation & Empowerment', 'Assigning work effectively while building ownership.', 'General', true),
(94, 'Managing Up', 'Communicating effectively with supervisors to drive alignment.', 'General', true),
(95, 'Building Relationships & Trust', 'Developing authentic connections that enable collaboration.', 'General', true),
(96, 'Relationship Repair & Trust Rebuilding', 'Restoring confidence after a breakdown or conflict.', 'General', true),
(97, 'Emotional Intelligence & Self-Regulation', 'Recognizing and managing emotions to navigate situations wisely.', 'General', true),
(98, 'Active Listening & Inquiry', 'Understanding deeply before responding or advising.', 'General', true),
(99, 'Boundary Setting & Role Clarity', 'Defining ownership, responsibilities, and limits clearly.', 'General', true),
(100, 'Managing Resistance to Change', 'Guiding others through transitions despite reluctance.', 'General', true),
(101, 'Account Management & Retention', 'Maintaining and growing customer relationships over time.', 'General', true),
(102, 'Motivation & Morale Building', 'Energizing teams during challenging times.', 'General', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. SCENARIOS (main ones)
-- =============================================
INSERT INTO scenarios (id, skill_id, name, description, context, instructions, avatar_name, avatar_role, difficulty, duration) VALUES
(28, 70, 'Missed Deadline Review', 'A critical deliverable was missed without escalation, causing delays and raising concerns about reliability.', 'Arjun enters anxious, embarrassed, mildly defensive.', 'Opening: Begin slightly defensive; offer surface-level explanations.', 'Arjun Mehta', 'Team Member', 'Medium', NULL),
(29, 71, 'Emergency Product Fix', 'A severe production bug is impacting users, causing escalations and leadership pressure.', 'Ravi enters overwhelmed and frustrated.', 'Opening: Show urgency & frustration; push back on unrealistic expectations.', 'Ravi Shankar', 'Engineering Lead', 'Hard', NULL),
(30, 72, 'Unclear Project Scope', 'Requirements are vague, expectations shift, and the team member feels hesitant and insecure.', 'Meera feels unsure, anxious, and fearful of making mistakes.', 'Opening: Offer hesitant responses, express confusion.', 'Meera Kapoor', 'Team Member', 'Hard', NULL),
(31, 73, 'Revenue Decline Analysis', 'The company has experienced a sudden 15% drop in revenue.', 'The CEO, Dev, is impatient and results-driven.', 'Opening: Ask directly for the reason behind the decline.', 'Dev Prakash', 'CEO', 'Hard', NULL),
(32, 74, 'Cross-Functional Conflict', 'The marketing and product teams disagree on release timing and feature scope.', 'Maya from Marketing enters feeling frustrated and under pressure.', 'Opening: Start assertive; express frustration about delays.', 'Maya Singh', 'Senior Marketing Lead', 'Medium', NULL),
(33, 75, 'Crisis Communication', 'A major system outage has impacted customers.', 'The client, Daniel, is upset and anxious.', 'Opening: Express frustration; demand clarity.', 'Daniel Roberts', 'Client', 'Medium', NULL),
(34, 76, 'Multi-Stakeholder Rollout', 'You are coordinating a feature rollout involving development, QA, sales, and support.', 'The development team member, Sanjay, enters stressed by shifting priorities.', 'Opening: Highlight conflicts in dependencies and current workload.', 'Sanjay Rao', 'Development Team Member', 'Hard', NULL),
(35, 77, 'Handling Project Setbacks', 'A major project has been delayed by 3 weeks due to technical issues.', 'The senior manager, Priyanka, enters frustrated and disappointed.', 'Opening: Start firm and frustrated; question why the delay occurred.', 'Priyanka Sen', 'Senior Manager', 'Intermediate', NULL),
(36, 78, 'Dealing with Critical Feedback', 'The manager has received harsh, public criticism from senior leadership.', 'The senior leader, Arvind, enters firm, direct, and unsatisfied.', 'Opening: Deliver direct, blunt feedback; question decisions.', 'Arvind Mehra', 'Senior Leader', 'Advanced', NULL),
(37, 79, 'Building Team Collaboration', 'You are leading a new cross-functional team with tension between marketing and engineering.', 'The marketing team member, Shalini, feels undermined by engineering.', 'Opening: Express tension with engineering; highlight misalignment.', 'Shalini Roy', 'Marketing Team Member', 'Intermediate', NULL),
(38, 80, 'Handling Upset Customer', 'A long-term customer is extremely frustrated due to repeated delays.', 'The angry customer, Mr. Kapoor, enters emotionally charged.', 'Opening: Speak with frustration; express disappointment.', 'Rajiv Kapoor', 'Angry Customer', 'Advanced', NULL),
(39, 81, 'Making Decisions Under Pressure', 'A high-value client request promises revenue but requires resources from an already overextended team.', 'The team lead, Nikhil, is torn between capturing revenue and protecting his team.', 'Opening: Present dilemma clearly; express both excitement and concern.', 'Nikhil Kumar', 'Team Lead', 'Advanced', NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 7. SCENARIO_SKILLS
-- =============================================
INSERT INTO scenario_skills (scenario_id, skill_id) VALUES
(28, 70), (29, 71), (30, 72), (31, 73), (32, 74), (33, 75),
(34, 76), (35, 77), (36, 78), (37, 79), (38, 80), (39, 81),
(40, 82), (41, 83), (42, 84), (43, 85), (44, 86), (45, 87),
(46, 88), (47, 89), (48, 90), (49, 91), (50, 92), (51, 93),
(52, 94), (53, 95), (54, 96), (55, 97), (56, 98), (57, 99),
(58, 100), (59, 101), (60, 102)
ON CONFLICT DO NOTHING;

-- =============================================
-- DONE! Your production database now has the core data.
-- =============================================
