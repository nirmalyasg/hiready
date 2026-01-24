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
  },
  // NEW: Enhanced personas with competency frameworks
  behavioral: {
    title: "Behavioral Interviewer",
    focus: "10 Core Behavioral Competencies using STAR method",
    openingStyle: "professional and curious",
    probeAreas: [
      "ownership_accountability",
      "problem_solving",
      "collaboration_teamwork",
      "communication",
      "adaptability_resilience",
      "customer_focus",
      "results_orientation",
      "learning_agility",
      "conflict_resolution",
      "integrity_ethics"
    ],
    competencyFramework: "behavioral_10"
  },
  leadership: {
    title: "Leadership Interviewer",
    focus: "8 Leadership Competencies for managers, directors, executives",
    openingStyle: "executive and strategic",
    probeAreas: [
      "strategic_thinking",
      "people_development",
      "decision_making",
      "team_building",
      "stakeholder_management",
      "execution_delivery",
      "change_leadership",
      "business_acumen"
    ],
    competencyFramework: "leadership_8"
  },
  domain: {
    title: "Domain Expert",
    focus: "Company, market, industry, and functional expertise",
    openingStyle: "knowledgeable and probing",
    probeAreas: [
      "company_knowledge",
      "industry_knowledge",
      "business_domain",
      "functional_expertise",
      "market_trends",
      "competitive_landscape"
    ],
    competencyFramework: "domain_functional"
  },
  coding: {
    title: "Coding Interviewer",
    focus: "Technical problem solving, code quality, algorithmic thinking",
    openingStyle: "direct and supportive",
    probeAreas: [
      "problem_decomposition",
      "algorithm_choice",
      "code_quality",
      "edge_cases",
      "complexity_analysis",
      "debugging"
    ],
    competencyFramework: "technical_coding"
  },
  case_study: {
    title: "Case Interviewer",
    focus: "Business analysis, structured thinking, recommendations",
    openingStyle: "professional and analytical",
    probeAreas: [
      "framework_application",
      "quantitative_analysis",
      "business_judgment",
      "logical_structure",
      "synthesis",
      "recommendations"
    ],
    competencyFramework: "technical_case"
  },
  system_design: {
    title: "System Design Interviewer",
    focus: "Architecture, scalability, distributed systems",
    openingStyle: "technical and exploratory",
    probeAreas: [
      "requirements_gathering",
      "high_level_design",
      "component_design",
      "data_modeling",
      "scalability",
      "reliability"
    ],
    competencyFramework: "technical_system_design"
  }
};

export function getInterviewerPersona(type: InterviewConfig["interviewType"] | string) {
  return INTERVIEWER_PERSONAS[type as keyof typeof INTERVIEWER_PERSONAS] || INTERVIEWER_PERSONAS.hr;
}

// ============================================================
// COMPETENCY-BASED QUESTION PATTERNS
// ============================================================

/**
 * Behavioral Competency Questions (10 Competencies)
 */
export const BEHAVIORAL_COMPETENCY_QUESTIONS = {
  ownership_accountability: {
    name: "Ownership & Accountability",
    questions: {
      entry: [
        "Tell me about a project where you took complete ownership. What was the outcome?",
        "Give an example of when you made a mistake at work. How did you handle it?"
      ],
      mid: [
        "Tell me about a time when you identified a problem no one else noticed and took action.",
        "Describe a situation where you had to make a decision without all the information."
      ],
      senior: [
        "Describe a time when you drove a major initiative end-to-end. What obstacles did you face?",
        "Tell me about a strategic decision you made that had significant business impact."
      ]
    },
    probes: [
      "What specifically did YOU do vs. the team?",
      "What would have happened if you hadn't stepped in?",
      "How did you measure the impact of your actions?"
    ],
    strongSignals: ["Uses 'I' statements", "Shows end-to-end ownership", "Acknowledges mistakes"],
    redFlags: ["Uses 'we' without clarifying role", "Blames others", "Passive involvement"]
  },
  problem_solving: {
    name: "Problem Solving & Analytical Thinking",
    questions: {
      entry: [
        "Walk me through how you would approach solving a new problem you've never seen before.",
        "Describe a challenging problem you solved. What was your approach?"
      ],
      mid: [
        "Tell me about a complex problem you solved. What frameworks or methods did you use?",
        "Describe a time when your initial solution didn't work. How did you adapt?"
      ],
      senior: [
        "Describe the most complex problem you've solved in your career. Walk me through your approach.",
        "Tell me about a time when you had to make a decision with incomplete or conflicting data."
      ]
    },
    probes: [
      "What alternatives did you consider?",
      "How did you validate your solution?",
      "What data points informed your decision?"
    ],
    strongSignals: ["Structures problems systematically", "Uses data to drive decisions", "Considers multiple solutions"],
    redFlags: ["Jumps to solutions without analysis", "Relies on intuition without data", "Cannot articulate reasoning"]
  },
  collaboration_teamwork: {
    name: "Collaboration & Teamwork",
    questions: {
      entry: [
        "Tell me about a successful team project you were part of. What was your role?",
        "Describe a time when you helped a teammate who was struggling."
      ],
      mid: [
        "Describe a time when you had to work with someone whose style was very different from yours.",
        "Tell me about a cross-functional project. How did you ensure alignment?"
      ],
      senior: [
        "How do you foster collaboration across teams with competing priorities?",
        "Tell me about a time when you had to align multiple stakeholders on a controversial decision."
      ]
    },
    probes: [
      "How did you handle disagreements within the team?",
      "What did you do to ensure everyone's voice was heard?",
      "How did you build trust with this person/team?"
    ],
    strongSignals: ["Shares credit", "Seeks diverse perspectives", "Adapts communication style"],
    redFlags: ["Takes individual credit", "Works in isolation", "Struggles with different personalities"]
  },
  communication: {
    name: "Communication & Influence",
    questions: {
      entry: [
        "Tell me about a time when you had to explain something technical to a non-technical person.",
        "Describe a situation where you had to persuade someone to see your point of view."
      ],
      mid: [
        "Describe a time when you had to deliver a difficult message. How did you approach it?",
        "Tell me about a situation where you influenced a decision without having direct authority."
      ],
      senior: [
        "Tell me about a time when you presented to executives or the board. How did you prepare?",
        "Describe how you've influenced organizational strategy or direction."
      ]
    },
    probes: [
      "How did you know your message was understood?",
      "What objections did you encounter?",
      "How did you prepare for this communication?"
    ],
    strongSignals: ["Tailors message to audience", "Uses data to support points", "Listens actively"],
    redFlags: ["Rambles or provides unclear explanations", "Talks over others", "Cannot adjust for audiences"]
  },
  adaptability_resilience: {
    name: "Adaptability & Resilience",
    questions: {
      entry: [
        "Tell me about a time when you had to adapt to a significant change at work.",
        "Describe a setback you faced. How did you handle it?"
      ],
      mid: [
        "Describe a project where the requirements changed significantly mid-stream.",
        "Tell me about a time when you failed. What did you learn?"
      ],
      senior: [
        "Tell me about leading through a major organizational change.",
        "Describe the biggest professional setback of your career. How did it shape you?"
      ]
    },
    probes: [
      "What was your initial reaction to the change?",
      "How did you maintain your effectiveness?",
      "What strategies do you use to manage stress?"
    ],
    strongSignals: ["Maintains effectiveness during change", "Views setbacks as learning", "Stays calm under pressure"],
    redFlags: ["Resists change", "Gets derailed by setbacks", "Needs extensive guidance in ambiguity"]
  },
  customer_focus: {
    name: "Customer Focus & Empathy",
    questions: {
      entry: [
        "Tell me about a time when you went out of your way to help a customer.",
        "How do you typically gather feedback about your work from users?"
      ],
      mid: [
        "Describe a situation where you identified an unmet customer need.",
        "Tell me about a time when you had to push back on a customer request."
      ],
      senior: [
        "How do you build a customer-centric culture within your team?",
        "Tell me about a controversial decision that prioritized long-term customer value."
      ]
    },
    probes: [
      "How did you understand the customer's underlying needs?",
      "What tradeoffs did you have to make?",
      "How did you measure customer satisfaction?"
    ],
    strongSignals: ["Seeks customer feedback", "Considers customer impact", "Balances needs with constraints"],
    redFlags: ["Doesn't consider end-user impact", "Makes assumptions without validation", "Dismisses feedback"]
  },
  results_orientation: {
    name: "Results Orientation & Drive",
    questions: {
      entry: [
        "Tell me about a goal you set for yourself. How did you achieve it?",
        "What's an accomplishment you're most proud of?"
      ],
      mid: [
        "Tell me about the most impactful project you've delivered.",
        "How do you prioritize when you have multiple competing deadlines?"
      ],
      senior: [
        "Tell me about a goal that seemed impossible but you achieved anyway.",
        "What's the biggest impact you've had on business metrics?"
      ]
    },
    probes: [
      "How did you measure success?",
      "What obstacles did you overcome?",
      "How did you stay motivated when things got difficult?"
    ],
    strongSignals: ["Sets specific, measurable goals", "Delivers consistently", "Pushes for improvement"],
    redFlags: ["Sets vague goals", "Misses deadlines", "Satisfied with 'good enough'"]
  },
  learning_agility: {
    name: "Learning Agility & Growth Mindset",
    questions: {
      entry: [
        "Tell me about something new you learned recently. How did you approach it?",
        "Describe a time when you received constructive feedback. How did you respond?"
      ],
      mid: [
        "Tell me about a skill you had to develop quickly for a project.",
        "How do you stay current in your field?"
      ],
      senior: [
        "How do you continue to grow and learn at this stage of your career?",
        "Tell me about a time when you had to unlearn something to be effective."
      ]
    },
    probes: [
      "How did you apply what you learned?",
      "What was the hardest part of learning this?",
      "How do you typically seek out feedback?"
    ],
    strongSignals: ["Seeks feedback and acts on it", "Learns quickly", "Admits knowledge gaps"],
    redFlags: ["Defensive about feedback", "Relies only on existing knowledge", "Repeats mistakes"]
  },
  conflict_resolution: {
    name: "Conflict Resolution & Difficult Conversations",
    questions: {
      entry: [
        "Tell me about a time when you disagreed with a teammate. How did you handle it?",
        "Describe a difficult conversation you had to have."
      ],
      mid: [
        "Describe a significant conflict you resolved at work.",
        "Tell me about a time when you had to give someone difficult feedback."
      ],
      senior: [
        "Tell me about a time when you had to resolve a conflict between teams.",
        "Describe the most difficult conversation you've had as a leader."
      ]
    },
    probes: [
      "What was the other person's perspective?",
      "How did you prepare for this conversation?",
      "What was the relationship like afterward?"
    ],
    strongSignals: ["Addresses conflicts directly", "Seeks to understand others", "Finds win-win solutions"],
    redFlags: ["Avoids conflict", "Takes disagreements personally", "Escalates unnecessarily"]
  },
  integrity_ethics: {
    name: "Integrity & Ethical Judgment",
    questions: {
      entry: [
        "Tell me about a time when you had to be honest even though it was difficult.",
        "Describe a situation where you saw something that didn't seem right."
      ],
      mid: [
        "Tell me about a time when you faced an ethical dilemma at work.",
        "Describe a situation where doing the right thing came at a personal cost."
      ],
      senior: [
        "Tell me about a time when you had to make an unpopular decision because it was right.",
        "How do you set the ethical tone for your team?"
      ]
    },
    probes: [
      "What was at stake for you personally?",
      "How did you decide what the right thing to do was?",
      "What would have happened if you hadn't spoken up?"
    ],
    strongSignals: ["Speaks truth even when uncomfortable", "Keeps commitments", "Owns mistakes"],
    redFlags: ["Exaggerates accomplishments", "Makes promises they can't keep", "Cuts corners"]
  }
};

/**
 * Leadership Competency Questions (8 Competencies)
 */
export const LEADERSHIP_COMPETENCY_QUESTIONS = {
  strategic_thinking: {
    name: "Strategic Thinking & Vision",
    questions: [
      "How do you set the strategic direction for your team? Walk me through your process.",
      "Tell me about a time when you had to pivot your strategy based on market changes.",
      "How do you balance short-term execution with long-term strategic goals?",
      "Describe how you've influenced organizational strategy beyond your immediate team."
    ],
    probes: [
      "How did you communicate this vision to your team?",
      "What data or insights informed your strategic thinking?",
      "How did you get buy-in for this direction?"
    ],
    strongSignals: ["Articulates clear vision", "Connects work to strategy", "Anticipates trends"],
    redFlags: ["Focuses only on tactical execution", "Cannot articulate strategic value", "Reactive rather than proactive"]
  },
  people_development: {
    name: "People Development & Coaching",
    questions: [
      "Tell me about someone you've developed who went on to significant success.",
      "How do you approach performance management across your team?",
      "Describe your philosophy on delegation and development.",
      "How do you handle underperformers while maintaining team morale?"
    ],
    probes: [
      "How did you identify their development needs?",
      "What specific actions did you take to help them grow?",
      "How do you balance pushing people with supporting them?"
    ],
    strongSignals: ["Provides regular feedback", "Creates development plans", "Track record of promoting people"],
    redFlags: ["Doesn't prioritize 1:1s", "Hoards work", "Team members don't grow"]
  },
  decision_making: {
    name: "Decision Making & Judgment",
    questions: [
      "Walk me through your decision-making framework for high-impact choices.",
      "Tell me about the toughest decision you've made as a leader.",
      "How do you balance speed of decision-making with thoroughness?",
      "Describe a time when you had to reverse a previous decision."
    ],
    probes: [
      "What information did you have vs. what did you wish you had?",
      "Who did you involve in the decision process?",
      "How did you communicate the decision and rationale?"
    ],
    strongSignals: ["Makes timely decisions", "Considers multiple perspectives", "Takes calculated risks"],
    redFlags: ["Analysis paralysis", "Decides without input", "Blames others for failures"]
  },
  team_building: {
    name: "Team Building & Culture",
    questions: [
      "How do you build and maintain a high-performing team culture?",
      "Tell me about a team you built from scratch or significantly transformed.",
      "How do you create an environment where people feel safe to take risks?",
      "What's your approach to building diverse and inclusive teams?"
    ],
    probes: [
      "How do you handle cultural fit during hiring?",
      "What rituals or practices do you use to build team cohesion?",
      "How do you know if your team culture is healthy?"
    ],
    strongSignals: ["Attracts and retains talent", "Creates psychological safety", "Builds diverse teams"],
    redFlags: ["High turnover", "Fear-based culture", "Inconsistent standards"]
  },
  stakeholder_management: {
    name: "Stakeholder Management & Influence",
    questions: [
      "How do you manage relationships with executives and board members?",
      "Tell me about navigating a politically complex situation.",
      "How do you balance competing stakeholder priorities?",
      "Describe how you've built strategic alliances to accomplish your goals."
    ],
    probes: [
      "How did you understand their priorities and concerns?",
      "What did you do when stakeholders disagreed?",
      "How do you say no to powerful stakeholders?"
    ],
    strongSignals: ["Manages expectations effectively", "Builds strong relationships", "Navigates politics constructively"],
    redFlags: ["Surprises stakeholders", "Burns bridges", "Avoids difficult conversations"]
  },
  execution_delivery: {
    name: "Execution & Delivery",
    questions: [
      "How do you drive execution across your organization?",
      "Tell me about the largest or most complex initiative you've delivered.",
      "How do you create accountability without micromanaging?",
      "Describe how you've improved execution processes at scale."
    ],
    probes: [
      "How do you know if execution is on track?",
      "What do you do when a project starts slipping?",
      "What systems have you put in place for accountability?"
    ],
    strongSignals: ["Delivers consistently", "Removes blockers", "Creates clear accountability"],
    redFlags: ["Misses deadlines", "Micromanages", "Team frequently firefighting"]
  },
  change_leadership: {
    name: "Change Leadership & Transformation",
    questions: [
      "Tell me about leading a major organizational transformation.",
      "How do you build a change-ready culture?",
      "Describe a change that failed and what you learned.",
      "How do you balance pace of change with organizational capacity?"
    ],
    probes: [
      "How did you communicate the need for change?",
      "How did you handle people who resisted?",
      "How did you sustain the change over time?"
    ],
    strongSignals: ["Successfully led change initiatives", "Communicates vision effectively", "Manages resistance"],
    redFlags: ["Avoids necessary changes", "Poor change communication", "Changes don't stick"]
  },
  business_acumen: {
    name: "Business Acumen & Financial Judgment",
    questions: [
      "How do you connect your team's work to business outcomes and metrics?",
      "Walk me through how you manage your budget and make resource allocation decisions.",
      "Tell me about a difficult tradeoff between technical quality and business needs.",
      "How do you stay informed about the competitive landscape?"
    ],
    probes: [
      "How did you quantify the business impact?",
      "What metrics do you use to measure success?",
      "How do you prioritize investments?"
    ],
    strongSignals: ["Understands business model", "Makes decisions with ROI mindset", "Manages resources effectively"],
    redFlags: ["Cannot articulate business impact", "Doesn't consider costs", "Focuses only on technical excellence"]
  }
};

/**
 * Get competency questions for a specific interview type
 */
export function getCompetencyQuestionsForType(
  interviewType: string,
  seniority: "entry" | "mid" | "senior" = "mid"
): { competencyId: string; name: string; questions: string[]; probes: string[] }[] {
  if (interviewType === "leadership") {
    return Object.entries(LEADERSHIP_COMPETENCY_QUESTIONS).map(([id, data]) => ({
      competencyId: id,
      name: data.name,
      questions: data.questions,
      probes: data.probes
    }));
  }

  // Default to behavioral competencies
  return Object.entries(BEHAVIORAL_COMPETENCY_QUESTIONS).map(([id, data]) => ({
    competencyId: id,
    name: data.name,
    questions: data.questions[seniority] || data.questions.mid,
    probes: data.probes
  }));
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
