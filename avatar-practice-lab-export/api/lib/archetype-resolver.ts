import { db } from "../db";
import { companies, roleArchetypes, roleInterviewStructureDefaults, jobTargets } from "../../shared/schema";
import { eq, sql, ilike } from "drizzle-orm";

export type CompanyArchetype = 
  | "startup" | "enterprise" | "regulated" | "consumer" | "saas" | "fintech" | "edtech" | "services" | "industrial"
  | "it_services" | "big_tech" | "bfsi" | "fmcg" | "manufacturing" | "consulting" | "bpm" | "telecom" | "conglomerate";

export type RoleFamily = "tech" | "data" | "product" | "sales" | "business";

export interface CompanyResolution {
  companyId?: string;
  companyName: string;
  archetype: CompanyArchetype | null;
  confidence: "high" | "medium" | "low";
  matchType: "direct" | "alias" | "inference" | "none";
  interviewComponents?: Record<string, boolean>;
}

export interface RoleResolution {
  roleArchetypeId: string | null;
  roleArchetypeName: string | null;
  roleFamily: RoleFamily | null;
  confidence: "high" | "medium" | "low";
  matchType: "keyword" | "title_pattern" | "jd_inference" | "none";
  primarySkillDimensions?: string[];
}

export interface InterviewStructure {
  phases: {
    name: string;
    mins: number;
    subphases?: string[];
  }[];
  emphasisWeights: Record<string, number>;
}

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,()]/g, "")
    .replace(/\s*(private|pvt|ltd|limited|inc|llc|corp|corporation|india|technologies|solutions|consulting|services)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function matchCompanyDirect(companyName: string): Promise<CompanyResolution | null> {
  const normalized = normalizeCompanyName(companyName);
  
  const directMatch = await db
    .select()
    .from(companies)
    .where(sql`LOWER(${companies.name}) = ${normalized.toLowerCase()}`)
    .limit(1);
    
  if (directMatch.length > 0) {
    const company = directMatch[0];
    return {
      companyId: company.id,
      companyName: company.name,
      archetype: company.archetype as CompanyArchetype,
      confidence: (company.confidence as "high" | "medium" | "low") || "medium",
      matchType: "direct",
      interviewComponents: company.interviewComponents as Record<string, boolean> | undefined,
    };
  }
  
  const likeMatch = await db
    .select()
    .from(companies)
    .where(ilike(companies.name, `%${companyName}%`))
    .limit(1);
    
  if (likeMatch.length > 0) {
    const company = likeMatch[0];
    return {
      companyId: company.id,
      companyName: company.name,
      archetype: company.archetype as CompanyArchetype,
      confidence: "medium",
      matchType: "direct",
      interviewComponents: company.interviewComponents as Record<string, boolean> | undefined,
    };
  }
  
  return null;
}

export async function matchCompanyByAlias(companyName: string): Promise<CompanyResolution | null> {
  const normalized = normalizeCompanyName(companyName);
  
  const allCompanies = await db
    .select()
    .from(companies)
    .where(sql`${companies.aliases} IS NOT NULL`);
    
  for (const company of allCompanies) {
    const aliases = (company.aliases as string[]) || [];
    for (const alias of aliases) {
      const normalizedAlias = normalizeCompanyName(alias);
      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        return {
          companyId: company.id,
          companyName: company.name,
          archetype: company.archetype as CompanyArchetype,
          confidence: "medium",
          matchType: "alias",
          interviewComponents: company.interviewComponents as Record<string, boolean> | undefined,
        };
      }
    }
  }
  
  return null;
}

export function inferCompanyArchetypeFromJD(jdText: string, companyName: string): CompanyResolution {
  const text = (jdText || "").toLowerCase();
  const company = (companyName || "").toLowerCase();
  
  const archetypePatterns: { archetype: CompanyArchetype; patterns: string[]; confidence: "medium" | "low" }[] = [
    { archetype: "big_tech", patterns: ["faang", "maang", "google", "amazon", "microsoft", "meta", "apple", "netflix", "system design", "scale", "distributed systems"], confidence: "medium" },
    { archetype: "consulting", patterns: ["consulting", "mbb", "mckinsey", "bcg", "bain", "deloitte", "pwc", "ey", "kpmg", "case study", "client engagement"], confidence: "medium" },
    { archetype: "bfsi", patterns: ["banking", "financial services", "investment", "trading", "risk management", "compliance", "regulatory", "fintech"], confidence: "medium" },
    { archetype: "it_services", patterns: ["it services", "outsourcing", "service delivery", "client project", "onsite", "offshore", "tcs", "infosys", "wipro", "cognizant"], confidence: "medium" },
    { archetype: "fmcg", patterns: ["fmcg", "consumer goods", "brand management", "trade marketing", "distribution", "supply chain", "retail"], confidence: "medium" },
    { archetype: "saas", patterns: ["saas", "subscription", "b2b software", "enterprise software", "cloud platform", "api"], confidence: "medium" },
    { archetype: "fintech", patterns: ["fintech", "payments", "lending", "digital banking", "neobank", "crypto", "blockchain"], confidence: "medium" },
    { archetype: "edtech", patterns: ["edtech", "education", "learning", "e-learning", "online courses", "upskilling"], confidence: "medium" },
    { archetype: "consumer", patterns: ["consumer tech", "app", "mobile", "consumer internet", "marketplace", "delivery", "food tech"], confidence: "medium" },
    { archetype: "startup", patterns: ["startup", "series a", "series b", "venture", "fast-paced", "hypergrowth", "founder"], confidence: "low" },
    { archetype: "enterprise", patterns: ["enterprise", "fortune 500", "mnc", "legacy", "transformation"], confidence: "low" },
  ];
  
  for (const { archetype, patterns, confidence } of archetypePatterns) {
    const matchCount = patterns.filter(p => text.includes(p) || company.includes(p)).length;
    if (matchCount >= 2) {
      return {
        companyName,
        archetype,
        confidence,
        matchType: "inference",
      };
    }
  }
  
  return {
    companyName,
    archetype: null,
    confidence: "low",
    matchType: "none",
  };
}

export async function resolveCompanyArchetype(companyName: string, jdText?: string): Promise<CompanyResolution> {
  const directMatch = await matchCompanyDirect(companyName);
  if (directMatch) return directMatch;
  
  const aliasMatch = await matchCompanyByAlias(companyName);
  if (aliasMatch) return aliasMatch;
  
  if (jdText) {
    return inferCompanyArchetypeFromJD(jdText, companyName);
  }
  
  return {
    companyName,
    archetype: null,
    confidence: "low",
    matchType: "none",
  };
}

const ROLE_KEYWORDS: Record<string, { roleArchetypeId: string; patterns: string[] }> = {
  core_software_engineer: {
    roleArchetypeId: "core_software_engineer",
    patterns: ["software engineer", "software developer", "sde", "backend", "frontend", "fullstack", "full stack", "full-stack", "mobile developer", "ios developer", "android developer", "web developer"],
  },
  data_analyst: {
    roleArchetypeId: "data_analyst",
    patterns: ["data analyst", "business analyst", "analytics", "bi analyst", "business intelligence"],
  },
  data_engineer: {
    roleArchetypeId: "data_engineer",
    patterns: ["data engineer", "etl developer", "data platform", "data infrastructure", "big data engineer"],
  },
  data_scientist: {
    roleArchetypeId: "data_scientist",
    patterns: ["data scientist", "data science", "applied scientist", "research scientist"],
  },
  ml_engineer: {
    roleArchetypeId: "ml_engineer",
    patterns: ["ml engineer", "machine learning engineer", "mlops", "ai engineer", "deep learning"],
  },
  infra_platform: {
    roleArchetypeId: "infra_platform",
    patterns: ["devops", "sre", "site reliability", "platform engineer", "infrastructure", "cloud engineer", "kubernetes", "devsecops"],
  },
  security_engineer: {
    roleArchetypeId: "security_engineer",
    patterns: ["security engineer", "security analyst", "cybersecurity", "infosec", "penetration tester", "appsec"],
  },
  qa_test_engineer: {
    roleArchetypeId: "qa_test_engineer",
    patterns: ["qa engineer", "quality assurance", "test engineer", "sdet", "automation engineer", "quality engineer"],
  },
  product_manager: {
    roleArchetypeId: "product_manager",
    patterns: ["product manager", "pm", "product owner", "apm", "associate product manager", "group product manager"],
  },
  technical_program_manager: {
    roleArchetypeId: "technical_program_manager",
    patterns: ["technical program manager", "tpm", "program manager", "engineering program manager"],
  },
  product_designer: {
    roleArchetypeId: "product_designer",
    patterns: ["product designer", "ux designer", "ui designer", "ux/ui", "interaction designer", "visual designer"],
  },
  marketing_growth: {
    roleArchetypeId: "marketing_growth",
    patterns: ["marketing", "growth", "digital marketing", "performance marketing", "brand marketing", "content marketing"],
  },
  sales_account: {
    roleArchetypeId: "sales_account",
    patterns: ["sales", "account executive", "account manager", "business development", "sales executive", "enterprise sales"],
  },
  customer_success: {
    roleArchetypeId: "customer_success",
    patterns: ["customer success", "csm", "customer success manager", "client success", "customer experience"],
  },
  bizops_strategy: {
    roleArchetypeId: "bizops_strategy",
    patterns: ["bizops", "business operations", "strategy", "chief of staff", "strategy analyst", "corporate strategy"],
  },
  operations_general: {
    roleArchetypeId: "operations_general",
    patterns: ["operations", "ops manager", "operations manager", "supply chain", "logistics", "process improvement"],
  },
  finance_strategy: {
    roleArchetypeId: "finance_strategy",
    patterns: ["finance", "fp&a", "financial analyst", "investment banking", "corporate finance", "treasury"],
  },
  consulting_general: {
    roleArchetypeId: "consulting_general",
    patterns: ["consultant", "management consultant", "strategy consultant", "associate consultant", "senior consultant"],
  },
};

const ROLE_FAMILY_MAP: Record<string, RoleFamily> = {
  core_software_engineer: "tech",
  data_analyst: "data",
  data_engineer: "data",
  data_scientist: "data",
  ml_engineer: "data",
  infra_platform: "tech",
  security_engineer: "tech",
  qa_test_engineer: "tech",
  product_manager: "product",
  technical_program_manager: "product",
  product_designer: "product",
  marketing_growth: "business",
  sales_account: "sales",
  customer_success: "sales",
  bizops_strategy: "business",
  operations_general: "business",
  finance_strategy: "business",
  consulting_general: "business",
};

export async function resolveRoleArchetype(roleTitle: string, jdText?: string): Promise<RoleResolution> {
  const normalizedTitle = roleTitle.toLowerCase().trim();
  const normalizedJd = (jdText || "").toLowerCase();
  
  let bestMatch: { archetypeId: string; matchCount: number; matchType: "keyword" | "title_pattern" | "jd_inference" } | null = null;
  
  for (const [archetypeId, config] of Object.entries(ROLE_KEYWORDS)) {
    const titleMatchCount = config.patterns.filter(p => normalizedTitle.includes(p)).length;
    
    if (titleMatchCount > 0 && (!bestMatch || titleMatchCount > bestMatch.matchCount)) {
      bestMatch = { archetypeId, matchCount: titleMatchCount, matchType: "keyword" };
    }
  }
  
  if (!bestMatch && jdText) {
    for (const [archetypeId, config] of Object.entries(ROLE_KEYWORDS)) {
      const jdMatchCount = config.patterns.filter(p => normalizedJd.includes(p)).length;
      
      if (jdMatchCount >= 2 && (!bestMatch || jdMatchCount > bestMatch.matchCount)) {
        bestMatch = { archetypeId, matchCount: jdMatchCount, matchType: "jd_inference" };
      }
    }
  }
  
  if (bestMatch) {
    const archetype = await db
      .select()
      .from(roleArchetypes)
      .where(eq(roleArchetypes.id, bestMatch.archetypeId))
      .limit(1);
      
    if (archetype.length > 0) {
      return {
        roleArchetypeId: archetype[0].id,
        roleArchetypeName: archetype[0].name,
        roleFamily: ROLE_FAMILY_MAP[bestMatch.archetypeId] || null,
        confidence: bestMatch.matchType === "keyword" ? "high" : "medium",
        matchType: bestMatch.matchType,
        primarySkillDimensions: archetype[0].primarySkillDimensions as string[] | undefined,
      };
    }
  }
  
  return {
    roleArchetypeId: null,
    roleArchetypeName: null,
    roleFamily: null,
    confidence: "low",
    matchType: "none",
  };
}

export async function getRoleInterviewStructure(
  roleArchetypeId: string,
  seniority: "entry" | "mid" | "senior"
): Promise<InterviewStructure | null> {
  const structure = await db
    .select()
    .from(roleInterviewStructureDefaults)
    .where(
      sql`${roleInterviewStructureDefaults.roleArchetypeId} = ${roleArchetypeId} 
          AND ${roleInterviewStructureDefaults.seniority} = ${seniority}`
    )
    .limit(1);
    
  if (structure.length > 0) {
    return {
      phases: structure[0].phasesJson as InterviewStructure["phases"],
      emphasisWeights: structure[0].emphasisWeightsJson as Record<string, number>,
    };
  }
  
  return null;
}

export async function getRoleArchetypeDetails(roleArchetypeId: string) {
  const archetype = await db
    .select()
    .from(roleArchetypes)
    .where(eq(roleArchetypes.id, roleArchetypeId))
    .limit(1);
    
  if (archetype.length > 0) {
    return archetype[0];
  }
  
  return null;
}

export async function listAllRoleArchetypes() {
  return db.select().from(roleArchetypes).where(eq(roleArchetypes.isActive, true));
}

export async function listAllCompanyArchetypes(): Promise<{ archetype: string; count: number }[]> {
  const result = await db
    .select({
      archetype: companies.archetype,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(companies)
    .where(sql`${companies.archetype} IS NOT NULL`)
    .groupBy(companies.archetype);
    
  return result.map(r => ({
    archetype: r.archetype || "unknown",
    count: r.count,
  }));
}

export async function updateJobArchetypes(
  jobTargetId: string,
  companyArchetype: CompanyArchetype | null,
  archetypeConfidence: "high" | "medium" | "low",
  roleArchetypeId: string | null,
  roleFamily: RoleFamily | null
) {
  await db
    .update(jobTargets)
    .set({
      companyArchetype: companyArchetype as any,
      archetypeConfidence: archetypeConfidence as any,
      roleArchetypeId,
      roleFamily: roleFamily as any,
      updatedAt: new Date(),
    })
    .where(eq(jobTargets.id, jobTargetId));
}

export interface UnifiedInterviewPlan {
  roleArchetype: {
    id: string;
    name: string;
    family: string | null;
  } | null;
  companyArchetype: {
    type: string;
    confidence: "high" | "medium" | "low";
  } | null;
  phases: {
    name: string;
    category: string;
    mins: number;
    practiceMode: "live_interview" | "coding_lab" | "case_study" | "presentation";
    description: string;
    subphases?: string[];
    emphasisWeight?: number;
  }[];
  emphasisWeights: Record<string, number>;
  companyNotes: string | null;
  seniority: "entry" | "mid" | "senior";
}

const PHASE_TO_CATEGORY_MAP: Record<string, { category: string; practiceMode: "live_interview" | "coding_lab" | "case_study" | "presentation"; description: string }> = {
  "Aptitude Assessment": { category: "aptitude_assessment", practiceMode: "coding_lab", description: "Quantitative, logical, and verbal reasoning assessment" },
  "HR Screening": { category: "hr_screening", practiceMode: "live_interview", description: "Behavioral assessment, motivation, background, and cultural fit" },
  "Phone Screen": { category: "hr_screening", practiceMode: "live_interview", description: "Initial screening call covering background and basic fit" },
  "Technical Interview": { category: "technical_interview", practiceMode: "live_interview", description: "Technical discussion covering domain expertise and problem-solving" },
  "Coding Round": { category: "coding_assessment", practiceMode: "coding_lab", description: "Hands-on coding problems to demonstrate programming skills" },
  "DSA Round": { category: "coding_assessment", practiceMode: "coding_lab", description: "Data structures and algorithms problem solving" },
  "System Design": { category: "system_design", practiceMode: "case_study", description: "Design scalable systems and discuss architectural tradeoffs" },
  "Hiring Manager": { category: "hiring_manager", practiceMode: "live_interview", description: "Deep-dive into role requirements, domain expertise, and team fit" },
  "Behavioral": { category: "behavioral", practiceMode: "live_interview", description: "STAR-format questions about past experiences and competencies" },
  "Case Study": { category: "case_study", practiceMode: "case_study", description: "Analyze business problems, structure approach, present recommendations" },
  "Product Sense": { category: "case_study", practiceMode: "case_study", description: "Product thinking, prioritization, and user-focused problem solving" },
  "Analytics Case": { category: "case_study", practiceMode: "case_study", description: "Data-driven problem solving and metric analysis" },
  "SQL Round": { category: "coding_assessment", practiceMode: "coding_lab", description: "SQL query writing and database problem solving" },
  "ML Round": { category: "technical_interview", practiceMode: "live_interview", description: "Machine learning concepts, algorithms, and implementation" },
  "Culture Fit": { category: "culture_values", practiceMode: "live_interview", description: "Assessment of values alignment and collaboration style" },
  "Bar Raiser": { category: "bar_raiser", practiceMode: "live_interview", description: "Cross-functional interview focused on raising the hiring bar" },
  "Panel Interview": { category: "panel_interview", practiceMode: "live_interview", description: "Interview with multiple interviewers covering various aspects" },
  "Group Discussion": { category: "group_discussion", practiceMode: "live_interview", description: "Group discussion evaluating communication and teamwork" },
  "Presentation": { category: "presentation", practiceMode: "presentation", description: "Present analysis, recommendations, or technical work to interviewers" },
};

const DEFAULT_PHASES_BY_ROLE_FAMILY: Record<string, { name: string; mins: number }[]> = {
  tech: [
    { name: "HR Screening", mins: 30 },
    { name: "Technical Interview", mins: 45 },
    { name: "Coding Round", mins: 60 },
    { name: "System Design", mins: 45 },
    { name: "Hiring Manager", mins: 45 },
  ],
  data: [
    { name: "HR Screening", mins: 30 },
    { name: "Technical Interview", mins: 45 },
    { name: "SQL Round", mins: 45 },
    { name: "Analytics Case", mins: 45 },
    { name: "Hiring Manager", mins: 45 },
  ],
  product: [
    { name: "HR Screening", mins: 30 },
    { name: "Product Sense", mins: 45 },
    { name: "Case Study", mins: 45 },
    { name: "Behavioral", mins: 45 },
    { name: "Hiring Manager", mins: 45 },
  ],
  sales: [
    { name: "HR Screening", mins: 30 },
    { name: "Behavioral", mins: 45 },
    { name: "Case Study", mins: 30 },
    { name: "Hiring Manager", mins: 45 },
  ],
  business: [
    { name: "HR Screening", mins: 30 },
    { name: "Case Study", mins: 45 },
    { name: "Behavioral", mins: 45 },
    { name: "Hiring Manager", mins: 45 },
  ],
};

interface CompanyInterviewComponents {
  aptitude?: boolean;
  codingChallenge?: boolean;
  technicalDsaSql?: boolean;
  systemDesign?: boolean;
  caseStudy?: boolean;
  hrScreen?: boolean;
  behavioral?: boolean;
  hiringManager?: boolean;
  groupDiscussion?: boolean;
  panel?: boolean;
  presentation?: boolean;
}

async function getCompanyInterviewComponents(companyName: string): Promise<CompanyInterviewComponents | null> {
  if (!companyName) return null;
  
  const normalizedName = companyName.toLowerCase().trim();
  
  const [company] = await db
    .select({ interviewComponents: companies.interviewComponents })
    .from(companies)
    .where(sql`LOWER(${companies.name}) LIKE ${'%' + normalizedName + '%'}`);
  
  if (company?.interviewComponents) {
    return company.interviewComponents as CompanyInterviewComponents;
  }
  
  return null;
}

const COMPONENT_TO_ROUND: Record<keyof CompanyInterviewComponents, { name: string; mins: number; priority: number }> = {
  aptitude: { name: "Aptitude Assessment", mins: 60, priority: 1 },
  hrScreen: { name: "HR Screening", mins: 30, priority: 2 },
  codingChallenge: { name: "Coding Round", mins: 60, priority: 3 },
  technicalDsaSql: { name: "Technical Interview", mins: 45, priority: 4 },
  systemDesign: { name: "System Design", mins: 45, priority: 5 },
  caseStudy: { name: "Case Study", mins: 45, priority: 6 },
  behavioral: { name: "Behavioral", mins: 45, priority: 7 },
  hiringManager: { name: "Hiring Manager", mins: 45, priority: 8 },
  groupDiscussion: { name: "Group Discussion", mins: 60, priority: 9 },
  panel: { name: "Panel Interview", mins: 60, priority: 10 },
  presentation: { name: "Presentation", mins: 45, priority: 11 },
};

export async function getUnifiedInterviewPlan(
  roleArchetypeId: string | null,
  roleFamily: string | null,
  companyArchetype: string | null,
  archetypeConfidence: "high" | "medium" | "low" | null,
  experienceLevel: string | null,
  companyNotes: string | null = null,
  companyName: string | null = null
): Promise<UnifiedInterviewPlan> {
  const seniority: "entry" | "mid" | "senior" = 
    experienceLevel === "senior" || experienceLevel === "lead" || experienceLevel === "executive" ? "senior" :
    experienceLevel === "entry" ? "entry" : "mid";

  let roleArchetypeDetails: { id: string; name: string; roleFamily: string | null } | null = null;
  let structureDefaults: InterviewStructure | null = null;
  
  if (roleArchetypeId) {
    const details = await getRoleArchetypeDetails(roleArchetypeId);
    if (details) {
      roleArchetypeDetails = { id: details.id, name: details.name, roleFamily: details.roleCategory || null };
    }
    structureDefaults = await getRoleInterviewStructure(roleArchetypeId, seniority);
  }
  
  let phases: UnifiedInterviewPlan["phases"] = [];
  let emphasisWeights: Record<string, number> = {};
  
  const companyComponents = companyName ? await getCompanyInterviewComponents(companyName) : null;
  
  if (companyComponents) {
    const activeRounds: { name: string; mins: number; priority: number }[] = [];
    
    for (const [key, value] of Object.entries(companyComponents)) {
      if (value === true && COMPONENT_TO_ROUND[key as keyof CompanyInterviewComponents]) {
        activeRounds.push(COMPONENT_TO_ROUND[key as keyof CompanyInterviewComponents]);
      }
    }
    
    activeRounds.sort((a, b) => a.priority - b.priority);
    
    phases = activeRounds.map(round => {
      const mapping = PHASE_TO_CATEGORY_MAP[round.name] || { 
        category: "technical_interview", 
        practiceMode: "live_interview" as const, 
        description: "Interview round" 
      };
      
      return {
        name: round.name,
        category: mapping.category,
        mins: round.mins,
        practiceMode: mapping.practiceMode,
        description: mapping.description,
        emphasisWeight: 1,
      };
    });
  } else if (structureDefaults && structureDefaults.phases.length > 0) {
    phases = structureDefaults.phases.map(phase => {
      const mapping = PHASE_TO_CATEGORY_MAP[phase.name] || { 
        category: "technical_interview", 
        practiceMode: "live_interview" as const, 
        description: "Interview round" 
      };
      
      return {
        name: phase.name,
        category: mapping.category,
        mins: phase.mins,
        practiceMode: mapping.practiceMode,
        description: mapping.description,
        subphases: phase.subphases,
        emphasisWeight: structureDefaults.emphasisWeights[phase.name] || 1,
      };
    });
    emphasisWeights = structureDefaults.emphasisWeights;
  } else {
    const family = roleFamily || "tech";
    const defaultPhases = DEFAULT_PHASES_BY_ROLE_FAMILY[family] || DEFAULT_PHASES_BY_ROLE_FAMILY.tech;
    
    phases = defaultPhases.map(phase => {
      const mapping = PHASE_TO_CATEGORY_MAP[phase.name] || { 
        category: "technical_interview", 
        practiceMode: "live_interview" as const, 
        description: "Interview round" 
      };
      
      return {
        name: phase.name,
        category: mapping.category,
        mins: phase.mins,
        practiceMode: mapping.practiceMode,
        description: mapping.description,
        emphasisWeight: 1,
      };
    });
  }
  
  return {
    roleArchetype: roleArchetypeDetails ? {
      id: roleArchetypeDetails.id,
      name: roleArchetypeDetails.name,
      family: roleArchetypeDetails.roleFamily,
    } : null,
    companyArchetype: companyArchetype ? {
      type: companyArchetype,
      confidence: archetypeConfidence || "low",
    } : null,
    phases,
    emphasisWeights,
    companyNotes,
    seniority,
  };
}

export async function resolveAndSaveJobArchetypes(
  jobTargetId: string,
  companyName: string,
  roleTitle: string,
  jdText?: string
) {
  const companyResolution = await resolveCompanyArchetype(companyName, jdText);
  const roleResolution = await resolveRoleArchetype(roleTitle, jdText);
  
  await updateJobArchetypes(
    jobTargetId,
    companyResolution.archetype,
    companyResolution.confidence,
    roleResolution.roleArchetypeId,
    roleResolution.roleFamily
  );
  
  return { companyResolution, roleResolution };
}
