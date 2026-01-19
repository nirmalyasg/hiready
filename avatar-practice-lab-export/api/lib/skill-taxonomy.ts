/**
 * Skill Taxonomy System
 * 
 * Maps skills to categories and determines which skills are relevant
 * for each interview round type.
 */

// Skill categories that group related skills
export type SkillCategory = 
  | "programming"      // Languages, frameworks, coding
  | "data_sql"         // SQL, databases, data manipulation
  | "architecture"     // System design, infrastructure
  | "algorithms"       // Data structures, problem solving, complexity
  | "ml_ai"           // Machine learning, AI, models
  | "analytics"        // Data analysis, BI, visualization
  | "product"          // Product management, strategy, roadmaps
  | "business"         // Business acumen, cases, strategy
  | "leadership"       // Management, team leading, mentoring
  | "communication"    // Soft skills, presentation, collaboration
  | "process"          // Methodologies, workflows, debugging
  | "domain"           // Industry/domain specific knowledge
  | "tools"            // Specific tools and platforms
  | "design"           // UX/UI, visual design, research
  | "sales";           // Sales, negotiation, persuasion

// Map of skill names (lowercase) to their categories
// A skill can belong to multiple categories
export const SKILL_TO_CATEGORIES: Record<string, SkillCategory[]> = {
  // Programming languages
  "python": ["programming"],
  "java": ["programming"],
  "javascript": ["programming"],
  "typescript": ["programming"],
  "c++": ["programming"],
  "c#": ["programming"],
  "go": ["programming"],
  "golang": ["programming"],
  "rust": ["programming"],
  "ruby": ["programming"],
  "php": ["programming"],
  "swift": ["programming"],
  "kotlin": ["programming"],
  "scala": ["programming"],
  "r": ["programming", "analytics"],
  
  // Web frameworks
  "react": ["programming"],
  "angular": ["programming"],
  "vue": ["programming"],
  "vue.js": ["programming"],
  "node.js": ["programming"],
  "nodejs": ["programming"],
  "express": ["programming"],
  "django": ["programming"],
  "flask": ["programming"],
  "spring": ["programming"],
  "spring boot": ["programming"],
  ".net": ["programming"],
  "asp.net": ["programming"],
  
  // SQL & Databases
  "sql": ["data_sql"],
  "mysql": ["data_sql"],
  "postgresql": ["data_sql"],
  "postgres": ["data_sql"],
  "oracle": ["data_sql"],
  "sql server": ["data_sql"],
  "mongodb": ["data_sql"],
  "redis": ["data_sql"],
  "cassandra": ["data_sql"],
  "dynamodb": ["data_sql"],
  "database design": ["data_sql", "architecture"],
  "data modeling": ["data_sql", "architecture"],
  "query optimization": ["data_sql"],
  "database administration": ["data_sql"],
  "nosql": ["data_sql"],
  
  // Data Engineering
  "etl": ["data_sql", "process"],
  "etl/elt": ["data_sql", "process"],
  "elt": ["data_sql", "process"],
  "data pipelines": ["data_sql", "architecture"],
  "data warehousing": ["data_sql", "architecture"],
  "spark": ["data_sql", "analytics"],
  "apache spark": ["data_sql", "analytics"],
  "airflow": ["data_sql", "tools"],
  "kafka": ["data_sql", "architecture"],
  "hadoop": ["data_sql", "tools"],
  "snowflake": ["data_sql", "tools"],
  "databricks": ["data_sql", "tools"],
  "dbt": ["data_sql", "tools"],
  
  // System Design & Architecture
  "system design": ["architecture"],
  "microservices": ["architecture"],
  "api design": ["architecture", "programming"],
  "rest api": ["architecture", "programming"],
  "graphql": ["architecture", "programming"],
  "distributed systems": ["architecture"],
  "scalability": ["architecture"],
  "high availability": ["architecture"],
  "load balancing": ["architecture"],
  "caching": ["architecture"],
  "message queues": ["architecture"],
  "event-driven": ["architecture"],
  "serverless": ["architecture"],
  
  // Cloud & Infrastructure
  "aws": ["tools", "architecture"],
  "azure": ["tools", "architecture"],
  "gcp": ["tools", "architecture"],
  "google cloud": ["tools", "architecture"],
  "docker": ["tools", "architecture"],
  "kubernetes": ["tools", "architecture"],
  "k8s": ["tools", "architecture"],
  "terraform": ["tools", "architecture"],
  "ci/cd": ["tools", "process"],
  "jenkins": ["tools"],
  "github actions": ["tools"],
  "devops": ["process", "tools"],
  
  // Algorithms & Problem Solving
  "algorithms": ["algorithms"],
  "data structures": ["algorithms"],
  "problem solving": ["algorithms"],
  "complexity analysis": ["algorithms"],
  "dynamic programming": ["algorithms"],
  "graph algorithms": ["algorithms"],
  "sorting": ["algorithms"],
  "searching": ["algorithms"],
  "recursion": ["algorithms"],
  "optimization": ["algorithms"],
  
  // ML & AI
  "machine learning": ["ml_ai"],
  "deep learning": ["ml_ai"],
  "neural networks": ["ml_ai"],
  "nlp": ["ml_ai"],
  "natural language processing": ["ml_ai"],
  "computer vision": ["ml_ai"],
  "tensorflow": ["ml_ai", "tools"],
  "pytorch": ["ml_ai", "tools"],
  "scikit-learn": ["ml_ai", "tools"],
  "model training": ["ml_ai"],
  "model deployment": ["ml_ai"],
  "feature engineering": ["ml_ai", "analytics"],
  "hyperparameter tuning": ["ml_ai"],
  "a/b testing": ["ml_ai", "analytics"],
  "llm": ["ml_ai"],
  "generative ai": ["ml_ai"],
  "prompt engineering": ["ml_ai"],
  
  // Analytics & BI
  "data analysis": ["analytics"],
  "statistical analysis": ["analytics"],
  "statistics": ["analytics"],
  "data visualization": ["analytics"],
  "tableau": ["analytics", "tools"],
  "power bi": ["analytics", "tools"],
  "looker": ["analytics", "tools"],
  "excel": ["analytics", "tools"],
  "reporting": ["analytics"],
  "dashboards": ["analytics"],
  "metrics": ["analytics", "product"],
  "kpis": ["analytics", "product"],
  "insight generation": ["analytics"],
  "business intelligence": ["analytics"],
  "pandas": ["analytics", "programming"],
  "numpy": ["analytics", "programming"],
  
  // Product Management
  "product strategy": ["product"],
  "product roadmap": ["product"],
  "product development": ["product"],
  "user research": ["product", "design"],
  "customer discovery": ["product"],
  "market research": ["product", "business"],
  "competitive analysis": ["product", "business"],
  "prioritization": ["product"],
  "backlog management": ["product"],
  "product thinking": ["product"],
  "user stories": ["product"],
  "requirements gathering": ["product"],
  "product launch": ["product"],
  "go-to-market": ["product", "business"],
  "feature specification": ["product"],
  
  // Business & Strategy
  "business acumen": ["business"],
  "business strategy": ["business"],
  "financial analysis": ["business", "analytics"],
  "roi analysis": ["business", "analytics"],
  "cost-benefit analysis": ["business"],
  "market sizing": ["business"],
  "business cases": ["business"],
  "consulting": ["business"],
  "case studies": ["business"],
  "strategic planning": ["business"],
  "stakeholder management": ["business", "communication"],
  "vendor management": ["business"],
  "contract negotiation": ["business", "sales"],
  "budgeting": ["business"],
  "p&l management": ["business", "leadership"],
  
  // Leadership & Management
  "leadership": ["leadership"],
  "team management": ["leadership"],
  "people management": ["leadership"],
  "mentoring": ["leadership"],
  "coaching": ["leadership"],
  "performance management": ["leadership"],
  "hiring": ["leadership"],
  "talent development": ["leadership"],
  "delegation": ["leadership"],
  "decision making": ["leadership"],
  "conflict resolution": ["leadership", "communication"],
  "cross-functional leadership": ["leadership"],
  "change management": ["leadership", "process"],
  "organizational design": ["leadership"],
  
  // Communication & Soft Skills
  "communication": ["communication"],
  "presentation": ["communication"],
  "public speaking": ["communication"],
  "written communication": ["communication"],
  "storytelling": ["communication"],
  "collaboration": ["communication"],
  "teamwork": ["communication"],
  "interpersonal skills": ["communication"],
  "active listening": ["communication"],
  "negotiation": ["communication", "sales"],
  "influence": ["communication", "leadership"],
  "empathy": ["communication"],
  "emotional intelligence": ["communication"],
  "feedback": ["communication"],
  "star method": ["communication"],
  "adaptability": ["communication"],
  "time management": ["communication", "process"],
  "critical thinking": ["communication", "algorithms"],
  
  // Process & Methodology
  "agile": ["process"],
  "scrum": ["process"],
  "kanban": ["process"],
  "lean": ["process"],
  "waterfall": ["process"],
  "project management": ["process"],
  "program management": ["process"],
  "risk management": ["process"],
  "quality assurance": ["process"],
  "testing": ["process", "programming"],
  "debugging": ["process", "programming"],
  "code review": ["process", "programming"],
  "documentation": ["process"],
  "root cause analysis": ["process"],
  "troubleshooting": ["process"],
  "incident management": ["process"],
  "sla management": ["process"],
  
  // Design & UX
  "ux design": ["design"],
  "ui design": ["design"],
  "user experience": ["design"],
  "user interface": ["design"],
  "wireframing": ["design"],
  "prototyping": ["design"],
  "figma": ["design", "tools"],
  "sketch": ["design", "tools"],
  "adobe xd": ["design", "tools"],
  "design systems": ["design"],
  "accessibility": ["design"],
  "usability testing": ["design"],
  "information architecture": ["design"],
  "interaction design": ["design"],
  "visual design": ["design"],
  "responsive design": ["design"],
  "design thinking": ["design", "process"],
  
  // Sales & Business Development
  "sales": ["sales"],
  "account management": ["sales"],
  "business development": ["sales", "business"],
  "lead generation": ["sales"],
  "pipeline management": ["sales"],
  "crm": ["sales", "tools"],
  "salesforce": ["sales", "tools"],
  "objection handling": ["sales", "communication"],
  "closing": ["sales"],
  "value proposition": ["sales", "product"],
  "customer success": ["sales", "communication"],
  "relationship building": ["sales", "communication"],
  "cold calling": ["sales"],
  "prospecting": ["sales"],
  
  // Domain/Industry
  "healthcare": ["domain"],
  "fintech": ["domain"],
  "e-commerce": ["domain"],
  "saas": ["domain"],
  "enterprise": ["domain"],
  "security": ["domain", "architecture"],
  "compliance": ["domain", "process"],
  "gdpr": ["domain"],
  "hipaa": ["domain"],
  "sox": ["domain"],
};

// Map interview round types to relevant skill categories
// Listed in priority order - first categories are most relevant
export const ROUND_TO_CATEGORIES: Record<string, SkillCategory[]> = {
  technical: ["architecture", "programming", "algorithms", "tools"],
  coding: ["programming", "algorithms", "data_sql"],
  sql: ["data_sql", "analytics", "architecture"],
  behavioral: ["communication", "leadership", "process"],
  hiring_manager: ["leadership", "communication", "business", "domain"],
  hr: ["communication", "leadership", "process"],
  case: ["business", "analytics", "product", "communication"],
  product: ["product", "analytics", "business", "design"],
  analytics: ["analytics", "data_sql", "business"],
  ml: ["ml_ai", "algorithms", "programming", "analytics"],
  portfolio: ["design", "communication", "product"],
  sales_roleplay: ["sales", "communication", "business"],
  aptitude: ["algorithms", "analytics", "communication"],
  group: ["communication", "leadership", "collaboration"],
};

/**
 * Normalize a skill name for lookup (lowercase, trim)
 */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim();
}

/**
 * Get categories for a skill, with fuzzy matching support
 */
export function getSkillCategories(skill: string): SkillCategory[] {
  const normalized = normalizeSkill(skill);
  
  // Direct match
  if (SKILL_TO_CATEGORIES[normalized]) {
    return SKILL_TO_CATEGORIES[normalized];
  }
  
  // Partial match - check if skill contains any known skill name
  for (const [knownSkill, categories] of Object.entries(SKILL_TO_CATEGORIES)) {
    if (normalized.includes(knownSkill) || knownSkill.includes(normalized)) {
      return categories;
    }
  }
  
  // Default to empty - skill has no known category
  return [];
}

/**
 * Calculate relevance score for a skill to a round type
 * Higher score = more relevant
 */
export function getSkillRelevanceScore(skill: string, roundType: string): number {
  const skillCategories = getSkillCategories(skill);
  const roundCategories = ROUND_TO_CATEGORIES[roundType] || [];
  
  if (skillCategories.length === 0 || roundCategories.length === 0) {
    return 0;
  }
  
  let score = 0;
  for (const skillCat of skillCategories) {
    const priorityIndex = roundCategories.indexOf(skillCat);
    if (priorityIndex !== -1) {
      // Higher priority categories (lower index) get higher scores
      score += (roundCategories.length - priorityIndex);
    }
  }
  
  return score;
}

/**
 * Get the most relevant skills from a list for a specific interview round type
 * Returns skills sorted by relevance, limited to count
 */
export function getSkillsForRound(
  roleSkills: string[],
  roundType: string,
  count: number = 3
): string[] {
  if (roleSkills.length === 0) {
    return [];
  }
  
  // Score each skill for this round type
  const scoredSkills = roleSkills.map(skill => ({
    skill,
    score: getSkillRelevanceScore(skill, roundType),
    originalIndex: roleSkills.indexOf(skill),
  }));
  
  // Sort by score (descending), then by original order for ties
  scoredSkills.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.originalIndex - b.originalIndex;
  });
  
  // If no skills have relevance score, fall back to returning in original order
  const hasRelevantSkills = scoredSkills.some(s => s.score > 0);
  
  if (!hasRelevantSkills) {
    // Return first `count` skills in original order
    return roleSkills.slice(0, count);
  }
  
  // Return top scoring skills
  return scoredSkills.slice(0, count).map(s => s.skill);
}

/**
 * Get default skills for a round type when no role skills are available
 */
export function getDefaultSkillsForRound(roundType: string): string[] {
  const defaults: Record<string, string[]> = {
    technical: ["Problem Solving", "System Design", "Technical Depth"],
    coding: ["Data Structures", "Algorithms", "Code Quality"],
    sql: ["SQL Queries", "Query Optimization", "Database Design"],
    behavioral: ["STAR Method", "Collaboration", "Conflict Resolution"],
    hiring_manager: ["Leadership", "Communication", "Team Fit"],
    hr: ["Communication", "Cultural Fit", "Career Goals"],
    case: ["Structured Thinking", "Business Acumen", "Analysis"],
    product: ["Product Thinking", "Prioritization", "User Empathy"],
    analytics: ["Data Analysis", "Metric Definition", "Insight Generation"],
    ml: ["ML Algorithms", "Model Design", "Feature Engineering"],
    portfolio: ["Design Process", "Storytelling", "Visual Communication"],
    sales_roleplay: ["Persuasion", "Objection Handling", "Value Proposition"],
    aptitude: ["Logical Reasoning", "Quantitative Skills", "Verbal Ability"],
    group: ["Communication", "Teamwork", "Active Listening"],
  };
  
  return defaults[roundType] || ["Communication", "Problem Solving", "Adaptability"];
}
