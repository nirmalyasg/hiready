import { db } from "../db.js";
import { eq, sql, ilike } from "drizzle-orm";
import { roleKits } from "../../shared/schema.js";

interface RoleKitMatch {
  roleKitId: number;
  roleKitName: string;
  confidence: "high" | "medium" | "low";
  matchType: "exact" | "keyword" | "domain" | "none";
}

const ROLE_DOMAIN_MAP: Record<string, string[]> = {
  software: [
    "software engineer", "software developer", "sde", "backend", "frontend", 
    "fullstack", "full stack", "full-stack", "mobile developer", "ios developer", 
    "android developer", "web developer", "developer", "engineer"
  ],
  data: [
    "data analyst", "data scientist", "data engineer", "ml engineer", 
    "machine learning", "analytics", "bi analyst", "business intelligence",
    "etl", "big data", "data science", "applied scientist"
  ],
  product: [
    "product manager", "pm", "product owner", "apm", "associate product manager",
    "group product manager", "product lead"
  ],
  design: [
    "product designer", "ux designer", "ui designer", "ux/ui", 
    "interaction designer", "visual designer", "design"
  ],
  marketing: [
    "marketing", "growth", "digital marketing", "performance marketing",
    "brand marketing", "content marketing", "marketing manager"
  ],
  sales: [
    "sales", "account executive", "account manager", "business development",
    "sales executive", "enterprise sales", "sdr", "sales development"
  ],
  customer_success: [
    "customer success", "csm", "customer support", "client success"
  ],
  operations: [
    "operations", "ops", "supply chain", "logistics", "operations manager"
  ],
  consulting: [
    "consultant", "business analyst", "strategy", "management consulting"
  ],
  finance: [
    "finance", "fp&a", "accounting", "financial analyst", "financial"
  ],
  hr: [
    "hr", "human resources", "people", "talent"
  ],
  recruiting: [
    "recruiter", "recruiting", "talent acquisition"
  ],
  engineering_management: [
    "engineering manager", "team lead", "tech lead", "engineering lead"
  ],
};

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

  for (const kit of allRoleKits) {
    const kitName = kit.name.toLowerCase();
    if (kitName.includes(normalizedTitle) || normalizedTitle.includes(kitName.split(" - ")[0])) {
      return {
        roleKitId: kit.id,
        roleKitName: kit.name,
        confidence: "high",
        matchType: "exact",
      };
    }
  }

  let detectedDomain: string | null = null;
  let bestMatchScore = 0;
  
  for (const [domain, patterns] of Object.entries(ROLE_DOMAIN_MAP)) {
    const matchCount = patterns.filter(p => 
      normalizedTitle.includes(p) || normalizedJd.includes(p)
    ).length;
    
    if (matchCount > bestMatchScore) {
      bestMatchScore = matchCount;
      detectedDomain = domain;
    }
  }
  
  if (detectedDomain) {
    const matchingKits = allRoleKits.filter(kit => kit.domain === detectedDomain);
    
    if (matchingKits.length > 0) {
      const entryLevel = matchingKits.find(k => 
        k.name.toLowerCase().includes("entry") || k.name.toLowerCase().includes("associate")
      );
      const midLevel = matchingKits.find(k => k.name.toLowerCase().includes("mid"));
      
      const isJunior = normalizedTitle.includes("junior") || 
                       normalizedTitle.includes("associate") || 
                       normalizedTitle.includes("entry") ||
                       normalizedJd.includes("0-2 years") ||
                       normalizedJd.includes("1-2 years") ||
                       normalizedJd.includes("fresher");
      
      const isMid = normalizedTitle.includes("mid") || 
                    normalizedTitle.includes("senior") ||
                    normalizedJd.includes("3-5 years") ||
                    normalizedJd.includes("4-6 years");
      
      let selectedKit = matchingKits[0];
      if (isJunior && entryLevel) {
        selectedKit = entryLevel;
      } else if (isMid && midLevel) {
        selectedKit = midLevel;
      } else if (entryLevel) {
        selectedKit = entryLevel;
      }
      
      return {
        roleKitId: selectedKit.id,
        roleKitName: selectedKit.name,
        confidence: bestMatchScore >= 2 ? "high" : "medium",
        matchType: "domain",
      };
    }
  }

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
        return {
          roleKitId: (entryLevel || matchingKits[0]).id,
          roleKitName: (entryLevel || matchingKits[0]).name,
          confidence: "medium",
          matchType: "domain",
        };
      }
    }
  }

  const defaultKit = allRoleKits.find(k => k.domain === "software" && k.name.toLowerCase().includes("entry"));
  if (defaultKit) {
    return {
      roleKitId: defaultKit.id,
      roleKitName: defaultKit.name,
      confidence: "low",
      matchType: "none",
    };
  }

  return {
    roleKitId: allRoleKits[0].id,
    roleKitName: allRoleKits[0].name,
    confidence: "low",
    matchType: "none",
  };
}
