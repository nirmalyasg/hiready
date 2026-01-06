export type RoundCategory = 
  | "aptitude_assessment"
  | "hr_screening"
  | "hiring_manager" 
  | "technical_interview"
  | "coding_assessment"
  | "system_design"
  | "case_study"
  | "behavioral"
  | "culture_values"
  | "bar_raiser"
  | "group_discussion";

export type PracticeMode = 
  | "live_interview"
  | "coding_lab"
  | "case_study";

export interface RoundTaxonomy {
  category: RoundCategory;
  label: string;
  description: string;
  practiceMode: PracticeMode;
  typicalDuration: string;
  icon: string;
}

export const ROUND_TAXONOMY: Record<RoundCategory, RoundTaxonomy> = {
  hr_screening: {
    category: "hr_screening",
    label: "HR Interview",
    description: "Behavioral assessment combined with general fit evaluation - covering motivation, background, cultural alignment, and teamwork",
    practiceMode: "live_interview",
    typicalDuration: "10-15 min",
    icon: "phone",
  },
  hiring_manager: {
    category: "hiring_manager",
    label: "Hiring Manager Interview",
    description: "Domain expertise deep-dive - industry knowledge, case studies, role-specific requirements, and strategic thinking derived from the JD",
    practiceMode: "live_interview",
    typicalDuration: "10-15 min",
    icon: "user",
  },
  technical_interview: {
    category: "technical_interview",
    label: "Technical Interview",
    description: "Technical problem solving, coding exercises, architecture discussions, and JD-derived technical skills verification",
    practiceMode: "live_interview",
    typicalDuration: "10-15 min",
    icon: "code",
  },
  coding_assessment: {
    category: "coding_assessment",
    label: "Coding Assessment",
    description: "Hands-on coding problems to demonstrate programming skills and algorithmic thinking",
    practiceMode: "coding_lab",
    typicalDuration: "15 min",
    icon: "terminal",
  },
  system_design: {
    category: "system_design",
    label: "System Design",
    description: "Design a scalable system architecture, discussing tradeoffs and technical decisions",
    practiceMode: "case_study",
    typicalDuration: "10-15 min",
    icon: "boxes",
  },
  case_study: {
    category: "case_study",
    label: "Case Study",
    description: "Analyze a business problem, structure your approach, and present recommendations",
    practiceMode: "case_study",
    typicalDuration: "10-15 min",
    icon: "briefcase",
  },
  behavioral: {
    category: "behavioral",
    label: "Behavioral Interview",
    description: "STAR-format questions about past experiences demonstrating key competencies",
    practiceMode: "live_interview",
    typicalDuration: "10-15 min",
    icon: "message-circle",
  },
  culture_values: {
    category: "culture_values",
    label: "Culture & Values",
    description: "Assessment of cultural fit, values alignment, and collaboration style",
    practiceMode: "live_interview",
    typicalDuration: "10-15 min",
    icon: "heart",
  },
  bar_raiser: {
    category: "bar_raiser",
    label: "Bar Raiser",
    description: "Cross-functional interview focused on raising the hiring bar (common at Amazon)",
    practiceMode: "live_interview",
    typicalDuration: "10-15 min",
    icon: "trending-up",
  },
  aptitude_assessment: {
    category: "aptitude_assessment",
    label: "Aptitude Assessment",
    description: "Quantitative, logical, and verbal reasoning assessment",
    practiceMode: "coding_lab",
    typicalDuration: "15 min",
    icon: "calculator",
  },
  group_discussion: {
    category: "group_discussion",
    label: "Group Discussion",
    description: "Group discussion evaluating communication and teamwork skills",
    practiceMode: "live_interview",
    typicalDuration: "10-15 min",
    icon: "users",
  },
};

export const BLUEPRINT_ROUND_MAPPING: Record<string, RoundCategory[]> = {
  phone_screen: ["hr_screening", "technical_interview"],
  onsite: ["hiring_manager", "technical_interview", "behavioral"],
  technical: ["technical_interview", "coding_assessment"],
  coding: ["coding_assessment"],
  system_design: ["system_design"],
  behavioral: ["behavioral"],
  bar_raiser: ["bar_raiser"],
  culture_fit: ["culture_values"],
  case: ["case_study"],
  presentation: ["case_study"],
  hiring_manager: ["hiring_manager"],
  hr: ["hr_screening"],
};

export const ARCHETYPE_ROUND_DEFAULTS: Record<string, RoundCategory[]> = {
  big_tech: ["hr_screening", "coding_assessment", "system_design", "behavioral", "hiring_manager"],
  enterprise: ["hr_screening", "hiring_manager", "technical_interview", "behavioral"],
  startup: ["hr_screening", "technical_interview", "culture_values", "hiring_manager"],
  consulting: ["hr_screening", "case_study", "behavioral", "hiring_manager"],
  finance: ["hr_screening", "technical_interview", "case_study", "behavioral"],
  default: ["hr_screening", "hiring_manager", "technical_interview", "behavioral"],
};

export interface CompanyPracticeContext {
  jobTargetId: string;
  companyName: string | null;
  companyId: string | null;
  roleTitle: string | null;
  archetype: string | null;
  tier: string | null;
  hasBlueprint: boolean;
  blueprintNotes: string | null;
  focusAreas: string[];
  leadershipPrinciples: string[] | null;
  interviewStyle: string | null;
}

export interface RoleBlueprint {
  taskType: string;
  promptTemplate: string;
  expectedSignals: string[];
  probeQuestions: string[];
  difficultyBand?: string;
}

export interface PracticeOption {
  id: string;
  phaseId?: string;
  roundCategory: RoundCategory;
  label: string;
  description: string;
  practiceMode: PracticeMode;
  typicalDuration: string;
  icon: string;
  companySpecific: boolean;
  provenance?: "both" | "company" | "role" | null;
  companyContext: CompanyPracticeContext;
  focusHint: string | null;
  roleBlueprint?: RoleBlueprint | null;
  allBlueprints?: RoleBlueprint[];
}

export function generatePracticeOptions(
  jobTargetId: string,
  companyName: string | null,
  companyId: string | null,
  roleTitle: string | null,
  archetype: string | null,
  tier: string | null,
  blueprintRounds: string[] | null,
  blueprintNotes: string | null,
  focusAreas: string[] = [],
  leadershipPrinciples: string[] | null = null,
  blueprintFocusAreas: string[] | null = null
): PracticeOption[] {
  const context: CompanyPracticeContext = {
    jobTargetId,
    companyName,
    companyId,
    roleTitle,
    archetype,
    tier,
    hasBlueprint: !!blueprintRounds && blueprintRounds.length > 0,
    blueprintNotes,
    focusAreas,
    leadershipPrinciples,
    interviewStyle: archetype === "big_tech" ? "structured" : archetype === "startup" ? "conversational" : "mixed",
  };

  let roundCategories: RoundCategory[] = [];
  let hasBlueprintCoding = false;
  let hasBlueprintCaseStudy = false;

  if (blueprintFocusAreas && blueprintFocusAreas.length > 0) {
    const focusLower = blueprintFocusAreas.map(f => f.toLowerCase());
    if (focusLower.some(f => ["coding", "dsa", "algorithms", "machine-coding", "leetcode"].includes(f))) {
      hasBlueprintCoding = true;
    }
    if (focusLower.some(f => ["case", "case-study", "estimation", "market-sizing", "business-case"].includes(f))) {
      hasBlueprintCaseStudy = true;
    }
  }

  if (blueprintRounds && blueprintRounds.length > 0) {
    for (const round of blueprintRounds) {
      const mapped = BLUEPRINT_ROUND_MAPPING[round.toLowerCase()];
      if (mapped) {
        for (const cat of mapped) {
          if (cat === "coding_assessment") {
            hasBlueprintCoding = true;
          } else if (cat === "case_study") {
            hasBlueprintCaseStudy = true;
          }
          roundCategories.push(cat);
        }
      }
    }
    roundCategories = [...new Set(roundCategories)];
  }

  if (roundCategories.length === 0) {
    if (archetype && ARCHETYPE_ROUND_DEFAULTS[archetype]) {
      roundCategories = [...ARCHETYPE_ROUND_DEFAULTS[archetype]];
    } else {
      roundCategories = [...ARCHETYPE_ROUND_DEFAULTS.default];
    }
  }

  roundCategories = roundCategories.filter(cat => {
    if (cat === "coding_assessment" && !hasBlueprintCoding) return false;
    if (cat === "case_study" && !hasBlueprintCaseStudy) return false;
    return true;
  });
  
  if (hasBlueprintCoding && !roundCategories.includes("coding_assessment")) {
    roundCategories.push("coding_assessment");
  }
  if (hasBlueprintCaseStudy && !roundCategories.includes("case_study")) {
    roundCategories.push("case_study");
  }

  const options: PracticeOption[] = roundCategories.map((category, index) => {
    const taxonomy = ROUND_TAXONOMY[category];
    const focusHint = getFocusHint(category, archetype, blueprintNotes, leadershipPrinciples);
    
    return {
      id: `${jobTargetId}-${category}-${index}`,
      roundCategory: category,
      label: companyName ? `${companyName} ${taxonomy.label}` : taxonomy.label,
      description: taxonomy.description,
      practiceMode: taxonomy.practiceMode,
      typicalDuration: taxonomy.typicalDuration,
      icon: taxonomy.icon,
      companySpecific: !!companyName && context.hasBlueprint,
      companyContext: context,
      focusHint,
    };
  });

  return options;
}

function getFocusHint(
  category: RoundCategory,
  archetype: string | null,
  blueprintNotes: string | null,
  leadershipPrinciples: string[] | null
): string | null {
  if (category === "bar_raiser" && leadershipPrinciples?.length) {
    return `Focus on: ${leadershipPrinciples.slice(0, 3).join(", ")}`;
  }
  
  if (category === "behavioral" && leadershipPrinciples?.length) {
    return `STAR stories demonstrating: ${leadershipPrinciples.slice(0, 2).join(", ")}`;
  }

  if (category === "culture_values" && archetype === "big_tech") {
    return "Emphasize collaboration, innovation, and impact at scale";
  }

  if (category === "system_design" && archetype === "big_tech") {
    return "Focus on scalability, reliability, and handling edge cases";
  }

  if (category === "case_study" && archetype === "consulting") {
    return "Structure your approach, consider multiple hypotheses, be data-driven";
  }

  if (blueprintNotes) {
    const noteSnippet = blueprintNotes.substring(0, 80);
    return noteSnippet.length < blueprintNotes.length ? `${noteSnippet}...` : noteSnippet;
  }

  return null;
}
