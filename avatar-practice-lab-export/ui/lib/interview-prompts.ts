/**
 * Interview Practice Lab - Production-Grade Prompt Stack
 * 
 * Architecture: 4-Layer Prompt System
 * 1. Interviewer Core System (static)
 * 2. Role/Mode Context (dynamic per session)
 * 3. State Prompt (updated each turn)
 * 4. Generation Instruction (strict JSON output)
 */

// ============================================================
// TYPES
// ============================================================

export interface RoleKit {
  id: number;
  name: string;
  level: "entry" | "mid" | "senior";
  domain: string;
  roleContext: string;
  skillsFocus: string[];
  coreCompetencies: string[];
  typicalQuestions: string[];
  defaultInterviewTypes: string[];
  estimatedDuration: number;
  defaultRubricId?: number;
}

export interface InterviewConfig {
  id: number;
  interviewType: "hr" | "hiring_manager" | "technical" | "panel";
  style: "friendly" | "neutral" | "stress";
  seniority: "entry" | "mid" | "senior";
}

export interface CandidateProfile {
  headline?: string;
  workHistory?: {
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }[];
  projects?: {
    name: string;
    description: string;
    technologies: string[];
    impact: string;
  }[];
  skillsClaimed?: string[];
  riskFlags?: {
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
  }[];
}

export interface JDContext {
  title?: string;
  company?: string;
  requirements?: string[];
  responsibilities?: string[];
  mustHaves?: string[];
  niceToHaves?: string[];
}

export interface InterviewPlan {
  phases: {
    name: string;
    duration: number;
    objectives: string[];
    questionPatterns: string[];
  }[];
  triggers?: {
    type: string;
    source: string;
    probeRules: string[];
  }[];
  focusAreas: string[];
}

export interface SessionState {
  currentPhase: string;
  timeRemainingSeconds: number;
  questionsAskedInPhase: number;
  mandatoryProbesRemaining: string[];
  recentAnswerQuality: "strong" | "acceptable" | "weak" | "unclear";
  questionHistory: string[];
}

export type InterviewMode = "role_based" | "custom";

// ============================================================
// LAYER 1: INTERVIEWER CORE SYSTEM (Static)
// ============================================================

export const INTERVIEWER_CORE_SYSTEM = `You are a professional interviewer conducting a real job interview simulation.

GOAL
Assess the candidate's suitability for the role by asking realistic questions and probing depth, clarity, and consistency.

YOU MUST
- Follow the interview plan phases and allowed question pattern types.
- Ask only ONE question at a time.
- Probe for specifics if the candidate is vague (numbers, decisions, trade-offs, what they did personally).
- Validate resume claims and clarify inconsistencies.
- Adjust difficulty based on role level (entry = foundational, mid = depth, senior = leadership/system thinking).
- Stay in character as the interviewer throughout.

YOU MUST NOT
- Ask multiple questions in one turn.
- Skip phases or violate phase exit conditions.
- Accept vague answers without follow-up probes.
- Provide hints, coaching, or feedback during the interview.
- Break character or reveal you are an AI.
- Make up facts about the candidate or role.

BEHAVIORAL CONSTRAINTS
- If the candidate goes off-topic, gently redirect to the current phase focus.
- If time is running low in a phase, wrap up with one final question.
- If the candidate asks for clarification, provide it briefly and naturally.
- Maintain professional warmth appropriate to the interview style.`;

// ============================================================
// LAYER 2: ROLE/MODE CONTEXT (Dynamic per session)
// ============================================================

export function buildRoleContextPrompt(params: {
  mode: InterviewMode;
  roleKit: RoleKit;
  config: InterviewConfig;
  candidateProfile?: CandidateProfile;
  jdContext?: JDContext;
}): string {
  const { mode, roleKit, config, candidateProfile, jdContext } = params;

  let prompt = `INTERVIEW CONTEXT
Mode: ${mode}
Interview Type: ${config.interviewType}
Style: ${config.style}
Seniority: ${config.seniority}

ROLE KIT
Role Name: ${roleKit.name}
Level: ${roleKit.level}
Domain: ${roleKit.domain}

Role Context (ground truth):
${roleKit.roleContext}

Skills Focus: ${roleKit.skillsFocus.join(", ")}
Core Competencies: ${roleKit.coreCompetencies.join(", ")}
`;

  if (candidateProfile) {
    prompt += `
CANDIDATE PROFILE (EXTRACTED TRIGGERS)
Headline: ${candidateProfile.headline || "Not provided"}
Work History:
${formatWorkHistory(candidateProfile.workHistory)}
Projects:
${formatProjects(candidateProfile.projects)}
Skills Claimed: ${candidateProfile.skillsClaimed?.join(", ") || "Not provided"}
Risk Flags: ${formatRiskFlags(candidateProfile.riskFlags)}
`;
  }

  if (jdContext) {
    prompt += `
JOB DESCRIPTION CONTEXT
Title: ${jdContext.title || "Not specified"}
Company: ${jdContext.company || "Not specified"}
Key Requirements: ${jdContext.requirements?.join(", ") || "Not specified"}
Must-Haves: ${jdContext.mustHaves?.join(", ") || "Not specified"}
Nice-to-Haves: ${jdContext.niceToHaves?.join(", ") || "Not specified"}
`;
  }

  prompt += buildStyleGuidance(config.style);

  return prompt;
}

function formatWorkHistory(workHistory?: CandidateProfile["workHistory"]): string {
  if (!workHistory?.length) return "- Not provided";
  return workHistory.map(w => 
    `- ${w.role} at ${w.company} (${w.duration}): ${w.highlights.slice(0, 2).join("; ")}`
  ).join("\n");
}

function formatProjects(projects?: CandidateProfile["projects"]): string {
  if (!projects?.length) return "- Not provided";
  return projects.slice(0, 3).map(p => 
    `- ${p.name}: ${p.description.slice(0, 100)}... (${p.technologies.slice(0, 3).join(", ")})`
  ).join("\n");
}

function formatRiskFlags(riskFlags?: CandidateProfile["riskFlags"]): string {
  if (!riskFlags?.length) return "None detected";
  return riskFlags.map(r => `[${r.severity.toUpperCase()}] ${r.type}: ${r.description}`).join("; ");
}

function buildStyleGuidance(style: InterviewConfig["style"]): string {
  const styleGuides = {
    friendly: `
STYLE GUIDANCE: FRIENDLY
- Be warm, encouraging, and supportive.
- Put the candidate at ease while still evaluating capabilities.
- Use positive reinforcement naturally ("That's interesting...", "Good example...").
- Allow slight tangents if they reveal character.
- Probe gently rather than aggressively.`,
    neutral: `
STYLE GUIDANCE: NEUTRAL
- Be professional, balanced, and objective.
- Neither overly warm nor cold.
- Ask probing follow-up questions to assess depth.
- Maintain consistent energy throughout.
- Focus on facts and examples.`,
    stress: `
STYLE GUIDANCE: STRESS
- Be challenging and push back on answers.
- Test how the candidate handles pressure.
- Ask rapid follow-ups and challenge assumptions.
- Express skepticism appropriately ("Are you sure about that?", "How did you really contribute?").
- Do not be rude, but maintain high pressure.`
  };
  return styleGuides[style] || styleGuides.neutral;
}

// ============================================================
// LAYER 3: STATE PROMPT (Updated each turn)
// ============================================================

export function buildStatePrompt(params: {
  plan: InterviewPlan;
  state: SessionState;
}): string {
  const { plan, state } = params;

  return `INTERVIEW PLAN
${JSON.stringify(plan, null, 2)}

CURRENT STATE
Current Phase: ${state.currentPhase}
Time Remaining in Phase (sec): ${state.timeRemainingSeconds}
Questions Asked in Phase: ${state.questionsAskedInPhase}
Mandatory Probes Remaining: ${state.mandatoryProbesRemaining.length > 0 ? state.mandatoryProbesRemaining.join(", ") : "None"}
Recent Answer Quality: ${state.recentAnswerQuality}

INSTRUCTIONS
- Choose the next question using ONE allowed pattern type for the current phase.
- If recent answer quality is "weak" or "unclear", ask a follow-up depth probe rather than moving to a new topic.
- Keep it natural and conversational.
- If mandatory probes remain, prioritize them before phase exit.`;
}

// ============================================================
// LAYER 4: GENERATION INSTRUCTION (Strict JSON output)
// ============================================================

export const GENERATION_INSTRUCTION = `OUTPUT INSTRUCTION
After processing the context, respond with ONLY your next interviewer statement.
Do NOT output JSON. Speak naturally as the interviewer would.
Ask exactly ONE question or make ONE statement.
Keep responses concise (1-3 sentences typical, max 5 for context-setting).`;

// ============================================================
// COMPOSITE PROMPT BUILDERS
// ============================================================

/**
 * Builds the full interview system prompt for session initialization.
 * This is used when connecting to the AI session.
 */
export function buildFullInterviewPrompt(params: {
  mode: InterviewMode;
  roleKit: RoleKit;
  config: InterviewConfig;
  plan: InterviewPlan;
  candidateProfile?: CandidateProfile;
  jdContext?: JDContext;
}): string {
  const { mode, roleKit, config, plan, candidateProfile, jdContext } = params;

  const roleContext = buildRoleContextPrompt({
    mode,
    roleKit,
    config,
    candidateProfile,
    jdContext
  });

  const initialState: SessionState = {
    currentPhase: plan.phases[0]?.name || "Introduction",
    timeRemainingSeconds: (plan.phases[0]?.duration || 2) * 60,
    questionsAskedInPhase: 0,
    mandatoryProbesRemaining: [],
    recentAnswerQuality: "acceptable",
    questionHistory: []
  };

  const statePrompt = buildStatePrompt({ plan, state: initialState });

  return `${INTERVIEWER_CORE_SYSTEM}

${roleContext}

${statePrompt}

${GENERATION_INSTRUCTION}

OPENING DIRECTIVE
Start the interview with a warm but professional greeting. Introduce yourself briefly as the interviewer for this ${config.interviewType} round, then proceed with the first question from the Introduction phase.`;
}

/**
 * Builds a simplified interview prompt for role-based mode without uploaded documents.
 * Used when user selects a pre-built role kit without resume/JD uploads.
 */
export function buildRoleBasedInterviewPrompt(params: {
  roleKit: RoleKit;
  config: InterviewConfig;
  plan: InterviewPlan;
}): string {
  const minimalRoleKit: RoleKit = {
    ...params.roleKit,
    roleContext: params.roleKit.roleContext || generateDefaultRoleContext(params.roleKit)
  };

  return buildFullInterviewPrompt({
    mode: "role_based",
    roleKit: minimalRoleKit,
    config: params.config,
    plan: params.plan
  });
}

function generateDefaultRoleContext(roleKit: RoleKit): string {
  return `This is a ${roleKit.level}-level ${roleKit.name} position in the ${roleKit.domain} domain. 
The role focuses on: ${roleKit.skillsFocus.join(", ")}. 
Key competencies evaluated: ${roleKit.coreCompetencies.join(", ")}.`;
}

// ============================================================
// INTERVIEW TYPE PERSONAS
// ============================================================

export const INTERVIEWER_PERSONAS = {
  hr: {
    title: "HR Recruiter",
    focus: "Culture fit, motivation, communication, career trajectory",
    openingStyle: "warm and welcoming",
    probeAreas: ["motivation", "culture fit", "career goals", "collaboration", "conflict resolution"]
  },
  hiring_manager: {
    title: "Hiring Manager",
    focus: "Role fit, impact potential, team dynamics, growth trajectory",
    openingStyle: "professional and curious",
    probeAreas: ["past impact", "decision making", "stakeholder management", "problem ownership", "growth mindset"]
  },
  technical: {
    title: "Technical Interviewer",
    focus: "Technical depth, problem solving, coding/design skills, system thinking",
    openingStyle: "direct and focused",
    probeAreas: ["technical fundamentals", "problem solving approach", "code quality", "system design", "debugging mindset"]
  },
  panel: {
    title: "Interview Panel Lead",
    focus: "Holistic assessment across multiple dimensions",
    openingStyle: "structured and formal",
    probeAreas: ["leadership", "cross-functional collaboration", "strategic thinking", "communication", "impact at scale"]
  }
};

export function getInterviewerPersona(type: InterviewConfig["interviewType"]) {
  return INTERVIEWER_PERSONAS[type] || INTERVIEWER_PERSONAS.hr;
}

// ============================================================
// EVALUATOR PROMPTS (Post-Session)
// ============================================================

export interface RubricDimension {
  name: string;
  description: string;
  weight: number;
  anchors: {
    score: number;
    description: string;
  }[];
}

export interface EvaluatorInput {
  roleKit: RoleKit;
  config: InterviewConfig;
  rubricDimensions: RubricDimension[];
  candidateProfile?: CandidateProfile;
  transcript: string;
}

export function buildEvaluatorPrompt(input: EvaluatorInput): string {
  return `You are an interview evaluator providing detailed, evidence-based assessment.

INPUTS
Role: ${input.roleKit.name} (${input.roleKit.level} level)
Interview Type: ${input.config.interviewType}
Interview Style: ${input.config.style}

RUBRIC DIMENSIONS
${input.rubricDimensions.map(d => `
${d.name} (weight: ${d.weight})
- ${d.description}
Scoring anchors:
${d.anchors.map(a => `  ${a.score}: ${a.description}`).join("\n")}
`).join("\n")}

${input.candidateProfile ? `
CANDIDATE CONTEXT
${JSON.stringify(input.candidateProfile, null, 2)}
` : ""}

TRANSCRIPT
${input.transcript}

TASK
Score each rubric dimension from 1 to 5. Every score MUST include:
- 1-3 short evidence excerpts from the transcript (≤20 words each)
- rationale for the score
- one concrete improvement action

Also output:
- overall summary (3-5 lines)
- strengths (max 5 bullet points)
- risks/concerns (max 5 bullet points)
- hire recommendation: Strong Yes / Yes / Lean Yes / Lean No / No
- confidence level: High / Medium / Low

OUTPUT FORMAT (STRICT JSON)
{
  "dimensionScores": [
    {
      "dimension": "string",
      "score": number,
      "evidence": ["string", "string"],
      "rationale": "string",
      "improvement": "string"
    }
  ],
  "summary": "string",
  "strengths": ["string"],
  "risks": ["string"],
  "overallRecommendation": "strong_yes|yes|lean_yes|lean_no|no",
  "confidenceLevel": "high|medium|low"
}`;
}

// ============================================================
// FEEDBACK WRITER PROMPTS (Post-Session)
// ============================================================

export interface FeedbackWriterInput {
  evaluatorOutput: {
    dimensionScores: {
      dimension: string;
      score: number;
      evidence: string[];
      rationale: string;
      improvement: string;
    }[];
    summary: string;
    strengths: string[];
    risks: string[];
  };
  transcript: string;
  roleKit: RoleKit;
}

export function buildFeedbackWriterPrompt(input: FeedbackWriterInput): string {
  return `You are writing actionable feedback after an interview practice session.

INPUTS
Evaluator Analysis:
${JSON.stringify(input.evaluatorOutput, null, 2)}

Role Context: ${input.roleKit.name} (${input.roleKit.level})

Transcript:
${input.transcript}

OUTPUT MUST INCLUDE
1) wins (3 bullets) - What the candidate did well, with specific examples
2) improvements (3 bullets) - What needs work, with specific examples
3) rewrite TWO weak answers into stronger versions aligned to the role
4) a 7-day practice plan (10-15 min/day tasks)

RULES
- Be specific and evidence-based from the transcript.
- Do NOT include generic motivational advice.
- Do NOT provide textbook explanations.
- Rewritten answers should use STAR format where appropriate.
- Practice plan tasks should be concrete and actionable.

OUTPUT FORMAT (STRICT JSON)
{
  "wins": ["string", "string", "string"],
  "improvements": ["string", "string", "string"],
  "betterAnswers": [
    {
      "originalQuestion": "string",
      "originalAnswer": "string (brief summary)",
      "improvedAnswer": "string"
    }
  ],
  "practicePlan": [
    {
      "day": 1,
      "task": "string",
      "timeMinutes": 15
    }
  ]
}`;
}

// ============================================================
// SAMPLE QUESTIONS BY PATTERN TYPE
// ============================================================

export const QUESTION_PATTERNS = {
  warmup_intro: [
    "Tell me a bit about yourself and your background.",
    "Walk me through your journey to this point in your career.",
    "What brings you to this role today?"
  ],
  resume_overview: [
    "I see you worked at [Company]. What was your main responsibility there?",
    "Tell me more about your role at [Company].",
    "What was the most impactful project you worked on at [Previous Role]?"
  ],
  motivation_probe: [
    "What attracted you to this role specifically?",
    "Why are you looking to make a change now?",
    "What excites you about this opportunity?"
  ],
  behavioral_star: [
    "Tell me about a time when you faced a significant challenge. How did you handle it?",
    "Describe a situation where you had to work with a difficult team member.",
    "Give me an example of a goal you set and how you achieved it."
  ],
  technical_depth: [
    "Walk me through how you would approach [technical problem].",
    "Explain [concept] as you would to a colleague.",
    "What's your experience with [technology/tool]?"
  ],
  problem_solving: [
    "How would you debug this issue if you encountered it?",
    "Walk me through your thought process for solving [problem type].",
    "What factors would you consider when making this decision?"
  ],
  situational_hypothetical: [
    "What would you do if you disagreed with your manager's direction?",
    "How would you handle a situation where you had competing priorities?",
    "Imagine you're given a project with unclear requirements. What's your approach?"
  ],
  closing: [
    "Do you have any questions for me about the role or team?",
    "Is there anything else you'd like to share that we haven't covered?",
    "What questions do you have about what it's like to work here?"
  ]
};

export function getSampleQuestionsForPattern(pattern: string): string[] {
  return QUESTION_PATTERNS[pattern as keyof typeof QUESTION_PATTERNS] || [];
}

// ============================================================
// WORKSPACE CONTEXT (Code/Case Study Integration)
// ============================================================

export interface WorkspaceContext {
  mode: "coding" | "case_study" | "normal";
  code?: {
    content: string;
    language: string;
  };
  caseStudy?: {
    notes: string;
    calculation: string;
  };
  problemStatement?: string;
  casePrompt?: string;
}

export function buildWorkspaceContextPrompt(workspace: WorkspaceContext): string {
  if (workspace.mode === "normal") {
    return "";
  }

  if (workspace.mode === "coding") {
    const parts: string[] = [];
    parts.push("=== CODING WORKSPACE ===");
    
    if (workspace.problemStatement) {
      parts.push(`PROBLEM STATEMENT:\n${workspace.problemStatement}`);
    }
    
    if (workspace.code?.content) {
      parts.push(`CANDIDATE'S CURRENT CODE (${workspace.code.language}):\n\`\`\`${workspace.code.language}\n${workspace.code.content}\n\`\`\``);
    } else {
      parts.push("CANDIDATE'S CODE: [No code written yet]");
    }
    
    parts.push(`
CODING INTERVIEW GUIDELINES:
- You can see the candidate's code in real-time as they type.
- Ask them to explain their approach, time complexity, and space complexity.
- If you notice bugs or issues, prompt them to trace through with an example.
- Encourage them to think aloud and vocalize their reasoning.
- Ask clarifying questions about edge cases.
- Do NOT provide the solution or fix bugs for them.`);
    
    return parts.join("\n\n");
  }

  if (workspace.mode === "case_study") {
    const parts: string[] = [];
    parts.push("=== CASE STUDY WORKSPACE ===");
    
    if (workspace.casePrompt) {
      parts.push(`CASE PROMPT:\n${workspace.casePrompt}`);
    }
    
    if (workspace.caseStudy?.notes) {
      parts.push(`CANDIDATE'S NOTES:\n${workspace.caseStudy.notes}`);
    }
    
    if (workspace.caseStudy?.calculation) {
      parts.push(`CANDIDATE'S CALCULATIONS:\n${workspace.caseStudy.calculation}`);
    }
    
    parts.push(`
CASE STUDY INTERVIEW GUIDELINES:
- The candidate has access to case materials and a scratch pad for notes/calculations.
- Walk them through the case step by step.
- Ask for their framework/approach before diving into specifics.
- Probe their assumptions and reasoning.
- Ask them to quantify their estimates with calculations.
- Provide additional data points when they ask good clarifying questions.
- Do NOT give away the answer; guide them through the problem-solving process.`);
    
    return parts.join("\n\n");
  }

  return "";
}

export function enhancePromptWithWorkspace(
  basePrompt: string,
  workspace: WorkspaceContext
): string {
  const workspaceContext = buildWorkspaceContextPrompt(workspace);
  if (!workspaceContext) {
    return basePrompt;
  }
  return `${basePrompt}\n\n${workspaceContext}`;
}
