export type InterviewLayoutMode = "normal" | "coding" | "case_study";

export interface InterviewPhase {
  name: string;
  duration: number;
  objectives?: string[];
  questionPatterns?: string[];
}

export interface InterviewPlanData {
  phases?: InterviewPhase[];
  focusAreas?: string[];
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
    const phaseName = phase.name.toLowerCase();
    const objectives = (phase.objectives || []).map((o) => o.toLowerCase()).join(" ");
    const combined = `${phaseName} ${objectives}`;
    return CODING_PHASE_KEYWORDS.some((kw) => combined.includes(kw));
  });
}

export function hasAnyCaseStudyPhase(plan: InterviewPlanData | null | undefined): boolean {
  if (!plan?.phases) return false;
  return plan.phases.some((phase) => {
    const phaseName = phase.name.toLowerCase();
    const objectives = (phase.objectives || []).map((o) => o.toLowerCase()).join(" ");
    const combined = `${phaseName} ${objectives}`;
    return CASE_STUDY_PHASE_KEYWORDS.some((kw) => combined.includes(kw));
  });
}
