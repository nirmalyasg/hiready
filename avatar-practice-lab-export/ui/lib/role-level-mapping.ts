export const ROLE_LEVEL_DICTIONARY: Record<string, string> = {
  "intern": "IC/Junior",
  "trainee": "IC/Junior",
  "apprentice": "IC/Junior",
  "associate": "IC/Junior",
  "junior associate": "IC/Junior",
  "executive": "IC/Junior",
  "senior executive": "IC/Junior",
  "analyst": "IC/Junior",
  "senior analyst": "IC/Junior",
  "specialist": "IC/Junior",
  "senior specialist": "IC/Junior",
  "engineer": "IC/Junior",
  "software engineer": "IC/Junior",
  "senior software engineer": "IC/Junior",
  "swe": "IC/Junior",
  "sde": "IC/Junior",
  "developer": "IC/Junior",
  "dev": "IC/Junior",
  "consultant": "IC/Junior",
  "senior consultant": "IC/Junior",
  "individual contributor": "IC/Junior",
  "ic": "IC/Junior",
  "coordinator": "IC/Junior",
  "officer": "IC/Junior",
  "customer support representative": "IC/Junior",
  "customer support associate": "IC/Junior",
  "relationship manager": "IC/Junior",
  "key account executive": "IC/Junior",
  "sme": "IC/Junior",
  "subject matter expert": "IC/Junior",
  "architect": "IC/Junior",
  "tech lead": "IC/Junior",
  "tl": "Manager",
  "staff engineer": "IC/Junior",
  "staff": "IC/Junior",
  "designer": "IC/Junior",
  "ux designer": "IC/Junior",
  "ui designer": "IC/Junior",
  "data scientist": "IC/Junior",
  "data analyst": "IC/Junior",
  "qa": "IC/Junior",
  "qa engineer": "IC/Junior",
  "tester": "IC/Junior",
  "ba": "IC/Junior",
  "business analyst": "IC/Junior",
  "sales representative": "IC/Junior",
  "sales rep": "IC/Junior",
  "ae": "IC/Junior",
  "account executive": "IC/Junior",
  "bdr": "IC/Junior",
  "sdr": "IC/Junior",
  "recruiter": "IC/Junior",
  "hr": "IC/Junior",
  "hr executive": "IC/Junior",
  "team lead": "Manager",
  "lead": "Manager",
  "people lead": "Manager",
  "supervisor": "Manager",
  "assistant manager": "Manager",
  "manager": "Manager",
  "senior manager": "Manager",
  "sr manager": "Manager",
  "associate manager": "Manager",
  "project manager": "Manager",
  "product manager": "Manager",
  "program manager": "Manager",
  "pm": "Manager",
  "pgm": "Manager",
  "delivery manager": "Manager",
  "account manager": "Manager",
  "am": "Manager",
  "relationship manager (people manager)": "Manager",
  "branch manager": "Manager",
  "practice lead": "Manager",
  "engagement manager": "Manager",
  "scrum master": "Manager",
  "em": "Manager",
  "engineering manager": "Manager",
  "people manager": "Manager",
  "hiring manager": "Manager",
  "ops manager": "Manager",
  "operations manager": "Manager",
  "sales manager": "Manager",
  "marketing manager": "Manager",
  "hr manager": "Manager",
  "finance manager": "Manager",
  "head": "Director",
  "functional head": "Director",
  "business head": "Director",
  "director": "Director",
  "senior director": "Director",
  "sr director": "Director",
  "associate director": "Director",
  "ad": "Director",
  "principal": "Director",
  "principal engineer": "Director",
  "distinguished engineer": "Director",
  "fellow": "Director",
  "general manager": "Director",
  "gm": "Director",
  "avp": "Director",
  "assistant vice president": "Director",
  "vp": "Director",
  "vice president": "Director",
  "svp": "Director",
  "senior vice president": "Director",
  "evp": "Director",
  "executive vice president": "Director",
  "country head": "Director",
  "regional head": "Director",
  "divisional head": "Director",
  "bh": "Director",
  "bu head": "Director",
  "business unit head": "Director",
  "vp engineering": "Director",
  "vp product": "Director",
  "vp sales": "Director",
  "vp marketing": "Director",
  "vp hr": "Director",
  "vp operations": "Director",
  "vp finance": "Director",
  "ceo": "CXO",
  "cfo": "CXO",
  "cto": "CXO",
  "coo": "CXO",
  "cmo": "CXO",
  "chro": "CXO",
  "cio": "CXO",
  "ciso": "CXO",
  "president": "CXO",
  "md": "CXO",
  "managing director": "CXO",
  "founder": "CXO",
  "co-founder": "CXO",
  "chairman": "CXO",
  "partner": "CXO",
  "senior partner": "CXO"
};

export type RoleLevelCategory = "IC/Junior" | "Manager" | "Director" | "CXO";

export interface RoleMatchResult {
  inputRole: string;
  matchedRole: string | null;
  level: RoleLevelCategory | null;
  confidence: "exact" | "high" | "medium" | "low" | "none";
  matchType: "exact" | "normalized" | "partial" | "token" | "none";
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function tokenize(str: string): string[] {
  return normalize(str).split(" ").filter(Boolean);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function getSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

export function matchRoleToLevel(inputRole: string): RoleMatchResult {
  const normalizedInput = normalize(inputRole);
  const inputTokens = tokenize(inputRole);
  
  if (!normalizedInput) {
    return {
      inputRole,
      matchedRole: null,
      level: null,
      confidence: "none",
      matchType: "none"
    };
  }
  
  const dictionaryRoles = Object.keys(ROLE_LEVEL_DICTIONARY);
  
  for (const role of dictionaryRoles) {
    if (normalize(role) === normalizedInput) {
      return {
        inputRole,
        matchedRole: role,
        level: ROLE_LEVEL_DICTIONARY[role] as RoleLevelCategory,
        confidence: "exact",
        matchType: "exact"
      };
    }
  }
  
  let bestMatch: { role: string; score: number; matchType: RoleMatchResult["matchType"] } | null = null;
  
  for (const role of dictionaryRoles) {
    const normalizedRole = normalize(role);
    const roleTokens = tokenize(role);
    
    if (normalizedInput.includes(normalizedRole) || normalizedRole.includes(normalizedInput)) {
      const lengthRatio = Math.min(normalizedInput.length, normalizedRole.length) / 
                          Math.max(normalizedInput.length, normalizedRole.length);
      const score = 0.8 + (lengthRatio * 0.2);
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { role, score, matchType: "partial" };
      }
    }
    
    const commonTokens = inputTokens.filter(t => roleTokens.includes(t));
    if (commonTokens.length > 0) {
      const tokenScore = commonTokens.length / Math.max(inputTokens.length, roleTokens.length);
      const adjustedScore = 0.5 + (tokenScore * 0.4);
      
      if (!bestMatch || adjustedScore > bestMatch.score) {
        bestMatch = { role, score: adjustedScore, matchType: "token" };
      }
    }
    
    const similarity = getSimilarity(normalizedInput, normalizedRole);
    if (similarity > 0.7) {
      const score = similarity * 0.9;
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { role, score, matchType: "normalized" };
      }
    }
  }
  
  if (bestMatch && bestMatch.score >= 0.6) {
    let confidence: RoleMatchResult["confidence"];
    if (bestMatch.score >= 0.9) {
      confidence = "high";
    } else if (bestMatch.score >= 0.75) {
      confidence = "medium";
    } else {
      confidence = "low";
    }
    
    return {
      inputRole,
      matchedRole: bestMatch.role,
      level: ROLE_LEVEL_DICTIONARY[bestMatch.role] as RoleLevelCategory,
      confidence,
      matchType: bestMatch.matchType
    };
  }
  
  return {
    inputRole,
    matchedRole: null,
    level: null,
    confidence: "none",
    matchType: "none"
  };
}

export function roleLevelToPersonaLevel(roleLevel: RoleLevelCategory): "ic" | "manager" | "senior" | "exec" {
  switch (roleLevel) {
    case "IC/Junior":
      return "ic";
    case "Manager":
      return "manager";
    case "Director":
      return "senior";
    case "CXO":
      return "exec";
    default:
      return "ic";
  }
}

export function personaLevelToRoleLevel(personaLevel: "ic" | "manager" | "senior" | "exec"): RoleLevelCategory {
  switch (personaLevel) {
    case "ic":
      return "IC/Junior";
    case "manager":
      return "Manager";
    case "senior":
      return "Director";
    case "exec":
      return "CXO";
    default:
      return "IC/Junior";
  }
}

export const ROLE_LEVEL_OPTIONS: Array<{
  level: "ic" | "manager" | "senior" | "exec";
  category: RoleLevelCategory;
  label: string;
  examples: string[];
}> = [
  {
    level: "ic",
    category: "IC/Junior",
    label: "Individual Contributor / Junior",
    examples: ["Engineer", "Analyst", "Associate", "Specialist"]
  },
  {
    level: "manager",
    category: "Manager",
    label: "People Manager",
    examples: ["Team Lead", "Manager", "Supervisor", "Scrum Master"]
  },
  {
    level: "senior",
    category: "Director",
    label: "Senior Leader / Director",
    examples: ["Director", "VP", "General Manager", "Principal"]
  },
  {
    level: "exec",
    category: "CXO",
    label: "Executive / C-Suite",
    examples: ["CEO", "CTO", "President", "Managing Director"]
  }
];
