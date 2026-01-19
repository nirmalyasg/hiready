import OpenAI from "openai";

export interface SkillTag {
  skill: string;
  category: "language" | "framework" | "tool" | "concept" | "domain" | "soft_skill";
  weight: number;
  source: "jd" | "resume" | "role_kit" | "inferred";
}

export interface CapabilityProfile {
  skills: SkillTag[];
  primaryLanguages: string[];
  frameworks: string[];
  domains: string[];
  seniorityLevel: "junior" | "mid" | "senior" | "lead";
  combinedRequirements: string[];
}

const SKILL_SYNONYMS: Record<string, string[]> = {
  "javascript": ["js", "ecmascript", "es6", "es2015", "vanilla js"],
  "typescript": ["ts"],
  "nodejs": ["node", "node.js", "express", "express.js", "nestjs"],
  "react": ["reactjs", "react.js", "react native", "jsx"],
  "python": ["py", "python3", "django", "flask", "fastapi"],
  "api": ["rest", "restful", "graphql", "api design", "api integration", "web services"],
  "database": ["sql", "postgresql", "postgres", "mysql", "mongodb", "nosql", "orm", "drizzle", "prisma"],
  "testing": ["unit testing", "jest", "pytest", "testing frameworks", "tdd", "bdd", "cypress"],
  "devops": ["ci/cd", "docker", "kubernetes", "k8s", "aws", "gcp", "azure", "cloud"],
  "git": ["version control", "github", "gitlab", "bitbucket"],
  "agile": ["scrum", "kanban", "sprint", "jira"],
};

function normalizeSkillName(skill: string): string {
  const lower = skill.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    if (synonyms.includes(lower) || lower === canonical) {
      return canonical;
    }
  }
  return lower;
}

function categorizeSkill(skill: string): SkillTag["category"] {
  const lower = skill.toLowerCase();
  
  const languages = ["javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "ruby", "php", "swift", "kotlin"];
  const frameworks = ["react", "angular", "vue", "nodejs", "express", "django", "flask", "spring", "rails", "nextjs", "nestjs"];
  const tools = ["git", "docker", "kubernetes", "jenkins", "terraform", "webpack", "vite", "npm", "yarn", "salesforce", "hubspot", "tableau", "power bi", "figma", "jira"];
  const concepts = ["api", "testing", "devops", "microservices", "architecture", "algorithms", "data structures", "design patterns", "agile", "scrum", "kanban"];
  const domains = [
    "frontend", "backend", "fullstack", "mobile", "cloud", "ml", "ai", "data science", "security",
    "sales", "marketing", "finance", "operations", "hr", "consulting", "product", "design",
    "data analysis", "business intelligence", "machine learning", "deep learning"
  ];
  const softSkills = [
    "leadership", "communication", "negotiation", "presentation", "collaboration",
    "stakeholder management", "relationship", "strategic thinking", "problem solving",
    "coaching", "mentoring", "influence", "decision making", "storytelling"
  ];
  
  if (languages.some(l => lower.includes(l))) return "language";
  if (frameworks.some(f => lower.includes(f))) return "framework";
  if (tools.some(t => lower.includes(t))) return "tool";
  if (concepts.some(c => lower.includes(c))) return "concept";
  if (domains.some(d => lower.includes(d))) return "domain";
  if (softSkills.some(s => lower.includes(s))) return "soft_skill";
  return "soft_skill";
}

export function extractSkillsFromText(text: string, source: SkillTag["source"]): SkillTag[] {
  const skillPatterns = [
    // Technical - Programming Languages
    /\b(JavaScript|TypeScript|Python|Java|Go|Rust|C\+\+|C#|Ruby|PHP|Swift|Kotlin)\b/gi,
    // Technical - Frameworks
    /\b(React|Angular|Vue|Node\.?js|Express|Django|Flask|Spring|Rails|Next\.?js|Nest\.?js)\b/gi,
    // Technical - Infrastructure & Tools
    /\b(REST|GraphQL|API|SQL|PostgreSQL|MongoDB|Redis|Docker|Kubernetes|AWS|GCP|Azure)\b/gi,
    /\b(Git|CI\/CD|Jenkins|Terraform|Webpack|Vite|Jest|Pytest|Cypress)\b/gi,
    /\b(microservices?|serverless|cloud native|distributed systems?)\b/gi,
    /\b(unit testing|integration testing|e2e testing|TDD|BDD)\b/gi,
    /\b(Agile|Scrum|Kanban|DevOps|SRE)\b/gi,
    
    // Data & Analytics
    /\b(data analysis|data analytics|business intelligence|BI|Tableau|Power BI|Looker)\b/gi,
    /\b(machine learning|ML|deep learning|AI|artificial intelligence|NLP|computer vision)\b/gi,
    /\b(ETL|data pipeline|data warehouse|Snowflake|Databricks|Spark|Hadoop)\b/gi,
    /\b(statistical analysis|A\/B testing|experimentation|predictive modeling)\b/gi,
    
    // Sales & Business Development
    /\b(sales|business development|revenue growth|pipeline management|quota)\b/gi,
    /\b(account management|key accounts|strategic accounts|enterprise sales|B2B sales)\b/gi,
    /\b(client relationship|customer relationship|relationship building|client success)\b/gi,
    /\b(negotiation|deal closing|contract negotiation|pricing strategy)\b/gi,
    /\b(CRM|Salesforce|HubSpot|sales enablement|sales operations)\b/gi,
    /\b(prospecting|lead generation|cold calling|outbound sales)\b/gi,
    
    // Strategy & Consulting
    /\b(strategic planning|business strategy|corporate strategy|go-to-market|GTM)\b/gi,
    /\b(market analysis|competitive analysis|market research|industry analysis)\b/gi,
    /\b(consulting|advisory|problem solving|analytical thinking)\b/gi,
    /\b(business case|ROI analysis|financial modeling|P&L|profit and loss)\b/gi,
    
    // Leadership & Management
    /\b(leadership|team leadership|people management|team management)\b/gi,
    /\b(stakeholder management|executive engagement|C-suite|senior leadership)\b/gi,
    /\b(cross-functional|collaboration|influence|change management)\b/gi,
    /\b(coaching|mentoring|talent development|performance management)\b/gi,
    /\b(decision making|strategic thinking|critical thinking)\b/gi,
    
    // Communication & Presentation
    /\b(communication skills?|presentation skills?|public speaking)\b/gi,
    /\b(written communication|verbal communication|storytelling)\b/gi,
    /\b(executive presentation|board presentation|client presentation)\b/gi,
    
    // Product & Design
    /\b(product management|product strategy|product roadmap|product lifecycle)\b/gi,
    /\b(user research|user experience|UX|UI|design thinking)\b/gi,
    /\b(requirements gathering|PRD|product requirements|specifications)\b/gi,
    /\b(prototyping|wireframing|Figma|Sketch|user testing)\b/gi,
    
    // Operations & Process
    /\b(operations management|process improvement|operational excellence)\b/gi,
    /\b(supply chain|logistics|inventory management|procurement)\b/gi,
    /\b(project management|program management|PMP|portfolio management)\b/gi,
    /\b(Six Sigma|Lean|Kaizen|process optimization|efficiency)\b/gi,
    
    // Finance & Analysis
    /\b(financial analysis|budgeting|forecasting|variance analysis)\b/gi,
    /\b(FP&A|financial planning|cost analysis|margin analysis)\b/gi,
    /\b(valuation|due diligence|M&A|mergers and acquisitions)\b/gi,
    
    // Marketing
    /\b(marketing strategy|digital marketing|content marketing|brand management)\b/gi,
    /\b(SEO|SEM|paid media|social media marketing|growth marketing)\b/gi,
    /\b(demand generation|lead nurturing|marketing automation|campaign management)\b/gi,
    
    // HR & Recruiting
    /\b(talent acquisition|recruiting|hiring|interviewing)\b/gi,
    /\b(compensation|benefits|total rewards|HRIS)\b/gi,
    /\b(employee engagement|culture|organizational development|learning & development)\b/gi,
  ];

  const skills: Map<string, SkillTag> = new Map();

  for (const pattern of skillPatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      const normalized = normalizeSkillName(match);
      if (!skills.has(normalized)) {
        skills.set(normalized, {
          skill: normalized,
          category: categorizeSkill(normalized),
          weight: 1,
          source,
        });
      } else {
        const existing = skills.get(normalized)!;
        existing.weight += 0.5;
      }
    }
  }

  return Array.from(skills.values());
}

export function combineSkillProfiles(
  jdSkills: SkillTag[],
  resumeSkills: SkillTag[],
  roleKitSkills: string[]
): CapabilityProfile {
  const skillMap: Map<string, SkillTag> = new Map();

  for (const skill of jdSkills) {
    skill.weight *= 1.5;
    skillMap.set(skill.skill, skill);
  }

  for (const skill of resumeSkills) {
    if (skillMap.has(skill.skill)) {
      const existing = skillMap.get(skill.skill)!;
      existing.weight += skill.weight;
    } else {
      skillMap.set(skill.skill, skill);
    }
  }

  for (const skillName of roleKitSkills) {
    const normalized = normalizeSkillName(skillName);
    if (skillMap.has(normalized)) {
      const existing = skillMap.get(normalized)!;
      existing.weight += 0.5;
    } else {
      skillMap.set(normalized, {
        skill: normalized,
        category: categorizeSkill(normalized),
        weight: 0.5,
        source: "role_kit",
      });
    }
  }

  const allSkills = Array.from(skillMap.values()).sort((a, b) => b.weight - a.weight);

  const primaryLanguages = allSkills
    .filter(s => s.category === "language")
    .slice(0, 3)
    .map(s => s.skill);

  const frameworks = allSkills
    .filter(s => s.category === "framework")
    .slice(0, 3)
    .map(s => s.skill);

  const domains = allSkills
    .filter(s => s.category === "domain")
    .slice(0, 2)
    .map(s => s.skill);

  const combinedRequirements: string[] = [];
  const topSkills = allSkills.slice(0, 5);
  for (let i = 0; i < topSkills.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 2, topSkills.length); j++) {
      combinedRequirements.push(`${topSkills[i].skill} + ${topSkills[j].skill}`);
    }
  }

  return {
    skills: allSkills,
    primaryLanguages,
    frameworks,
    domains,
    seniorityLevel: determineSeniorityLevel(allSkills),
    combinedRequirements: combinedRequirements.slice(0, 5),
  };
}

function determineSeniorityLevel(skills: SkillTag[]): CapabilityProfile["seniorityLevel"] {
  const conceptSkills = skills.filter(s => s.category === "concept" || s.category === "domain");
  const totalWeight = skills.reduce((sum, s) => sum + s.weight, 0);
  
  if (conceptSkills.length >= 5 && totalWeight > 20) return "lead";
  if (conceptSkills.length >= 3 && totalWeight > 15) return "senior";
  if (totalWeight > 8) return "mid";
  return "junior";
}

export async function generateCompositeProblem(
  profile: CapabilityProfile,
  existingExercises: { name: string; activityType: string }[],
  openai: OpenAI
): Promise<{
  title: string;
  description: string;
  activityType: "explain" | "debug" | "modify";
  language: string;
  difficulty: "easy" | "medium" | "hard";
  codeSnippet: string;
  expectedBehavior: string;
  skillsCovered: string[];
}> {
  const topSkills = profile.skills.slice(0, 4).map(s => s.skill);
  const primaryLanguage = profile.primaryLanguages[0] || "javascript";
  const combination = profile.combinedRequirements[0] || topSkills.join(" + ");

  const prompt = `Generate a coding exercise that tests multiple skills together: ${combination}.

Target language: ${primaryLanguage}
Difficulty: ${profile.seniorityLevel === "junior" ? "easy" : profile.seniorityLevel === "senior" || profile.seniorityLevel === "lead" ? "hard" : "medium"}
Skills to combine: ${topSkills.join(", ")}

Existing exercises to avoid duplicating:
${existingExercises.map(e => `- ${e.name} (${e.activityType})`).join("\n")}

Create a realistic, practical problem that:
1. Tests at least 2 of the listed skills together
2. Is based on a real-world scenario
3. Has clear success criteria
4. Takes 15-20 minutes to complete

Return JSON with this structure:
{
  "title": "Problem title",
  "description": "Detailed problem description with context",
  "activityType": "explain" | "debug" | "modify",
  "language": "${primaryLanguage}",
  "difficulty": "easy" | "medium" | "hard",
  "codeSnippet": "The code to work with (properly escaped)",
  "expectedBehavior": "What the correct solution should do",
  "skillsCovered": ["skill1", "skill2"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  
  return {
    title: result.title || `${combination} Challenge`,
    description: result.description || `Apply your ${combination} skills to solve this problem.`,
    activityType: result.activityType || "explain",
    language: result.language || primaryLanguage,
    difficulty: result.difficulty || "medium",
    codeSnippet: result.codeSnippet || "// Your code here",
    expectedBehavior: result.expectedBehavior || "Complete the task successfully",
    skillsCovered: result.skillsCovered || topSkills,
  };
}

export function matchExercisesToProfile(
  exercises: Array<{
    id: number;
    name: string;
    activityType: string;
    language: string;
    difficulty: string;
    codeSnippet: string;
  }>,
  profile: CapabilityProfile
): Array<{ exercise: typeof exercises[0]; score: number; matchedSkills: string[] }> {
  const results: Array<{ exercise: typeof exercises[0]; score: number; matchedSkills: string[] }> = [];

  for (const exercise of exercises) {
    let score = 0;
    const matchedSkills: string[] = [];
    const exerciseText = `${exercise.name} ${exercise.codeSnippet}`.toLowerCase();

    for (const skill of profile.skills) {
      const skillLower = skill.skill.toLowerCase();
      if (exerciseText.includes(skillLower)) {
        score += skill.weight;
        matchedSkills.push(skill.skill);
      }
    }

    const exerciseLanguageLower = exercise.language.toLowerCase();
    if (profile.primaryLanguages.some(lang => lang.toLowerCase() === exerciseLanguageLower)) {
      score += 2;
    }

    if (matchedSkills.length >= 2) {
      score += 3;
    }

    results.push({ exercise, score, matchedSkills });
  }

  return results.sort((a, b) => b.score - a.score);
}

// ============================================================================
// SKILL-TO-INTERVIEW-TYPE MAPPING
// Dynamically determines interview types based on JD-extracted skills
// ============================================================================

export type InterviewType = 
  | "hr" 
  | "hiring_manager" 
  | "technical" 
  | "behavioral" 
  | "case_study" 
  | "coding" 
  | "system_design" 
  | "sql" 
  | "analytics" 
  | "product_sense"
  | "panel";

interface InterviewTypeConfig {
  type: InterviewType;
  label: string;
  description: string;
  triggerSkills: string[];  // Skills that suggest this interview type
  triggerDomains: string[]; // Domains that suggest this interview type
  weight: number;           // Base weight for prioritization
  minSkillMatches: number;  // Minimum skill matches to include
}

const INTERVIEW_TYPE_CONFIGS: InterviewTypeConfig[] = [
  {
    type: "hr",
    label: "HR Screening",
    description: "Culture fit, motivation, and basic qualifications",
    triggerSkills: [], // Always included as baseline
    triggerDomains: [],
    weight: 1,
    minSkillMatches: 0,
  },
  {
    type: "behavioral",
    label: "Behavioral Interview",
    description: "STAR-format questions about past experiences",
    triggerSkills: [
      "leadership", "team leadership", "people management", "coaching", "mentoring",
      "collaboration", "cross-functional", "stakeholder management", "communication",
      "conflict resolution", "influence", "decision making"
    ],
    triggerDomains: ["leadership", "management", "hr"],
    weight: 2,
    minSkillMatches: 1,
  },
  {
    type: "hiring_manager",
    label: "Hiring Manager Interview",
    description: "Role fit, team dynamics, and domain expertise",
    triggerSkills: [
      "strategic thinking", "problem solving", "analytical thinking",
      "stakeholder management", "executive engagement", "cross-functional"
    ],
    triggerDomains: [],
    weight: 2,
    minSkillMatches: 0, // Often included regardless
  },
  {
    type: "case_study",
    label: "Case Study",
    description: "Business problem solving and structured thinking",
    triggerSkills: [
      "consulting", "business case", "strategic planning", "market analysis",
      "competitive analysis", "problem solving", "analytical thinking",
      "roi analysis", "financial modeling", "business strategy",
      "negotiation", "deal closing", "account management", "strategic accounts",
      "sales", "business development", "revenue growth"
    ],
    triggerDomains: ["consulting", "strategy", "sales", "business development"],
    weight: 3,
    minSkillMatches: 2,
  },
  {
    type: "technical",
    label: "Technical Interview",
    description: "Deep-dive into technical skills and knowledge",
    triggerSkills: [
      "javascript", "typescript", "python", "java", "go", "rust",
      "react", "angular", "vue", "nodejs", "django", "flask",
      "api", "rest", "graphql", "database", "sql", "mongodb",
      "docker", "kubernetes", "aws", "gcp", "azure",
      "microservices", "distributed systems", "architecture"
    ],
    triggerDomains: ["software", "engineering", "tech", "data", "ml", "ai"],
    weight: 3,
    minSkillMatches: 2,
  },
  {
    type: "coding",
    label: "Coding Assessment",
    description: "Live coding, algorithms, and data structures",
    triggerSkills: [
      "javascript", "typescript", "python", "java", "go", "rust", "c++", "c#",
      "algorithms", "data structures", "coding", "programming"
    ],
    triggerDomains: ["software", "engineering", "backend", "fullstack"],
    weight: 3,
    minSkillMatches: 2,
  },
  {
    type: "system_design",
    label: "System Design",
    description: "Architecture and scalability discussions",
    triggerSkills: [
      "architecture", "system design", "distributed systems", "microservices",
      "scalability", "api", "database", "cloud", "aws", "gcp", "kubernetes"
    ],
    triggerDomains: ["software", "engineering", "infrastructure", "platform"],
    weight: 3,
    minSkillMatches: 3,
  },
  {
    type: "sql",
    label: "SQL Assessment",
    description: "Database queries and data manipulation",
    triggerSkills: [
      "sql", "postgresql", "mysql", "database", "data warehouse",
      "etl", "data pipeline", "snowflake", "databricks"
    ],
    triggerDomains: ["data", "analytics", "business intelligence"],
    weight: 2,
    minSkillMatches: 2,
  },
  {
    type: "analytics",
    label: "Analytics Case",
    description: "Data analysis and insights generation",
    triggerSkills: [
      "data analysis", "data analytics", "business intelligence", "tableau",
      "power bi", "statistical analysis", "a/b testing", "experimentation",
      "predictive modeling", "excel", "data visualization"
    ],
    triggerDomains: ["data", "analytics", "business intelligence"],
    weight: 3,
    minSkillMatches: 2,
  },
  {
    type: "product_sense",
    label: "Product Sense",
    description: "Product thinking, user empathy, and prioritization",
    triggerSkills: [
      "product management", "product strategy", "product roadmap",
      "user research", "user experience", "requirements gathering",
      "prd", "prioritization", "design thinking"
    ],
    triggerDomains: ["product", "design", "ux"],
    weight: 3,
    minSkillMatches: 2,
  },
  {
    type: "panel",
    label: "Panel Interview",
    description: "Multi-stakeholder interview with leadership team",
    triggerSkills: [
      "executive engagement", "c-suite", "senior leadership",
      "board presentation", "stakeholder management"
    ],
    triggerDomains: ["executive", "leadership", "director", "vp"],
    weight: 2,
    minSkillMatches: 2,
  },
];

export interface DerivedInterviewType {
  type: InterviewType;
  label: string;
  description: string;
  confidence: "high" | "medium" | "low";
  matchedSkills: string[];
  score: number;
}

export interface InterviewTypeDerivation {
  recommendedTypes: DerivedInterviewType[];
  allMatchedSkills: string[];
  skillCategories: {
    technical: string[];
    business: string[];
    leadership: string[];
    communication: string[];
  };
  derivationReason: string;
}

/**
 * Derives recommended interview types based on skills extracted from JD text
 * @param jdText - Raw job description text
 * @param roleTitle - Job title for additional context
 * @param roleLevel - Seniority level (entry, mid, senior, director, etc.)
 */
export function deriveInterviewTypesFromSkills(
  jdText: string,
  roleTitle: string,
  roleLevel?: string | null
): InterviewTypeDerivation {
  // Extract skills from JD
  const extractedSkills = extractSkillsFromText(jdText, "jd");
  const skillSet = new Set(extractedSkills.map(s => s.skill.toLowerCase()));
  
  // Also check role title for additional context
  const titleLower = roleTitle.toLowerCase();
  
  // Categorize skills for reporting
  const skillCategories = {
    technical: extractedSkills.filter(s => 
      s.category === "language" || s.category === "framework" || s.category === "tool"
    ).map(s => s.skill),
    business: extractedSkills.filter(s => 
      s.skill.toLowerCase().includes("sales") ||
      s.skill.toLowerCase().includes("business") ||
      s.skill.toLowerCase().includes("strategy") ||
      s.skill.toLowerCase().includes("consulting") ||
      s.skill.toLowerCase().includes("finance") ||
      s.skill.toLowerCase().includes("account") ||
      s.skill.toLowerCase().includes("negotiation")
    ).map(s => s.skill),
    leadership: extractedSkills.filter(s => 
      s.skill.toLowerCase().includes("leadership") ||
      s.skill.toLowerCase().includes("management") ||
      s.skill.toLowerCase().includes("coaching") ||
      s.skill.toLowerCase().includes("mentoring")
    ).map(s => s.skill),
    communication: extractedSkills.filter(s => 
      s.skill.toLowerCase().includes("communication") ||
      s.skill.toLowerCase().includes("presentation") ||
      s.skill.toLowerCase().includes("stakeholder")
    ).map(s => s.skill),
  };
  
  // Score each interview type based on skill matches
  const scoredTypes: DerivedInterviewType[] = [];
  
  for (const config of INTERVIEW_TYPE_CONFIGS) {
    const matchedSkills: string[] = [];
    let score = config.weight;
    
    // Check skill matches
    for (const triggerSkill of config.triggerSkills) {
      const triggerLower = triggerSkill.toLowerCase();
      // Check if any extracted skill contains this trigger
      for (const skill of skillSet) {
        if (skill.includes(triggerLower) || triggerLower.includes(skill)) {
          matchedSkills.push(skill);
          score += 1;
        }
      }
      // Also check JD text directly for phrases
      if (jdText.toLowerCase().includes(triggerLower)) {
        score += 0.5;
      }
    }
    
    // Check domain matches from title
    for (const domain of config.triggerDomains) {
      if (titleLower.includes(domain)) {
        score += 2;
      }
    }
    
    // Boost for senior roles
    if (roleLevel && ["senior", "director", "vp", "executive"].includes(roleLevel)) {
      if (config.type === "behavioral" || config.type === "panel" || config.type === "case_study") {
        score += 1;
      }
    }
    
    // Only include if minimum skill matches met
    const uniqueMatches = [...new Set(matchedSkills)];
    if (uniqueMatches.length >= config.minSkillMatches || config.type === "hr") {
      // Determine confidence based on score
      let confidence: "high" | "medium" | "low";
      if (score >= 5 || uniqueMatches.length >= 3) {
        confidence = "high";
      } else if (score >= 3 || uniqueMatches.length >= 2) {
        confidence = "medium";
      } else {
        confidence = "low";
      }
      
      scoredTypes.push({
        type: config.type,
        label: config.label,
        description: config.description,
        confidence,
        matchedSkills: uniqueMatches,
        score,
      });
    }
  }
  
  // Sort by score and filter to top relevant types
  scoredTypes.sort((a, b) => b.score - a.score);
  
  // Always include HR, but beyond that, only include types with reasonable scores
  const recommendedTypes = scoredTypes.filter((t, index) => {
    if (t.type === "hr") return true;
    if (t.type === "hiring_manager" && index < 5) return true; // Usually included
    if (t.confidence === "high") return true;
    if (t.confidence === "medium" && index < 6) return true;
    return false;
  });
  
  // Ensure reasonable number (3-6 interview types)
  const finalTypes = recommendedTypes.slice(0, 6);
  if (finalTypes.length < 3) {
    // Add hiring_manager and behavioral as defaults if not enough matches
    const hasHiringManager = finalTypes.some(t => t.type === "hiring_manager");
    const hasBehavioral = finalTypes.some(t => t.type === "behavioral");
    
    if (!hasHiringManager) {
      const hmConfig = INTERVIEW_TYPE_CONFIGS.find(c => c.type === "hiring_manager")!;
      finalTypes.push({
        type: "hiring_manager",
        label: hmConfig.label,
        description: hmConfig.description,
        confidence: "medium",
        matchedSkills: [],
        score: 2,
      });
    }
    if (!hasBehavioral && finalTypes.length < 4) {
      const bConfig = INTERVIEW_TYPE_CONFIGS.find(c => c.type === "behavioral")!;
      finalTypes.push({
        type: "behavioral",
        label: bConfig.label,
        description: bConfig.description,
        confidence: "medium",
        matchedSkills: [],
        score: 2,
      });
    }
  }
  
  // Build derivation reason
  const topSkillCategories = Object.entries(skillCategories)
    .filter(([_, skills]) => skills.length > 0)
    .map(([cat, skills]) => `${skills.length} ${cat}`)
    .join(", ");
  
  const derivationReason = topSkillCategories
    ? `Based on ${extractedSkills.length} skills detected (${topSkillCategories})`
    : `Based on role title "${roleTitle}"`;
  
  return {
    recommendedTypes: finalTypes,
    allMatchedSkills: [...new Set(extractedSkills.map(s => s.skill))],
    skillCategories,
    derivationReason,
  };
}
