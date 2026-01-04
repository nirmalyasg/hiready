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

  if (context.interviewType === "technical" && ["swe", "data", "security"].includes(context.roleCategory)) {
    phases.push({
      id: "technical",
      name: "Technical Assessment",
      durationMins: 15,
      objective: ["problem-solving", "technical-depth", "system-thinking"],
      patternTypes: ["technical"],
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
