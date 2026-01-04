-- Interview Intelligence Seed Data
-- Companies (50 total: 25 India + 25 Global)
-- Question Patterns (~120 patterns)

-- =====================
-- COMPANIES - India (25)
-- =====================
INSERT INTO companies (name, country, tier, archetype, tags) VALUES
('Tata Consultancy Services', 'India', 'top50', 'services', '["it-services", "consulting", "enterprise"]'),
('Infosys', 'India', 'top50', 'services', '["it-services", "consulting", "digital"]'),
('Wipro', 'India', 'top50', 'services', '["it-services", "consulting"]'),
('HCL Technologies', 'India', 'top50', 'services', '["it-services", "enterprise"]'),
('Tech Mahindra', 'India', 'top50', 'services', '["it-services", "telecom"]'),
('Flipkart', 'India', 'top50', 'consumer', '["ecommerce", "tech", "startup-grown"]'),
('Zomato', 'India', 'top50', 'consumer', '["food-tech", "delivery", "marketplace"]'),
('Paytm', 'India', 'top50', 'fintech', '["payments", "financial-services"]'),
('Razorpay', 'India', 'top50', 'fintech', '["payments", "b2b", "startup"]'),
('Swiggy', 'India', 'top50', 'consumer', '["food-tech", "delivery", "hyperlocal"]'),
('Ola', 'India', 'top50', 'consumer', '["mobility", "ride-sharing"]'),
('BYJU''S', 'India', 'top200', 'edtech', '["education", "learning"]'),
('PhonePe', 'India', 'top50', 'fintech', '["payments", "upi"]'),
('Freshworks', 'India', 'top50', 'saas', '["crm", "customer-service", "b2b"]'),
('MakeMyTrip', 'India', 'top200', 'consumer', '["travel", "ota"]'),
('ICICI Bank', 'India', 'top50', 'regulated', '["banking", "financial-services"]'),
('HDFC Bank', 'India', 'top50', 'regulated', '["banking", "financial-services"]'),
('Reliance Jio', 'India', 'top50', 'enterprise', '["telecom", "digital", "conglomerate"]'),
('Larsen & Toubro', 'India', 'top50', 'industrial', '["engineering", "construction", "manufacturing"]'),
('Tata Steel', 'India', 'top50', 'industrial', '["steel", "manufacturing"]'),
('Zerodha', 'India', 'top200', 'fintech', '["broking", "trading", "investment"]'),
('Meesho', 'India', 'top200', 'consumer', '["social-commerce", "reseller"]'),
('CRED', 'India', 'top200', 'fintech', '["credit", "rewards", "payments"]'),
('Groww', 'India', 'top200', 'fintech', '["investment", "mutual-funds", "trading"]'),
('Nykaa', 'India', 'top200', 'consumer', '["beauty", "ecommerce", "d2c"]')
ON CONFLICT (name) DO NOTHING;

-- =====================
-- COMPANIES - Global (25)
-- =====================
INSERT INTO companies (name, country, tier, archetype, tags) VALUES
('Google', 'USA', 'top50', 'enterprise', '["big-tech", "search", "cloud", "ai"]'),
('Amazon', 'USA', 'top50', 'enterprise', '["big-tech", "ecommerce", "cloud", "aws"]'),
('Microsoft', 'USA', 'top50', 'enterprise', '["big-tech", "cloud", "software", "azure"]'),
('Meta', 'USA', 'top50', 'consumer', '["big-tech", "social", "ads", "vr"]'),
('Apple', 'USA', 'top50', 'consumer', '["big-tech", "hardware", "software", "services"]'),
('Netflix', 'USA', 'top50', 'consumer', '["streaming", "entertainment", "content"]'),
('Uber', 'USA', 'top50', 'consumer', '["mobility", "ride-sharing", "delivery"]'),
('Airbnb', 'USA', 'top50', 'consumer', '["travel", "hospitality", "marketplace"]'),
('Stripe', 'USA', 'top50', 'fintech', '["payments", "developer-tools", "b2b"]'),
('LinkedIn', 'USA', 'top50', 'enterprise', '["professional-network", "hr-tech", "microsoft"]'),
('Salesforce', 'USA', 'top50', 'saas', '["crm", "enterprise", "cloud"]'),
('Adobe', 'USA', 'top50', 'saas', '["creative", "marketing", "enterprise"]'),
('IBM', 'USA', 'top50', 'enterprise', '["consulting", "cloud", "ai"]'),
('Oracle', 'USA', 'top50', 'enterprise', '["database", "cloud", "enterprise"]'),
('JPMorgan Chase', 'USA', 'top50', 'regulated', '["banking", "investment", "financial-services"]'),
('Goldman Sachs', 'USA', 'top50', 'regulated', '["investment-banking", "trading", "asset-management"]'),
('Walmart', 'USA', 'top50', 'consumer', '["retail", "ecommerce", "supply-chain"]'),
('Shopify', 'Canada', 'top50', 'saas', '["ecommerce", "platform", "merchant"]'),
('Atlassian', 'Australia', 'top50', 'saas', '["developer-tools", "collaboration", "b2b"]'),
('Bloomberg', 'USA', 'top50', 'enterprise', '["financial-data", "media", "terminal"]'),
('Nvidia', 'USA', 'top50', 'enterprise', '["semiconductors", "ai", "gpu"]'),
('Tesla', 'USA', 'top50', 'consumer', '["automotive", "ev", "energy"]'),
('Spotify', 'Sweden', 'top50', 'consumer', '["streaming", "music", "audio"]'),
('Twitter/X', 'USA', 'top50', 'consumer', '["social", "media", "real-time"]'),
('Coinbase', 'USA', 'top200', 'fintech', '["crypto", "exchange", "blockchain"]')
ON CONFLICT (name) DO NOTHING;

-- =====================
-- QUESTION PATTERNS - Resume Claim Patterns (20)
-- =====================
INSERT INTO question_patterns (pattern_type, role_category, interview_type, template, probe_tree, tags, source_type) VALUES
('resume_claim', 'general', 'hiring_manager', 'You mentioned {{project_name}} on your resume. Walk me through the context and your specific role.', '{"ifVague": ["What was the exact scope of your involvement?", "Can you be more specific about what YOU did vs the team?", "How many people were on the team and what was your role?"], "always": ["What was the hardest challenge you faced?", "What would you do differently if you could redo it?"]}', '["ownership", "depth", "leadership"]', 'curated'),
('resume_claim', 'swe', 'technical', 'You mentioned {{project_name}}. What was the hardest bug or failure you hit, and how did you debug it?', '{"ifVague": ["What was the exact symptom?", "What hypotheses did you form first?", "What did you try that failed?"], "always": ["How did you verify the fix?", "How did you prevent regression?"]}', '["debugging", "ownership", "verification"]', 'curated'),
('resume_claim', 'swe', 'technical', 'I see you worked with {{technology}}. Can you describe a complex problem you solved using it?', '{"ifVague": ["What made this problem complex?", "What alternatives did you consider?"], "always": ["What trade-offs did you make?", "How did this solution perform at scale?"]}', '["technical-depth", "problem-solving", "trade-offs"]', 'curated'),
('resume_claim', 'data', 'technical', 'You mentioned building a {{model_type}} model. Walk me through your feature engineering process.', '{"ifVague": ["What was your target variable?", "How did you handle missing data?"], "always": ["How did you validate your features?", "What was the business impact?"]}', '["ml", "data-science", "methodology"]', 'curated'),
('resume_claim', 'pm', 'hiring_manager', 'Tell me about {{product_feature}} you launched. How did you measure success?', '{"ifVague": ["What metrics did you track?", "How did you define success upfront?"], "always": ["What would you do differently?", "How did users respond?"]}', '["product-sense", "metrics", "user-focus"]', 'curated'),
('resume_claim', 'general', 'hr', 'I noticed a gap between {{date1}} and {{date2}}. Can you tell me what you were doing during that time?', '{"ifVague": ["Were you pursuing any personal projects?", "Any skills you developed during this time?"], "always": ["How did this period influence your career goals?"]}', '["gap-explanation", "career-continuity"]', 'curated'),
('resume_claim', 'general', 'hiring_manager', 'You mentioned leading a team of {{team_size}}. How did you handle underperformers?', '{"ifVague": ["Can you give a specific example?", "What was the outcome?"], "always": ["How did you balance support vs accountability?", "What would you do differently?"]}', '["leadership", "people-management", "difficult-conversations"]', 'curated'),
('resume_claim', 'sales', 'hiring_manager', 'You mentioned achieving {{quota_percentage}}% of quota. Walk me through your biggest deal.', '{"ifVague": ["What was the deal size?", "How long was the sales cycle?"], "always": ["What objections did you overcome?", "How did you handle the competition?"]}', '["sales-process", "closing", "objection-handling"]', 'curated'),
('resume_claim', 'marketing', 'hiring_manager', 'Tell me about the {{campaign_name}} campaign. What was your role and what results did you achieve?', '{"ifVague": ["What channels did you use?", "What was the budget?"], "always": ["How did you measure ROI?", "What would you optimize next time?"]}', '["campaign-management", "metrics", "roi"]', 'curated'),
('resume_claim', 'ops', 'hiring_manager', 'You mentioned improving {{process_name}} by {{percentage}}%. How did you approach this?', '{"ifVague": ["What was the baseline?", "How did you identify the bottleneck?"], "always": ["How did you ensure the change stuck?", "What resistance did you face?"]}', '["process-improvement", "data-driven", "change-management"]', 'curated'),
('resume_claim', 'finance', 'hiring_manager', 'Tell me about the {{financial_model}} you built. What assumptions drove your analysis?', '{"ifVague": ["What was the purpose of the model?", "What inputs did you use?"], "always": ["How did you validate your assumptions?", "What was the outcome of your recommendation?"]}', '["financial-modeling", "analysis", "assumptions"]', 'curated'),
('resume_claim', 'hr', 'hiring_manager', 'You mentioned designing {{program_name}}. How did you measure employee engagement?', '{"ifVague": ["What metrics did you track?", "How did you gather feedback?"], "always": ["What was the participation rate?", "What would you change?"]}', '["employee-engagement", "program-design", "hr-metrics"]', 'curated'),
('resume_claim', 'consulting', 'hiring_manager', 'Tell me about your work on {{client_project}}. What was your specific contribution?', '{"ifVague": ["What was the client''s main challenge?", "How many consultants were on the team?"], "always": ["How did you manage client expectations?", "What was the final recommendation?"]}', '["client-management", "problem-solving", "consulting"]', 'curated'),
('resume_claim', 'design', 'hiring_manager', 'Walk me through the design process for {{design_project}}. How did you validate your decisions?', '{"ifVague": ["What research did you do?", "How many iterations did you go through?"], "always": ["How did you handle stakeholder feedback?", "What was the impact on user metrics?"]}', '["design-process", "user-research", "iteration"]', 'curated'),
('resume_claim', 'security', 'technical', 'You mentioned discovering {{vulnerability_type}}. Walk me through how you found and remediated it.', '{"ifVague": ["What tools did you use?", "What was the attack vector?"], "always": ["How did you prevent similar issues?", "How did you communicate the risk to stakeholders?"]}', '["security", "vulnerability", "remediation"]', 'curated'),
('resume_claim', 'swe', 'technical', 'I see you scaled {{system_name}} to handle {{scale}}. What architectural decisions did you make?', '{"ifVague": ["What was the bottleneck before?", "What trade-offs did you consider?"], "always": ["How did you test at scale?", "What would you do differently?"]}', '["system-design", "scalability", "architecture"]', 'curated'),
('resume_claim', 'data', 'technical', 'You mentioned reducing {{metric}} by {{percentage}}%. How did you identify the root cause?', '{"ifVague": ["What data did you analyze?", "What hypotheses did you test?"], "always": ["How did you validate the fix?", "How did you ensure it didn''t regress?"]}', '["data-analysis", "root-cause", "metrics"]', 'curated'),
('resume_claim', 'pm', 'hiring_manager', 'Tell me about a feature you killed or decided NOT to build. Why?', '{"ifVague": ["What was the original hypothesis?", "What data informed your decision?"], "always": ["How did you communicate this to stakeholders?", "What did you do instead?"]}', '["prioritization", "data-driven", "stakeholder-management"]', 'curated'),
('resume_claim', 'general', 'hiring_manager', 'You mentioned working in a {{industry}} company. How did that environment shape your approach?', '{"ifVague": ["What was unique about that environment?", "What constraints did you face?"], "always": ["How would you apply those learnings here?"]}', '["industry-context", "adaptability"]', 'curated'),
('resume_claim', 'general', 'hr', 'What prompted your move from {{company1}} to {{company2}}?', '{"ifVague": ["What were you looking for?", "What did you find lacking in your previous role?"], "always": ["What did you learn from that transition?"]}', '["career-decisions", "motivation", "growth"]', 'curated')
ON CONFLICT DO NOTHING;

-- =====================
-- QUESTION PATTERNS - Behavioral Patterns (25)
-- =====================
INSERT INTO question_patterns (pattern_type, role_category, interview_type, template, probe_tree, tags, source_type) VALUES
('behavioral', 'general', 'behavioral', 'Tell me about a time you disagreed with your manager. How did you handle it?', '{"ifVague": ["What was the specific disagreement?", "What was at stake?"], "always": ["What was the outcome?", "What did you learn about managing up?"]}', '["conflict", "managing-up", "communication"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Describe a situation where you had to deliver results under a tight deadline.', '{"ifVague": ["How tight was the deadline?", "What made it challenging?"], "always": ["What trade-offs did you make?", "How did you prioritize?"]}', '["time-management", "pressure", "prioritization"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Tell me about a time you failed. What did you learn?', '{"ifVague": ["What was the failure exactly?", "What was the impact?"], "always": ["How did you recover?", "How did this change your approach?"]}', '["failure", "learning", "resilience"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Describe a time you had to persuade someone who initially disagreed with you.', '{"ifVague": ["What were they opposed to?", "What was their reasoning?"], "always": ["What approach worked?", "How did you maintain the relationship?"]}', '["influence", "persuasion", "stakeholder-management"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Tell me about a time you took initiative beyond your job description.', '{"ifVague": ["What prompted you to act?", "What was the scope?"], "always": ["What was the outcome?", "How was it received?"]}', '["ownership", "initiative", "proactivity"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Describe a situation where you had to work with a difficult colleague.', '{"ifVague": ["What made them difficult?", "How did it impact the work?"], "always": ["What did you do?", "How did the relationship evolve?"]}', '["collaboration", "conflict-resolution", "emotional-intelligence"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Tell me about a time you received critical feedback. How did you respond?', '{"ifVague": ["What was the feedback?", "Who gave it?"], "always": ["What did you do with it?", "How did you feel about it?"]}', '["feedback", "growth-mindset", "self-awareness"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Describe a time you had to make a decision with incomplete information.', '{"ifVague": ["What information was missing?", "What was at stake?"], "always": ["How did you mitigate the risk?", "Was it the right call?"]}', '["decision-making", "ambiguity", "risk"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Tell me about a project that required you to learn something completely new.', '{"ifVague": ["What did you need to learn?", "How did you approach it?"], "always": ["How long did it take?", "Would you do it differently?"]}', '["learning", "adaptability", "growth"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Describe a time you had to balance multiple competing priorities.', '{"ifVague": ["What were the priorities?", "Who set them?"], "always": ["How did you decide?", "What trade-offs did you make?"]}', '["prioritization", "time-management", "communication"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Tell me about a time you mentored or coached someone.', '{"ifVague": ["What was their challenge?", "What was your approach?"], "always": ["What was the outcome?", "What did you learn from mentoring?"]}', '["mentorship", "leadership", "development"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Describe a situation where you had to deliver bad news to a stakeholder.', '{"ifVague": ["What was the bad news?", "Who was the stakeholder?"], "always": ["How did you deliver it?", "How did they react?"]}', '["communication", "stakeholder-management", "difficult-conversations"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Tell me about a time you went above and beyond for a customer or user.', '{"ifVague": ["What was the situation?", "What did you do?"], "always": ["What was the impact?", "How was it received?"]}', '["customer-focus", "service", "ownership"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Describe a time when you had to adapt to a significant change at work.', '{"ifVague": ["What was the change?", "How did it affect you?"], "always": ["How did you adapt?", "What helped you through it?"]}', '["adaptability", "change-management", "resilience"]', 'curated'),
('behavioral', 'general', 'behavioral', 'Tell me about a time you identified a problem before others did.', '{"ifVague": ["How did you spot it?", "What were the signs?"], "always": ["What did you do about it?", "What was the outcome?"]}', '["problem-identification", "proactivity", "attention-to-detail"]', 'curated'),
('behavioral', 'swe', 'behavioral', 'Tell me about a time you had to refactor legacy code. How did you approach it?', '{"ifVague": ["What was wrong with the code?", "How big was the scope?"], "always": ["How did you minimize risk?", "What was the outcome?"]}', '["refactoring", "technical-debt", "code-quality"]', 'curated'),
('behavioral', 'swe', 'behavioral', 'Describe a time you had to debug a production issue under pressure.', '{"ifVague": ["What was the issue?", "How was it discovered?"], "always": ["How did you triage?", "What was your debugging process?"]}', '["debugging", "production", "pressure"]', 'curated'),
('behavioral', 'pm', 'behavioral', 'Tell me about a time you had to say no to a feature request from leadership.', '{"ifVague": ["What was the request?", "Why did you say no?"], "always": ["How did you communicate it?", "What was the outcome?"]}', '["prioritization", "stakeholder-management", "communication"]', 'curated'),
('behavioral', 'pm', 'behavioral', 'Describe a time you shipped something that didn''t work as expected.', '{"ifVague": ["What went wrong?", "How did you find out?"], "always": ["What did you do?", "How did you prevent it from happening again?"]}', '["failure", "learning", "recovery"]', 'curated'),
('behavioral', 'sales', 'behavioral', 'Tell me about a deal you lost. What happened and what did you learn?', '{"ifVague": ["What was the deal?", "Why did you lose?"], "always": ["What would you do differently?", "How did you apply this learning?"]}', '["sales", "loss", "learning"]', 'curated'),
('behavioral', 'data', 'behavioral', 'Describe a time your analysis led to an unexpected finding. How did you communicate it?', '{"ifVague": ["What was the finding?", "Why was it unexpected?"], "always": ["How did stakeholders react?", "What was the business impact?"]}', '["data-analysis", "communication", "influence"]', 'curated'),
('behavioral', 'design', 'behavioral', 'Tell me about a time you had to push back on a design decision from leadership.', '{"ifVague": ["What was the decision?", "Why did you disagree?"], "always": ["How did you present your case?", "What was the outcome?"]}', '["design", "stakeholder-management", "advocacy"]', 'curated'),
('behavioral', 'hr', 'behavioral', 'Describe a time you had to handle a sensitive employee situation.', '{"ifVague": ["What was the situation?", "What made it sensitive?"], "always": ["How did you balance confidentiality and transparency?", "What was the outcome?"]}', '["hr", "confidentiality", "empathy"]', 'curated'),
('behavioral', 'ops', 'behavioral', 'Tell me about a process you improved. What was your approach?', '{"ifVague": ["What was wrong with the process?", "How did you identify it?"], "always": ["How did you implement the change?", "How did you measure success?"]}', '["process-improvement", "operations", "change-management"]', 'curated'),
('behavioral', 'finance', 'behavioral', 'Describe a time your analysis influenced a major business decision.', '{"ifVague": ["What was the decision?", "What analysis did you do?"], "always": ["How did you present your findings?", "What was the outcome?"]}', '["financial-analysis", "influence", "decision-making"]', 'curated')
ON CONFLICT DO NOTHING;

-- =====================
-- QUESTION PATTERNS - JD Requirement Patterns (15)
-- =====================
INSERT INTO question_patterns (pattern_type, role_category, interview_type, template, probe_tree, tags, source_type) VALUES
('jd_requirement', 'general', 'hiring_manager', 'This role requires {{skill}}. Can you share an example of how you''ve demonstrated this?', '{"ifVague": ["Can you be more specific about the situation?", "What was your role?"], "always": ["What was the outcome?", "How would you apply this skill here?"]}', '["skill-validation", "experience-match"]', 'curated'),
('jd_requirement', 'swe', 'technical', 'We use {{technology}} extensively. What''s your experience level and what have you built with it?', '{"ifVague": ["How many years have you used it?", "What was the most complex thing you built?"], "always": ["What are the pitfalls you''ve encountered?", "How do you stay updated?"]}', '["technical-skill", "technology-depth"]', 'curated'),
('jd_requirement', 'swe', 'technical', 'This role requires experience with distributed systems. Tell me about a distributed system you''ve designed or maintained.', '{"ifVague": ["What was the scale?", "What technologies did you use?"], "always": ["How did you handle failures?", "What would you do differently?"]}', '["distributed-systems", "system-design", "architecture"]', 'curated'),
('jd_requirement', 'data', 'technical', 'We need someone who can work with {{data_size}} datasets. How have you handled data at scale?', '{"ifVague": ["What was the data volume?", "What tools did you use?"], "always": ["What performance challenges did you face?", "How did you optimize?"]}', '["big-data", "data-engineering", "scale"]', 'curated'),
('jd_requirement', 'pm', 'hiring_manager', 'This role requires working closely with {{stakeholder_type}}. Tell me about your experience.', '{"ifVague": ["What was the relationship like?", "How often did you interact?"], "always": ["How did you manage conflicting priorities?", "What did you learn?"]}', '["stakeholder-management", "collaboration"]', 'curated'),
('jd_requirement', 'general', 'hiring_manager', 'This is a cross-functional role. How have you navigated working across teams?', '{"ifVague": ["Which teams did you work with?", "What was your role?"], "always": ["How did you handle misalignment?", "What was the outcome?"]}', '["cross-functional", "collaboration", "influence"]', 'curated'),
('jd_requirement', 'general', 'hiring_manager', 'We''re looking for someone who can work independently. Give me an example of a project you owned end-to-end.', '{"ifVague": ["What was the project?", "Who set the goals?"], "always": ["How did you manage without oversight?", "What challenges did you face?"]}', '["autonomy", "ownership", "self-direction"]', 'curated'),
('jd_requirement', 'swe', 'technical', 'We practice test-driven development. What''s your experience with TDD?', '{"ifVague": ["How often do you write tests first?", "What types of tests do you write?"], "always": ["When is TDD not appropriate?", "How do you balance speed and coverage?"]}', '["testing", "tdd", "code-quality"]', 'curated'),
('jd_requirement', 'sales', 'hiring_manager', 'This role targets {{customer_segment}}. What''s your experience selling to this segment?', '{"ifVague": ["What companies did you sell to?", "What was the typical deal size?"], "always": ["What''s unique about this segment?", "How did you adapt your approach?"]}', '["sales", "customer-segment", "experience"]', 'curated'),
('jd_requirement', 'marketing', 'hiring_manager', 'We need someone experienced in {{marketing_channel}}. What results have you achieved?', '{"ifVague": ["What was your budget?", "What metrics did you track?"], "always": ["What''s your approach to optimization?", "How do you stay current?"]}', '["marketing", "channel-expertise", "results"]', 'curated'),
('jd_requirement', 'general', 'hr', 'This role requires relocating to {{location}}. Are you comfortable with that?', '{"ifVague": [], "always": ["What factors are you considering?", "When could you relocate?"]}', '["logistics", "relocation"]', 'curated'),
('jd_requirement', 'general', 'hiring_manager', 'This is a {{seniority_level}} role. How do you see yourself contributing at this level?', '{"ifVague": ["What does this level mean to you?", "What have you done at this level before?"], "always": ["How do you plan to grow?", "What support do you need?"]}', '["seniority", "expectations", "growth"]', 'curated'),
('jd_requirement', 'design', 'hiring_manager', 'We need someone who can work with {{design_tool}}. What''s your experience?', '{"ifVague": ["How often do you use it?", "What have you created with it?"], "always": ["What are its limitations?", "What alternatives have you tried?"]}', '["design-tools", "skill-validation"]', 'curated'),
('jd_requirement', 'ops', 'hiring_manager', 'This role requires managing {{team_size}} direct reports. Tell me about your people management experience.', '{"ifVague": ["How many people have you managed?", "What was the team composition?"], "always": ["How do you develop your team?", "How do you handle performance issues?"]}', '["management", "leadership", "team-building"]', 'curated'),
('jd_requirement', 'consulting', 'hiring_manager', 'We serve clients in {{industry}}. What''s your exposure to this industry?', '{"ifVague": ["What projects have you done?", "What do you know about the industry?"], "always": ["What are the key challenges?", "How would you ramp up?"]}', '["industry-knowledge", "consulting", "client-focus"]', 'curated')
ON CONFLICT DO NOTHING;

-- =====================
-- QUESTION PATTERNS - Technical Patterns (20)
-- =====================
INSERT INTO question_patterns (pattern_type, role_category, interview_type, template, probe_tree, tags, source_type) VALUES
('technical', 'swe', 'technical', 'How would you design a URL shortening service like bit.ly?', '{"ifVague": ["What are the main components?", "What APIs would you expose?"], "always": ["How would you handle high traffic?", "How would you prevent abuse?"]}', '["system-design", "api-design", "scalability"]', 'curated'),
('technical', 'swe', 'technical', 'Explain the difference between SQL and NoSQL databases. When would you use each?', '{"ifVague": ["Can you give specific examples?"], "always": ["What are the trade-offs?", "Have you migrated between them?"]}', '["databases", "architecture", "trade-offs"]', 'curated'),
('technical', 'swe', 'technical', 'How do you approach code reviews? What do you look for?', '{"ifVague": ["Can you be more specific?"], "always": ["How do you give constructive feedback?", "What''s your pet peeve in code reviews?"]}', '["code-review", "collaboration", "quality"]', 'curated'),
('technical', 'swe', 'technical', 'Walk me through how you would debug a memory leak in production.', '{"ifVague": ["What tools would you use?", "How would you identify the source?"], "always": ["How would you verify the fix?", "How would you prevent it?"]}', '["debugging", "performance", "production"]', 'curated'),
('technical', 'swe', 'technical', 'Explain CAP theorem and its implications for distributed systems.', '{"ifVague": ["Can you define each component?"], "always": ["How have you applied this in practice?", "Give an example of a trade-off you made."]}', '["distributed-systems", "theory", "architecture"]', 'curated'),
('technical', 'swe', 'technical', 'How would you design a rate limiter?', '{"ifVague": ["What algorithm would you use?", "Where would you implement it?"], "always": ["How would you handle distributed rate limiting?", "What would you do about bursts?"]}', '["system-design", "api", "throttling"]', 'curated'),
('technical', 'data', 'technical', 'Walk me through your approach to building a recommendation system.', '{"ifVague": ["What type of recommendations?", "What data would you use?"], "always": ["How would you evaluate it?", "How would you handle cold start?"]}', '["ml", "recommendations", "system-design"]', 'curated'),
('technical', 'data', 'technical', 'Explain the bias-variance trade-off and how you manage it.', '{"ifVague": ["Can you give an example?"], "always": ["How do you detect overfitting?", "What techniques do you use to reduce it?"]}', '["ml", "theory", "model-evaluation"]', 'curated'),
('technical', 'data', 'technical', 'How would you design an A/B testing framework?', '{"ifVague": ["What components would you include?", "How would you assign users?"], "always": ["How would you handle network effects?", "How do you determine sample size?"]}', '["experimentation", "statistics", "system-design"]', 'curated'),
('technical', 'data', 'technical', 'Walk me through how you would build a fraud detection system.', '{"ifVague": ["What signals would you use?", "What model would you choose?"], "always": ["How would you handle class imbalance?", "How would you evaluate false positives?"]}', '["ml", "fraud", "system-design"]', 'curated'),
('technical', 'pm', 'technical', 'How would you measure the success of a new feature?', '{"ifVague": ["What type of feature?", "What metrics would you track?"], "always": ["How would you attribute impact?", "What would cause you to kill the feature?"]}', '["metrics", "product-analytics", "experimentation"]', 'curated'),
('technical', 'pm', 'technical', 'Walk me through how you would prioritize a backlog with limited engineering resources.', '{"ifVague": ["What framework would you use?", "What inputs would you consider?"], "always": ["How do you handle stakeholder pressure?", "How do you communicate trade-offs?"]}', '["prioritization", "product-management", "frameworks"]', 'curated'),
('technical', 'security', 'technical', 'How would you perform a security audit of a web application?', '{"ifVague": ["What would you check first?", "What tools would you use?"], "always": ["How would you prioritize findings?", "How would you communicate to developers?"]}', '["security-audit", "web-security", "methodology"]', 'curated'),
('technical', 'security', 'technical', 'Explain the OWASP Top 10 and which ones you encounter most often.', '{"ifVague": ["Can you explain a few in detail?"], "always": ["How do you prevent these in practice?", "What''s most overlooked?"]}', '["owasp", "web-security", "vulnerabilities"]', 'curated'),
('technical', 'swe', 'technical', 'How do you approach API design? What makes a good API?', '{"ifVague": ["What principles do you follow?"], "always": ["How do you version APIs?", "How do you handle breaking changes?"]}', '["api-design", "best-practices", "versioning"]', 'curated'),
('technical', 'swe', 'technical', 'Explain how you would implement authentication for a microservices architecture.', '{"ifVague": ["What auth mechanism would you use?", "How would services communicate?"], "always": ["How would you handle session management?", "What security concerns exist?"]}', '["microservices", "authentication", "security"]', 'curated'),
('technical', 'data', 'technical', 'How do you handle data quality issues in a data pipeline?', '{"ifVague": ["What types of issues do you see?", "How do you detect them?"], "always": ["How do you prevent bad data from propagating?", "How do you alert on issues?"]}', '["data-engineering", "data-quality", "pipelines"]', 'curated'),
('technical', 'swe', 'technical', 'What''s your approach to writing maintainable code?', '{"ifVague": ["What practices do you follow?"], "always": ["How do you balance speed and quality?", "Give an example of refactoring for maintainability."]}', '["code-quality", "maintainability", "best-practices"]', 'curated'),
('technical', 'swe', 'technical', 'How would you design a notification system that handles millions of events per day?', '{"ifVague": ["What channels would you support?", "How would you store preferences?"], "always": ["How would you handle failures?", "How would you prevent spam?"]}', '["system-design", "scale", "messaging"]', 'curated'),
('technical', 'data', 'technical', 'Walk me through how you would build a real-time analytics dashboard.', '{"ifVague": ["What metrics would you show?", "What update frequency?"], "always": ["How would you handle data freshness vs accuracy?", "What aggregation strategies?"]}', '["analytics", "real-time", "data-engineering"]', 'curated')
ON CONFLICT DO NOTHING;

-- =====================
-- QUESTION PATTERNS - Scenario/Situational Patterns (20)
-- =====================
INSERT INTO question_patterns (pattern_type, role_category, interview_type, template, probe_tree, tags, source_type) VALUES
('situational', 'general', 'hiring_manager', 'Imagine you just joined the team and discovered a critical process was broken. What would you do?', '{"ifVague": ["How would you assess the severity?", "Who would you talk to first?"], "always": ["How would you balance fixing vs understanding?", "How would you communicate progress?"]}', '["problem-solving", "judgment", "communication"]', 'curated'),
('situational', 'general', 'hiring_manager', 'You''re given a project with an impossible deadline. How do you handle it?', '{"ifVague": ["What would you do first?", "How would you assess feasibility?"], "always": ["How would you negotiate scope?", "How would you communicate to stakeholders?"]}', '["prioritization", "negotiation", "communication"]', 'curated'),
('situational', 'general', 'hiring_manager', 'Two senior team members have conflicting approaches. How would you resolve it?', '{"ifVague": ["What would be your first step?", "How would you understand both perspectives?"], "always": ["How would you facilitate a decision?", "What if they can''t agree?"]}', '["conflict-resolution", "facilitation", "leadership"]', 'curated'),
('situational', 'pm', 'hiring_manager', 'A key customer is requesting a feature that goes against your product vision. How do you handle it?', '{"ifVague": ["How would you understand their need?", "What factors would you consider?"], "always": ["How would you say no if needed?", "What alternatives would you offer?"]}', '["stakeholder-management", "product-vision", "negotiation"]', 'curated'),
('situational', 'pm', 'hiring_manager', 'Your A/B test shows mixed results - some metrics improved, others declined. What do you do?', '{"ifVague": ["How would you analyze further?", "What factors would you consider?"], "always": ["How would you make a decision?", "How would you communicate it?"]}', '["experimentation", "data-driven", "decision-making"]', 'curated'),
('situational', 'swe', 'technical', 'You discover a critical security vulnerability the day before a major release. What do you do?', '{"ifVague": ["How would you assess the risk?", "Who would you inform?"], "always": ["How would you balance security vs timeline?", "What if the business pushes back?"]}', '["security", "judgment", "pressure"]', 'curated'),
('situational', 'swe', 'technical', 'Your code review is being blocked by a senior engineer who insists on a different approach. How do you handle it?', '{"ifVague": ["What would you try to understand first?", "How would you present your case?"], "always": ["What if you still disagree?", "When would you escalate?"]}', '["collaboration", "code-review", "conflict"]', 'curated'),
('situational', 'sales', 'hiring_manager', 'A competitor is spreading misinformation about your product to a key prospect. How do you respond?', '{"ifVague": ["How would you verify the claims?", "What information would you gather?"], "always": ["How would you address it with the prospect?", "What if they believe the competitor?"]}', '["competition", "objection-handling", "integrity"]', 'curated'),
('situational', 'sales', 'hiring_manager', 'Your champion at a prospect company just left. The deal is at risk. What do you do?', '{"ifVague": ["What would you do immediately?", "How would you identify new stakeholders?"], "always": ["How would you rebuild momentum?", "What would you do differently next time?"]}', '["relationship-building", "deal-management", "resilience"]', 'curated'),
('situational', 'marketing', 'hiring_manager', 'Your campaign is getting significant negative feedback on social media. How do you respond?', '{"ifVague": ["How would you assess the situation?", "Who would you involve?"], "always": ["How would you decide whether to pull the campaign?", "How would you address the feedback?"]}', '["crisis-management", "social-media", "judgment"]', 'curated'),
('situational', 'data', 'technical', 'Your model is showing unexpected behavior in production. How do you diagnose and fix it?', '{"ifVague": ["What would you check first?", "How would you identify the root cause?"], "always": ["How would you prevent this in the future?", "When would you roll back?"]}', '["ml-ops", "debugging", "production"]', 'curated'),
('situational', 'data', 'technical', 'A stakeholder wants you to use a biased dataset to meet a deadline. How do you handle it?', '{"ifVague": ["How would you explain the risk?", "What alternatives would you propose?"], "always": ["What if they insist?", "How would you document your concerns?"]}', '["ethics", "data-quality", "stakeholder-management"]', 'curated'),
('situational', 'design', 'hiring_manager', 'Users are confused by a feature you designed. Metrics show low adoption. What do you do?', '{"ifVague": ["How would you diagnose the problem?", "What research would you do?"], "always": ["How would you prioritize fixes?", "How would you communicate to stakeholders?"]}', '["user-research", "iteration", "metrics"]', 'curated'),
('situational', 'hr', 'hiring_manager', 'An employee confides in you about harassment but asks you not to tell anyone. What do you do?', '{"ifVague": ["How would you respond initially?", "What are your obligations?"], "always": ["How would you balance confidentiality and policy?", "How would you support the employee?"]}', '["hr", "ethics", "policy"]', 'curated'),
('situational', 'ops', 'hiring_manager', 'A key vendor just doubled their prices. Your budget is already tight. What do you do?', '{"ifVague": ["What would you assess first?", "What options would you consider?"], "always": ["How would you negotiate?", "What if they won''t budge?"]}', '["vendor-management", "negotiation", "problem-solving"]', 'curated'),
('situational', 'finance', 'hiring_manager', 'You find a material error in the financial statements after they''ve been shared with the board. What do you do?', '{"ifVague": ["How would you assess the impact?", "Who would you inform first?"], "always": ["How would you prevent this in the future?", "How would you communicate to the board?"]}', '["integrity", "crisis-management", "communication"]', 'curated'),
('situational', 'consulting', 'hiring_manager', 'Your client is asking you to recommend a solution you know won''t work. How do you handle it?', '{"ifVague": ["Why do you think it won''t work?", "How would you present your concerns?"], "always": ["What if they insist?", "How would you protect your reputation?"]}', '["client-management", "integrity", "consulting"]', 'curated'),
('situational', 'general', 'hr', 'You receive a counter-offer from your current employer. How do you evaluate it?', '{"ifVague": ["What factors would you consider?", "How would you assess if things would really change?"], "always": ["What would make you stay vs go?", "How important is loyalty in this decision?"]}', '["career-decisions", "negotiation", "self-awareness"]', 'curated'),
('situational', 'general', 'hiring_manager', 'You realize your team is building the wrong thing, but you''re 70% done. What do you do?', '{"ifVague": ["How would you assess the situation?", "Who would you involve?"], "always": ["How would you decide whether to pivot?", "How would you communicate the change?"]}', '["judgment", "sunk-cost", "leadership"]', 'curated'),
('situational', 'pm', 'hiring_manager', 'Engineering says the feature will take 3 months. Sales needs it in 1 month. What do you do?', '{"ifVague": ["What would you try to understand first?", "What options would you explore?"], "always": ["How would you negotiate with both sides?", "What if there''s no compromise?"]}', '["prioritization", "negotiation", "cross-functional"]', 'curated')
ON CONFLICT DO NOTHING;

-- =====================
-- QUESTION PATTERNS - Probe/Follow-up Patterns (20)
-- =====================
INSERT INTO question_patterns (pattern_type, role_category, interview_type, template, probe_tree, tags, source_type) VALUES
('probe', 'general', 'hiring_manager', 'You mentioned {{claim}}. Can you be more specific about what YOU personally did?', '{"always": ["What decisions did you make?", "What was the outcome of your specific contribution?"]}', '["ownership", "depth", "verification"]', 'curated'),
('probe', 'general', 'hiring_manager', 'What was the metric impact of that work?', '{"ifVague": ["Can you estimate the impact?", "What would have happened without your work?"], "always": ["How did you measure this?"]}', '["metrics", "impact", "quantification"]', 'curated'),
('probe', 'general', 'hiring_manager', 'What would you do differently if you could do it again?', '{"ifVague": ["Was there anything that didn''t go well?"], "always": ["What did you learn from this experience?"]}', '["reflection", "learning", "growth"]', 'curated'),
('probe', 'general', 'hiring_manager', 'How did others respond to your approach?', '{"ifVague": ["Did anyone disagree?", "What feedback did you receive?"], "always": ["How did you handle pushback?"]}', '["collaboration", "feedback", "influence"]', 'curated'),
('probe', 'general', 'hiring_manager', 'What trade-offs did you consider?', '{"ifVague": ["Were there alternative approaches?", "What did you sacrifice?"], "always": ["How did you decide?"]}', '["trade-offs", "decision-making", "judgment"]', 'curated'),
('probe', 'swe', 'technical', 'How did you test this?', '{"ifVague": ["What types of tests did you write?", "What was your test coverage?"], "always": ["How did you verify correctness?"]}', '["testing", "verification", "quality"]', 'curated'),
('probe', 'swe', 'technical', 'What would happen if this failed at 10x scale?', '{"ifVague": ["What bottlenecks would you hit?"], "always": ["How would you architect for that scale?"]}', '["scalability", "system-design", "foresight"]', 'curated'),
('probe', 'swe', 'technical', 'How would you monitor this in production?', '{"ifVague": ["What metrics would you track?"], "always": ["How would you alert on issues?", "What''s your debugging workflow?"]}', '["observability", "monitoring", "operations"]', 'curated'),
('probe', 'data', 'technical', 'How did you validate your model?', '{"ifVague": ["What metrics did you use?", "Did you do cross-validation?"], "always": ["How did you check for overfitting?"]}', '["ml", "validation", "methodology"]', 'curated'),
('probe', 'data', 'technical', 'What assumptions did your analysis rely on?', '{"ifVague": ["Were there any data quality issues?"], "always": ["How did you validate these assumptions?"]}', '["analysis", "assumptions", "rigor"]', 'curated'),
('probe', 'pm', 'hiring_manager', 'How did you know users wanted this?', '{"ifVague": ["What research did you do?", "What signals did you see?"], "always": ["How did you validate before building?"]}', '["user-research", "validation", "product-sense"]', 'curated'),
('probe', 'pm', 'hiring_manager', 'What did you say no to in order to build this?', '{"ifVague": ["What was on the backlog?"], "always": ["How did you communicate that trade-off?"]}', '["prioritization", "trade-offs", "stakeholder-management"]', 'curated'),
('probe', 'sales', 'hiring_manager', 'What was the customer''s main objection?', '{"ifVague": ["What were they worried about?"], "always": ["How did you address it?", "Did they buy in the end?"]}', '["objection-handling", "sales-process", "persuasion"]', 'curated'),
('probe', 'general', 'hiring_manager', 'Who else was involved and what did they contribute?', '{"always": ["How did you collaborate?", "What was your unique contribution?"]}', '["collaboration", "team", "ownership"]', 'curated'),
('probe', 'general', 'hiring_manager', 'What was the timeline and how did you manage it?', '{"ifVague": ["Were there any delays?"], "always": ["How did you prioritize?", "What would you do differently?"]}', '["time-management", "execution", "planning"]', 'curated'),
('probe', 'general', 'hiring_manager', 'What was the biggest risk and how did you mitigate it?', '{"ifVague": ["Were there things that could have gone wrong?"], "always": ["How did you identify risks upfront?"]}', '["risk-management", "foresight", "planning"]', 'curated'),
('probe', 'general', 'hr', 'Why do you think you were successful in this?', '{"always": ["What skills did you use?", "Would you be able to replicate this success here?"]}', '["self-awareness", "skills", "transfer"]', 'curated'),
('probe', 'general', 'hr', 'What would your manager/colleagues say was your main contribution?', '{"always": ["Have they given you this feedback directly?"]}', '["self-awareness", "reputation", "feedback"]', 'curated'),
('probe', 'general', 'hiring_manager', 'What did you learn from this that you still apply today?', '{"always": ["Can you give a recent example?"]}', '["learning", "growth", "application"]', 'curated'),
('probe', 'design', 'hiring_manager', 'How did you incorporate user feedback into your design?', '{"ifVague": ["What feedback did you receive?"], "always": ["What did you change based on feedback?"]}', '["user-research", "iteration", "design"]', 'curated')
ON CONFLICT DO NOTHING;

-- =====================
-- COMPANY ROLE BLUEPRINTS
-- Top 15 Companies with detailed interview structures
-- =====================

-- Google SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid', 
  '["algorithms", "system-design", "coding", "googleyness", "problem-solving"]'::jsonb,
  '{"dimensions": [{"key": "problem_solving", "weight": 30}, {"key": "coding", "weight": 25}, {"key": "system_design", "weight": 20}, {"key": "communication", "weight": 15}, {"key": "leadership", "weight": 10}], "passingScore": 70, "style": "structured"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["coding", "algorithms"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["system-design"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["behavioral", "googleyness"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["coding", "problem-solving"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["coding", "algorithms"]}]'::jsonb,
  'Google uses structured interviews with 4-5 onsite rounds. Focus on problem-solving approach, not just correct answers. "Googleyness" evaluates culture fit and collaboration.'
FROM companies c WHERE c.name = 'Google'
ON CONFLICT DO NOTHING;

INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'senior',
  '["algorithms", "system-design", "leadership", "technical-depth", "mentorship"]'::jsonb,
  '{"dimensions": [{"key": "system_design", "weight": 30}, {"key": "problem_solving", "weight": 25}, {"key": "leadership", "weight": 20}, {"key": "coding", "weight": 15}, {"key": "communication", "weight": 10}], "passingScore": 75, "style": "structured"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["system-design", "coding"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["system-design", "scale"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["leadership", "behavioral"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["coding", "algorithms"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["technical-depth"]}]'::jsonb,
  'Senior SWE at Google requires demonstrated technical leadership. System design is weighted heavily. Expect questions about mentoring and driving technical decisions.'
FROM companies c WHERE c.name = 'Google'
ON CONFLICT DO NOTHING;

INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'pm', 'mid',
  '["product-sense", "analytical", "technical", "execution", "leadership"]'::jsonb,
  '{"dimensions": [{"key": "product_sense", "weight": 30}, {"key": "analytical", "weight": 25}, {"key": "execution", "weight": 20}, {"key": "technical", "weight": 15}, {"key": "leadership", "weight": 10}], "passingScore": 70, "style": "structured"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["product-sense", "execution"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["product-design"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["analytical", "estimation"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["technical"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["leadership", "behavioral"]}]'::jsonb,
  'Google PM interviews test product sense, analytical thinking, and technical depth. Expect estimation questions and product critique exercises.'
FROM companies c WHERE c.name = 'Google'
ON CONFLICT DO NOTHING;

-- Amazon SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["leadership-principles", "system-design", "coding", "ownership", "customer-obsession"]'::jsonb,
  '{"dimensions": [{"key": "ownership", "weight": 25}, {"key": "problem_solving", "weight": 25}, {"key": "coding", "weight": 20}, {"key": "customer_obsession", "weight": 15}, {"key": "communication", "weight": 15}], "passingScore": 70, "style": "behavioral-heavy"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 60, "focus": ["coding", "leadership-principles"]}, {"round": 2, "type": "onsite", "duration": 60, "focus": ["system-design", "ownership"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["coding", "problem-solving"]}, {"round": 4, "type": "onsite", "duration": 60, "focus": ["behavioral", "leadership-principles"]}, {"round": 5, "type": "bar_raiser", "duration": 60, "focus": ["behavioral", "culture-fit"]}]'::jsonb,
  'Amazon uses STAR format extensively. Every round includes Leadership Principles questions. Bar Raiser round is critical - they can veto any hire.'
FROM companies c WHERE c.name = 'Amazon'
ON CONFLICT DO NOTHING;

INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'senior',
  '["leadership-principles", "system-design", "ownership", "dive-deep", "bias-for-action"]'::jsonb,
  '{"dimensions": [{"key": "ownership", "weight": 25}, {"key": "system_design", "weight": 25}, {"key": "dive_deep", "weight": 20}, {"key": "leadership", "weight": 15}, {"key": "bias_for_action", "weight": 15}], "passingScore": 75, "style": "behavioral-heavy"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 60, "focus": ["system-design", "leadership-principles"]}, {"round": 2, "type": "onsite", "duration": 60, "focus": ["system-design", "scale"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["behavioral", "ownership"]}, {"round": 4, "type": "onsite", "duration": 60, "focus": ["behavioral", "dive-deep"]}, {"round": 5, "type": "bar_raiser", "duration": 60, "focus": ["behavioral", "leadership"]}]'::jsonb,
  'Senior SDEs must demonstrate Dive Deep and Ownership. Expect questions about influencing without authority and making high-judgment calls.'
FROM companies c WHERE c.name = 'Amazon'
ON CONFLICT DO NOTHING;

INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'pm', 'mid',
  '["leadership-principles", "customer-obsession", "working-backwards", "metrics", "execution"]'::jsonb,
  '{"dimensions": [{"key": "customer_obsession", "weight": 30}, {"key": "ownership", "weight": 25}, {"key": "analytical", "weight": 20}, {"key": "execution", "weight": 15}, {"key": "communication", "weight": 10}], "passingScore": 70, "style": "behavioral-heavy"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 60, "focus": ["product-sense", "leadership-principles"]}, {"round": 2, "type": "onsite", "duration": 60, "focus": ["working-backwards", "prfaq"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["metrics", "analytical"]}, {"round": 4, "type": "onsite", "duration": 60, "focus": ["behavioral", "ownership"]}, {"round": 5, "type": "bar_raiser", "duration": 60, "focus": ["behavioral", "culture-fit"]}]'::jsonb,
  'Amazon PMs must master Working Backwards and PRFAQ process. Customer Obsession is the most important LP. Expect to write press releases for hypothetical products.'
FROM companies c WHERE c.name = 'Amazon'
ON CONFLICT DO NOTHING;

-- Microsoft SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "problem-solving", "collaboration", "growth-mindset"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 30}, {"key": "problem_solving", "weight": 25}, {"key": "collaboration", "weight": 20}, {"key": "system_design", "weight": 15}, {"key": "growth_mindset", "weight": 10}], "passingScore": 65, "style": "conversational"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["coding"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["coding", "problem-solving"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral"]}, {"round": 5, "type": "as_appropriate", "duration": 45, "focus": ["culture-fit", "collaboration"]}]'::jsonb,
  'Microsoft emphasizes growth mindset. Interviewers are looking for curiosity and ability to learn. "As Appropriate" round is with hiring manager for final decision.'
FROM companies c WHERE c.name = 'Microsoft'
ON CONFLICT DO NOTHING;

INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'pm', 'mid',
  '["product-sense", "customer-focus", "data-driven", "collaboration", "technical"]'::jsonb,
  '{"dimensions": [{"key": "product_sense", "weight": 30}, {"key": "customer_focus", "weight": 25}, {"key": "analytical", "weight": 20}, {"key": "collaboration", "weight": 15}, {"key": "technical", "weight": 10}], "passingScore": 65, "style": "conversational"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["product-sense"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["product-design"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["analytical", "metrics"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral", "collaboration"]}, {"round": 5, "type": "as_appropriate", "duration": 45, "focus": ["culture-fit"]}]'::jsonb,
  'Microsoft PM interviews focus on product sense and customer empathy. Less technical depth required compared to Google. Emphasis on collaboration and inclusive design.'
FROM companies c WHERE c.name = 'Microsoft'
ON CONFLICT DO NOTHING;

-- Meta SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "behavioral", "product-sense", "move-fast"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 35}, {"key": "system_design", "weight": 25}, {"key": "behavioral", "weight": 20}, {"key": "communication", "weight": 10}, {"key": "product_sense", "weight": 10}], "passingScore": 70, "style": "intensive"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["coding"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["coding", "algorithms"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["coding", "product"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["system-design"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["behavioral"]}]'::jsonb,
  'Meta (Facebook) interviews are coding-heavy. Expect 2-3 coding rounds. System design uses Meta-scale examples. Behavioral round focuses on "Move Fast" and impact.'
FROM companies c WHERE c.name = 'Meta'
ON CONFLICT DO NOTHING;

INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'pm', 'mid',
  '["product-sense", "execution", "analytical", "technical", "impact"]'::jsonb,
  '{"dimensions": [{"key": "product_sense", "weight": 35}, {"key": "execution", "weight": 25}, {"key": "analytical", "weight": 20}, {"key": "communication", "weight": 10}, {"key": "technical", "weight": 10}], "passingScore": 70, "style": "intensive"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["product-sense"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["product-sense", "design"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["execution"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["analytical", "metrics"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["leadership", "behavioral"]}]'::jsonb,
  'Meta PM interviews emphasize product sense and impact at scale. Expect questions about improving Facebook/Instagram products. Execution round focuses on prioritization.'
FROM companies c WHERE c.name = 'Meta'
ON CONFLICT DO NOTHING;

-- Apple SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "attention-to-detail", "collaboration", "secrecy"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "attention_to_detail", "weight": 20}, {"key": "collaboration", "weight": 15}, {"key": "communication", "weight": 10}], "passingScore": 70, "style": "secretive"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 60, "focus": ["coding", "algorithms"]}, {"round": 2, "type": "onsite", "duration": 60, "focus": ["coding"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 60, "focus": ["behavioral"]}, {"round": 5, "type": "onsite", "duration": 60, "focus": ["team-fit"]}]'::jsonb,
  'Apple is notoriously secretive about interview process. Emphasis on attention to detail and craft. Team-specific interviews mean experience varies by org.'
FROM companies c WHERE c.name = 'Apple'
ON CONFLICT DO NOTHING;

-- Netflix SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'senior',
  '["system-design", "ownership", "context-not-control", "judgment", "candor"]'::jsonb,
  '{"dimensions": [{"key": "judgment", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "ownership", "weight": 20}, {"key": "candor", "weight": 15}, {"key": "coding", "weight": 10}], "passingScore": 75, "style": "culture-heavy"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["system-design", "culture"]}, {"round": 2, "type": "onsite", "duration": 60, "focus": ["system-design", "scale"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["behavioral", "judgment"]}, {"round": 4, "type": "onsite", "duration": 60, "focus": ["culture", "candor"]}, {"round": 5, "type": "onsite", "duration": 60, "focus": ["team-fit", "ownership"]}]'::jsonb,
  'Netflix hires experienced engineers only. Culture fit is paramount - read the culture memo. Expect questions about "Context not Control" and high-judgment decisions.'
FROM companies c WHERE c.name = 'Netflix'
ON CONFLICT DO NOTHING;

-- Stripe SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "debugging", "user-empathy", "rigor"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 30}, {"key": "debugging", "weight": 25}, {"key": "system_design", "weight": 20}, {"key": "communication", "weight": 15}, {"key": "user_empathy", "weight": 10}], "passingScore": 70, "style": "practical"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 60, "focus": ["coding"]}, {"round": 2, "type": "onsite", "duration": 60, "focus": ["debugging", "practical-coding"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 60, "focus": ["integration", "api-design"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["manager", "culture"]}]'::jsonb,
  'Stripe interviews are practical and product-focused. Famous debugging exercise - fix real bugs in codebase. Integration round tests API design for developer experience.'
FROM companies c WHERE c.name = 'Stripe'
ON CONFLICT DO NOTHING;

-- Flipkart SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["dsa", "system-design", "problem-solving", "scale", "ownership"]'::jsonb,
  '{"dimensions": [{"key": "dsa", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "problem_solving", "weight": 20}, {"key": "communication", "weight": 15}, {"key": "ownership", "weight": 10}], "passingScore": 65, "style": "standard"}'::jsonb,
  '[{"round": 1, "type": "online_test", "duration": 90, "focus": ["dsa", "coding"]}, {"round": 2, "type": "phone_screen", "duration": 60, "focus": ["dsa", "problem-solving"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["machine-coding"]}, {"round": 4, "type": "onsite", "duration": 60, "focus": ["system-design"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["hiring-manager"]}]'::jsonb,
  'Flipkart uses machine coding rounds - build working code in 90 mins. System design questions often involve e-commerce scale (flash sales, inventory). DSA is heavily weighted.'
FROM companies c WHERE c.name = 'Flipkart'
ON CONFLICT DO NOTHING;

INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'pm', 'mid',
  '["product-sense", "metrics", "execution", "customer-focus", "problem-solving"]'::jsonb,
  '{"dimensions": [{"key": "product_sense", "weight": 30}, {"key": "metrics", "weight": 25}, {"key": "execution", "weight": 20}, {"key": "customer_focus", "weight": 15}, {"key": "communication", "weight": 10}], "passingScore": 65, "style": "standard"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["product-sense"]}, {"round": 2, "type": "case_study", "duration": 60, "focus": ["case-study", "presentation"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["metrics", "analytical"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["hiring-manager"]}]'::jsonb,
  'Flipkart PM interviews include a take-home case study with presentation. Expect questions about e-commerce metrics (conversion, GMV, ARPU). India-specific market understanding valued.'
FROM companies c WHERE c.name = 'Flipkart'
ON CONFLICT DO NOTHING;

-- Razorpay SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "payments-domain", "reliability", "security"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 25}, {"key": "system_design", "weight": 25}, {"key": "reliability", "weight": 20}, {"key": "problem_solving", "weight": 20}, {"key": "communication", "weight": 10}], "passingScore": 65, "style": "standard"}'::jsonb,
  '[{"round": 1, "type": "online_test", "duration": 90, "focus": ["dsa"]}, {"round": 2, "type": "phone_screen", "duration": 60, "focus": ["coding"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["culture-fit"]}]'::jsonb,
  'Razorpay values payments domain knowledge. System design questions often involve financial systems (payment routing, reconciliation). Reliability and idempotency are key themes.'
FROM companies c WHERE c.name = 'Razorpay'
ON CONFLICT DO NOTHING;

-- Freshworks SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "saas", "multi-tenancy", "customer-focus"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "problem_solving", "weight": 20}, {"key": "customer_focus", "weight": 15}, {"key": "communication", "weight": 10}], "passingScore": 65, "style": "standard"}'::jsonb,
  '[{"round": 1, "type": "online_test", "duration": 90, "focus": ["dsa"]}, {"round": 2, "type": "phone_screen", "duration": 60, "focus": ["coding"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["system-design", "saas"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["hiring-manager"]}]'::jsonb,
  'Freshworks focuses on SaaS architecture. Expect questions about multi-tenancy, subscription billing, and customer-facing reliability. Chennai-based with global product mindset.'
FROM companies c WHERE c.name = 'Freshworks'
ON CONFLICT DO NOTHING;

-- Goldman Sachs SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "finance-domain", "low-latency", "problem-solving"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 30}, {"key": "problem_solving", "weight": 25}, {"key": "system_design", "weight": 20}, {"key": "finance_knowledge", "weight": 15}, {"key": "communication", "weight": 10}], "passingScore": 70, "style": "formal"}'::jsonb,
  '[{"round": 1, "type": "online_test", "duration": 120, "focus": ["dsa", "coding"]}, {"round": 2, "type": "phone_screen", "duration": 60, "focus": ["coding", "finance"]}, {"round": 3, "type": "superday", "duration": 45, "focus": ["coding"]}, {"round": 4, "type": "superday", "duration": 45, "focus": ["system-design"]}, {"round": 5, "type": "superday", "duration": 45, "focus": ["behavioral"]}, {"round": 6, "type": "superday", "duration": 45, "focus": ["culture-fit"]}]'::jsonb,
  'Goldman Sachs uses Superday format - multiple back-to-back interviews. Finance domain knowledge helps but not required. Low-latency systems are common design topics.'
FROM companies c WHERE c.name = 'Goldman Sachs'
ON CONFLICT DO NOTHING;

-- Uber SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "distributed-systems", "real-time", "problem-solving"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "problem_solving", "weight": 20}, {"key": "communication", "weight": 15}, {"key": "collaboration", "weight": 10}], "passingScore": 70, "style": "intensive"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["coding"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["coding"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["coding"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["system-design"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["behavioral"]}]'::jsonb,
  'Uber interviews focus on real-time distributed systems. Expect questions about ride matching, surge pricing, and location services. Two coding rounds test different skills.'
FROM companies c WHERE c.name = 'Uber'
ON CONFLICT DO NOTHING;

-- Airbnb SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "core-values", "belonging", "host-guest-empathy"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 25}, {"key": "core_values", "weight": 25}, {"key": "system_design", "weight": 20}, {"key": "problem_solving", "weight": 20}, {"key": "communication", "weight": 10}], "passingScore": 70, "style": "values-heavy"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["coding"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["coding"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["core-values"]}, {"round": 5, "type": "cross_functional", "duration": 45, "focus": ["collaboration", "values"]}]'::jsonb,
  'Airbnb heavily weights core values (Belong Anywhere, Be a Host). Cross-functional round includes non-engineers. System design often involves marketplace dynamics.'
FROM companies c WHERE c.name = 'Airbnb'
ON CONFLICT DO NOTHING;

-- Salesforce SWE Blueprints  
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "crm-domain", "trust", "customer-success"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "problem_solving", "weight": 20}, {"key": "customer_success", "weight": 15}, {"key": "communication", "weight": 10}], "passingScore": 65, "style": "conversational"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["coding"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["coding"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["values"]}]'::jsonb,
  'Salesforce uses Ohana culture values. Trust is the #1 value. Multi-tenant architecture knowledge helps. Customer Success mindset is evaluated throughout.'
FROM companies c WHERE c.name = 'Salesforce'
ON CONFLICT DO NOTHING;

-- LinkedIn SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "data-intensive", "graph", "growth-mindset"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "problem_solving", "weight": 20}, {"key": "collaboration", "weight": 15}, {"key": "growth_mindset", "weight": 10}], "passingScore": 65, "style": "conversational"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 45, "focus": ["coding"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["coding"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["hiring-manager"]}]'::jsonb,
  'LinkedIn (Microsoft) uses social graph problems in system design. Data-intensive systems are common topics. Growth mindset from Microsoft culture is valued.'
FROM companies c WHERE c.name = 'LinkedIn'
ON CONFLICT DO NOTHING;

-- Atlassian SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["coding", "system-design", "collaboration-tools", "values", "customer-focus"]'::jsonb,
  '{"dimensions": [{"key": "coding", "weight": 25}, {"key": "values", "weight": 25}, {"key": "system_design", "weight": 20}, {"key": "problem_solving", "weight": 20}, {"key": "communication", "weight": 10}], "passingScore": 65, "style": "values-heavy"}'::jsonb,
  '[{"round": 1, "type": "phone_screen", "duration": 60, "focus": ["coding", "values"]}, {"round": 2, "type": "onsite", "duration": 45, "focus": ["coding"]}, {"round": 3, "type": "onsite", "duration": 45, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["values"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["team-fit"]}]'::jsonb,
  'Atlassian heavily weights company values (Open company, no bullshit; Play as a team; Be the change). Values round is often a dealbreaker. Australian-friendly work culture.'
FROM companies c WHERE c.name = 'Atlassian'
ON CONFLICT DO NOTHING;

-- Swiggy SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["dsa", "system-design", "logistics", "real-time", "scale"]'::jsonb,
  '{"dimensions": [{"key": "dsa", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "problem_solving", "weight": 20}, {"key": "communication", "weight": 15}, {"key": "ownership", "weight": 10}], "passingScore": 65, "style": "standard"}'::jsonb,
  '[{"round": 1, "type": "online_test", "duration": 90, "focus": ["dsa"]}, {"round": 2, "type": "phone_screen", "duration": 60, "focus": ["dsa"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["machine-coding"]}, {"round": 4, "type": "onsite", "duration": 60, "focus": ["system-design"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["hiring-manager"]}]'::jsonb,
  'Swiggy uses machine coding rounds. System design focuses on logistics (delivery routing, ETA prediction, surge). India hyper-local market understanding is valued.'
FROM companies c WHERE c.name = 'Swiggy'
ON CONFLICT DO NOTHING;

-- Zomato SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["dsa", "system-design", "food-tech", "real-time", "consumer"]'::jsonb,
  '{"dimensions": [{"key": "dsa", "weight": 30}, {"key": "system_design", "weight": 25}, {"key": "problem_solving", "weight": 20}, {"key": "communication", "weight": 15}, {"key": "ownership", "weight": 10}], "passingScore": 65, "style": "standard"}'::jsonb,
  '[{"round": 1, "type": "online_test", "duration": 90, "focus": ["dsa"]}, {"round": 2, "type": "phone_screen", "duration": 60, "focus": ["dsa"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["system-design"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["culture-fit"]}]'::jsonb,
  'Zomato interviews focus on consumer tech at scale. System design covers restaurant discovery, ratings, and delivery. Startup mindset with attention to unit economics.'
FROM companies c WHERE c.name = 'Zomato'
ON CONFLICT DO NOTHING;

-- PhonePe SWE Blueprints
INSERT INTO company_role_blueprints (company_id, role_category, seniority, skill_focus, rubric_overrides, interview_rounds, notes)
SELECT c.id, 'swe', 'mid',
  '["dsa", "system-design", "payments", "upi", "reliability"]'::jsonb,
  '{"dimensions": [{"key": "dsa", "weight": 25}, {"key": "system_design", "weight": 25}, {"key": "reliability", "weight": 20}, {"key": "problem_solving", "weight": 20}, {"key": "communication", "weight": 10}], "passingScore": 65, "style": "standard"}'::jsonb,
  '[{"round": 1, "type": "online_test", "duration": 90, "focus": ["dsa"]}, {"round": 2, "type": "phone_screen", "duration": 60, "focus": ["dsa"]}, {"round": 3, "type": "onsite", "duration": 60, "focus": ["system-design", "payments"]}, {"round": 4, "type": "onsite", "duration": 45, "focus": ["behavioral"]}, {"round": 5, "type": "onsite", "duration": 45, "focus": ["hiring-manager"]}]'::jsonb,
  'PhonePe (Walmart-backed) focuses on UPI and payments. System design covers transaction processing, idempotency, and reconciliation. Reliability is a key evaluation criterion.'
FROM companies c WHERE c.name = 'PhonePe'
ON CONFLICT DO NOTHING;
