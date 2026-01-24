/**
 * Enhanced JD Context Extraction
 *
 * This module provides comprehensive extraction of context from job descriptions:
 * 1. Domain/Industry/Market analysis
 * 2. Leadership signal detection
 * 3. Skill categorization by interview type
 * 4. Company context enrichment
 */

import { getOpenAI } from "../utils/openai-client.js";
import {
  BEHAVIORAL_COMPETENCIES,
  LEADERSHIP_COMPETENCIES,
  DOMAIN_KNOWLEDGE_AREAS,
  getCompetenciesForInterviewType,
  type CompetencyDimension
} from "./competency-frameworks.js";

// ============================================================
// TYPES
// ============================================================

export interface EnhancedJDContext {
  // Company & Market Context
  company: {
    name: string;
    archetype: CompanyArchetype;
    size: CompanySize;
    industry: string;
    businessDomain: string;
    culture: string[];
    stage: CompanyStage;
  };

  // Market & Industry Context
  market: {
    industry: string;
    segment: string;
    trends: string[];
    competitors: string[];
    challenges: string[];
  };

  // Role Context
  role: {
    title: string;
    level: SeniorityLevel;
    department: string;
    function: FunctionalArea;
    reportingTo: string;
    directReports: boolean;
    scope: RoleScope;
  };

  // Skills & Competencies (categorized)
  skills: {
    technical: CategorizedSkill[];
    behavioral: CategorizedSkill[];
    leadership: CategorizedSkill[];
    domain: CategorizedSkill[];
  };

  // Leadership Signals
  leadershipSignals: {
    isLeadershipRole: boolean;
    leadershipLevel: "individual_contributor" | "team_lead" | "manager" | "senior_manager" | "director" | "executive";
    requiredCompetencies: string[];
    teamSize?: string;
    budgetResponsibility: boolean;
    peopleManagement: boolean;
    strategyOwnership: boolean;
  };

  // Interview Focus Areas
  interviewFocus: {
    primaryCompetencies: string[];
    secondaryCompetencies: string[];
    technicalAreas: string[];
    domainTopics: string[];
    culturalFit: string[];
  };

  // Complexity calibration
  complexity: {
    level: "basic" | "intermediate" | "advanced" | "expert";
    technicalDepth: "shallow" | "moderate" | "deep";
    businessComplexity: "simple" | "moderate" | "complex";
    experienceYears: string;
  };
}

export type CompanyArchetype =
  | "startup"
  | "scaleup"
  | "enterprise"
  | "regulated"
  | "big_tech"
  | "consulting"
  | "agency"
  | "fintech"
  | "healthcare"
  | "manufacturing"
  | "retail"
  | "saas"
  | "consumer"
  | "b2b"
  | "marketplace"
  | "government"
  | "nonprofit"
  | "unknown";

export type CompanySize = "tiny" | "small" | "medium" | "large" | "enterprise" | "unknown";

export type CompanyStage = "seed" | "early" | "growth" | "mature" | "public" | "unknown";

export type SeniorityLevel =
  | "intern"
  | "entry"
  | "junior"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "manager"
  | "senior_manager"
  | "director"
  | "vp"
  | "c_level";

export type FunctionalArea =
  | "engineering"
  | "product"
  | "design"
  | "data"
  | "marketing"
  | "sales"
  | "customer_success"
  | "operations"
  | "finance"
  | "hr"
  | "legal"
  | "general_management"
  | "consulting"
  | "research"
  | "other";

export type RoleScope = "individual" | "project" | "team" | "department" | "function" | "business_unit" | "company";

export interface CategorizedSkill {
  name: string;
  category: string;
  proficiency: "basic" | "intermediate" | "advanced" | "expert";
  priority: "must_have" | "important" | "nice_to_have";
  interviewType: string; // Which interview type should test this
  competencyId?: string; // Maps to competency framework
}

// ============================================================
// LEADERSHIP SIGNAL DETECTION
// ============================================================

const LEADERSHIP_KEYWORDS = {
  strong: [
    "lead", "manage", "direct", "oversee", "head", "own", "drive", "spearhead",
    "mentor", "coach", "develop team", "build team", "hire", "recruit",
    "strategic", "strategy", "vision", "roadmap", "p&l", "budget",
    "executive", "c-suite", "board", "stakeholder management",
    "cross-functional", "organization-wide", "company-wide"
  ],
  moderate: [
    "coordinate", "collaborate", "influence", "guide", "support",
    "contribute to strategy", "work with leadership", "report to",
    "team player", "cross-team", "multi-team"
  ],
  indicators: {
    teamSize: /(?:manage|lead|oversee|team of)\s*(\d+[\s-]*\+?\s*(?:people|engineers|members|reports)?)/gi,
    budget: /(?:budget|p&l|financial responsibility|revenue)\s*(?:of|:)?\s*\$?\d+/gi,
    directReports: /direct reports?|reporting to you|your team|manage\s+\d+/gi,
    strategyOwnership: /own the strategy|strategic direction|set the vision|define roadmap/gi
  }
};

export function detectLeadershipSignals(jdText: string): EnhancedJDContext["leadershipSignals"] {
  const textLower = jdText.toLowerCase();

  // Count leadership keywords
  let strongCount = 0;
  let moderateCount = 0;

  for (const keyword of LEADERSHIP_KEYWORDS.strong) {
    if (textLower.includes(keyword)) strongCount++;
  }
  for (const keyword of LEADERSHIP_KEYWORDS.moderate) {
    if (textLower.includes(keyword)) moderateCount++;
  }

  // Detect specific signals
  const teamSizeMatches = jdText.match(LEADERSHIP_KEYWORDS.indicators.teamSize);
  const budgetMatches = jdText.match(LEADERSHIP_KEYWORDS.indicators.budget);
  const directReportsMatches = jdText.match(LEADERSHIP_KEYWORDS.indicators.directReports);
  const strategyMatches = jdText.match(LEADERSHIP_KEYWORDS.indicators.strategyOwnership);

  const budgetResponsibility = !!budgetMatches;
  const peopleManagement = !!directReportsMatches;
  const strategyOwnership = !!strategyMatches;

  // Determine leadership level
  let leadershipLevel: EnhancedJDContext["leadershipSignals"]["leadershipLevel"] = "individual_contributor";

  if (strongCount >= 5 || strategyOwnership || budgetResponsibility) {
    if (textLower.includes("vp") || textLower.includes("vice president") || textLower.includes("c-level") || textLower.includes("cto") || textLower.includes("ceo")) {
      leadershipLevel = "executive";
    } else if (textLower.includes("director")) {
      leadershipLevel = "director";
    } else if (textLower.includes("senior manager")) {
      leadershipLevel = "senior_manager";
    } else {
      leadershipLevel = "manager";
    }
  } else if (strongCount >= 2 || peopleManagement || moderateCount >= 4) {
    leadershipLevel = "team_lead";
  }

  const isLeadershipRole = leadershipLevel !== "individual_contributor";

  // Map required competencies
  const requiredCompetencies: string[] = [];
  if (isLeadershipRole) {
    if (peopleManagement) requiredCompetencies.push("people_development", "team_building");
    if (strategyOwnership) requiredCompetencies.push("strategic_thinking", "decision_making");
    if (budgetResponsibility) requiredCompetencies.push("business_acumen");
    if (strongCount >= 3) requiredCompetencies.push("stakeholder_management", "execution_delivery");
    if (textLower.includes("change") || textLower.includes("transform")) {
      requiredCompetencies.push("change_leadership");
    }
  }

  return {
    isLeadershipRole,
    leadershipLevel,
    requiredCompetencies: [...new Set(requiredCompetencies)],
    teamSize: teamSizeMatches?.[0],
    budgetResponsibility,
    peopleManagement,
    strategyOwnership
  };
}

// ============================================================
// SKILL CATEGORIZATION
// ============================================================

const SKILL_CATEGORY_PATTERNS: Record<string, { pattern: RegExp; interviewType: string }[]> = {
  technical: [
    { pattern: /python|java|javascript|typescript|c\+\+|go|rust|ruby|php|swift|kotlin|scala/gi, interviewType: "technical" },
    { pattern: /react|angular|vue|node|django|flask|spring|rails|\.net/gi, interviewType: "technical" },
    { pattern: /sql|postgresql|mysql|mongodb|redis|elasticsearch|dynamodb/gi, interviewType: "technical" },
    { pattern: /aws|azure|gcp|kubernetes|docker|terraform|jenkins|ci\/cd/gi, interviewType: "technical" },
    { pattern: /machine learning|ml|deep learning|nlp|computer vision|tensorflow|pytorch/gi, interviewType: "technical" },
    { pattern: /system design|architecture|microservices|distributed systems|scalability/gi, interviewType: "system_design" },
    { pattern: /data structures|algorithms|oop|design patterns/gi, interviewType: "coding" }
  ],
  data: [
    { pattern: /data analysis|data analytics|business intelligence|bi|tableau|power bi|looker/gi, interviewType: "analytics" },
    { pattern: /statistics|statistical analysis|hypothesis testing|a\/b testing|experimentation/gi, interviewType: "analytics" },
    { pattern: /etl|data pipeline|data engineering|airflow|spark|hadoop/gi, interviewType: "technical" },
    { pattern: /sql|querying|database/gi, interviewType: "sql" }
  ],
  product: [
    { pattern: /product strategy|product vision|roadmap|prioritization|product sense/gi, interviewType: "product_sense" },
    { pattern: /user research|customer research|usability|user experience/gi, interviewType: "behavioral" },
    { pattern: /metrics|kpis|okrs|product analytics|north star/gi, interviewType: "case_study" },
    { pattern: /go-to-market|gtm|market analysis|competitive analysis/gi, interviewType: "case_study" }
  ],
  behavioral: [
    { pattern: /communication|presentation|stakeholder|collaboration|teamwork/gi, interviewType: "behavioral" },
    { pattern: /problem.?solving|critical thinking|analytical thinking/gi, interviewType: "behavioral" },
    { pattern: /leadership|mentoring|coaching|people management/gi, interviewType: "leadership" },
    { pattern: /project management|agile|scrum|planning|execution/gi, interviewType: "behavioral" },
    { pattern: /adaptability|flexibility|learning|growth mindset/gi, interviewType: "behavioral" }
  ],
  domain: [
    { pattern: /industry knowledge|domain expertise|sector experience/gi, interviewType: "domain" },
    { pattern: /regulatory|compliance|risk management|audit/gi, interviewType: "domain" },
    { pattern: /market knowledge|competitive landscape|industry trends/gi, interviewType: "domain" }
  ]
};

export function categorizeSkills(skills: string[], jdText: string): EnhancedJDContext["skills"] {
  const categorized: EnhancedJDContext["skills"] = {
    technical: [],
    behavioral: [],
    leadership: [],
    domain: []
  };

  const textLower = jdText.toLowerCase();

  for (const skill of skills) {
    const skillLower = skill.toLowerCase();
    let category = "behavioral";
    let interviewType = "behavioral";
    let competencyId: string | undefined;

    // Check against patterns
    for (const [cat, patterns] of Object.entries(SKILL_CATEGORY_PATTERNS)) {
      for (const { pattern, interviewType: intType } of patterns) {
        if (pattern.test(skillLower)) {
          category = cat === "data" ? "technical" : cat;
          interviewType = intType;
          break;
        }
      }
    }

    // Check for leadership skills
    for (const competency of LEADERSHIP_COMPETENCIES.dimensions) {
      if (skillLower.includes(competency.name.toLowerCase()) ||
          competency.name.toLowerCase().includes(skillLower)) {
        category = "leadership";
        interviewType = "leadership";
        competencyId = competency.id;
        break;
      }
    }

    // Check for behavioral competencies
    if (category === "behavioral") {
      for (const competency of BEHAVIORAL_COMPETENCIES.dimensions) {
        if (skillLower.includes(competency.name.toLowerCase()) ||
            competency.name.toLowerCase().includes(skillLower)) {
          competencyId = competency.id;
          break;
        }
      }
    }

    // Determine priority based on JD context
    let priority: CategorizedSkill["priority"] = "nice_to_have";
    if (textLower.includes(`must have ${skillLower}`) ||
        textLower.includes(`required: ${skillLower}`) ||
        textLower.includes(`${skillLower} (required)`)) {
      priority = "must_have";
    } else if (textLower.includes(skillLower)) {
      priority = "important";
    }

    // Determine proficiency based on context
    let proficiency: CategorizedSkill["proficiency"] = "intermediate";
    if (textLower.includes(`expert ${skillLower}`) || textLower.includes(`advanced ${skillLower}`)) {
      proficiency = "advanced";
    } else if (textLower.includes(`strong ${skillLower}`) || textLower.includes(`deep ${skillLower}`)) {
      proficiency = "advanced";
    } else if (textLower.includes(`basic ${skillLower}`) || textLower.includes(`familiarity with ${skillLower}`)) {
      proficiency = "basic";
    }

    const categorizedSkill: CategorizedSkill = {
      name: skill,
      category,
      proficiency,
      priority,
      interviewType,
      competencyId
    };

    // Add to appropriate category
    if (category === "technical") {
      categorized.technical.push(categorizedSkill);
    } else if (category === "leadership") {
      categorized.leadership.push(categorizedSkill);
    } else if (category === "domain" || category === "product") {
      categorized.domain.push(categorizedSkill);
    } else {
      categorized.behavioral.push(categorizedSkill);
    }
  }

  return categorized;
}

// ============================================================
// COMPANY ARCHETYPE DETECTION
// ============================================================

const COMPANY_ARCHETYPE_PATTERNS: Record<CompanyArchetype, string[]> = {
  startup: ["startup", "early stage", "seed", "series a", "founding team", "ground floor"],
  scaleup: ["scale-up", "scaleup", "hyper growth", "series b", "series c", "rapidly growing"],
  enterprise: ["enterprise", "fortune 500", "large organization", "global company", "multinational"],
  regulated: ["regulated", "compliance", "regulatory", "banking", "insurance", "healthcare compliance"],
  big_tech: ["faang", "big tech", "google", "facebook", "amazon", "microsoft", "apple", "meta"],
  consulting: ["consulting", "advisory", "professional services", "client-facing"],
  agency: ["agency", "digital agency", "creative agency", "marketing agency"],
  fintech: ["fintech", "financial technology", "payments", "lending platform", "neobank"],
  healthcare: ["healthcare", "healthtech", "medical", "pharma", "biotech", "clinical"],
  manufacturing: ["manufacturing", "industrial", "factory", "production", "supply chain"],
  retail: ["retail", "e-commerce", "ecommerce", "consumer goods", "cpg", "fmcg"],
  saas: ["saas", "software as a service", "subscription", "b2b software", "cloud platform"],
  consumer: ["consumer", "b2c", "consumer app", "consumer product", "direct to consumer"],
  b2b: ["b2b", "enterprise sales", "business customers", "enterprise software"],
  marketplace: ["marketplace", "platform", "two-sided", "network effects"],
  government: ["government", "public sector", "federal", "state agency"],
  nonprofit: ["nonprofit", "non-profit", "ngo", "foundation", "charitable"],
  unknown: []
};

export function detectCompanyArchetype(jdText: string, companyName?: string): CompanyArchetype {
  const textLower = jdText.toLowerCase();

  for (const [archetype, patterns] of Object.entries(COMPANY_ARCHETYPE_PATTERNS)) {
    if (archetype === "unknown") continue;
    for (const pattern of patterns) {
      if (textLower.includes(pattern)) {
        return archetype as CompanyArchetype;
      }
    }
  }

  return "unknown";
}

// ============================================================
// SENIORITY LEVEL DETECTION
// ============================================================

const SENIORITY_PATTERNS: Record<SeniorityLevel, string[]> = {
  intern: ["intern", "internship", "co-op"],
  entry: ["entry level", "entry-level", "graduate", "new grad", "junior", "associate"],
  junior: ["junior", "jr", "associate", "1-2 years", "0-2 years"],
  mid: ["mid-level", "mid level", "intermediate", "2-5 years", "3-5 years"],
  senior: ["senior", "sr", "5+ years", "5-8 years", "experienced"],
  staff: ["staff", "principal", "lead engineer", "tech lead", "8+ years"],
  principal: ["principal", "distinguished", "fellow", "10+ years"],
  manager: ["manager", "managing", "team lead", "supervisor"],
  senior_manager: ["senior manager", "sr manager", "group manager"],
  director: ["director", "head of", "department head"],
  vp: ["vice president", "vp", "svp", "evp"],
  c_level: ["cto", "ceo", "cfo", "coo", "cio", "chief"]
};

export function detectSeniorityLevel(jdText: string, title?: string): SeniorityLevel {
  const searchText = `${title || ""} ${jdText}`.toLowerCase();

  // Check in order of specificity (higher levels first)
  const orderedLevels: SeniorityLevel[] = [
    "c_level", "vp", "director", "senior_manager", "manager",
    "principal", "staff", "senior", "mid", "junior", "entry", "intern"
  ];

  for (const level of orderedLevels) {
    for (const pattern of SENIORITY_PATTERNS[level]) {
      if (searchText.includes(pattern)) {
        return level;
      }
    }
  }

  return "mid"; // Default
}

// ============================================================
// FUNCTIONAL AREA DETECTION
// ============================================================

const FUNCTIONAL_AREA_PATTERNS: Record<FunctionalArea, string[]> = {
  engineering: ["software engineer", "developer", "sde", "backend", "frontend", "full stack", "devops", "sre", "infrastructure"],
  product: ["product manager", "product owner", "product lead", "pm", "apm"],
  design: ["designer", "ux", "ui", "user experience", "visual design", "product design"],
  data: ["data scientist", "data analyst", "data engineer", "ml engineer", "analytics", "business intelligence"],
  marketing: ["marketing", "growth", "brand", "content", "seo", "sem", "digital marketing"],
  sales: ["sales", "account executive", "ae", "sdr", "bdr", "enterprise sales"],
  customer_success: ["customer success", "csm", "account manager", "client services", "customer support"],
  operations: ["operations", "supply chain", "logistics", "procurement", "facilities"],
  finance: ["finance", "accounting", "fp&a", "controller", "treasury", "tax"],
  hr: ["hr", "human resources", "people operations", "talent", "recruiting", "recruiter"],
  legal: ["legal", "counsel", "attorney", "compliance", "contracts"],
  general_management: ["general manager", "gm", "business lead", "managing director"],
  consulting: ["consultant", "advisory", "strategy consultant", "management consultant"],
  research: ["researcher", "research scientist", "r&d", "scientist"],
  other: []
};

export function detectFunctionalArea(jdText: string, title?: string): FunctionalArea {
  const searchText = `${title || ""} ${jdText}`.toLowerCase();

  for (const [area, patterns] of Object.entries(FUNCTIONAL_AREA_PATTERNS)) {
    if (area === "other") continue;
    for (const pattern of patterns) {
      if (searchText.includes(pattern)) {
        return area as FunctionalArea;
      }
    }
  }

  return "other";
}

// ============================================================
// MAIN EXTRACTION FUNCTION
// ============================================================

export interface JDExtractionInput {
  jdText: string;
  companyName?: string;
  roleTitle?: string;
  parsedSkills?: string[];
  parsedResponsibilities?: string[];
}

/**
 * Extract comprehensive context from a job description
 */
export async function extractEnhancedJDContext(
  input: JDExtractionInput
): Promise<EnhancedJDContext> {
  const { jdText, companyName, roleTitle, parsedSkills = [], parsedResponsibilities = [] } = input;

  // Detect leadership signals
  const leadershipSignals = detectLeadershipSignals(jdText);

  // Detect company archetype
  const companyArchetype = detectCompanyArchetype(jdText, companyName);

  // Detect seniority level
  const seniorityLevel = detectSeniorityLevel(jdText, roleTitle);

  // Detect functional area
  const functionalArea = detectFunctionalArea(jdText, roleTitle);

  // Categorize skills
  const categorizedSkills = categorizeSkills(parsedSkills, jdText);

  // Determine complexity based on seniority
  const complexity = mapSeniorityToComplexity(seniorityLevel);

  // Build interview focus based on role and leadership
  const interviewFocus = buildInterviewFocus(
    functionalArea,
    seniorityLevel,
    leadershipSignals,
    categorizedSkills
  );

  // Use AI for deeper extraction if OpenAI is available
  let aiEnhancedContext: Partial<EnhancedJDContext> = {};
  try {
    aiEnhancedContext = await extractWithAI(jdText, companyName, roleTitle);
  } catch (error) {
    console.warn("AI-enhanced JD extraction failed, using rule-based extraction:", error);
  }

  return {
    company: {
      name: companyName || aiEnhancedContext.company?.name || "Unknown",
      archetype: companyArchetype,
      size: aiEnhancedContext.company?.size || "unknown",
      industry: aiEnhancedContext.company?.industry || extractIndustry(jdText),
      businessDomain: aiEnhancedContext.company?.businessDomain || "",
      culture: aiEnhancedContext.company?.culture || extractCultureSignals(jdText),
      stage: aiEnhancedContext.company?.stage || "unknown"
    },
    market: {
      industry: aiEnhancedContext.market?.industry || extractIndustry(jdText),
      segment: aiEnhancedContext.market?.segment || "",
      trends: aiEnhancedContext.market?.trends || [],
      competitors: aiEnhancedContext.market?.competitors || [],
      challenges: aiEnhancedContext.market?.challenges || []
    },
    role: {
      title: roleTitle || "Unknown Role",
      level: seniorityLevel,
      department: aiEnhancedContext.role?.department || "",
      function: functionalArea,
      reportingTo: aiEnhancedContext.role?.reportingTo || "",
      directReports: leadershipSignals.peopleManagement,
      scope: determineRoleScope(seniorityLevel, leadershipSignals)
    },
    skills: categorizedSkills,
    leadershipSignals,
    interviewFocus,
    complexity
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function mapSeniorityToComplexity(seniority: SeniorityLevel): EnhancedJDContext["complexity"] {
  const mapping: Record<SeniorityLevel, EnhancedJDContext["complexity"]> = {
    intern: { level: "basic", technicalDepth: "shallow", businessComplexity: "simple", experienceYears: "0" },
    entry: { level: "basic", technicalDepth: "shallow", businessComplexity: "simple", experienceYears: "0-1" },
    junior: { level: "basic", technicalDepth: "shallow", businessComplexity: "simple", experienceYears: "1-2" },
    mid: { level: "intermediate", technicalDepth: "moderate", businessComplexity: "moderate", experienceYears: "3-5" },
    senior: { level: "advanced", technicalDepth: "deep", businessComplexity: "moderate", experienceYears: "5-8" },
    staff: { level: "expert", technicalDepth: "deep", businessComplexity: "complex", experienceYears: "8+" },
    principal: { level: "expert", technicalDepth: "deep", businessComplexity: "complex", experienceYears: "10+" },
    manager: { level: "advanced", technicalDepth: "moderate", businessComplexity: "complex", experienceYears: "5+" },
    senior_manager: { level: "expert", technicalDepth: "moderate", businessComplexity: "complex", experienceYears: "8+" },
    director: { level: "expert", technicalDepth: "moderate", businessComplexity: "complex", experienceYears: "10+" },
    vp: { level: "expert", technicalDepth: "shallow", businessComplexity: "complex", experienceYears: "12+" },
    c_level: { level: "expert", technicalDepth: "shallow", businessComplexity: "complex", experienceYears: "15+" }
  };

  return mapping[seniority] || mapping.mid;
}

function buildInterviewFocus(
  functionalArea: FunctionalArea,
  seniority: SeniorityLevel,
  leadershipSignals: EnhancedJDContext["leadershipSignals"],
  skills: EnhancedJDContext["skills"]
): EnhancedJDContext["interviewFocus"] {
  const primaryCompetencies: string[] = [];
  const secondaryCompetencies: string[] = [];
  const technicalAreas: string[] = [];
  const domainTopics: string[] = [];
  const culturalFit: string[] = [];

  // Add leadership competencies if it's a leadership role
  if (leadershipSignals.isLeadershipRole) {
    primaryCompetencies.push(...leadershipSignals.requiredCompetencies);
    if (leadershipSignals.peopleManagement) {
      primaryCompetencies.push("people_development", "team_building");
    }
    if (leadershipSignals.strategyOwnership) {
      primaryCompetencies.push("strategic_thinking");
    }
  }

  // Add technical competencies
  for (const skill of skills.technical.filter(s => s.priority === "must_have")) {
    technicalAreas.push(skill.name);
  }

  // Add behavioral competencies
  for (const skill of skills.behavioral.filter(s => s.priority === "must_have" || s.priority === "important")) {
    if (skill.competencyId) {
      primaryCompetencies.push(skill.competencyId);
    }
  }

  // Add domain topics
  for (const skill of skills.domain) {
    domainTopics.push(skill.name);
  }

  // Always include core competencies based on function
  const coreByFunction: Record<FunctionalArea, string[]> = {
    engineering: ["problem_solving", "communication", "collaboration_teamwork"],
    product: ["problem_solving", "communication", "customer_focus", "results_orientation"],
    design: ["communication", "collaboration_teamwork", "customer_focus"],
    data: ["problem_solving", "communication", "results_orientation"],
    marketing: ["communication", "results_orientation", "adaptability_resilience"],
    sales: ["communication", "results_orientation", "adaptability_resilience"],
    customer_success: ["customer_focus", "communication", "problem_solving"],
    operations: ["results_orientation", "problem_solving", "collaboration_teamwork"],
    finance: ["problem_solving", "integrity_ethics", "communication"],
    hr: ["communication", "collaboration_teamwork", "integrity_ethics"],
    legal: ["communication", "integrity_ethics", "problem_solving"],
    general_management: ["strategic_thinking", "people_development", "execution_delivery"],
    consulting: ["problem_solving", "communication", "adaptability_resilience"],
    research: ["problem_solving", "learning_agility", "communication"],
    other: ["problem_solving", "communication", "collaboration_teamwork"]
  };

  secondaryCompetencies.push(...coreByFunction[functionalArea]);

  // Add cultural fit signals
  culturalFit.push("ownership_accountability", "integrity_ethics");

  // Deduplicate and limit
  return {
    primaryCompetencies: [...new Set(primaryCompetencies)].slice(0, 5),
    secondaryCompetencies: [...new Set(secondaryCompetencies)].filter(c => !primaryCompetencies.includes(c)).slice(0, 5),
    technicalAreas: [...new Set(technicalAreas)].slice(0, 8),
    domainTopics: [...new Set(domainTopics)].slice(0, 5),
    culturalFit: [...new Set(culturalFit)].slice(0, 3)
  };
}

function determineRoleScope(
  seniority: SeniorityLevel,
  leadershipSignals: EnhancedJDContext["leadershipSignals"]
): RoleScope {
  if (["c_level", "vp"].includes(seniority)) return "company";
  if (seniority === "director") return "function";
  if (["senior_manager", "manager"].includes(seniority) || leadershipSignals.leadershipLevel === "manager") {
    return "team";
  }
  if (leadershipSignals.leadershipLevel === "team_lead") return "project";
  return "individual";
}

function extractIndustry(jdText: string): string {
  const industries = [
    { name: "Technology", keywords: ["tech", "software", "saas", "platform", "digital"] },
    { name: "Finance", keywords: ["financial", "banking", "investment", "fintech", "trading"] },
    { name: "Healthcare", keywords: ["healthcare", "medical", "pharma", "biotech", "health"] },
    { name: "E-commerce", keywords: ["ecommerce", "e-commerce", "retail", "marketplace"] },
    { name: "Consulting", keywords: ["consulting", "advisory", "professional services"] },
    { name: "Manufacturing", keywords: ["manufacturing", "industrial", "production"] },
    { name: "Media", keywords: ["media", "entertainment", "streaming", "content"] },
    { name: "Education", keywords: ["education", "edtech", "learning", "training"] },
    { name: "Telecommunications", keywords: ["telecom", "telecommunications", "network"] }
  ];

  const textLower = jdText.toLowerCase();
  for (const industry of industries) {
    for (const keyword of industry.keywords) {
      if (textLower.includes(keyword)) {
        return industry.name;
      }
    }
  }
  return "General";
}

function extractCultureSignals(jdText: string): string[] {
  const cultureKeywords = [
    { signal: "fast-paced", keywords: ["fast-paced", "fast paced", "dynamic", "high-growth", "rapidly"] },
    { signal: "collaborative", keywords: ["collaborative", "teamwork", "cross-functional", "together"] },
    { signal: "innovative", keywords: ["innovative", "cutting-edge", "disruptive", "pioneering"] },
    { signal: "remote-friendly", keywords: ["remote", "distributed", "hybrid", "work from home"] },
    { signal: "mission-driven", keywords: ["mission", "impact", "purpose", "meaningful"] },
    { signal: "data-driven", keywords: ["data-driven", "metrics", "analytical", "evidence-based"] },
    { signal: "diverse", keywords: ["diverse", "inclusive", "equity", "belonging", "dei"] },
    { signal: "startup-culture", keywords: ["startup", "entrepreneurial", "scrappy", "hustle"] }
  ];

  const signals: string[] = [];
  const textLower = jdText.toLowerCase();

  for (const culture of cultureKeywords) {
    for (const keyword of culture.keywords) {
      if (textLower.includes(keyword)) {
        signals.push(culture.signal);
        break;
      }
    }
  }

  return signals;
}

async function extractWithAI(
  jdText: string,
  companyName?: string,
  roleTitle?: string
): Promise<Partial<EnhancedJDContext>> {
  const openai = getOpenAI();

  const prompt = `Analyze this job description and extract key context:

JOB TITLE: ${roleTitle || "Not specified"}
COMPANY: ${companyName || "Not specified"}

JOB DESCRIPTION:
${jdText.substring(0, 4000)}

Extract and return JSON:
{
  "company": {
    "industry": "specific industry",
    "businessDomain": "what the company does in 2-3 words",
    "size": "tiny|small|medium|large|enterprise",
    "stage": "seed|early|growth|mature|public",
    "culture": ["culture signal 1", "culture signal 2"]
  },
  "market": {
    "industry": "broader industry category",
    "segment": "specific market segment",
    "trends": ["trend 1", "trend 2"],
    "challenges": ["challenge 1"]
  },
  "role": {
    "department": "likely department",
    "reportingTo": "likely reports to role"
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a job description analyst. Extract structured information accurately." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.warn("AI extraction failed:", error);
    return {};
  }
}

// ============================================================
// EXPORTS FOR QUESTION GENERATION
// ============================================================

/**
 * Get recommended interview types based on JD context
 */
export function getRecommendedInterviewTypes(context: EnhancedJDContext): string[] {
  const types: string[] = [];

  // Always include HR/behavioral
  types.push("hr");

  // Technical roles need technical/coding interviews
  if (context.role.function === "engineering" || context.skills.technical.length > 3) {
    types.push("technical", "coding");
    if (context.complexity.level === "advanced" || context.complexity.level === "expert") {
      types.push("system_design");
    }
  }

  // Data roles need SQL/analytics
  if (context.role.function === "data" || context.skills.technical.some(s => s.name.toLowerCase().includes("sql"))) {
    types.push("sql", "analytics");
  }

  // Product/business roles need case studies
  if (["product", "consulting", "general_management", "operations"].includes(context.role.function)) {
    types.push("case_study", "product_sense");
  }

  // Leadership roles need leadership interviews
  if (context.leadershipSignals.isLeadershipRole) {
    types.push("leadership", "hiring_manager");
  }

  // Domain knowledge for senior roles
  if (["senior", "staff", "principal", "manager", "director", "vp", "c_level"].includes(context.role.level)) {
    types.push("domain");
  }

  return [...new Set(types)];
}

/**
 * Get competencies to assess based on JD context
 */
export function getCompetenciesToAssess(context: EnhancedJDContext): {
  behavioral: CompetencyDimension[];
  leadership: CompetencyDimension[];
} {
  const behavioralIds = [
    ...context.interviewFocus.primaryCompetencies,
    ...context.interviewFocus.secondaryCompetencies,
    ...context.interviewFocus.culturalFit
  ];

  const behavioral = BEHAVIORAL_COMPETENCIES.dimensions.filter(
    d => behavioralIds.includes(d.id)
  );

  let leadership: CompetencyDimension[] = [];
  if (context.leadershipSignals.isLeadershipRole) {
    const leadershipIds = context.leadershipSignals.requiredCompetencies;
    leadership = LEADERSHIP_COMPETENCIES.dimensions.filter(
      d => leadershipIds.includes(d.id) || leadershipIds.length === 0
    );
  }

  return { behavioral, leadership };
}
