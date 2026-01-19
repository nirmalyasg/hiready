import { db } from "../db.js";
import { eq, sql, ilike } from "drizzle-orm";
import { roleKits, jobTargets } from "../../shared/schema.js";

interface RoleKitMatch {
  roleKitId: number;
  roleKitName: string;
  confidence: "high" | "medium" | "low";
  matchType: "exact" | "keyword" | "domain" | "none" | "generated";
  roleKitCategory?: string | null;
  alternativeMatches?: { roleKitId: number; roleKitName: string; confidence: "medium" | "low" }[];
}

// Domain patterns - only strong, specific keywords
const ROLE_DOMAIN_MAP: Record<string, string[]> = {
  software: [
    "software engineer", "software developer", "sde", "backend engineer", "frontend engineer", 
    "fullstack engineer", "full stack developer", "full-stack developer", "mobile developer", 
    "ios developer", "android developer", "web developer", "devops engineer", "site reliability",
    "platform engineer", "systems engineer"
  ],
  data: [
    "data analyst", "data scientist", "data engineer", "ml engineer", 
    "machine learning engineer", "analytics engineer", "bi analyst", "business intelligence analyst",
    "data science", "applied scientist", "research scientist"
  ],
  product: [
    "product manager", "product owner", "associate product manager",
    "group product manager", "product lead", "technical product manager", "senior product manager"
  ],
  design: [
    "product designer", "ux designer", "ui designer", "ux/ui designer", 
    "interaction designer", "visual designer", "graphic designer", "design lead"
  ],
  marketing: [
    "marketing manager", "growth manager", "digital marketing", "performance marketing",
    "brand manager", "content marketing manager", "marketing lead", "marketing director"
  ],
  sales: [
    "sales manager", "account executive", "sales executive", "business development manager",
    "enterprise sales", "sales development representative", "sales director"
  ],
  customer_success: [
    "customer success manager", "csm", "customer support manager", "client success manager"
  ],
  operations: [
    "operations manager", "supply chain manager", "logistics manager", "operations director"
  ],
  consulting: [
    "consultant", "management consultant", "strategy consultant", "business consultant",
    "practice director", "practice leader", "engagement manager", "principal consultant"
  ],
  finance: [
    "finance manager", "fp&a analyst", "financial analyst", "accounting manager", 
    "finance director", "controller"
  ],
  hr: [
    "hr manager", "human resources manager", "hr director", "hr business partner",
    "hrbp", "compensation manager", "benefits manager"
  ],
  recruiting: [
    "recruiter", "talent acquisition", "recruiting manager", "sourcer"
  ],
  engineering_management: [
    "engineering manager", "tech lead", "engineering director", "vp engineering",
    "director of engineering"
  ],
  research: [
    "market research", "competitive intelligence", "market insights", "research director",
    "insights manager", "research analyst", "competitive analyst"
  ],
};

// Domain display names for kit naming
const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  software: "Technology",
  data: "Data & Analytics",
  product: "Product",
  design: "Design",
  marketing: "Marketing",
  sales: "Sales",
  customer_success: "Customer Success",
  operations: "Operations",
  consulting: "Consulting",
  finance: "Finance",
  hr: "HR",
  recruiting: "Recruiting",
  engineering_management: "Engineering Leadership",
  research: "Research & Insights",
  general: "General",
};

// Seniority levels
type SeniorityLevel = "entry" | "mid" | "senior" | "director" | "vp" | "executive";

const SENIORITY_DISPLAY: Record<SeniorityLevel, string> = {
  entry: "Entry",
  mid: "Mid-Level",
  senior: "Senior",
  director: "Director",
  vp: "VP",
  executive: "Executive",
};

// Known company names to strip (common in job titles)
const KNOWN_COMPANIES = [
  "google", "facebook", "meta", "amazon", "apple", "microsoft", "netflix",
  "uber", "lyft", "airbnb", "stripe", "linkedin", "twitter", "x", "salesforce",
  "bain", "mckinsey", "bcg", "deloitte", "accenture", "pwc", "ey", "kpmg",
  "goldman sachs", "jp morgan", "morgan stanley", "citi", "bank of america"
];

// Phrases that indicate non-functional qualifiers
const TEAM_CONTEXT_PHRASES = [
  "market and competitive insights",
  "revenue operations", "platform team", "core team", "growth team",
  "enterprise team", "consumer team", "infrastructure team"
];

const LEVEL_QUALIFIERS = [
  "i", "ii", "iii", "iv", "v", "1", "2", "3", "4", "5",
  "level 1", "level 2", "level 3", "level 4", "level 5",
  "l1", "l2", "l3", "l4", "l5", "l6", "l7", "e3", "e4", "e5", "e6", "e7"
];

// Role prefixes that should come before functional area
const ROLE_PREFIXES = ["senior", "junior", "lead", "principal", "staff", "associate", "head of"];

// Normalize a job title to its generic form
// "Practice Director, Market and Competitive Insights (Vector) at Bain & Company" → "Practice Director"
// "Director, Product Management" → "Director of Product Management"
// "Software Engineer II, Platform" → "Software Engineer"
export function normalizeTitle(title: string): string {
  let normalized = title.trim();
  
  // Remove parentheticals and brackets first (e.g., "(Vector)", "[Remote]")
  normalized = normalized.replace(/\s*\([^)]*\)\s*/g, " ");
  normalized = normalized.replace(/\s*\[[^\]]*\]\s*/g, " ");
  
  // Remove "at Company" suffix
  normalized = normalized.replace(/\s+at\s+[\w\s&]+$/i, "");
  
  // Check for known company names anywhere and remove
  for (const company of KNOWN_COMPANIES) {
    const regex = new RegExp(`\\b${company}\\b`, "gi");
    normalized = normalized.replace(regex, "");
  }
  
  // Remove known team context phrases
  for (const phrase of TEAM_CONTEXT_PHRASES) {
    const regex = new RegExp(`,?\\s*${phrase}`, "gi");
    normalized = normalized.replace(regex, "");
  }
  
  // Handle comma-separated titles smartly
  // "Director, Product Management" → "Director of Product Management"
  // "Practice Director, Market Insights" → "Practice Director" (if market insights is team context)
  // "Architect, Data Platform" → "Data Platform Architect" 
  if (normalized.includes(",")) {
    const parts = normalized.split(",").map(p => p.trim()).filter(p => p);
    
    if (parts.length === 2) {
      const [first, second] = parts;
      const firstLower = first.toLowerCase();
      const secondLower = second.toLowerCase();
      
      // Functional areas that should be preserved
      const functionalIndicators = [
        "management", "engineering", "marketing", "sales", "design", "product", 
        "data", "analytics", "operations", "finance", "hr", "recruiting",
        "platform", "infrastructure", "backend", "frontend", "mobile", "cloud",
        "security", "devops", "machine learning", "ai", "research"
      ];
      const isFunctional = functionalIndicators.some(f => secondLower.includes(f));
      
      // Pure level titles (just a rank, no specialization)
      const pureLevelTitles = ["director", "manager", "lead", "head", "vp", "vice president"];
      const firstIsPureLevel = pureLevelTitles.some(l => firstLower === l);
      
      // Role titles that include specialization (keep as-is)
      const roleWithSpec = ["architect", "engineer", "analyst", "designer", "developer", "scientist"];
      const firstIsRole = roleWithSpec.some(r => firstLower.includes(r));
      
      if (isFunctional) {
        if (firstIsPureLevel) {
          // "Director, Product Management" → "Director of Product Management"
          normalized = `${first} of ${second}`;
        } else if (firstIsRole) {
          // "Architect, Data Platform" → "Data Platform Architect"
          normalized = `${second} ${first}`;
        } else {
          // "Practice Director, Revenue Operations" → "Practice Director"
          // First part has specialization already, second is context
          normalized = first;
        }
      } else {
        // Second part is team context, not functional area
        normalized = first;
      }
    } else if (parts.length > 2) {
      // Just take the first meaningful part
      normalized = parts[0];
    }
  }
  
  // Handle dash-separated qualifiers
  // "Software Engineer - Platform" → "Software Engineer"
  if (normalized.includes(" - ")) {
    const parts = normalized.split(" - ").map(p => p.trim());
    // Keep only the role part (usually first), unless it's just a level
    normalized = parts[0];
  }
  
  // Remove level qualifiers like "II", "Level 3"
  const words = normalized.split(/\s+/);
  const filteredWords = words.filter(w => !LEVEL_QUALIFIERS.includes(w.toLowerCase()));
  normalized = filteredWords.join(" ");
  
  // Clean up extra whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  // Capitalize properly
  normalized = normalized
    .split(" ")
    .map(w => {
      // Keep "of", "and", "the" lowercase unless first word
      const lowerWords = ["of", "and", "the", "for", "in"];
      if (lowerWords.includes(w.toLowerCase())) {
        return w.toLowerCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
  
  // Capitalize first letter
  if (normalized.length > 0) {
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  
  return normalized || title;
}

// Detect seniority level from title and JD
export function detectSeniority(title: string, jdText?: string | null): SeniorityLevel {
  const t = title.toLowerCase();
  const jd = (jdText || "").toLowerCase();
  
  // Executive level
  if (t.includes("chief") || t.includes("ceo") || t.includes("cto") || 
      t.includes("cfo") || t.includes("coo") || t.includes("c-level") ||
      t.includes("president")) {
    return "executive";
  }
  
  // VP level
  if (t.includes("vp ") || t.includes("vice president") || t.includes("svp") ||
      t.includes("evp") || t.includes("avp")) {
    return "vp";
  }
  
  // Director level
  if (t.includes("director") || t.includes("head of") || t.includes("practice leader") ||
      t.includes("practice director")) {
    return "director";
  }
  
  // Senior level
  if (t.includes("senior") || t.includes("sr.") || t.includes("sr ") ||
      t.includes("principal") || t.includes("staff") || t.includes("lead")) {
    return "senior";
  }
  
  // Entry level
  if (t.includes("junior") || t.includes("jr.") || t.includes("jr ") ||
      t.includes("associate") || t.includes("entry") || t.includes("intern") ||
      t.includes("trainee") || t.includes("graduate")) {
    return "entry";
  }
  
  // Check JD for experience indicators
  if (jd) {
    if (jd.includes("0-2 years") || jd.includes("1-2 years") || 
        jd.includes("0-3 years") || jd.includes("fresher") ||
        jd.includes("new graduate") || jd.includes("entry level")) {
      return "entry";
    }
    if (jd.includes("8+ years") || jd.includes("10+ years") || 
        jd.includes("12+ years") || jd.includes("15+ years")) {
      return "senior";
    }
  }
  
  // Default to mid-level
  return "mid";
}

// Detect domain from title and JD content
export function detectDomain(title: string, jdText?: string | null): string {
  const t = title.toLowerCase();
  const jd = (jdText || "").toLowerCase();
  
  // Score each domain based on pattern matches
  let bestDomain = "general";
  let bestScore = 0;
  
  for (const [domain, patterns] of Object.entries(ROLE_DOMAIN_MAP)) {
    let score = 0;
    
    for (const pattern of patterns) {
      // Title matches weighted 3x
      if (t.includes(pattern)) {
        score += 3;
      }
      // JD matches weighted 1x
      if (jd.includes(pattern)) {
        score += 1;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }
  
  // Fallback detection for common role types not in patterns
  if (bestScore < 2) {
    if (t.includes("analyst") && !t.includes("data")) {
      if (t.includes("business") || jd.includes("stakeholder") || jd.includes("requirements")) {
        return "consulting";
      }
      if (t.includes("market") || t.includes("competitive") || t.includes("insights")) {
        return "research";
      }
    }
    if (t.includes("manager") && !bestDomain.includes("manager")) {
      if (jd.includes("consulting") || jd.includes("client") || jd.includes("engagement")) {
        return "consulting";
      }
    }
    if (t.includes("director")) {
      if (jd.includes("consulting") || jd.includes("practice") || jd.includes("partner")) {
        return "consulting";
      }
    }
  }
  
  return bestDomain;
}

// Calculate similarity score between two strings (0-1)
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();
  
  if (t1 === t2) return 1.0;
  if (t1.includes(t2) || t2.includes(t1)) return 0.8;
  
  const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return intersection / union;
}

// Calculate skills overlap between two skill arrays
function calculateSkillsOverlap(skills1: string[], skills2: string[]): number {
  if (skills1.length === 0 || skills2.length === 0) return 0;
  
  const s1 = new Set(skills1.map(s => s.toLowerCase()));
  const s2 = new Set(skills2.map(s => s.toLowerCase()));
  
  const intersection = [...s1].filter(s => s2.has(s)).length;
  const union = new Set([...s1, ...s2]).size;
  
  return intersection / union;
}

// Extract base title from kit name (removes " - Domain (Level)" suffix)
function extractKitBaseTitle(kitName: string): string {
  // Remove " - Domain (Level)" or just "(Level)" patterns
  let base = kitName.split(" - ")[0].trim();
  base = base.replace(/\s*\([^)]+\)\s*$/, "").trim();
  return base;
}

// Find an existing similar generic kit
async function findSimilarExistingKit(
  normalizedTitle: string,
  domain: string,
  seniority: SeniorityLevel,
  skills: string[]
): Promise<RoleKitMatch | null> {
  const allKits = await db.select().from(roleKits);
  
  let bestMatch: typeof allKits[0] | null = null;
  let bestScore = 0;
  
  for (const kit of allKits) {
    let score = 0;
    
    // Extract base title from kit name for comparison
    const kitBaseTitle = extractKitBaseTitle(kit.name);
    
    // Title similarity (weight: 40%)
    const titleSim = calculateTitleSimilarity(normalizedTitle, kitBaseTitle);
    score += titleSim * 40;
    
    // Domain match (weight: 30%)
    if (kit.domain === domain) {
      score += 30;
    }
    
    // Level match (weight: 15%) - match seniority categories
    const seniorityLevelMatch = (kit.level === seniority) || 
      (kit.level === "senior" && (seniority === "director" || seniority === "vp" || seniority === "executive"));
    if (seniorityLevelMatch) {
      score += 15;
    }
    
    // Skills overlap (weight: 15%)
    const kitSkills = (kit.skillsFocus as string[]) || [];
    const skillsOverlap = calculateSkillsOverlap(skills, kitSkills);
    score += skillsOverlap * 15;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = kit;
    }
  }
  
  // Require at least 60% match score to reuse existing kit
  if (bestMatch && bestScore >= 60) {
    return {
      roleKitId: bestMatch.id,
      roleKitName: bestMatch.name,
      confidence: "high",
      matchType: "exact",
      roleKitCategory: bestMatch.roleCategory,
    };
  }
  
  return null;
}

// Generate a generic kit name
function generateGenericKitName(normalizedTitle: string, domain: string, seniority: SeniorityLevel): string {
  const domainDisplay = DOMAIN_DISPLAY_NAMES[domain] || "General";
  const seniorityDisplay = SENIORITY_DISPLAY[seniority];
  const titleLower = normalizedTitle.toLowerCase();
  
  // Check if domain is already clearly indicated in the title
  // Use specific, unambiguous keywords that clearly identify the domain
  const domainKeywords: Record<string, string[]> = {
    software: ["software engineer", "software developer", "devops", "sde", "backend engineer", "frontend engineer"],
    data: ["data analyst", "data scientist", "data engineer", "analytics", "machine learning"],
    product: ["product manager", "product owner", "product lead"],
    design: ["designer", "ux designer", "ui designer", "product designer"],
    marketing: ["marketing manager", "marketing director", "marketing lead"],
    sales: ["sales manager", "sales director", "account executive"],
    customer_success: ["customer success manager", "customer success"],
    operations: ["operations manager", "operations director"],
    consulting: ["consultant", "consulting"],
    finance: ["finance manager", "financial analyst", "fp&a"],
    hr: ["hr manager", "human resources", "hrbp"],
    recruiting: ["recruiter", "talent acquisition", "recruiting manager"],
    engineering_management: ["engineering manager", "tech lead", "engineering director"],
    research: ["research analyst", "market research", "competitive intelligence"],
  };
  
  const domainWords = domainKeywords[domain] || [];
  
  // Check for exact phrase matches only (not partial word matches)
  const domainInTitle = domainWords.some(phrase => {
    // Must be a complete phrase match
    return titleLower.includes(phrase);
  });
  
  // If domain is already clear from title, just add seniority
  if (domainInTitle || domain === "general") {
    return `${normalizedTitle} (${seniorityDisplay})`;
  }
  
  return `${normalizedTitle} - ${domainDisplay} (${seniorityDisplay})`;
}

// Map seniority to kit level (preserving granularity where possible)
function seniorityToKitLevel(seniority: SeniorityLevel): "entry" | "mid" | "senior" {
  switch (seniority) {
    case "entry":
      return "entry";
    case "mid":
      return "mid";
    case "senior":
    case "director":
    case "vp":
    case "executive":
      return "senior";
    default:
      return "mid";
  }
}

export async function mapRoleTitleToRoleKit(
  roleTitle: string,
  roleFamily?: string | null,
  jdText?: string | null
): Promise<RoleKitMatch | null> {
  // Apply normalization for consistent matching
  const normalizedInputTitle = normalizeTitle(roleTitle).toLowerCase();
  const rawNormalizedTitle = roleTitle.toLowerCase().trim();
  
  const allRoleKits = await db.select().from(roleKits);
  
  if (allRoleKits.length === 0) {
    return null;
  }

  // Step 1: Try exact/substring title matching (high confidence)
  for (const kit of allRoleKits) {
    // Extract and normalize kit base title for fair comparison
    const kitBaseName = extractKitBaseTitle(kit.name).toLowerCase();
    
    // Match against both raw and normalized input title
    if (kitBaseName === normalizedInputTitle || 
        kitBaseName === rawNormalizedTitle ||
        kitBaseName.includes(normalizedInputTitle) || 
        normalizedInputTitle.includes(kitBaseName)) {
      const alternatives = allRoleKits
        .filter(k => k.id !== kit.id && k.domain === kit.domain)
        .slice(0, 3)
        .map(k => ({ roleKitId: k.id, roleKitName: k.name, confidence: "medium" as const }));
      return {
        roleKitId: kit.id,
        roleKitName: kit.name,
        confidence: "high",
        matchType: "exact",
        roleKitCategory: kit.roleCategory,
        alternativeMatches: alternatives,
      };
    }
  }

  // Step 2: Domain detection using unified detectDomain function
  const detectedDomain = detectDomain(roleTitle, jdText);
  
  // Only proceed if we detected a meaningful domain
  if (detectedDomain && detectedDomain !== "general") {
    const matchingKits = allRoleKits.filter(kit => kit.domain === detectedDomain);
    
    if (matchingKits.length > 0) {
      let selectedKit = matchingKits[0];
      let bestSimilarity = 0;
      
      for (const kit of matchingKits) {
        const similarity = calculateTitleSimilarity(roleTitle, kit.name);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          selectedKit = kit;
        }
      }
      
      if (bestSimilarity < 0.3) {
        const seniority = detectSeniority(roleTitle, jdText);
        const entryLevel = matchingKits.find(k => k.level === "entry");
        const midLevel = matchingKits.find(k => k.level === "mid");
        const seniorLevel = matchingKits.find(k => k.level === "senior");
        
        if (seniority === "entry" && entryLevel) {
          selectedKit = entryLevel;
        } else if ((seniority === "senior" || seniority === "director") && seniorLevel) {
          selectedKit = seniorLevel;
        } else if (midLevel) {
          selectedKit = midLevel;
        } else if (entryLevel) {
          selectedKit = entryLevel;
        }
      }
      
      const alternatives = matchingKits
        .filter(k => k.id !== selectedKit.id)
        .slice(0, 3)
        .map(k => ({ roleKitId: k.id, roleKitName: k.name, confidence: "medium" as const }));
      
      // Confidence based on title similarity - higher similarity = higher confidence
      let confidence: "high" | "medium" | "low";
      if (bestSimilarity >= 0.5) {
        confidence = "high";
      } else if (bestSimilarity >= 0.3) {
        confidence = "medium";
      } else {
        confidence = "low";
      }
      
      return {
        roleKitId: selectedKit.id,
        roleKitName: selectedKit.name,
        confidence,
        matchType: "domain",
        roleKitCategory: selectedKit.roleCategory,
        alternativeMatches: alternatives,
      };
    }
  }

  // Step 3: Role family mapping (if provided)
  if (roleFamily) {
    const familyDomainMap: Record<string, string> = {
      tech: "software",
      engineering: "software",
      data: "data",
      product: "product",
      design: "design",
      business: "consulting",
      sales: "sales",
      marketing: "marketing",
      operations: "operations",
      finance: "finance",
      hr: "hr",
    };
    
    const mappedDomain = familyDomainMap[roleFamily.toLowerCase()];
    if (mappedDomain) {
      const matchingKits = allRoleKits.filter(kit => kit.domain === mappedDomain);
      if (matchingKits.length > 0) {
        const entryLevel = matchingKits.find(k => 
          k.name.toLowerCase().includes("entry") || k.name.toLowerCase().includes("associate")
        );
        const selectedKit = entryLevel || matchingKits[0];
        const alternatives = matchingKits
          .filter(k => k.id !== selectedKit.id)
          .slice(0, 3)
          .map(k => ({ roleKitId: k.id, roleKitName: k.name, confidence: "medium" as const }));
        return {
          roleKitId: selectedKit.id,
          roleKitName: selectedKit.name,
          confidence: "low",
          matchType: "domain",
          roleKitCategory: selectedKit.roleCategory,
          alternativeMatches: alternatives,
        };
      }
    }
  }

  // Step 4: No match - return low confidence fallback
  const defaultKit = allRoleKits.find(k => k.domain === "software" && k.name.toLowerCase().includes("entry"));
  const topAlternatives = allRoleKits
    .filter(k => k.id !== (defaultKit?.id || allRoleKits[0].id))
    .slice(0, 5)
    .map(k => ({ roleKitId: k.id, roleKitName: k.name, confidence: "low" as const }));
  
  if (defaultKit) {
    return {
      roleKitId: defaultKit.id,
      roleKitName: defaultKit.name,
      confidence: "low",
      matchType: "none",
      roleKitCategory: defaultKit.roleCategory,
      alternativeMatches: topAlternatives,
    };
  }

  return {
    roleKitId: allRoleKits[0].id,
    roleKitName: allRoleKits[0].name,
    confidence: "low",
    matchType: "none",
    roleKitCategory: allRoleKits[0].roleCategory,
    alternativeMatches: topAlternatives,
  };
}

interface JDParsedData {
  requiredSkills?: string[];
  preferredSkills?: string[];
  experienceLevel?: string;
  responsibilities?: string[];
  companyContext?: string;
  focusAreas?: string[];
  detectedRoleTitle?: string;
  analysisDimensions?: string[];
  interviewTopics?: string[];
}

export async function ensureRoleKitForJob(
  roleTitle: string,
  jdText: string | null,
  jdParsed: JDParsedData | null,
  companyName: string | null
): Promise<RoleKitMatch> {
  // Try to find an existing high-confidence match
  const existingMatch = await mapRoleTitleToRoleKit(roleTitle, null, jdText);
  
  if (existingMatch && existingMatch.confidence === "high") {
    return existingMatch;
  }

  // Extract generic role characteristics
  const normalizedTitle = normalizeTitle(roleTitle);
  const domain = detectDomain(roleTitle, jdText);
  const seniority = detectSeniority(roleTitle, jdText);
  
  const skills = [
    ...(jdParsed?.requiredSkills || []),
    ...(jdParsed?.preferredSkills || []),
  ].slice(0, 10);

  // Check if a similar generic kit already exists
  const similarKit = await findSimilarExistingKit(normalizedTitle, domain, seniority, skills);
  if (similarKit) {
    console.log(`Found similar existing kit for "${roleTitle}": ${similarKit.roleKitName}`);
    return similarKit;
  }

  // Create a new generic role kit
  const kitName = generateGenericKitName(normalizedTitle, domain, seniority);
  
  console.log(`Creating generic kit for "${roleTitle}" -> "${kitName}" (domain: ${domain}, seniority: ${seniority})`);

  const [newKit] = await db
    .insert(roleKits)
    .values({
      name: kitName,
      level: seniorityToKitLevel(seniority),
      domain: domain,
      description: `Generic role kit for ${normalizedTitle} roles at the ${SENIORITY_DISPLAY[seniority]} level in ${DOMAIN_DISPLAY_NAMES[domain] || domain}`,
      skillsFocus: skills.length > 0 ? skills : null,
      defaultInterviewTypes: ["hr", "technical", "behavioral"],
      trackTags: ["generic", domain, seniority], // Include actual seniority for granularity
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    roleKitId: newKit.id,
    roleKitName: newKit.name,
    confidence: "high",
    matchType: "generated",
    roleKitCategory: null,
  };
}

// Re-process all existing jobs to fix mismatched role kits
export async function reprocessAllJobs(): Promise<{
  processed: number;
  updated: number;
  errors: number;
  details: Array<{
    jobId: string;
    roleTitle: string;
    oldKitId: number | null;
    newKitId: number;
    newKitName: string;
    action: "updated" | "unchanged" | "error";
    error?: string;
  }>;
}> {
  const allJobs = await db.select().from(jobTargets);
  
  const results = {
    processed: 0,
    updated: 0,
    errors: 0,
    details: [] as Array<{
      jobId: string;
      roleTitle: string;
      oldKitId: number | null;
      newKitId: number;
      newKitName: string;
      action: "updated" | "unchanged" | "error";
      error?: string;
    }>,
  };

  for (const job of allJobs) {
    results.processed++;
    
    try {
      const newMatch = await ensureRoleKitForJob(
        job.roleTitle,
        job.jdText,
        job.jdParsed as JDParsedData | null,
        job.companyName
      );
      
      const oldKitId = job.roleKitId;
      
      // Update if kit changed or was null
      if (oldKitId !== newMatch.roleKitId) {
        await db
          .update(jobTargets)
          .set({ 
            roleKitId: newMatch.roleKitId,
            updatedAt: new Date()
          })
          .where(eq(jobTargets.id, job.id));
        
        results.updated++;
        results.details.push({
          jobId: job.id,
          roleTitle: job.roleTitle,
          oldKitId,
          newKitId: newMatch.roleKitId,
          newKitName: newMatch.roleKitName,
          action: "updated",
        });
      } else {
        results.details.push({
          jobId: job.id,
          roleTitle: job.roleTitle,
          oldKitId,
          newKitId: newMatch.roleKitId,
          newKitName: newMatch.roleKitName,
          action: "unchanged",
        });
      }
    } catch (error: any) {
      results.errors++;
      results.details.push({
        jobId: job.id,
        roleTitle: job.roleTitle,
        oldKitId: job.roleKitId,
        newKitId: 0,
        newKitName: "",
        action: "error",
        error: error.message,
      });
    }
  }

  return results;
}
