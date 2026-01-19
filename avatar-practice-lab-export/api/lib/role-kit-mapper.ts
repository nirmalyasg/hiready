import { db } from "../db.js";
import { eq, sql, ilike } from "drizzle-orm";
import { roleKits } from "../../shared/schema.js";

interface RoleKitMatch {
  roleKitId: number;
  roleKitName: string;
  confidence: "high" | "medium" | "low";
  matchType: "exact" | "keyword" | "domain" | "none";
  roleKitCategory?: string | null;
  alternativeMatches?: { roleKitId: number; roleKitName: string; confidence: "medium" | "low" }[];
}

// Domain patterns - only strong, specific keywords (removed generic terms)
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
    "consultant", "management consultant", "strategy consultant", "business consultant"
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
};

// Calculate similarity score between two strings (0-1)
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();
  
  // Exact match
  if (t1 === t2) return 1.0;
  
  // One contains the other
  if (t1.includes(t2) || t2.includes(t1)) return 0.8;
  
  // Word overlap score
  const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return intersection / union;
}

export async function mapRoleTitleToRoleKit(
  roleTitle: string,
  roleFamily?: string | null,
  jdText?: string | null
): Promise<RoleKitMatch | null> {
  const normalizedTitle = roleTitle.toLowerCase().trim();
  const normalizedJd = (jdText || "").toLowerCase();
  
  const allRoleKits = await db.select().from(roleKits);
  
  if (allRoleKits.length === 0) {
    return null;
  }

  // Step 1: Try exact/substring title matching (high confidence)
  for (const kit of allRoleKits) {
    const kitName = kit.name.toLowerCase();
    const kitBaseName = kitName.split(" - ")[0].trim();
    
    // Check for strong title match
    if (kitBaseName === normalizedTitle || 
        kitName.includes(normalizedTitle) || 
        normalizedTitle.includes(kitBaseName)) {
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

  // Step 2: Domain detection with strict thresholds
  // Title matches count more than JD matches
  let detectedDomain: string | null = null;
  let bestMatchScore = 0;
  let titleMatchCount = 0;
  
  for (const [domain, patterns] of Object.entries(ROLE_DOMAIN_MAP)) {
    // Count title matches (weighted 2x)
    const titleMatches = patterns.filter(p => normalizedTitle.includes(p)).length;
    // Count JD matches (weighted 1x, only if title has at least 1 match)
    const jdMatches = titleMatches > 0 
      ? patterns.filter(p => normalizedJd.includes(p) && !normalizedTitle.includes(p)).length
      : 0;
    
    const weightedScore = (titleMatches * 2) + jdMatches;
    
    if (weightedScore > bestMatchScore) {
      bestMatchScore = weightedScore;
      detectedDomain = domain;
      titleMatchCount = titleMatches;
    }
  }
  
  // Require at least 1 title match or 3+ total weighted score for valid domain detection
  if (detectedDomain && (titleMatchCount >= 1 || bestMatchScore >= 3)) {
    const matchingKits = allRoleKits.filter(kit => kit.domain === detectedDomain);
    
    if (matchingKits.length > 0) {
      // Find best matching kit by title similarity
      let selectedKit = matchingKits[0];
      let bestSimilarity = 0;
      
      for (const kit of matchingKits) {
        const similarity = calculateTitleSimilarity(roleTitle, kit.name);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          selectedKit = kit;
        }
      }
      
      // If no good similarity, check seniority level
      if (bestSimilarity < 0.3) {
        const isJunior = normalizedTitle.includes("junior") || 
                         normalizedTitle.includes("associate") || 
                         normalizedTitle.includes("entry") ||
                         normalizedJd.includes("0-2 years") ||
                         normalizedJd.includes("1-2 years") ||
                         normalizedJd.includes("fresher");
        
        const isSenior = normalizedTitle.includes("senior") || 
                         normalizedTitle.includes("lead") ||
                         normalizedTitle.includes("principal") ||
                         normalizedTitle.includes("director");
        
        const entryLevel = matchingKits.find(k => 
          k.name.toLowerCase().includes("entry") || k.name.toLowerCase().includes("associate")
        );
        const midLevel = matchingKits.find(k => k.name.toLowerCase().includes("mid"));
        const seniorLevel = matchingKits.find(k => k.name.toLowerCase().includes("senior"));
        
        if (isJunior && entryLevel) {
          selectedKit = entryLevel;
        } else if (isSenior && seniorLevel) {
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
      
      // Confidence: high if 3+ weighted score OR good title similarity, medium if 2, low if 1
      let confidence: "high" | "medium" | "low";
      if (bestMatchScore >= 3 || bestSimilarity >= 0.5) {
        confidence = "high";
      } else if (bestMatchScore >= 2) {
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
          confidence: "low", // Role family alone is not strong enough
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
  const existingMatch = await mapRoleTitleToRoleKit(roleTitle, null, jdText);
  
  // Only accept high confidence matches - medium/low should create custom kit
  if (existingMatch && existingMatch.confidence === "high") {
    return existingMatch;
  }

  // Create a custom role kit for this specific job
  let detectedDomain = "general";
  const normalizedTitle = roleTitle.toLowerCase();
  
  // Try to detect domain from title only (not JD, to avoid false matches)
  for (const [domain, patterns] of Object.entries(ROLE_DOMAIN_MAP)) {
    if (patterns.some(p => normalizedTitle.includes(p))) {
      detectedDomain = domain;
      break;
    }
  }

  const skillsFocus = [
    ...(jdParsed?.requiredSkills || []),
    ...(jdParsed?.preferredSkills || []),
  ].slice(0, 10);

  const interviewTopics = jdParsed?.interviewTopics || jdParsed?.focusAreas || [];

  const kitName = companyName 
    ? `${roleTitle} at ${companyName}`
    : roleTitle;

  const [newKit] = await db
    .insert(roleKits)
    .values({
      name: kitName,
      level: "entry",
      domain: detectedDomain,
      description: `Custom role kit for ${roleTitle}${companyName ? ` at ${companyName}` : ""}`,
      skillsFocus: skillsFocus.length > 0 ? skillsFocus : null,
      defaultInterviewTypes: ["hr", "technical", "behavioral"],
      trackTags: ["custom"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    roleKitId: newKit.id,
    roleKitName: newKit.name,
    confidence: "high",
    matchType: "exact",
    roleKitCategory: null,
  };
}
