import { db } from "../db";
import { questionPatterns, companies, companyRoleBlueprints, userSkillMemory } from "../../shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getOpenAI } from "../utils/openai-client";

export interface InterviewContext {
  roleCategory: string;
  interviewType: string;
  seniority: string;
  style: "friendly" | "neutral" | "stress";
  companyName?: string;
  companyArchetype?: string;
  resumeExtract?: ResumeExtract;
  jdExtract?: JDExtract;
  jobTarget?: JobTargetContext;
  blueprintFocus?: BlueprintFocus;
}

export interface BlueprintFocus {
  focusAreas: string[];
  hasCodingRounds: boolean;
  hasCaseStudyRounds: boolean;
  hasSystemDesign: boolean;
  interviewStyle?: string;
  notes?: string;
}

export interface ResumeExtract {
  projects?: { name: string; description: string; impact?: string }[];
  skills?: string[];
  workHistory?: { company: string; role: string; duration: string; highlights?: string[] }[];
  education?: string[];
  gaps?: { period: string; explanation?: string }[];
  claimTriggers?: string[];
}

export interface JDExtract {
  responsibilities?: string[];
  mustHave?: string[];
  niceToHave?: string[];
  keywords?: string[];
  senioritySignal?: string;
}

export interface JobTargetContext {
  roleTitle: string;
  company?: string;
  location?: string;
  description?: string;
}

export interface InterviewPhase {
  id: string;
  name: string;
  durationMins: number;
  objective: string[];
  patternTypes: string[];
  triggers?: string[];
}

export interface EnhancedInterviewPlan {
  metadata: {
    roleCategory: string;
    seniority: string;
    interviewType: string;
    company?: string;
    style: string;
  };
  phases: InterviewPhase[];
  globalRules: {
    probeDepth: number;
    avoidRepeats: boolean;
    beStrictOnVagueness: boolean;
  };
  loadedPatterns: LoadedPattern[];
}

export interface LoadedPattern {
  id: string;
  patternType: string;
  template: string;
  probeTree: {
    ifVague?: string[];
    ifStrong?: string[];
    always?: string[];
    followUp?: string[];
  };
  tags: string[];
  filledTemplate?: string;
}

export interface AnswerClassification {
  quality: "strong" | "adequate" | "weak" | "vague";
  hasMetrics: boolean;
  hasSpecificExample: boolean;
  hasOwnership: boolean;
  missingElements: string[];
  claimsExtracted: string[];
  confidence: number;
}

export interface ProbeDecision {
  shouldProbe: boolean;
  probeQuestion?: string;
  probeReason?: string;
  moveToNextPattern: boolean;
}

export async function loadQuestionPatterns(
  roleCategory: string,
  interviewType: string,
  patternTypes: string[]
): Promise<LoadedPattern[]> {
  const validPatternTypes = patternTypes as Array<"resume_claim" | "jd_requirement" | "behavioral" | "scenario" | "probe" | "technical" | "situational">;
  
  const patterns = await db
    .select()
    .from(questionPatterns)
    .where(
      and(
        inArray(questionPatterns.patternType, validPatternTypes),
        sql`(${questionPatterns.roleCategory} = ${roleCategory} OR ${questionPatterns.roleCategory} = 'general' OR ${questionPatterns.roleCategory} IS NULL)`,
        sql`(${questionPatterns.interviewType} = ${interviewType} OR ${questionPatterns.interviewType} IS NULL)`
      )
    )
    .limit(50);

  return patterns.map((p) => ({
    id: p.id,
    patternType: p.patternType,
    template: p.template,
    probeTree: (p.probeTree as LoadedPattern["probeTree"]) || {},
    tags: (p.tags as string[]) || [],
  }));
}

export async function getCompanyBlueprint(
  companyName: string,
  roleCategory: string
): Promise<{
  company: any;
  blueprint: any;
} | null> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.name, companyName))
    .limit(1);

  if (!company) return null;

  const [blueprint] = await db
    .select()
    .from(companyRoleBlueprints)
    .where(
      and(
        eq(companyRoleBlueprints.companyId, company.id),
        eq(companyRoleBlueprints.roleCategory, roleCategory as any)
      )
    )
    .limit(1);

  return { company, blueprint };
}

export function fillPatternTemplate(
  template: string,
  context: InterviewContext
): string {
  let filled = template;

  if (context.resumeExtract?.projects?.length) {
    const project = context.resumeExtract.projects[0];
    filled = filled.replace(/\{\{project_name\}\}/g, project.name);
    filled = filled.replace(/\{\{PROJECT\/CLAIM\}\}/g, project.name);
  }

  if (context.resumeExtract?.workHistory?.length) {
    const job = context.resumeExtract.workHistory[0];
    filled = filled.replace(/\{\{company1\}\}/g, job.company);
    filled = filled.replace(/\{\{role\}\}/g, job.role);
  }

  if (context.resumeExtract?.skills?.length) {
    const skill = context.resumeExtract.skills[0];
    filled = filled.replace(/\{\{technology\}\}/g, skill);
    filled = filled.replace(/\{\{skill\}\}/g, skill);
  }

  if (context.jdExtract?.mustHave?.length) {
    filled = filled.replace(/\{\{skill\}\}/g, context.jdExtract.mustHave[0]);
  }

  if (context.jobTarget) {
    filled = filled.replace(/\{\{company\}\}/g, context.jobTarget.company || "the company");
    filled = filled.replace(/\{\{roleTitle\}\}/g, context.jobTarget.roleTitle);
  }

  filled = filled.replace(/\{\{seniority_level\}\}/g, context.seniority);
  filled = filled.replace(/\{\{interviewType\}\}/g, context.interviewType);

  filled = filled.replace(/\{\{[^}]+\}\}/g, "[specific detail]");

  return filled;
}

export async function classifyAnswer(
  answer: string,
  question: string,
  context: InterviewContext
): Promise<AnswerClassification> {
  const openai = getOpenAI();

  const classificationPrompt = `You are an interview answer classifier. Analyze this candidate answer and classify it.

QUESTION: "${question}"
ANSWER: "${answer}"
ROLE: ${context.roleCategory} (${context.seniority})
INTERVIEW TYPE: ${context.interviewType}

Classify the answer and return JSON:
{
  "quality": "strong" | "adequate" | "weak" | "vague",
  "hasMetrics": boolean (did they provide numbers, percentages, or measurable impact?),
  "hasSpecificExample": boolean (did they describe a real situation with details?),
  "hasOwnership": boolean (did they clearly state what THEY personally did?),
  "missingElements": ["list of missing elements like 'no metrics', 'unclear role', 'no outcome', 'too generic'"],
  "claimsExtracted": ["any specific claims they made that could be probed further"],
  "confidence": 0.0-1.0 (your confidence in this classification)
}

CLASSIFICATION RULES:
- STRONG: Has specific example + clear ownership + measurable impact/outcome
- ADEQUATE: Has example but missing some depth (metrics OR clear ownership)
- WEAK: Generic answer, lacks specifics, unclear what they actually did
- VAGUE: Non-answer, deflection, or too brief to evaluate`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: classificationPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Answer classification failed:", error);
    return {
      quality: "adequate",
      hasMetrics: false,
      hasSpecificExample: false,
      hasOwnership: false,
      missingElements: [],
      claimsExtracted: [],
      confidence: 0.5,
    };
  }
}

export function selectProbe(
  pattern: LoadedPattern,
  classification: AnswerClassification,
  probeCount: number,
  maxProbes: number = 3
): ProbeDecision {
  if (probeCount >= maxProbes) {
    return { shouldProbe: false, moveToNextPattern: true };
  }

  const probeTree = pattern.probeTree;

  if (probeTree.always?.length && probeCount === 0) {
    return {
      shouldProbe: true,
      probeQuestion: probeTree.always[0],
      probeReason: "standard follow-up",
      moveToNextPattern: false,
    };
  }

  if (classification.quality === "vague" || classification.quality === "weak") {
    if (probeTree.ifVague?.length) {
      const probeIndex = Math.min(probeCount, probeTree.ifVague.length - 1);
      return {
        shouldProbe: true,
        probeQuestion: probeTree.ifVague[probeIndex],
        probeReason: `answer was ${classification.quality}`,
        moveToNextPattern: false,
      };
    }

    const genericProbes = [
      "Can you be more specific about what YOU personally did?",
      "What was the measurable outcome or impact?",
      "What was the most challenging part and how did you handle it?",
    ];
    return {
      shouldProbe: true,
      probeQuestion: genericProbes[Math.min(probeCount, genericProbes.length - 1)],
      probeReason: `answer was ${classification.quality}`,
      moveToNextPattern: false,
    };
  }

  if (classification.quality === "strong" && probeTree.ifStrong?.length) {
    return {
      shouldProbe: true,
      probeQuestion: probeTree.ifStrong[0],
      probeReason: "exploring depth of strong answer",
      moveToNextPattern: false,
    };
  }

  if (probeTree.followUp?.length && probeCount < 2) {
    return {
      shouldProbe: true,
      probeQuestion: probeTree.followUp[probeCount],
      probeReason: "standard follow-up",
      moveToNextPattern: false,
    };
  }

  return { shouldProbe: false, moveToNextPattern: true };
}

export async function generateEnhancedPlan(
  context: InterviewContext
): Promise<EnhancedInterviewPlan> {
  const phases: InterviewPhase[] = [];

  phases.push({
    id: "intro",
    name: "Introduction & Rapport",
    durationMins: 3,
    objective: ["rapport", "role-context", "set-expectations"],
    patternTypes: [],
  });

  if (context.interviewType === "hr") {
    phases.push({
      id: "background",
      name: "Background & Motivation",
      durationMins: 8,
      objective: ["career-journey", "motivation", "role-interest", "general-fit"],
      patternTypes: ["resume_claim", "behavioral"],
      triggers: context.resumeExtract?.claimTriggers || [],
    });

    phases.push({
      id: "behavioral",
      name: "Behavioral Assessment",
      durationMins: 12,
      objective: ["values-fit", "collaboration", "conflict-handling", "ownership", "teamwork"],
      patternTypes: ["behavioral", "situational"],
    });

    phases.push({
      id: "cultural_fit",
      name: "Cultural Alignment",
      durationMins: 6,
      objective: ["work-style", "team-dynamics", "company-values"],
      patternTypes: ["behavioral"],
    });
  } else if (context.interviewType === "hiring_manager") {
    const blueprintFocus = context.blueprintFocus;
    const hasCaseStudy = blueprintFocus?.hasCaseStudyRounds ?? false;
    
    if (context.resumeExtract?.projects?.length || context.resumeExtract?.workHistory?.length) {
      phases.push({
        id: "resume_deep_dive",
        name: "Experience Deep Dive",
        durationMins: 10,
        objective: ["validate-claims", "assess-ownership", "verify-impact"],
        patternTypes: ["resume_claim"],
        triggers: context.resumeExtract?.claimTriggers || [],
      });
    }

    phases.push({
      id: "domain_expertise",
      name: "Domain & Industry Knowledge",
      durationMins: 10,
      objective: ["industry-understanding", "domain-depth", "market-awareness"],
      patternTypes: ["jd_requirement", "situational"],
    });

    if (context.jdExtract?.mustHave?.length) {
      phases.push({
        id: "jd_requirements",
        name: "Role-Specific Requirements",
        durationMins: 8,
        objective: ["skill-match", "experience-verification", "competency-assessment"],
        patternTypes: ["jd_requirement"],
      });
    }

    if (hasCaseStudy) {
      phases.push({
        id: "case_study",
        name: "Case Study Analysis",
        durationMins: 12,
        objective: ["problem-framing", "strategic-thinking", "analytical-approach", "recommendation"],
        patternTypes: ["situational", "behavioral"],
      });
    } else {
      phases.push({
        id: "case_scenario",
        name: "Situational Analysis",
        durationMins: 8,
        objective: ["problem-framing", "strategic-thinking", "decision-making"],
        patternTypes: ["situational", "behavioral"],
      });
    }
  } else if (context.interviewType === "technical") {
    const blueprintFocus = context.blueprintFocus;
    const hasCoding = blueprintFocus?.hasCodingRounds ?? true;
    const hasSystemDesign = blueprintFocus?.hasSystemDesign ?? true;
    
    if (context.resumeExtract?.projects?.length || context.resumeExtract?.workHistory?.length) {
      phases.push({
        id: "technical_background",
        name: "Technical Background Review",
        durationMins: 8,
        objective: ["validate-claims", "technical-depth", "project-ownership"],
        patternTypes: ["resume_claim", "technical"],
        triggers: context.resumeExtract?.claimTriggers || [],
      });
    }

    if (hasCoding) {
      phases.push({
        id: "technical_assessment",
        name: "Technical Problem Solving",
        durationMins: 15,
        objective: ["problem-solving", "technical-depth", "system-thinking", "coding-approach"],
        patternTypes: ["technical"],
      });
    }

    if (context.jdExtract?.mustHave?.length) {
      phases.push({
        id: "skill_verification",
        name: "Technical Skills Verification",
        durationMins: 10,
        objective: ["skill-match", "hands-on-knowledge", "practical-application"],
        patternTypes: ["jd_requirement", "technical"],
      });
    }

    if (hasSystemDesign) {
      phases.push({
        id: "architecture_design",
        name: "Architecture & Design Discussion",
        durationMins: 8,
        objective: ["system-design", "trade-offs", "scalability"],
        patternTypes: ["technical"],
      });
    }
    
    if (!hasCoding && !hasSystemDesign) {
      phases.push({
        id: "technical_discussion",
        name: "Technical Discussion",
        durationMins: 12,
        objective: ["technical-knowledge", "domain-expertise", "problem-approach"],
        patternTypes: ["technical", "jd_requirement"],
      });
    }
  } else {
    if (context.resumeExtract?.projects?.length || context.resumeExtract?.workHistory?.length) {
      phases.push({
        id: "resume_deep_dive",
        name: "Resume Deep Dive",
        durationMins: 10,
        objective: ["validate-claims", "assess-ownership", "verify-impact"],
        patternTypes: ["resume_claim"],
        triggers: context.resumeExtract?.claimTriggers || [],
      });
    }

    if (context.jdExtract?.mustHave?.length) {
      phases.push({
        id: "jd_requirements",
        name: "Role Requirements",
        durationMins: 8,
        objective: ["skill-match", "experience-verification"],
        patternTypes: ["jd_requirement"],
      });
    }

    phases.push({
      id: "behavioral",
      name: "Behavioral Assessment",
      durationMins: 10,
      objective: ["values-fit", "collaboration", "conflict-handling", "ownership"],
      patternTypes: ["behavioral", "situational"],
    });
  }

  phases.push({
    id: "close",
    name: "Closing & Questions",
    durationMins: 4,
    objective: ["candidate-questions", "wrap-up", "next-steps"],
    patternTypes: [],
  });

  const allPatternTypes = [...new Set(phases.flatMap((p) => p.patternTypes))];
  const loadedPatterns = allPatternTypes.length > 0
    ? await loadQuestionPatterns(context.roleCategory, context.interviewType, allPatternTypes)
    : [];

  const filledPatterns = loadedPatterns.map((p) => ({
    ...p,
    filledTemplate: fillPatternTemplate(p.template, context),
  }));

  return {
    metadata: {
      roleCategory: context.roleCategory,
      seniority: context.seniority,
      interviewType: context.interviewType,
      company: context.companyName,
      style: context.style,
    },
    phases,
    globalRules: {
      probeDepth: context.style === "stress" ? 4 : 3,
      avoidRepeats: true,
      beStrictOnVagueness: context.style !== "friendly",
    },
    loadedPatterns: filledPatterns,
  };
}

export async function updateUserSkillMemory(
  userId: string,
  roleCategory: string,
  dimensionScores: { dimension: string; score: number }[],
  sessionId?: number
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  for (const { dimension, score } of dimensionScores) {
    const [existing] = await db
      .select()
      .from(userSkillMemory)
      .where(
        and(
          eq(userSkillMemory.userId, userId),
          eq(userSkillMemory.dimension, dimension),
          sql`(${userSkillMemory.roleCategory} = ${roleCategory} OR ${userSkillMemory.roleCategory} IS NULL)`
        )
      )
      .limit(1);

    if (existing) {
      const currentTrend = (existing.trend as any) || { scores: [], direction: "stable" };
      const scores = [...(currentTrend.scores || []), { date: today, score, sessionId }].slice(-10);

      let direction: "improving" | "stable" | "declining" = "stable";
      if (scores.length >= 3) {
        const recent = scores.slice(-3);
        const avgRecent = recent.reduce((a, b) => a + b.score, 0) / recent.length;
        const avgOlder = scores.slice(0, -3).reduce((a, b) => a + b.score, 0) / Math.max(scores.length - 3, 1);
        if (avgRecent > avgOlder + 5) direction = "improving";
        else if (avgRecent < avgOlder - 5) direction = "declining";
      }

      await db
        .update(userSkillMemory)
        .set({
          latestScore: score,
          trend: { scores, direction },
          updatedAt: new Date(),
        })
        .where(eq(userSkillMemory.id, existing.id));
    } else {
      await db.insert(userSkillMemory).values({
        userId,
        roleCategory: roleCategory as any,
        dimension,
        baselineScore: score,
        latestScore: score,
        trend: { scores: [{ date: today, score, sessionId }], direction: "stable" },
        commonIssues: [],
        resolvedIssues: [],
      });
    }
  }
}

export async function getUserSkillTrends(
  userId: string,
  roleCategory?: string
): Promise<{
  dimensions: {
    dimension: string;
    baseline: number;
    latest: number;
    direction: string;
    history: { date: string; score: number }[];
  }[];
  overallTrend: string;
  strongestDimensions: string[];
  weakestDimensions: string[];
}> {
  const memories = await db
    .select()
    .from(userSkillMemory)
    .where(
      roleCategory
        ? and(eq(userSkillMemory.userId, userId), eq(userSkillMemory.roleCategory, roleCategory as any))
        : eq(userSkillMemory.userId, userId)
    );

  const dimensions = memories.map((m) => ({
    dimension: m.dimension,
    baseline: m.baselineScore || 0,
    latest: m.latestScore || 0,
    direction: (m.trend as any)?.direction || "stable",
    history: (m.trend as any)?.scores || [],
  }));

  const sorted = [...dimensions].sort((a, b) => b.latest - a.latest);
  const strongestDimensions = sorted.slice(0, 3).map((d) => d.dimension);
  const weakestDimensions = sorted.slice(-3).reverse().map((d) => d.dimension);

  const improvingCount = dimensions.filter((d) => d.direction === "improving").length;
  const decliningCount = dimensions.filter((d) => d.direction === "declining").length;
  const overallTrend = improvingCount > decliningCount ? "improving" : decliningCount > improvingCount ? "declining" : "stable";

  return {
    dimensions,
    overallTrend,
    strongestDimensions,
    weakestDimensions,
  };
}

export const ENHANCED_INTERVIEWER_PROMPT = `You are a professional interviewer conducting a {{interviewType}} interview for {{roleTitle}} ({{seniority}}).

BEHAVIOR RULES:
1. VALIDATE CLAIMS: For any achievement, ask for specifics: what exactly did you do? what was the impact? how did you measure it?
2. PROBE DEPTH: If answer is vague, probe deeper. Ask for numbers, trade-offs, decisions made.
3. CONSISTENCY CHECK: Cross-reference against resume facts; clarify contradictions politely.
4. RISK AREAS: Respectfully explore gaps, short tenures, big claims without evidence.
5. FIT CHECK: Connect answers to role + company context.

STYLE: {{style}}
- Friendly: encouraging, warm, supportive but still thorough
- Neutral: professional, matter-of-fact, balanced
- Stress: skeptical, time-pressured, challenging (not rude)

CURRENT PHASE: {{currentPhase}}
QUESTION PATTERN: {{questionPattern}}

INPUTS AVAILABLE:
- Resume extract: {{resumeExtract}}
- JD requirements: {{jdExtract}}
- Company context: {{companyContext}}

RULES:
- Ask ONE question at a time
- Keep questions concise (1-2 sentences)
- Do NOT coach or give feedback during interview
- Do NOT reveal the interview plan
- If candidate asks a question, answer briefly and redirect

When you receive a candidate answer, evaluate it internally:
- Is it specific or vague?
- Does it show ownership or is it "we" without "I"?
- Are there metrics/impact or just claims?
- Should you probe deeper or move on?`;

export const ENHANCED_EVALUATOR_PROMPT = `You are evaluating an interview transcript for {{roleTitle}} at {{company}}.

CONTEXT:
- Interview type: {{interviewType}}
- Seniority level: {{seniority}}
- Candidate profile summary: {{candidateProfile}}
- JD requirements: {{jdRequirements}}

EVALUATION RUBRIC (score each 0-100):
1. Communication Clarity - Structure, articulation, conciseness
2. Structured Thinking - Logical reasoning, framework usage
3. Depth & Ownership - How much they personally drove vs. observed
4. Problem Solving - Reasoning quality, trade-off awareness
5. Execution Details - Tools, steps, verification mentioned
6. Collaboration - Conflict handling, stakeholder management
7. Initiative & Ownership - Proactivity, going beyond requirements
8. Learning & Growth - Self-awareness, improvement orientation
9. Role Fit - Match to JD requirements, gap areas
10. Confidence & Presence - Delivery, composure under pressure

OUTPUT FORMAT (STRICT JSON):
{
  "overall": {
    "score": 0-100,
    "readiness": "not_ready" | "borderline" | "ready",
    "hireSignal": "strong_hire" | "hire" | "lean_hire" | "lean_no_hire" | "no_hire"
  },
  "dimensionScores": [
    {
      "key": "dimension_name",
      "score": 0-100,
      "evidence": [{"quote": "short excerpt", "why": "explanation"}],
      "fixes": [{"title": "improvement area", "how": "specific action"}]
    }
  ],
  "jdMatch": {
    "matchedSkills": ["skill1", "skill2"],
    "missingSkills": ["skill3"],
    "riskFlags": ["concern1"],
    "priorityGaps": ["gap1"]
  },
  "answerRewrites": [
    {
      "question": "original question",
      "yourAnswer": "what candidate said (brief)",
      "betterAnswer": "improved version",
      "whyBetter": "explanation"
    }
  ],
  "nextActions": [
    {
      "type": "practice" | "exercise" | "resume_fix",
      "title": "action title",
      "details": "specific instructions",
      "estimatedMinutes": 15
    }
  ],
  "memoryUpdate": {
    "newRecurringIssues": ["issue1"],
    "resolvedIssues": ["issue2"],
    "recommendedFocusNext": "area to focus"
  }
}

RULES:
- Use ONLY transcript + provided context; no hallucinated facts
- Evidence quotes must be ≤25 words
- Be specific and actionable, not generic
- Consider seniority level when scoring (higher bar for senior roles)`;

// =====================
// Readiness Score Calculation
// =====================

export interface ReadinessScore {
  overall: number;
  readinessLevel: "not_ready" | "needs_work" | "almost_ready" | "ready" | "strong";
  breakdown: {
    skillCoverage: number;
    recentPerformance: number;
    jdAlignment: number;
    practiceVolume: number;
    trendBonus: number;
  };
  dimensions: {
    dimension: string;
    score: number;
    weight: number;
    trend: string;
    jdRelevance: boolean;
  }[];
  gaps: {
    dimension: string;
    currentScore: number;
    targetScore: number;
    priority: "critical" | "high" | "medium" | "low";
    suggestedFocus: string;
  }[];
  recommendations: string[];
  estimatedPrepTimeHours: number;
  lastPracticedAt?: Date;
  practiceSessionCount: number;
}

export interface JobTargetForReadiness {
  id: number;
  roleTitle: string;
  company?: string;
  jdText?: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  seniority?: string;
}

const DIMENSION_WEIGHTS: Record<string, number> = {
  "clarity_structure": 12,
  "depth_evidence": 15,
  "problem_solving": 15,
  "role_fit": 12,
  "confidence_composure": 10,
  "communication_hygiene": 8,
  "ownership_impact": 12,
  "consistency_honesty": 8,
  "technical_depth": 10,
  "behavioral_examples": 8,
};

const JD_CRITICAL_DIMENSIONS: Record<string, string[]> = {
  swe: ["problem_solving", "technical_depth", "depth_evidence", "ownership_impact"],
  pm: ["clarity_structure", "problem_solving", "role_fit", "behavioral_examples"],
  data: ["technical_depth", "depth_evidence", "problem_solving", "clarity_structure"],
  design: ["clarity_structure", "behavioral_examples", "role_fit", "ownership_impact"],
  sales: ["confidence_composure", "communication_hygiene", "behavioral_examples", "role_fit"],
  manager: ["behavioral_examples", "ownership_impact", "clarity_structure", "role_fit"],
  default: ["clarity_structure", "depth_evidence", "problem_solving", "role_fit"],
};

function getReadinessLevel(score: number): ReadinessScore["readinessLevel"] {
  if (score >= 85) return "strong";
  if (score >= 70) return "ready";
  if (score >= 55) return "almost_ready";
  if (score >= 40) return "needs_work";
  return "not_ready";
}

function calculateGapPriority(gap: number, isJdCritical: boolean): "critical" | "high" | "medium" | "low" {
  if (isJdCritical && gap > 25) return "critical";
  if (gap > 30) return "critical";
  if (gap > 20 || (isJdCritical && gap > 15)) return "high";
  if (gap > 10) return "medium";
  return "low";
}

function generateSuggestedFocus(dimension: string, score: number): string {
  const focusMap: Record<string, Record<string, string>> = {
    "clarity_structure": {
      low: "Practice the STAR method for all answers. Record yourself and check for clear beginning-middle-end.",
      medium: "Focus on concise openings. Time yourself - aim for 90-120 second responses.",
      high: "Fine-tune your answer flow. Add signposting phrases like 'First... Second... Finally...'",
    },
    "depth_evidence": {
      low: "Prepare 5 strong stories with specific metrics. Use the CAR format (Challenge-Action-Result).",
      medium: "Add more numbers to your stories. Think: percentages, timelines, team sizes, revenue impact.",
      high: "Polish your evidence. Make metrics more memorable and tie them to business outcomes.",
    },
    "problem_solving": {
      low: "Practice thinking out loud. Use structured frameworks for case questions.",
      medium: "Work on articulating trade-offs. Practice explaining WHY you chose one approach over another.",
      high: "Deepen your reasoning. Anticipate follow-up questions and address edge cases proactively.",
    },
    "role_fit": {
      low: "Research the role deeply. Prepare specific examples showing you've done similar work.",
      medium: "Connect your experience more explicitly to the job requirements.",
      high: "Prepare thoughtful questions that show deep understanding of the role's challenges.",
    },
    "confidence_composure": {
      low: "Practice with mock interviews. Focus on maintaining steady pace and avoiding filler words.",
      medium: "Record yourself answering tough questions. Work on body language and vocal variety.",
      high: "Prepare for curveball questions. Practice pivoting gracefully when caught off-guard.",
    },
    "ownership_impact": {
      low: "Use 'I' instead of 'we'. Identify YOUR specific contributions in every story.",
      medium: "Quantify your impact more precisely. Prepare backup details if probed.",
      high: "Connect your actions to larger business outcomes. Show strategic thinking.",
    },
  };

  const scoreLevel = score < 50 ? "low" : score < 70 ? "medium" : "high";
  return focusMap[dimension]?.[scoreLevel] || 
    `Focus on improving ${dimension.replace(/_/g, " ")} through targeted practice sessions.`;
}

function generateReadinessRecommendations(
  readinessLevel: ReadinessScore["readinessLevel"],
  gaps: ReadinessScore["gaps"],
  practiceCount: number,
  overallScore: number
): string[] {
  const recommendations: string[] = [];

  if (practiceCount === 0) {
    recommendations.push("Start with 2-3 general practice sessions to establish a baseline");
  } else if (practiceCount < 3) {
    recommendations.push(`Complete ${3 - practiceCount} more practice sessions before your interview`);
  }

  const criticalGaps = gaps.filter(g => g.priority === "critical");
  if (criticalGaps.length > 0) {
    recommendations.push(`Focus first on: ${criticalGaps.slice(0, 2).map(g => g.dimension.replace(/_/g, " ")).join(", ")}`);
  }

  if (readinessLevel === "not_ready" || readinessLevel === "needs_work") {
    recommendations.push("Consider scheduling your interview for at least 2 weeks out to allow preparation time");
    recommendations.push("Do one full mock interview before your real interview");
  } else if (readinessLevel === "almost_ready") {
    recommendations.push("You're close! Focus on your weakest 1-2 areas for maximum improvement");
    recommendations.push("Practice answering questions under time pressure");
  } else if (readinessLevel === "ready" || readinessLevel === "strong") {
    recommendations.push("Maintain readiness with occasional practice sessions");
    recommendations.push("Prepare thoughtful questions to ask the interviewer");
  }

  if (overallScore < 60) {
    recommendations.push("Watch 2-3 sample interview videos to see strong answer patterns");
  }

  return recommendations.slice(0, 5);
}

function estimatePrepTime(readinessLevel: ReadinessScore["readinessLevel"], gapCount: number): number {
  const baseHours: Record<string, number> = {
    not_ready: 15,
    needs_work: 10,
    almost_ready: 5,
    ready: 2,
    strong: 1,
  };
  return baseHours[readinessLevel] + gapCount * 1.5;
}

export async function calculateReadinessScore(
  userId: string,
  jobTarget: JobTargetForReadiness,
  roleCategory: string = "general"
): Promise<ReadinessScore> {
  const skillTrends = await getUserSkillTrends(userId, roleCategory);

  const jdCriticalDimensions = JD_CRITICAL_DIMENSIONS[roleCategory] || JD_CRITICAL_DIMENSIONS.default;

  const dimensionResults: ReadinessScore["dimensions"] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const dim of skillTrends.dimensions) {
    const weight = DIMENSION_WEIGHTS[dim.dimension] || 10;
    const isJdRelevant = jdCriticalDimensions.includes(dim.dimension);
    const effectiveWeight = isJdRelevant ? weight * 1.5 : weight;

    dimensionResults.push({
      dimension: dim.dimension,
      score: dim.latest,
      weight: effectiveWeight,
      trend: dim.direction,
      jdRelevance: isJdRelevant,
    });

    totalWeightedScore += dim.latest * effectiveWeight;
    totalWeight += effectiveWeight;
  }

  const skillCoverageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  const improvingCount = skillTrends.dimensions.filter(d => d.direction === "improving").length;
  const decliningCount = skillTrends.dimensions.filter(d => d.direction === "declining").length;
  const trendBonus = Math.min(10, (improvingCount - decliningCount) * 2);

  const recentScores = skillTrends.dimensions
    .filter(d => d.history.length > 0)
    .map(d => d.history[d.history.length - 1]?.score || d.latest);
  const recentPerformance = recentScores.length > 0 
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length 
    : 0;

  const jdCriticalScores = dimensionResults
    .filter(d => d.jdRelevance)
    .map(d => d.score);
  const jdAlignment = jdCriticalScores.length > 0
    ? jdCriticalScores.reduce((a, b) => a + b, 0) / jdCriticalScores.length
    : 0;

  const practiceSessionCount = skillTrends.dimensions.reduce((sum, d) => sum + d.history.length, 0);
  const practiceVolumeScore = Math.min(100, practiceSessionCount * 15);

  const overall = Math.round(
    skillCoverageScore * 0.4 +
    recentPerformance * 0.25 +
    jdAlignment * 0.25 +
    practiceVolumeScore * 0.05 +
    trendBonus
  );

  const readinessLevel = getReadinessLevel(overall);

  const gaps: ReadinessScore["gaps"] = [];
  const targetScore = 75;

  for (const dim of dimensionResults) {
    const gap = targetScore - dim.score;
    if (gap > 5) {
      gaps.push({
        dimension: dim.dimension,
        currentScore: dim.score,
        targetScore,
        priority: calculateGapPriority(gap, dim.jdRelevance),
        suggestedFocus: generateSuggestedFocus(dim.dimension, dim.score),
      });
    }
  }

  gaps.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const recommendations = generateReadinessRecommendations(
    readinessLevel,
    gaps,
    practiceSessionCount,
    overall
  );

  const estimatedPrepTimeHours = estimatePrepTime(readinessLevel, gaps.filter(g => g.priority !== "low").length);

  let lastPracticedAt: Date | undefined;
  for (const dim of skillTrends.dimensions) {
    if (dim.history.length > 0) {
      const lastDate = new Date(dim.history[dim.history.length - 1].date);
      if (!lastPracticedAt || lastDate > lastPracticedAt) {
        lastPracticedAt = lastDate;
      }
    }
  }

  return {
    overall: Math.min(100, Math.max(0, overall)),
    readinessLevel,
    breakdown: {
      skillCoverage: Math.round(skillCoverageScore),
      recentPerformance: Math.round(recentPerformance),
      jdAlignment: Math.round(jdAlignment),
      practiceVolume: Math.round(practiceVolumeScore),
      trendBonus: Math.round(trendBonus),
    },
    dimensions: dimensionResults,
    gaps,
    recommendations,
    estimatedPrepTimeHours: Math.round(estimatedPrepTimeHours * 10) / 10,
    lastPracticedAt,
    practiceSessionCount,
  };
}

export async function getJobReadinessSummary(
  userId: string,
  jobTargets: JobTargetForReadiness[]
): Promise<{
  jobs: {
    jobId: number;
    roleTitle: string;
    company?: string;
    readinessScore: number;
    readinessLevel: string;
    topGaps: string[];
    daysToReady: number;
  }[];
  overallFocus: string[];
  commonWeaknesses: string[];
}> {
  const results: {
    jobId: number;
    roleTitle: string;
    company?: string;
    readinessScore: number;
    readinessLevel: string;
    topGaps: string[];
    daysToReady: number;
  }[] = [];

  const allGaps: Record<string, number> = {};

  for (const job of jobTargets) {
    const roleCategory = detectRoleCategory(job.roleTitle);
    const readiness = await calculateReadinessScore(userId, job, roleCategory);

    results.push({
      jobId: job.id,
      roleTitle: job.roleTitle,
      company: job.company,
      readinessScore: readiness.overall,
      readinessLevel: readiness.readinessLevel,
      topGaps: readiness.gaps.slice(0, 3).map(g => g.dimension),
      daysToReady: Math.ceil(readiness.estimatedPrepTimeHours / 1.5),
    });

    for (const gap of readiness.gaps) {
      allGaps[gap.dimension] = (allGaps[gap.dimension] || 0) + 1;
    }
  }

  const commonWeaknesses = Object.entries(allGaps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dim]) => dim);

  const overallFocus = commonWeaknesses.length > 0
    ? [`Focus on ${commonWeaknesses[0].replace(/_/g, " ")} - it affects ${allGaps[commonWeaknesses[0]]} of your saved jobs`]
    : ["Add practice sessions to build your skill baseline"];

  return {
    jobs: results,
    overallFocus,
    commonWeaknesses,
  };
}

function detectRoleCategory(roleTitle: string): string {
  const lower = roleTitle.toLowerCase();
  if (lower.includes("engineer") || lower.includes("developer") || lower.includes("swe")) return "swe";
  if (lower.includes("product") || lower.includes("pm")) return "pm";
  if (lower.includes("data") || lower.includes("analyst") || lower.includes("scientist")) return "data";
  if (lower.includes("design") || lower.includes("ux") || lower.includes("ui")) return "design";
  if (lower.includes("sales") || lower.includes("account")) return "sales";
  if (lower.includes("manager") || lower.includes("director") || lower.includes("lead")) return "manager";
  return "general";
}

// =====================
// Coach Agent - 7-Day Practice Plans
// =====================

export interface PracticePlanDay {
  day: number;
  focus: string;
  activities: {
    type: "mock_interview" | "exercise" | "review" | "research" | "self_practice";
    title: string;
    description: string;
    estimatedMinutes: number;
    dimension?: string;
    resources?: string[];
  }[];
  expectedOutcome: string;
  totalMinutes: number;
}

export interface SevenDayPracticePlan {
  userId: string;
  jobTargetId?: number;
  roleCategory: string;
  currentReadiness: number;
  targetReadiness: number;
  focusAreas: string[];
  days: PracticePlanDay[];
  weeklyGoal: string;
  commitmentLevel: "light" | "moderate" | "intensive";
  estimatedTotalHours: number;
  generatedAt: Date;
}

interface CoachingContext {
  userId: string;
  readiness: ReadinessScore;
  jobTarget?: JobTargetForReadiness;
  roleCategory: string;
  interviewDate?: Date;
  dailyTimeAvailable?: number;
  previousPlanHistory?: { completedDays: number; skippedActivities: string[] }[];
}

const ACTIVITY_TEMPLATES: Record<string, Record<string, { 
  title: string; 
  description: string; 
  minutes: number;
  type: "mock_interview" | "exercise" | "review" | "research" | "self_practice";
}[]>> = {
  clarity_structure: {
    low: [
      { type: "exercise", title: "STAR Method Practice", description: "Write out 5 stories using STAR format (Situation, Task, Action, Result)", minutes: 30 },
      { type: "self_practice", title: "Record & Review", description: "Record yourself answering a behavioral question. Check for clear beginning-middle-end", minutes: 20 },
      { type: "review", title: "Watch Strong Examples", description: "Watch 2-3 sample interview answers and note their structure", minutes: 15 },
    ],
    medium: [
      { type: "self_practice", title: "Timed Responses", description: "Practice answering questions in 90-120 seconds with a timer", minutes: 20 },
      { type: "exercise", title: "Signposting Practice", description: "Rewrite 3 of your stories adding transition phrases (First..., Additionally..., Finally...)", minutes: 15 },
    ],
    high: [
      { type: "mock_interview", title: "Quick Mock Round", description: "Do a 3-question mock focusing on answer structure", minutes: 25 },
    ],
  },
  depth_evidence: {
    low: [
      { type: "exercise", title: "Metrics Brainstorm", description: "List 10+ quantifiable impacts from your work (%, $, time saved, users helped)", minutes: 25 },
      { type: "exercise", title: "CAR Story Writing", description: "Write 3 stories using Challenge-Action-Result format with specific numbers", minutes: 35 },
      { type: "review", title: "Evidence Audit", description: "Review your resume and prepare backup details for each bullet point", minutes: 20 },
    ],
    medium: [
      { type: "self_practice", title: "Number Recall Practice", description: "Practice reciting your key metrics from memory naturally", minutes: 15 },
      { type: "exercise", title: "Impact Translation", description: "Translate 3 technical achievements into business impact", minutes: 20 },
    ],
    high: [
      { type: "mock_interview", title: "Deep Dive Mock", description: "Practice being probed on your strongest story", minutes: 25 },
    ],
  },
  problem_solving: {
    low: [
      { type: "research", title: "Framework Study", description: "Learn 2-3 problem-solving frameworks (MECE, Issue Tree, Hypothesis-driven)", minutes: 25 },
      { type: "exercise", title: "Think Aloud Practice", description: "Practice solving 2 case problems while narrating your thought process", minutes: 40 },
      { type: "review", title: "Case Study Examples", description: "Review 3 sample case interviews and note the reasoning patterns", minutes: 20 },
    ],
    medium: [
      { type: "exercise", title: "Trade-off Articulation", description: "For 3 past decisions, practice explaining the trade-offs you considered", minutes: 20 },
      { type: "mock_interview", title: "Case Practice Session", description: "Do one full case question with structured approach", minutes: 30 },
    ],
    high: [
      { type: "self_practice", title: "Edge Case Prep", description: "For your strongest problem-solving story, prepare for 5 follow-up questions", minutes: 20 },
    ],
  },
  role_fit: {
    low: [
      { type: "research", title: "Company Research", description: "Research the company's recent news, culture, and challenges", minutes: 25 },
      { type: "exercise", title: "Experience Mapping", description: "Map your experiences to specific JD requirements", minutes: 30 },
      { type: "exercise", title: "Why Questions", description: "Prepare authentic answers for 'Why this role?' and 'Why this company?'", minutes: 20 },
    ],
    medium: [
      { type: "research", title: "Team Research", description: "Research the team/department you'd join and their key projects", minutes: 20 },
      { type: "exercise", title: "Gap Stories", description: "Prepare stories showing you can learn skills you're missing", minutes: 25 },
    ],
    high: [
      { type: "exercise", title: "Thoughtful Questions", description: "Prepare 5 insightful questions that show you understand the role deeply", minutes: 20 },
    ],
  },
  confidence_composure: {
    low: [
      { type: "self_practice", title: "Mirror Practice", description: "Practice your introduction and key stories in front of a mirror", minutes: 20 },
      { type: "exercise", title: "Filler Word Audit", description: "Record yourself and count filler words (um, like, you know). Aim to reduce by 50%", minutes: 15 },
      { type: "self_practice", title: "Power Pose Routine", description: "Practice 2-minute power poses before mock sessions", minutes: 10 },
    ],
    medium: [
      { type: "mock_interview", title: "Pressure Practice", description: "Do a mock interview with time pressure (shorter answer limits)", minutes: 25 },
      { type: "exercise", title: "Curveball Prep", description: "Prepare responses for 5 unexpected or difficult questions", minutes: 20 },
    ],
    high: [
      { type: "mock_interview", title: "Stress Interview", description: "Do a mock with stress-style interviewer", minutes: 30 },
    ],
  },
  ownership_impact: {
    low: [
      { type: "exercise", title: "I vs We Rewrite", description: "Rewrite 5 stories replacing 'we' with 'I' and adding your specific role", minutes: 25 },
      { type: "exercise", title: "Contribution Clarity", description: "For each major project, write one sentence explaining YOUR unique contribution", minutes: 20 },
      { type: "review", title: "Resume Ownership Audit", description: "Review resume and ensure every bullet shows YOUR action and impact", minutes: 15 },
    ],
    medium: [
      { type: "self_practice", title: "Ownership Drill", description: "Practice telling stories emphasizing 'I decided...', 'I built...', 'I led...'", minutes: 20 },
      { type: "exercise", title: "Impact Quantification", description: "Add specific impact numbers to 3 of your stories", minutes: 15 },
    ],
    high: [
      { type: "mock_interview", title: "Probe Practice", description: "Practice being probed on exactly what YOU did in team projects", minutes: 25 },
    ],
  },
};

const WARMUP_ACTIVITIES = [
  { type: "self_practice" as const, title: "Quick Intro Practice", description: "Practice your 60-second elevator pitch", minutes: 10 },
  { type: "review" as const, title: "Resume Review", description: "Re-read your resume to refresh on details", minutes: 10 },
  { type: "research" as const, title: "News Check", description: "Check company/industry news for conversation points", minutes: 10 },
];

const COOLDOWN_ACTIVITIES = [
  { type: "review" as const, title: "Session Reflection", description: "Write 3 things that went well and 1 area to improve", minutes: 10 },
  { type: "exercise" as const, title: "Next Day Prep", description: "Preview tomorrow's focus area and gather materials", minutes: 10 },
];

function getActivityLevel(score: number): "low" | "medium" | "high" {
  if (score < 50) return "low";
  if (score < 70) return "medium";
  return "high";
}

function selectActivitiesForDimension(
  dimension: string, 
  score: number, 
  targetMinutes: number
): PracticePlanDay["activities"] {
  const level = getActivityLevel(score);
  const templates = ACTIVITY_TEMPLATES[dimension]?.[level] || [];
  
  const activities: PracticePlanDay["activities"] = [];
  let totalMinutes = 0;
  
  for (const template of templates) {
    if (totalMinutes + template.minutes <= targetMinutes + 10) {
      activities.push({
        type: template.type,
        title: template.title,
        description: template.description,
        estimatedMinutes: template.minutes,
        dimension,
      });
      totalMinutes += template.minutes;
    }
  }
  
  return activities;
}

function distributeGapsAcrossWeek(gaps: ReadinessScore["gaps"]): Record<number, string[]> {
  const distribution: Record<number, string[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  };
  
  const criticalGaps = gaps.filter(g => g.priority === "critical" || g.priority === "high");
  const otherGaps = gaps.filter(g => g.priority === "medium" || g.priority === "low");
  
  let dayIndex = 1;
  for (const gap of criticalGaps) {
    distribution[dayIndex].push(gap.dimension);
    if (dayIndex < 4) {
      distribution[dayIndex + 3].push(gap.dimension);
    }
    dayIndex = (dayIndex % 3) + 1;
  }
  
  dayIndex = 4;
  for (const gap of otherGaps) {
    if (distribution[dayIndex].length < 2) {
      distribution[dayIndex].push(gap.dimension);
    }
    dayIndex = dayIndex === 7 ? 4 : dayIndex + 1;
  }
  
  return distribution;
}

export async function generateSevenDayPlan(
  context: CoachingContext
): Promise<SevenDayPracticePlan> {
  const { userId, readiness, jobTarget, roleCategory, dailyTimeAvailable = 45 } = context;
  
  const commitmentLevel: "light" | "moderate" | "intensive" = 
    dailyTimeAvailable <= 30 ? "light" : 
    dailyTimeAvailable <= 60 ? "moderate" : "intensive";
  
  const gapDistribution = distributeGapsAcrossWeek(readiness.gaps);
  
  const days: PracticePlanDay[] = [];
  let totalMinutes = 0;
  
  for (let day = 1; day <= 7; day++) {
    const dayGaps = gapDistribution[day];
    let activities: PracticePlanDay["activities"] = [];
    let usedMinutes = 0;
    
    if (day === 1 && usedMinutes + 15 <= dailyTimeAvailable) {
      activities.push({
        type: "review",
        title: "Baseline Assessment",
        description: "Review your readiness report and identify top 3 focus areas",
        estimatedMinutes: 15,
      });
      usedMinutes += 15;
    }
    
    if ((day === 1 || day === 4 || day === 7) && usedMinutes + 10 <= dailyTimeAvailable) {
      const warmup = WARMUP_ACTIVITIES[day % WARMUP_ACTIVITIES.length];
      activities.push({
        type: warmup.type,
        title: warmup.title,
        description: warmup.description,
        estimatedMinutes: warmup.minutes,
      });
      usedMinutes += warmup.minutes;
    }
    
    const remainingForGaps = dailyTimeAvailable - usedMinutes - ((day === 3 || day === 6) ? 25 : 0) - (day === 7 ? 10 : 0);
    const targetMinutesPerGap = Math.floor(remainingForGaps / Math.max(dayGaps.length, 1));
    
    for (const gapDimension of dayGaps) {
      if (usedMinutes >= dailyTimeAvailable - 5) break;
      
      const gapInfo = readiness.gaps.find(g => g.dimension === gapDimension);
      const score = gapInfo?.currentScore || 50;
      const availableForGap = Math.min(targetMinutesPerGap, dailyTimeAvailable - usedMinutes);
      const gapActivities = selectActivitiesForDimension(gapDimension, score, availableForGap);
      
      for (const activity of gapActivities) {
        if (usedMinutes + activity.estimatedMinutes <= dailyTimeAvailable) {
          activities.push(activity);
          usedMinutes += activity.estimatedMinutes;
        }
      }
    }
    
    if ((day === 3 || day === 6) && usedMinutes + 25 <= dailyTimeAvailable + 5) {
      const mockMinutes = Math.min(25, dailyTimeAvailable - usedMinutes + 5);
      activities.push({
        type: "mock_interview",
        title: "Practice Session",
        description: `Complete a ${day === 3 ? "behavioral" : "mixed"} interview simulation`,
        estimatedMinutes: mockMinutes,
      });
      usedMinutes += mockMinutes;
    }
    
    if (day === 7 && usedMinutes + 10 <= dailyTimeAvailable + 5) {
      activities.push({
        type: "review",
        title: "Week Recap",
        description: "Compare your performance to Day 1. Identify gaps for next week",
        estimatedMinutes: 10,
      });
      usedMinutes += 10;
    }
    
    const dayTotalMinutes = activities.reduce((sum, a) => sum + a.estimatedMinutes, 0);
    totalMinutes += dayTotalMinutes;
    
    let focus = "General practice";
    if (dayGaps.length > 0) {
      focus = dayGaps.slice(0, 2).map(d => d.replace(/_/g, " ")).join(" + ");
    } else if (day === 3 || day === 6) {
      focus = "Mock interview";
    } else if (day === 7) {
      focus = "Review and planning";
    }
    
    const expectedOutcome = dayGaps.length > 0
      ? `Improve ${dayGaps[0].replace(/_/g, " ")} by practicing specific techniques`
      : day === 7
        ? "Clear picture of progress and next steps"
        : "Build overall interview readiness";
    
    days.push({
      day,
      focus,
      activities,
      expectedOutcome,
      totalMinutes: dayTotalMinutes,
    });
  }
  
  const focusAreas = readiness.gaps.slice(0, 3).map(g => g.dimension);
  const targetReadiness = Math.min(100, readiness.overall + 15);
  const weeklyGoal = readiness.readinessLevel === "not_ready" || readiness.readinessLevel === "needs_work"
    ? "Build foundational interview skills and establish consistent practice habits"
    : readiness.readinessLevel === "almost_ready"
      ? "Polish weak areas and gain confidence through targeted practice"
      : "Maintain peak readiness and refine edge cases";
  
  return {
    userId,
    jobTargetId: jobTarget?.id,
    roleCategory,
    currentReadiness: readiness.overall,
    targetReadiness,
    focusAreas,
    days,
    weeklyGoal,
    commitmentLevel,
    estimatedTotalHours: Math.round(totalMinutes / 60 * 10) / 10,
    generatedAt: new Date(),
  };
}

export async function generateAIPracticePlan(
  context: CoachingContext
): Promise<SevenDayPracticePlan> {
  const openai = getOpenAI();
  
  const prompt = `You are an expert interview coach creating a personalized 7-day practice plan.

CANDIDATE PROFILE:
- Current readiness score: ${context.readiness.overall}/100 (${context.readiness.readinessLevel})
- Target role: ${context.jobTarget?.roleTitle || "General interview prep"}
- Target company: ${context.jobTarget?.company || "Not specified"}
- Daily time available: ${context.dailyTimeAvailable || 45} minutes
- Role category: ${context.roleCategory}

CURRENT GAPS (priority order):
${context.readiness.gaps.slice(0, 5).map(g => `- ${g.dimension}: ${g.currentScore}/100 (${g.priority}) - ${g.suggestedFocus}`).join("\n")}

STRONGEST AREAS:
${context.readiness.dimensions.filter(d => d.score >= 70).slice(0, 3).map(d => `- ${d.dimension}: ${d.score}/100`).join("\n") || "No strong areas yet - need baseline practice"}

Create a 7-day practice plan. Return as JSON:
{
  "weeklyGoal": "one sentence describing the week's main objective",
  "days": [
    {
      "day": 1,
      "focus": "main focus for this day",
      "activities": [
        {
          "type": "mock_interview" | "exercise" | "review" | "research" | "self_practice",
          "title": "activity title (5-8 words)",
          "description": "specific instructions (1-2 sentences)",
          "estimatedMinutes": 15,
          "dimension": "dimension_name or null"
        }
      ],
      "expectedOutcome": "what candidate should achieve"
    }
  ]
}

RULES:
- Balance the daily time across activities (total ≈ ${context.dailyTimeAvailable || 45} min/day)
- Day 1: Include orientation/assessment
- Days 3 and 6: Include mock interview practice
- Day 7: Include review and next week planning
- Focus more on critical/high priority gaps early in the week
- Include at least one mock_interview activity on days 3 and 6
- Be specific and actionable, not generic`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const aiPlan = JSON.parse(response.choices[0].message.content || "{}");
    
    const days: PracticePlanDay[] = (aiPlan.days || []).map((d: any) => ({
      day: d.day,
      focus: d.focus,
      activities: (d.activities || []).map((a: any) => ({
        type: a.type,
        title: a.title,
        description: a.description,
        estimatedMinutes: a.estimatedMinutes,
        dimension: a.dimension,
        resources: a.resources,
      })),
      expectedOutcome: d.expectedOutcome,
      totalMinutes: (d.activities || []).reduce((s: number, a: any) => s + (a.estimatedMinutes || 15), 0),
    }));
    
    const totalMinutes = days.reduce((s, d) => s + d.totalMinutes, 0);
    
    return {
      userId: context.userId,
      jobTargetId: context.jobTarget?.id,
      roleCategory: context.roleCategory,
      currentReadiness: context.readiness.overall,
      targetReadiness: Math.min(100, context.readiness.overall + 15),
      focusAreas: context.readiness.gaps.slice(0, 3).map(g => g.dimension),
      days,
      weeklyGoal: aiPlan.weeklyGoal || "Improve interview readiness through targeted practice",
      commitmentLevel: (context.dailyTimeAvailable || 45) <= 30 ? "light" : (context.dailyTimeAvailable || 45) <= 60 ? "moderate" : "intensive",
      estimatedTotalHours: Math.round(totalMinutes / 60 * 10) / 10,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("AI practice plan generation failed, using template:", error);
    return generateSevenDayPlan(context);
  }
}
