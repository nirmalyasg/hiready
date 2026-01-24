export type InterviewLayoutMode = "normal" | "coding" | "case_study";

export type PhaseType = "warmup" | "behavioral" | "technical" | "coding" | "case_study" | "wrap_up" | "general";

export type TechnicalExerciseType = "coding" | "case_study" | "hybrid" | "discussion";

export interface PhaseChallenge {
  challengeId?: string;
  challengeType?: "coding" | "case_study";
  skillTags?: string[];
}

export interface TechnicalChallenge {
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

export interface TechnicalRouting {
  exerciseType: TechnicalExerciseType;
  confidence: "high" | "medium" | "low";
  rationale: string;
  matchedSignals: string[];
}

export interface InterviewPhase {
  name: string;
  duration: number;
  objectives?: string[];
  questionPatterns?: string[];
  phaseType?: PhaseType;
  challenge?: PhaseChallenge;
  routing?: TechnicalRouting;
}

export interface CodingProblemData {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints?: string[];
  hints?: string[];
  starterCode?: Record<string, string>;
  testCases?: { input: string; expectedOutput: string }[];
}

export interface CaseStudyData {
  id: string | number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  businessContext?: string;
  materials?: { id: string; title: string; type: string; content: string }[];
  questions?: string[];
}

export interface InterviewPlanData {
  phases?: InterviewPhase[];
  focusAreas?: string[];
  codingProblem?: CodingProblemData;
  caseStudy?: CaseStudyData;
  technicalRouting?: TechnicalRouting;
  technicalChallenge?: TechnicalChallenge;
}

const CODING_PHASE_KEYWORDS = [
  "coding",
  "problem solving",
  "technical assessment",
  "live coding",
  "algorithm",
  "data structure",
  "dsa",
  "leetcode",
  "machine-coding",
  "programming",
];

const CASE_STUDY_PHASE_KEYWORDS = [
  "case study",
  "case-study",
  "estimation",
  "market sizing",
  "market-sizing",
  "business case",
  "business-case",
  "situational analysis",
  "guesstimate",
];

export function detectInterviewLayoutMode(plan: InterviewPlanData | null | undefined): InterviewLayoutMode {
  if (!plan?.phases || plan.phases.length === 0) {
    return "normal";
  }

  // Priority 1: Check if there's a technical routing that specifies the exercise type
  if (plan.technicalRouting?.exerciseType) {
    if (plan.technicalRouting.exerciseType === "coding") {
      return "coding";
    }
    if (plan.technicalRouting.exerciseType === "case_study") {
      return "case_study";
    }
    // For hybrid, check the technical challenge if present
    if (plan.technicalRouting.exerciseType === "hybrid" && plan.technicalChallenge) {
      return plan.technicalChallenge.challengeType;
    }
  }

  // Priority 2: Check if there's a technical challenge attached
  if (plan.technicalChallenge?.challengeType) {
    return plan.technicalChallenge.challengeType;
  }

  // Priority 3: Check phase challenges
  for (const phase of plan.phases) {
    if (phase.challenge?.challengeType) {
      return phase.challenge.challengeType;
    }
  }

  // Priority 4: Check phase keywords
  for (const phase of plan.phases) {
    const phaseName = phase.name.toLowerCase();
    const objectives = (phase.objectives || []).map((o) => o.toLowerCase()).join(" ");
    const patterns = (phase.questionPatterns || []).map((p) => p.toLowerCase()).join(" ");
    const combined = `${phaseName} ${objectives} ${patterns}`;

    if (CODING_PHASE_KEYWORDS.some((kw) => combined.includes(kw))) {
      return "coding";
    }

    if (CASE_STUDY_PHASE_KEYWORDS.some((kw) => combined.includes(kw))) {
      return "case_study";
    }
  }

  const focusAreas = (plan.focusAreas || []).map((f) => f.toLowerCase()).join(" ");
  if (CODING_PHASE_KEYWORDS.some((kw) => focusAreas.includes(kw))) {
    return "coding";
  }
  if (CASE_STUDY_PHASE_KEYWORDS.some((kw) => focusAreas.includes(kw))) {
    return "case_study";
  }

  return "normal";
}

export function getCurrentPhaseMode(
  plan: InterviewPlanData | null | undefined,
  currentPhaseIndex: number
): InterviewLayoutMode {
  if (!plan?.phases || currentPhaseIndex < 0 || currentPhaseIndex >= plan.phases.length) {
    return "normal";
  }

  const phase = plan.phases[currentPhaseIndex];
  
  if (phase.challenge?.challengeType) {
    return phase.challenge.challengeType;
  }
  
  if (phase.phaseType === "coding") {
    return "coding";
  }
  if (phase.phaseType === "case_study") {
    return "case_study";
  }
  
  if (phase.phaseType === "warmup" || phase.phaseType === "behavioral" || phase.phaseType === "wrap_up") {
    return "normal";
  }

  const phaseName = phase.name.toLowerCase();
  const objectives = (phase.objectives || []).map((o) => o.toLowerCase()).join(" ");
  const patterns = (phase.questionPatterns || []).map((p) => p.toLowerCase()).join(" ");
  const combined = `${phaseName} ${objectives} ${patterns}`;

  if (CODING_PHASE_KEYWORDS.some((kw) => combined.includes(kw))) {
    return "coding";
  }

  if (CASE_STUDY_PHASE_KEYWORDS.some((kw) => combined.includes(kw))) {
    return "case_study";
  }

  return "normal";
}

export function hasAnyCodingPhase(plan: InterviewPlanData | null | undefined): boolean {
  if (!plan?.phases) return false;
  return plan.phases.some((phase) => {
    // Check for explicit challenge type first
    if (phase.challenge?.challengeType === "coding") return true;
    if (phase.phaseType === "coding") return true;

    const phaseName = phase.name.toLowerCase();
    const objectives = (phase.objectives || []).map((o) => o.toLowerCase()).join(" ");
    const combined = `${phaseName} ${objectives}`;
    return CODING_PHASE_KEYWORDS.some((kw) => combined.includes(kw));
  });
}

export function hasAnyCaseStudyPhase(plan: InterviewPlanData | null | undefined): boolean {
  if (!plan?.phases) return false;
  return plan.phases.some((phase) => {
    // Check for explicit challenge type first
    if (phase.challenge?.challengeType === "case_study") return true;
    if (phase.phaseType === "case_study") return true;

    const phaseName = phase.name.toLowerCase();
    const objectives = (phase.objectives || []).map((o) => o.toLowerCase()).join(" ");
    const combined = `${phaseName} ${objectives}`;
    return CASE_STUDY_PHASE_KEYWORDS.some((kw) => combined.includes(kw));
  });
}

/**
 * Gets the technical challenge for the current phase if available
 */
export function getPhaseChallenge(
  plan: InterviewPlanData | null | undefined,
  currentPhaseIndex: number
): TechnicalChallenge | null {
  if (!plan?.phases || currentPhaseIndex < 0 || currentPhaseIndex >= plan.phases.length) {
    return null;
  }

  const phase = plan.phases[currentPhaseIndex];

  // Check if phase has a challenge attached
  if (phase.challenge?.challengeId && phase.challenge.challengeType) {
    // Return the full challenge details from the plan if available
    if (plan.technicalChallenge && plan.technicalChallenge.challengeId === phase.challenge.challengeId) {
      return plan.technicalChallenge;
    }

    // Otherwise construct a minimal challenge from phase data
    return {
      challengeId: phase.challenge.challengeId,
      challengeType: phase.challenge.challengeType,
      title: phase.name,
      description: (phase.objectives || []).join(". "),
      difficulty: "medium",
      skillTags: phase.challenge.skillTags || [],
      estimatedDuration: phase.duration || 15,
    };
  }

  // Check if there's a plan-level technical challenge for this phase
  if (plan.technicalChallenge) {
    const phaseMode = getCurrentPhaseMode(plan, currentPhaseIndex);
    if (phaseMode === plan.technicalChallenge.challengeType) {
      return plan.technicalChallenge;
    }
  }

  return null;
}

/**
 * Gets the exercise routing information from the plan
 */
export function getTechnicalRouting(plan: InterviewPlanData | null | undefined): TechnicalRouting | null {
  return plan?.technicalRouting || null;
}

/**
 * Determines if the interview requires an exercise (coding or case study)
 */
export function requiresExercise(plan: InterviewPlanData | null | undefined): boolean {
  if (!plan) return false;

  // Check plan-level routing
  if (plan.technicalRouting?.exerciseType) {
    const type = plan.technicalRouting.exerciseType;
    return type === "coding" || type === "case_study" || type === "hybrid";
  }

  // Check for technical challenge
  if (plan.technicalChallenge) return true;

  // Check phases
  if (plan.phases) {
    for (const phase of plan.phases) {
      if (phase.challenge?.challengeType) return true;
      if (phase.phaseType === "coding" || phase.phaseType === "case_study") return true;
    }
  }

  // Check for coding problem or case study data
  if (plan.codingProblem || plan.caseStudy) return true;

  return false;
}

/**
 * Gets the appropriate exercise data for the current phase
 */
export function getExerciseData(
  plan: InterviewPlanData | null | undefined,
  currentPhaseIndex: number
): { type: "coding" | "case_study" | null; data: CodingProblemData | CaseStudyData | null } {
  const phaseMode = getCurrentPhaseMode(plan, currentPhaseIndex);

  if (phaseMode === "coding") {
    return { type: "coding", data: plan?.codingProblem || null };
  }

  if (phaseMode === "case_study") {
    return { type: "case_study", data: plan?.caseStudy || null };
  }

  return { type: null, data: null };
}
