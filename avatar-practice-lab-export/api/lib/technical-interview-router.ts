/**
 * Technical Interview Router
 *
 * Determines the appropriate exercise type (coding or case study) for technical
 * interview rounds based on role archetype, role category, skills, and job details.
 */

import { db } from "../db.js";
import { eq, and, sql } from "drizzle-orm";
import {
  roleArchetypes,
  codingExercises,
  caseTemplates,
  roleKits,
  jobTargets,
} from "../../shared/schema.js";
import { extractSkillsFromText, type SkillTag } from "./capability-vectorizer.js";

// Types for technical exercise routing
export type TechnicalExerciseType = "coding" | "case_study" | "hybrid" | "discussion";

export interface TechnicalExerciseRouting {
  exerciseType: TechnicalExerciseType;
  confidence: "high" | "medium" | "low";
  rationale: string;
  matchedSignals: string[];
  suggestedExercise?: {
    id: string | number;
    name: string;
    type: "coding_exercise" | "case_template";
    difficulty: "easy" | "medium" | "hard";
    skillTags: string[];
  };
  fallbackType?: TechnicalExerciseType;
}

export interface TechnicalPhaseChallenge {
  challengeId: string;
  challengeType: "coding" | "case_study";
  exerciseId?: number;
  caseTemplateId?: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  skillTags: string[];
  estimatedDuration: number;
}

// Role categories that typically require coding exercises
const CODING_FOCUSED_CATEGORIES = ["tech", "data"] as const;

// Role categories that typically require case studies
const CASE_STUDY_FOCUSED_CATEGORIES = ["product", "business", "sales", "consulting"] as const;

// Role archetypes that strongly indicate coding exercises
const CODING_FOCUSED_ARCHETYPES = [
  "core_software_engineer",
  "data_engineer",
  "ml_engineer",
  "infra_platform",
  "security_engineer",
  "qa_test_engineer",
] as const;

// Role archetypes that strongly indicate case studies
const CASE_STUDY_FOCUSED_ARCHETYPES = [
  "product_manager",
  "technical_program_manager",
  "bizops_strategy",
  "operations_general",
  "finance_strategy",
  "consulting_general",
  "marketing_growth",
] as const;

// Role archetypes that may need hybrid (either coding or case)
const HYBRID_ARCHETYPES = [
  "data_analyst",
  "data_scientist",
  "product_designer",
  "customer_success",
  "sales_account",
] as const;

// Skill keywords that indicate coding-heavy roles
const CODING_SKILL_SIGNALS = [
  "programming",
  "coding",
  "algorithm",
  "data structure",
  "dsa",
  "leetcode",
  "python",
  "javascript",
  "java",
  "c++",
  "golang",
  "rust",
  "typescript",
  "react",
  "node.js",
  "backend",
  "frontend",
  "fullstack",
  "api",
  "microservices",
  "database",
  "sql",
  "nosql",
  "cloud",
  "aws",
  "gcp",
  "azure",
  "kubernetes",
  "docker",
  "ci/cd",
  "devops",
  "debugging",
  "testing",
  "unit test",
  "integration test",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "data pipeline",
  "etl",
  "spark",
  "kafka",
];

// Skill keywords that indicate case study roles
const CASE_STUDY_SKILL_SIGNALS = [
  "product management",
  "product strategy",
  "roadmap",
  "prioritization",
  "stakeholder",
  "business case",
  "market analysis",
  "competitive analysis",
  "go-to-market",
  "user research",
  "metrics",
  "kpi",
  "okr",
  "growth",
  "monetization",
  "pricing",
  "customer journey",
  "funnel",
  "conversion",
  "retention",
  "acquisition",
  "a/b testing",
  "experiment",
  "hypothesis",
  "strategy",
  "consulting",
  "problem solving",
  "structured thinking",
  "presentation",
  "communication",
  "estimation",
  "market sizing",
  "case interview",
  "business development",
  "partnership",
  "negotiation",
  "project management",
  "program management",
  "cross-functional",
  "leadership",
];

// Interview mode to exercise type mapping
const INTERVIEW_MODE_TO_EXERCISE: Record<string, TechnicalExerciseType> = {
  coding_technical: "coding",
  case_problem_solving: "case_study",
  system_deep_dive: "hybrid",
  behavioral: "discussion",
  hiring_manager: "discussion",
  role_based: "hybrid",
  custom: "hybrid",
  skill_only: "hybrid",
};

/**
 * Analyzes skills and determines the exercise type tendency
 */
function analyzeSkillSignals(skills: string[]): {
  codingScore: number;
  caseStudyScore: number;
  matchedCoding: string[];
  matchedCaseStudy: string[];
} {
  const normalizedSkills = skills.map(s => s.toLowerCase());
  const skillsText = normalizedSkills.join(" ");

  const matchedCoding: string[] = [];
  const matchedCaseStudy: string[] = [];

  for (const signal of CODING_SKILL_SIGNALS) {
    if (skillsText.includes(signal.toLowerCase())) {
      matchedCoding.push(signal);
    }
  }

  for (const signal of CASE_STUDY_SKILL_SIGNALS) {
    if (skillsText.includes(signal.toLowerCase())) {
      matchedCaseStudy.push(signal);
    }
  }

  return {
    codingScore: matchedCoding.length,
    caseStudyScore: matchedCaseStudy.length,
    matchedCoding,
    matchedCaseStudy,
  };
}

/**
 * Determines the technical exercise type based on role archetype
 */
export function getExerciseTypeFromArchetype(
  roleArchetypeId: string | null
): { type: TechnicalExerciseType; confidence: "high" | "medium" | "low" } {
  if (!roleArchetypeId) {
    return { type: "hybrid", confidence: "low" };
  }

  if (CODING_FOCUSED_ARCHETYPES.includes(roleArchetypeId as any)) {
    return { type: "coding", confidence: "high" };
  }

  if (CASE_STUDY_FOCUSED_ARCHETYPES.includes(roleArchetypeId as any)) {
    return { type: "case_study", confidence: "high" };
  }

  if (HYBRID_ARCHETYPES.includes(roleArchetypeId as any)) {
    return { type: "hybrid", confidence: "medium" };
  }

  return { type: "hybrid", confidence: "low" };
}

/**
 * Determines the technical exercise type based on role category
 */
export function getExerciseTypeFromCategory(
  roleCategory: string | null
): { type: TechnicalExerciseType; confidence: "high" | "medium" | "low" } {
  if (!roleCategory) {
    return { type: "hybrid", confidence: "low" };
  }

  if (CODING_FOCUSED_CATEGORIES.includes(roleCategory as any)) {
    return { type: "coding", confidence: "medium" };
  }

  if (CASE_STUDY_FOCUSED_CATEGORIES.includes(roleCategory as any)) {
    return { type: "case_study", confidence: "medium" };
  }

  return { type: "hybrid", confidence: "low" };
}

/**
 * Main routing function - determines the appropriate technical exercise type
 * based on multiple signals: role archetype, category, skills, and interview mode
 */
export async function routeTechnicalInterview(params: {
  roleArchetypeId?: string | null;
  roleCategory?: string | null;
  roleKitId?: number | null;
  jobTargetId?: string | null;
  interviewMode?: string | null;
  skills?: string[];
  jdText?: string | null;
  seniority?: "entry" | "mid" | "senior";
}): Promise<TechnicalExerciseRouting> {
  const {
    roleArchetypeId,
    roleCategory,
    roleKitId,
    jobTargetId,
    interviewMode,
    skills = [],
    jdText,
    seniority = "mid",
  } = params;

  const matchedSignals: string[] = [];
  let exerciseType: TechnicalExerciseType = "hybrid";
  let confidence: "high" | "medium" | "low" = "low";
  let rationale = "";

  // Priority 1: Interview mode takes precedence if explicitly set
  if (interviewMode && INTERVIEW_MODE_TO_EXERCISE[interviewMode]) {
    const modeType = INTERVIEW_MODE_TO_EXERCISE[interviewMode];
    if (modeType !== "hybrid" && modeType !== "discussion") {
      exerciseType = modeType;
      confidence = "high";
      rationale = `Interview mode "${interviewMode}" explicitly requires ${modeType}`;
      matchedSignals.push(`interview_mode:${interviewMode}`);
    }
  }

  // Priority 2: Role archetype is the strongest signal
  if (confidence !== "high" && roleArchetypeId) {
    const archetypeResult = getExerciseTypeFromArchetype(roleArchetypeId);
    if (archetypeResult.confidence === "high") {
      exerciseType = archetypeResult.type;
      confidence = archetypeResult.confidence;
      rationale = `Role archetype "${roleArchetypeId}" strongly indicates ${exerciseType}`;
      matchedSignals.push(`archetype:${roleArchetypeId}`);
    } else if (archetypeResult.type !== "hybrid") {
      exerciseType = archetypeResult.type;
      confidence = archetypeResult.confidence;
      matchedSignals.push(`archetype:${roleArchetypeId}`);
    }
  }

  // Priority 3: Role category as secondary signal
  if (confidence === "low" && roleCategory) {
    const categoryResult = getExerciseTypeFromCategory(roleCategory);
    if (categoryResult.type !== "hybrid") {
      exerciseType = categoryResult.type;
      confidence = categoryResult.confidence;
      rationale = `Role category "${roleCategory}" suggests ${exerciseType}`;
      matchedSignals.push(`category:${roleCategory}`);
    }
  }

  // Priority 4: Skill analysis from JD or provided skills
  let extractedSkills = skills;
  if (jdText && skills.length === 0) {
    const skillTags = extractSkillsFromText(jdText, "jd");
    extractedSkills = skillTags.map(s => s.skill);
  }

  if (extractedSkills.length > 0) {
    const skillAnalysis = analyzeSkillSignals(extractedSkills);

    if (confidence !== "high") {
      if (skillAnalysis.codingScore > skillAnalysis.caseStudyScore * 1.5) {
        exerciseType = "coding";
        confidence = skillAnalysis.codingScore >= 5 ? "high" : "medium";
        rationale = `Skill analysis shows ${skillAnalysis.codingScore} coding signals vs ${skillAnalysis.caseStudyScore} case study signals`;
        matchedSignals.push(...skillAnalysis.matchedCoding.slice(0, 5).map(s => `skill:${s}`));
      } else if (skillAnalysis.caseStudyScore > skillAnalysis.codingScore * 1.5) {
        exerciseType = "case_study";
        confidence = skillAnalysis.caseStudyScore >= 5 ? "high" : "medium";
        rationale = `Skill analysis shows ${skillAnalysis.caseStudyScore} case study signals vs ${skillAnalysis.codingScore} coding signals`;
        matchedSignals.push(...skillAnalysis.matchedCaseStudy.slice(0, 5).map(s => `skill:${s}`));
      }
    }
  }

  // Priority 5: Load role kit defaults if available
  if (confidence === "low" && roleKitId) {
    try {
      const [roleKit] = await db
        .select()
        .from(roleKits)
        .where(eq(roleKits.id, roleKitId));

      if (roleKit?.roleCategory) {
        const categoryResult = getExerciseTypeFromCategory(roleKit.roleCategory);
        if (categoryResult.type !== "hybrid") {
          exerciseType = categoryResult.type;
          confidence = "medium";
          rationale = `Role kit "${roleKit.name}" is in category "${roleKit.roleCategory}"`;
          matchedSignals.push(`roleKit:${roleKit.name}`);
        }
      }
    } catch (error) {
      console.error("Error loading role kit:", error);
    }
  }

  // Default rationale if still hybrid/undetermined
  if (!rationale) {
    rationale = "No strong signals detected; defaulting to hybrid approach allowing both exercise types";
  }

  // Determine fallback type for hybrid
  const fallbackType: TechnicalExerciseType | undefined =
    exerciseType === "hybrid" ? "coding" : undefined;

  return {
    exerciseType,
    confidence,
    rationale,
    matchedSignals,
    fallbackType,
  };
}

/**
 * Fetches a suitable exercise based on the routing result
 */
export async function fetchExerciseForRouting(
  routing: TechnicalExerciseRouting,
  params: {
    roleKitId?: number | null;
    roleArchetypeId?: string | null;
    skills?: string[];
    seniority?: "entry" | "mid" | "senior";
  }
): Promise<TechnicalPhaseChallenge | null> {
  const { roleKitId, roleArchetypeId, skills = [], seniority = "mid" } = params;

  const difficultyMap: Record<string, "easy" | "medium" | "hard"> = {
    entry: "easy",
    mid: "medium",
    senior: "hard",
  };
  const targetDifficulty = difficultyMap[seniority] || "medium";

  if (routing.exerciseType === "coding" || routing.exerciseType === "hybrid") {
    // Try to find a coding exercise
    try {
      let exercises = await db
        .select()
        .from(codingExercises)
        .where(
          roleKitId
            ? eq(codingExercises.roleKitId, roleKitId)
            : sql`1=1`
        )
        .limit(10);

      // Filter by difficulty if possible
      let matchingExercises = exercises.filter(e => e.difficulty === targetDifficulty);
      if (matchingExercises.length === 0) {
        matchingExercises = exercises;
      }

      if (matchingExercises.length > 0) {
        // Pick one randomly or by skill match
        const exercise = matchingExercises[Math.floor(Math.random() * matchingExercises.length)];

        return {
          challengeId: `coding-${exercise.id}`,
          challengeType: "coding",
          exerciseId: exercise.id,
          title: exercise.name,
          description: exercise.codeSnippet?.slice(0, 200) || "Complete the coding challenge",
          difficulty: (exercise.difficulty as "easy" | "medium" | "hard") || "medium",
          skillTags: (exercise.tags as string[]) || [],
          estimatedDuration: 15,
        };
      }
    } catch (error) {
      console.error("Error fetching coding exercise:", error);
    }
  }

  if (routing.exerciseType === "case_study" ||
      (routing.exerciseType === "hybrid" && routing.fallbackType === "case_study")) {
    // Try to find a case template
    try {
      let cases = await db
        .select()
        .from(caseTemplates)
        .where(
          roleKitId
            ? eq(caseTemplates.roleKitId, roleKitId)
            : sql`1=1`
        )
        .limit(10);

      // Filter by difficulty if possible
      let matchingCases = cases.filter(c => c.difficulty === targetDifficulty);
      if (matchingCases.length === 0) {
        matchingCases = cases;
      }

      if (matchingCases.length > 0) {
        const caseTemplate = matchingCases[Math.floor(Math.random() * matchingCases.length)];

        return {
          challengeId: `case-${caseTemplate.id}`,
          challengeType: "case_study",
          caseTemplateId: caseTemplate.id,
          title: caseTemplate.name,
          description: caseTemplate.description || "Analyze and solve this business case",
          difficulty: (caseTemplate.difficulty as "easy" | "medium" | "hard") || "medium",
          skillTags: [],
          estimatedDuration: 20,
        };
      }
    } catch (error) {
      console.error("Error fetching case template:", error);
    }
  }

  return null;
}

/**
 * Full routing + exercise selection in one call
 */
export async function routeAndSelectExercise(params: {
  roleArchetypeId?: string | null;
  roleCategory?: string | null;
  roleKitId?: number | null;
  jobTargetId?: string | null;
  interviewMode?: string | null;
  skills?: string[];
  jdText?: string | null;
  seniority?: "entry" | "mid" | "senior";
}): Promise<{
  routing: TechnicalExerciseRouting;
  challenge: TechnicalPhaseChallenge | null;
}> {
  const routing = await routeTechnicalInterview(params);

  const challenge = await fetchExerciseForRouting(routing, {
    roleKitId: params.roleKitId,
    roleArchetypeId: params.roleArchetypeId,
    skills: params.skills,
    seniority: params.seniority,
  });

  // Attach suggested exercise to routing result
  if (challenge) {
    routing.suggestedExercise = {
      id: challenge.challengeId,
      name: challenge.title,
      type: challenge.challengeType === "coding" ? "coding_exercise" : "case_template",
      difficulty: challenge.difficulty,
      skillTags: challenge.skillTags,
    };
  }

  return { routing, challenge };
}

/**
 * Enriches interview phases with technical exercise routing
 */
export async function enrichPhasesWithExercises(
  phases: Array<{
    name: string;
    phaseType?: string;
    category?: string;
    objectives?: string[];
  }>,
  params: {
    roleArchetypeId?: string | null;
    roleCategory?: string | null;
    roleKitId?: number | null;
    interviewMode?: string | null;
    skills?: string[];
    jdText?: string | null;
    seniority?: "entry" | "mid" | "senior";
  }
): Promise<Array<{
  name: string;
  phaseType?: string;
  category?: string;
  objectives?: string[];
  challenge?: TechnicalPhaseChallenge;
  routing?: TechnicalExerciseRouting;
}>> {
  const technicalPhaseKeywords = [
    "technical",
    "coding",
    "problem solving",
    "assessment",
    "dsa",
    "algorithm",
  ];

  const casePhaseKeywords = [
    "case study",
    "case-study",
    "product sense",
    "estimation",
    "business case",
    "analytics case",
  ];

  const enrichedPhases = await Promise.all(
    phases.map(async (phase) => {
      const phaseName = phase.name.toLowerCase();
      const objectives = (phase.objectives || []).join(" ").toLowerCase();
      const combined = `${phaseName} ${objectives}`;

      // Check if this phase needs exercise routing
      const isTechnicalPhase = technicalPhaseKeywords.some(kw => combined.includes(kw));
      const isCasePhase = casePhaseKeywords.some(kw => combined.includes(kw));

      if (!isTechnicalPhase && !isCasePhase) {
        return phase;
      }

      // Override interview mode based on phase type
      let phaseInterviewMode = params.interviewMode;
      if (isCasePhase && !isTechnicalPhase) {
        phaseInterviewMode = "case_problem_solving";
      } else if (isTechnicalPhase && !isCasePhase) {
        phaseInterviewMode = "coding_technical";
      }

      // Get routing and exercise for this phase
      const { routing, challenge } = await routeAndSelectExercise({
        ...params,
        interviewMode: phaseInterviewMode,
      });

      return {
        ...phase,
        phaseType: challenge?.challengeType || phase.phaseType,
        challenge: challenge || undefined,
        routing,
      };
    })
  );

  return enrichedPhases;
}
