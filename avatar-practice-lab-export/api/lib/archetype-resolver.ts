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
