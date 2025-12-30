export const TENSION_ARCHETYPES = [
  {
    id: "misaligned_expectations",
    label: "Misaligned Expectations",
    description: "Different assumptions about what should happen",
    examples: ["Timeline disagreements", "Scope confusion", "Quality standards gap"]
  },
  {
    id: "power_imbalance",
    label: "Power Imbalance",
    description: "Unequal authority or influence in the conversation",
    examples: ["Speaking up to leadership", "Pushing back on decisions", "Challenging authority"]
  },
  {
    id: "emotional_defensiveness",
    label: "Emotional Defensiveness",
    description: "The other person may react emotionally to feedback or challenges",
    examples: ["Delivering criticism", "Addressing performance", "Confronting behavior"]
  },
  {
    id: "uncertainty_ambiguity",
    label: "Uncertainty / Ambiguity",
    description: "Lack of clarity about facts, expectations, or next steps",
    examples: ["Unclear requirements", "Changing priorities", "Unknown outcomes"]
  },
  {
    id: "time_pressure",
    label: "Time Pressure",
    description: "Urgency that limits discussion or decision-making",
    examples: ["Tight deadlines", "Quick decisions needed", "Limited meeting time"]
  },
  {
    id: "value_disagreement",
    label: "Value Disagreement",
    description: "Different beliefs about what matters most",
    examples: ["Ethical concerns", "Priority conflicts", "Cultural differences"]
  },
  {
    id: "fear_of_consequences",
    label: "Fear of Consequences",
    description: "Concern about negative outcomes from speaking up",
    examples: ["Career impact", "Relationship damage", "Reputation risk"]
  },
  {
    id: "conflicting_incentives",
    label: "Conflicting Incentives",
    description: "Different motivations or goals between parties",
    examples: ["Resource competition", "Credit attribution", "Competing priorities"]
  },
  {
    id: "honesty_vs_harmony",
    label: "Honesty vs Harmony",
    description: "Tension between being truthful and maintaining the relationship",
    examples: ["Difficult feedback", "Saying no", "Expressing disagreement"]
  },
  {
    id: "resistance_to_change",
    label: "Resistance to Change",
    description: "The other person is reluctant to accept new ideas or directions",
    examples: ["Process changes", "New approaches", "Shifting strategies"]
  },
  {
    id: "credibility_challenge",
    label: "Credibility Challenge",
    description: "Your expertise or position may be questioned",
    examples: ["New in role", "Crossing domains", "Unpopular opinion"]
  },
  {
    id: "high_stakes_low_trust",
    label: "High Stakes, Low Trust",
    description: "Important conversation with limited relationship foundation",
    examples: ["New relationships", "Past conflicts", "Skeptical audience"]
  }
] as const;

export type TensionArchetype = typeof TENSION_ARCHETYPES[number]["id"];

export const CONTEXT_TYPES = [
  {
    id: "workplace_formal",
    label: "Workplace (Formal)",
    description: "Professional settings with clear hierarchies",
    norms: ["Professional language", "Structured discussion", "Outcome-focused"],
    examples: ["Board meetings", "Performance reviews", "Client presentations"]
  },
  {
    id: "workplace_semiformal",
    label: "Workplace (Semi-formal)",
    description: "Professional but more relaxed settings",
    norms: ["Collaborative tone", "Open dialogue", "Solution-oriented"],
    examples: ["Team syncs", "1:1 meetings", "Brainstorming sessions"]
  },
  {
    id: "professional_relationship",
    label: "Professional Relationship",
    description: "Mentor, client, peer, or partner interactions",
    norms: ["Mutual respect", "Balanced exchange", "Long-term focus"],
    examples: ["Mentor conversations", "Client relationship", "Partner discussions"]
  },
  {
    id: "public_intellectual",
    label: "Public / Intellectual Discussion",
    description: "Debates, discussions, or exchanges of ideas",
    norms: ["Evidence-based", "Respectful disagreement", "Idea-focused"],
    examples: ["Panel discussions", "Debates", "Group discussions"]
  },
  {
    id: "reflective_coaching",
    label: "Reflective / Coaching",
    description: "Self-reflection or guided exploration",
    norms: ["Open exploration", "No judgment", "Growth-focused"],
    examples: ["Coaching sessions", "Self-reflection", "Thought exploration"]
  }
] as const;

export type ContextType = typeof CONTEXT_TYPES[number]["id"];

export const COUNTER_PERSONA_ARCHETYPES = [
  {
    id: "skeptical_peer",
    label: "Skeptical Peer",
    description: "Questions ideas and seeks evidence",
    caresAbout: "accuracy",
    pressureResponse: "challenges_logic",
    trigger: "perceived_incompetence",
    behaviorHints: ["Asks probing questions", "Requests data", "Plays devil's advocate"]
  },
  {
    id: "impatient_stakeholder",
    label: "Impatient Stakeholder",
    description: "Focuses on speed and results",
    caresAbout: "speed",
    pressureResponse: "pushes_back",
    trigger: "uncertainty",
    behaviorHints: ["Interrupts", "Wants bottom line first", "Pushes for commitment"]
  },
  {
    id: "defensive_manager",
    label: "Defensive Manager",
    description: "Protects their decisions and team",
    caresAbout: "control",
    pressureResponse: "becomes_rigid",
    trigger: "being_questioned",
    behaviorHints: ["Justifies past decisions", "Deflects criticism", "Pulls rank"]
  },
  {
    id: "idealistic_thinker",
    label: "Idealistic Thinker",
    description: "Prioritizes principles over practicality",
    caresAbout: "fairness",
    pressureResponse: "becomes_emotional",
    trigger: "value_conflict",
    behaviorHints: ["Appeals to values", "Struggles with compromise", "Sees big picture"]
  },
  {
    id: "risk_averse_authority",
    label: "Risk-Averse Authority",
    description: "Prioritizes safety and stability over innovation",
    caresAbout: "safety",
    pressureResponse: "withdraws",
    trigger: "uncertainty",
    behaviorHints: ["Asks about risks", "Prefers proven approaches", "Seeks guarantees"]
  },
  {
    id: "emotionally_invested",
    label: "Emotionally Invested Partner",
    description: "Takes things personally, cares deeply about outcomes",
    caresAbout: "recognition",
    pressureResponse: "becomes_emotional",
    trigger: "feeling_ignored",
    behaviorHints: ["Expresses feelings", "Seeks validation", "May become hurt"]
  },
  {
    id: "overconfident_expert",
    label: "Overconfident Expert",
    description: "Believes strongly in their expertise",
    caresAbout: "status",
    pressureResponse: "pushes_back",
    trigger: "being_questioned",
    behaviorHints: ["Dismisses alternatives", "Cites experience", "Speaks with certainty"]
  },
  {
    id: "passive_resistor",
    label: "Passive Resistor",
    description: "Agrees superficially but doesn't commit",
    caresAbout: "stability",
    pressureResponse: "withdraws",
    trigger: "losing_control",
    behaviorHints: ["Says yes but delays", "Raises obstacles later", "Avoids direct conflict"]
  }
] as const;

export type CounterPersonaArchetype = typeof COUNTER_PERSONA_ARCHETYPES[number]["id"];

export const USER_OBJECTIVES = [
  {
    id: "clarify",
    label: "Clarify",
    description: "Make understanding explicit",
    successIndicators: ["Shared understanding established", "Ambiguity resolved", "Clear next steps defined"],
    promptHint: "Help the user articulate and confirm mutual understanding"
  },
  {
    id: "align",
    label: "Align",
    description: "Reach shared ground",
    successIndicators: ["Agreement on key points", "Commitment to direction", "Buy-in achieved"],
    promptHint: "Create opportunities for finding common ground while presenting different perspectives"
  },
  {
    id: "influence",
    label: "Influence",
    description: "Shift perspective or decision",
    successIndicators: ["Other party considers new angle", "Decision moved in desired direction", "Mind changed"],
    promptHint: "Be initially resistant to change, requiring compelling arguments to shift position"
  },
  {
    id: "set_boundaries",
    label: "Set Boundaries",
    description: "Protect time, scope, or values",
    successIndicators: ["Limits clearly communicated", "Boundaries respected", "Terms established"],
    promptHint: "Push against the user's boundaries to test their firmness and clarity"
  },
  {
    id: "resolve",
    label: "Resolve",
    description: "Close an issue or conflict",
    successIndicators: ["Issue addressed", "Path forward agreed", "Tension reduced"],
    promptHint: "Maintain the tension initially, requiring skilled navigation to reach resolution"
  },
  {
    id: "explore",
    label: "Explore",
    description: "Understand viewpoints without requiring a decision",
    successIndicators: ["Perspectives shared", "Understanding deepened", "Options surfaced"],
    promptHint: "Share perspectives openly and engage in genuine exploration of ideas"
  },
  {
    id: "reflect",
    label: "Reflect",
    description: "Articulate thinking or emotions",
    successIndicators: ["Thoughts clarified", "Feelings expressed", "Insights gained"],
    promptHint: "Ask thoughtful questions that help the user articulate their thoughts and feelings"
  }
] as const;

export type UserObjective = typeof USER_OBJECTIVES[number]["id"];

export const CONVERSATION_MODES = [
  {
    id: "explore",
    label: "Explore",
    description: "Curiosity, openness, understanding",
    avatarBehavior: ["Asks open questions", "Shows genuine interest", "Follows threads"],
    pacing: "relaxed"
  },
  {
    id: "persuade",
    label: "Persuade",
    description: "Framing, logic, emotional appeal",
    avatarBehavior: ["Presents counterpoints", "Tests arguments", "Requires convincing"],
    pacing: "engaged"
  },
  {
    id: "resolve",
    label: "Resolve",
    description: "Closure, agreement, next steps",
    avatarBehavior: ["Drives toward decision", "Seeks commitment", "Addresses blockers"],
    pacing: "focused"
  },
  {
    id: "reflect",
    label: "Reflect",
    description: "Insight, self-expression, meaning",
    avatarBehavior: ["Asks deepening questions", "Creates space", "Mirrors back"],
    pacing: "slow"
  },
  {
    id: "challenge",
    label: "Challenge",
    description: "Testing ideas, surfacing assumptions",
    avatarBehavior: ["Pushes back", "Questions premises", "Plays devil's advocate"],
    pacing: "intense"
  }
] as const;

export type ConversationMode = typeof CONVERSATION_MODES[number]["id"];

export const SKILL_LENSES = [
  {
    id: "clarity_of_thought",
    label: "Clarity of Thought",
    description: "Organizing and expressing ideas clearly",
    feedbackFocus: ["Structure of arguments", "Logical flow", "Conciseness"]
  },
  {
    id: "assertiveness",
    label: "Assertiveness",
    description: "Expressing views confidently without aggression",
    feedbackFocus: ["Directness", "Confidence in statements", "Standing ground"]
  },
  {
    id: "active_listening",
    label: "Active Listening",
    description: "Understanding and responding to what others say",
    feedbackFocus: ["Acknowledgment", "Building on points", "Asking follow-ups"]
  },
  {
    id: "emotional_regulation",
    label: "Emotional Regulation",
    description: "Managing emotions during difficult moments",
    feedbackFocus: ["Tone stability", "Response to pressure", "Composure"]
  },
  {
    id: "structured_reasoning",
    label: "Structured Reasoning",
    description: "Using logic and evidence effectively",
    feedbackFocus: ["Evidence use", "Logical connections", "Addressing counterpoints"]
  },
  {
    id: "presence_confidence",
    label: "Presence & Confidence",
    description: "Projecting confidence and authority",
    feedbackFocus: ["Pacing", "Filler words", "Certainty of language"]
  },
  {
    id: "questioning",
    label: "Questioning",
    description: "Asking effective questions to understand and guide",
    feedbackFocus: ["Question quality", "Follow-up questions", "Curiosity shown"]
  }
] as const;

export type SkillLens = typeof SKILL_LENSES[number]["id"];

export const USER_POWER_POSITIONS = [
  { id: "lower", label: "Lower Power", description: "Student, junior, dependent" },
  { id: "equal", label: "Equal Power", description: "Peer, partner, colleague" },
  { id: "higher", label: "Higher Power", description: "Manager, authority, leader" }
] as const;

export type UserPowerPosition = typeof USER_POWER_POSITIONS[number]["id"];

export const USER_EXPERIENCE_LEVELS = [
  { id: "first_time", label: "First-time", description: "New to this type of conversation" },
  { id: "developing", label: "Developing", description: "Some experience, still building skills" },
  { id: "seasoned", label: "Seasoned", description: "Experienced in these conversations" }
] as const;

export type UserExperienceLevel = typeof USER_EXPERIENCE_LEVELS[number]["id"];

export const USER_DEFAULT_PATTERNS = [
  { id: "avoids_conflict", label: "Avoids Conflict", description: "Tends to sidestep difficult points" },
  { id: "over_explains", label: "Over-explains", description: "Provides too much context or justification" },
  { id: "becomes_defensive", label: "Becomes Defensive", description: "Gets protective when challenged" },
  { id: "dominates", label: "Dominates", description: "Takes over the conversation" },
  { id: "withdraws", label: "Withdraws", description: "Pulls back under pressure" }
] as const;

export type UserDefaultPattern = typeof USER_DEFAULT_PATTERNS[number]["id"];

export interface UserPersona {
  powerPosition: UserPowerPosition;
  experienceLevel: UserExperienceLevel;
  emotionalExposure: "low" | "medium" | "high";
  defaultPattern?: UserDefaultPattern;
}

export interface CounterPersona {
  archetype: CounterPersonaArchetype;
  caresAbout: string;
  pressureResponse: string;
  trigger: string;
}

export interface ConversationBlueprint {
  userPersona?: UserPersona;
  context: ContextType;
  counterPersona: CounterPersona;
  tension: {
    primary: TensionArchetype;
    secondary?: TensionArchetype;
  };
  userObjective: UserObjective;
  conversationMode: ConversationMode;
  skillLens: {
    primary: SkillLens;
    secondary?: SkillLens;
  };
  scenarioSummary: {
    title: string;
    context: string;
    counterPersonaDescription: string;
    whatMakesItTricky: string;
    objectiveStatement: string;
    userRole?: string;
    avatarRole?: string;
  };
}

export interface CustomScenarioInput {
  userDescription: string;
  otherPersonType?: string;
  tensions?: TensionArchetype[];
  objective?: UserObjective;
}

export function getTensionById(id: TensionArchetype) {
  return TENSION_ARCHETYPES.find(t => t.id === id);
}

export function getContextById(id: ContextType) {
  return CONTEXT_TYPES.find(c => c.id === id);
}

export function getCounterPersonaById(id: CounterPersonaArchetype) {
  return COUNTER_PERSONA_ARCHETYPES.find(p => p.id === id);
}

export function getObjectiveById(id: UserObjective) {
  return USER_OBJECTIVES.find(o => o.id === id);
}

export function getModeById(id: ConversationMode) {
  return CONVERSATION_MODES.find(m => m.id === id);
}

export function getSkillLensById(id: SkillLens) {
  return SKILL_LENSES.find(s => s.id === id);
}

export type PersonaOverlayLevel = "ic" | "manager" | "senior" | "exec" | "custom";

export interface PersonaOverlay {
  userRoleTitle: string;
  authorityAndConstraints: string[];
  successCriteria: string[];
  commonMistakes: string[];
  toneGuidance: string;
  avatarPushbackLevel: "low" | "medium" | "high";
}

export const DEFAULT_PERSONA_OVERLAYS: Record<Exclude<PersonaOverlayLevel, "custom">, PersonaOverlay> = {
  ic: {
    userRoleTitle: "Junior Associate / Individual Contributor",
    authorityAndConstraints: ["Limited authority; may need approvals", "Must follow policy/process"],
    successCriteria: ["Stay calm and professional", "Gather key facts", "Offer allowed options", "Escalate correctly when needed"],
    commonMistakes: ["Over-apologizing or over-explaining", "Overpromising", "Getting defensive"],
    toneGuidance: "Clear, respectful, confident. Use short sentences.",
    avatarPushbackLevel: "medium"
  },
  manager: {
    userRoleTitle: "People Manager / Team Lead",
    authorityAndConstraints: ["Can negotiate options within limits", "Accountable for resolution and team impact"],
    successCriteria: ["De-escalate and restore trust", "Set boundaries/expectations", "Agree on plan + owners", "Protect relationship"],
    commonMistakes: ["Jumping to solution too fast", "Sounding rigid", "Not naming trade-offs"],
    toneGuidance: "Empathetic + firm. Name constraints and options.",
    avatarPushbackLevel: "high"
  },
  senior: {
    userRoleTitle: "Senior Leader / Director",
    authorityAndConstraints: ["Can approve significant decisions", "Must balance team and business needs"],
    successCriteria: ["Make clear decisions", "Align stakeholders", "Set strategic direction", "Address root causes"],
    commonMistakes: ["Being too tactical", "Avoiding difficult decisions", "Not delegating enough"],
    toneGuidance: "Strategic, decisive, empowering. Focus on outcomes and accountability.",
    avatarPushbackLevel: "high"
  },
  exec: {
    userRoleTitle: "Executive / CXO",
    authorityAndConstraints: ["Can commit resources or policy exceptions", "Must avoid overpromising; protect brand and long-term relationship"],
    successCriteria: ["Acknowledge impact at a strategic level", "Make a clear decision or commitment path", "Align stakeholders", "Close with executive-level next steps"],
    commonMistakes: ["Too vague", "Too directive without empathy", "Committing without details/owners"],
    toneGuidance: "Calm, decisive, diplomatic. Focus on outcomes, risk, and accountability.",
    avatarPushbackLevel: "high"
  }
};

export function generatePersonaOverlayPrompt(personaOverlay: PersonaOverlay): string {
  const pushbackDescriptions = {
    low: "Be reasonably cooperative. Test the user gently but don't create unnecessary friction.",
    medium: "Provide moderate resistance. Challenge vague statements and test the user's composure, but respond positively to good approaches.",
    high: "Be demanding and challenging. Require clear, confident responses. Escalate frustration if the user seems uncertain or makes common mistakes."
  };

  return `
## User Persona Context

The person you are speaking with is a: ${personaOverlay.userRoleTitle}

### Their Authority & Constraints
${personaOverlay.authorityAndConstraints.map(c => `- ${c}`).join('\n')}

### What Success Looks Like For Them
${personaOverlay.successCriteria.map(c => `- ${c}`).join('\n')}

### Common Mistakes to Watch For (and exploit)
${personaOverlay.commonMistakes.map(m => `- ${m}`).join('\n')}
If you detect these mistakes, push back harder or express frustration appropriately.

### Expected Tone From User
${personaOverlay.toneGuidance}

### Your Pushback Level: ${personaOverlay.avatarPushbackLevel.toUpperCase()}
${pushbackDescriptions[personaOverlay.avatarPushbackLevel]}
`.trim();
}

export function generateAvatarPromptFromBlueprint(
  blueprint: ConversationBlueprint, 
  personaOverlay?: PersonaOverlay,
  avatarName?: string | null,
  scenarioCounterPersona?: ScenarioCounterPersona | null,
  userName?: string | null,
  openingScene?: string | null,
): string {
  const counterPersona = getCounterPersonaById(blueprint.counterPersona.archetype);
  const mode = getModeById(blueprint.conversationMode);
  const objective = getObjectiveById(blueprint.userObjective);
  const tension = getTensionById(blueprint.tension.primary);
  
  // Use avatar name if provided, otherwise fall back to role description
  // Priority: scenario counter-persona role > blueprint avatarRole > blueprint counterPersonaDescription
  const effectiveRole = scenarioCounterPersona?.role || blueprint.scenarioSummary.avatarRole;
  const avatarIdentity = avatarName 
    ? (effectiveRole ? `${avatarName} (${effectiveRole})` : avatarName)
    : effectiveRole || blueprint.scenarioSummary.counterPersonaDescription;
  
  // Use actual user name if provided
  const userIdentity = userName 
    ? `${userName} who is practicing their skills`
    : (blueprint.scenarioSummary.userRole || 'the professional practicing their skills');
  
  // Create name addressing instruction if we have a real user name
  const nameInstruction = userName 
    ? `\n- Address them as "${userName}" during the conversation when it feels natural`
    : '';
  
  const roleAssignment = `
### Role Assignment
- The USER is playing: ${userIdentity}
- YOU are playing: ${avatarIdentity}${nameInstruction}
`;

  // Merge scenario counter-persona with blueprint counter-persona
  // Scenario counter-persona takes priority, with safe fallbacks to prevent undefined values
  const effectiveCaresAbout = 
    scenarioCounterPersona?.caresAbout || 
    counterPersona?.caresAbout || 
    blueprint.counterPersona.caresAbout || 
    "achieving their goals";
  
  const effectivePressureResponse = 
    scenarioCounterPersona?.pressureResponse || 
    counterPersona?.pressureResponse?.replace(/_/g, ' ') || 
    blueprint.counterPersona.pressureResponse || 
    "become more assertive";
  
  // Scenario has "triggers" array, blueprint has "trigger" string
  const effectiveTriggers = scenarioCounterPersona?.triggers?.length 
    ? scenarioCounterPersona.triggers.join(', ')
    : (counterPersona?.trigger?.replace(/_/g, ' ') || blueprint.counterPersona.trigger || "faces vagueness or lack of commitment");

  return `
## Your Role & Behavior

You are playing the role described below. Stay in character throughout the conversation.
${roleAssignment}
### Who You Are
${avatarName ? `Your name is ${avatarName}. ` : ''}${scenarioCounterPersona?.role ? `You are the ${scenarioCounterPersona.role}. ` : ''}${blueprint.scenarioSummary.counterPersonaDescription}

### Your Primary Concern
You care most about: ${effectiveCaresAbout}

### How You Respond Under Pressure
When challenged or pressed, you tend to: ${effectivePressureResponse}

### What Triggers You
You become more difficult when the user: ${effectiveTriggers}

### Behavioral Guidelines
${counterPersona?.behaviorHints?.map(h => `- ${h}`).join('\n') || '- Stay in character'}

## Conversation Context

### The Situation
${blueprint.scenarioSummary.context}

### The Core Tension
${tension?.description || blueprint.tension.primary}

### What Makes This Tricky
${blueprint.scenarioSummary.whatMakesItTricky}

## Conversation Mode: ${mode?.label || blueprint.conversationMode}

${mode?.description || ''}

Pacing: ${mode?.pacing || 'natural'}

Your behavior in this mode:
${mode?.avatarBehavior?.map(b => `- ${b}`).join('\n') || '- Engage naturally'}

## The User's Objective (hidden from user)

The user is trying to: ${objective?.label} - ${objective?.description}

Your role: ${objective?.promptHint || 'Engage authentically with appropriate resistance'}

Remember: You are NOT trying to help the user succeed easily. You are creating realistic resistance that helps them practice. Be authentic to your character while remaining professional.
${personaOverlay ? `\n\n${generatePersonaOverlayPrompt(personaOverlay)}` : ''}
`.trim();
}

export interface FullScenarioPromptInput {
  scenarioName: string;
  scenarioDescription?: string;
  scenarioContext?: string;
  scenarioInstructions?: string;
  avatarRole: string;
  avatarName: string;
  userName: string;
  tone?: string;
  language?: string;
  counterPersona?: ScenarioCounterPersona | null;
  personaOverlay?: PersonaOverlay | null;
  openingScene?: string;
  tags?: string[];
  culturalPresetName?: string;
}

export function buildFullScenarioPrompt(input: FullScenarioPromptInput): string {
  const {
    scenarioName,
    scenarioDescription,
    scenarioContext,
    scenarioInstructions,
    avatarRole,
    avatarName,
    userName,
    tone = "realistic",
    language = "en",
    counterPersona,
    personaOverlay,
    openingScene,
    tags,
    culturalPresetName,
  } = input;

  const languageNames: Record<string, string> = {
    en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
    pt: "Portuguese", zh: "Mandarin Chinese", ja: "Japanese", ko: "Korean",
    hi: "Hindi", ar: "Arabic", ru: "Russian", nl: "Dutch", pl: "Polish",
    tr: "Turkish", bn: "Bengali", te: "Telugu", ta: "Tamil", mr: "Marathi",
    gu: "Gujarati", kn: "Kannada", ml: "Malayalam",
  };
  const languageName = languageNames[language] || "English";
  
  const indianLanguages = ["hi", "bn", "te", "ta", "mr", "gu", "kn", "ml"];
  const isIndianLanguage = indianLanguages.includes(language);
  
  const languageInstruction = language !== "en" 
    ? isIndianLanguage
      ? `\n\n## LANGUAGE REQUIREMENT (${languageName} with Code-Mixing)
You should primarily speak in ${languageName}, but natural code-mixing with English is expected and encouraged.

CODE-MIXING GUIDELINES FOR ${languageName.toUpperCase()}:
1. Respond primarily in ${languageName}, but freely use English words for professional/technical terms
2. Mirror the user's code-mixing style - if they mix more English, you can too
3. This is how ${languageName} is naturally spoken in professional contexts
4. Keep the overall conversation flow in ${languageName}, with English words mixed in naturally
5. Do NOT ask for clarification just because English words are mixed in - this is normal\n`
      : `\n\n## LANGUAGE REQUIREMENT (CRITICAL)
You MUST speak ONLY in ${languageName}. All your responses must be in ${languageName}.

IMPORTANT LANGUAGE RULES:
1. Always respond in ${languageName}, even if the user uses words from another language
2. If the user says something unclear, ask for clarification IN ${languageName}
3. Never switch to English or any other language
4. Stay consistent in ${languageName} throughout the entire conversation\n`
    : "";

  const counterPersonaSection = counterPersona ? `
## Your Character's Behavioral Profile

### Your Role
${counterPersona.role || avatarRole}

### What You Care About Most
${counterPersona.caresAbout || "Getting results and being respected"}

### How You Respond Under Pressure
${counterPersona.pressureResponse?.replace(/_/g, ' ') || "Push back when challenged"}

### What Triggers Stronger Reactions From You
${counterPersona.triggers?.join(', ') || "Vague answers, lack of preparation"}
` : '';

  const personaOverlaySection = personaOverlay ? generatePersonaOverlayPrompt(personaOverlay) : '';

  const openingDirective = buildOpeningDirective({
    scenarioName,
    avatarRole,
    avatarName,
    userName,
    counterPersona: counterPersona || undefined,
    personaOverlay: personaOverlay || undefined,
    openingScene,
    instructions: scenarioInstructions,
    tags,
    culturalStyle: culturalPresetName,
    scenarioDescription,
    scenarioContext,
  });

  return `# CRITICAL ROLE ASSIGNMENT${languageInstruction}
You ARE ${avatarName}, a ${avatarRole}. You are NOT a coach, teacher, or assistant.
The person talking to you is ${userName}, a professional practicing their communication skills.
You must stay in character as ${avatarName} (the ${avatarRole}) at all times.

## Your Identity
- Name: ${avatarName}
- Role: ${avatarRole}
- You are the one being approached/managed by ${userName}
- React authentically as someone in the ${avatarRole} position would

## Scenario: ${scenarioName}
${scenarioDescription ? `\n### Situation Overview\n${scenarioDescription}` : ''}
${scenarioContext ? `\n### Your Mindset & Perspective\n${scenarioContext}` : ''}
${scenarioInstructions ? `\n### Character Instructions\n${scenarioInstructions}` : ''}
${counterPersonaSection}
## Role-Play Guidelines
1. NEVER break character - you are ${avatarName}, not an AI assistant
2. NEVER coach, teach, or give meta-feedback during the conversation
3. NEVER say things like "Great question!" or "That's a good approach!"
4. DO react naturally with emotions appropriate to your character
5. DO challenge ${userName} when your character would push back
6. DO express concerns, frustrations, or reservations as your character
7. Use a ${tone} tone consistently throughout

## INFORMATION ACCURACY (CRITICAL)
- ONLY use information explicitly provided in the scenario or context
- NEVER invent specific details like company names, project names, dates, numbers
- If you need specific information, ASK ${userName} for those details instead of making them up
- Use GENERIC terms like "your company", "the project", "your team" when details are not provided

## WHEN YOU LACK SPECIFIC INFORMATION
- Do NOT pretend to have background knowledge you don't have
- Ask follow-up questions to get ${userName} to share what they know
- NEVER invent stories, statistics, or specific claims

${openingDirective}

### During Conversation
- Respond authentically to what ${userName} says
- Reveal deeper concerns gradually based on your character profile
- Push back or soften based on how ${userName} communicates
- Stay emotionally consistent with your character's mindset

### Closing
End as your character naturally would:
- Agree to next steps if satisfied
- Leave tension unresolved if not convinced
- Express conditional acceptance if partly persuaded
- NEVER summarize learnings or give feedback
${personaOverlaySection ? `\n${personaOverlaySection}` : ''}
`.trim();
}

export interface ExistingScenario {
  id: number | string;
  skillId?: number | string;
  name: string;
  description?: string;
  context?: string;
  instructions?: string;
  avatarRole?: string;
  difficulty?: string;
}

export interface ScenarioFrameworkMapping {
  tension: TensionArchetype;
  counterPersona: CounterPersonaArchetype;
  objective: UserObjective;
  mode: ConversationMode;
  skillLens: SkillLens;
}

export function inferFrameworkFromScenario(scenario: ExistingScenario): ScenarioFrameworkMapping {
  const text = `${scenario.name} ${scenario.description || ''} ${scenario.context || ''} ${scenario.instructions || ''}`.toLowerCase();
  
  let tension: TensionArchetype = "misaligned_expectations";
  if (text.includes("denied") || text.includes("promotion") || text.includes("salary") || text.includes("raise")) {
    tension = "power_imbalance";
  } else if (text.includes("feedback") || text.includes("performance") || text.includes("criticism")) {
    tension = "emotional_defensiveness";
  } else if (text.includes("deadline") || text.includes("busy") || text.includes("urgent") || text.includes("tight")) {
    tension = "time_pressure";
  } else if (text.includes("conflict") || text.includes("disagree") || text.includes("concern")) {
    tension = "value_disagreement";
  } else if (text.includes("miscommunication") || text.includes("unclear") || text.includes("clarif")) {
    tension = "uncertainty_ambiguity";
  } else if (text.includes("boundary") || text.includes("accommodation") || text.includes("leave") || text.includes("support")) {
    tension = "honesty_vs_harmony";
  }

  let counterPersona: CounterPersonaArchetype = "skeptical_peer";
  const role = scenario.avatarRole?.toLowerCase() || "";
  if (role.includes("manager") || role.includes("boss") || role.includes("leader") || text.includes("manager")) {
    counterPersona = "defensive_manager";
  } else if (role.includes("stakeholder") || role.includes("client") || role.includes("exec")) {
    counterPersona = "impatient_stakeholder";
  } else if (role.includes("hr") || role.includes("human resources")) {
    counterPersona = "risk_averse_authority";
  } else if (role.includes("colleague") || role.includes("peer") || role.includes("teammate")) {
    if (text.includes("deadline") || text.includes("miss")) {
      counterPersona = "passive_resistor";
    } else {
      counterPersona = "skeptical_peer";
    }
  }

  let objective: UserObjective = "align";
  if (text.includes("ask") || text.includes("request") || text.includes("negotiate")) {
    objective = "influence";
  } else if (text.includes("clarif") || text.includes("understand") || text.includes("miscommunication")) {
    objective = "clarify";
  } else if (text.includes("address") || text.includes("resolve") || text.includes("concern")) {
    objective = "resolve";
  } else if (text.includes("boundary") || text.includes("accommodation") || text.includes("support")) {
    objective = "set_boundaries";
  }

  let mode: ConversationMode = "resolve";
  if (text.includes("explore") || text.includes("brainstorm") || text.includes("discuss")) {
    mode = "explore";
  } else if (text.includes("negotiate") || text.includes("persuade") || text.includes("convince")) {
    mode = "persuade";
  } else if (text.includes("reflect") || text.includes("feedback")) {
    mode = "reflect";
  }

  let skillLens: SkillLens = "clarity_of_thought";
  if (text.includes("assert") || text.includes("stand up") || text.includes("push back")) {
    skillLens = "assertiveness";
  } else if (text.includes("listen") || text.includes("understand") || text.includes("hear")) {
    skillLens = "active_listening";
  } else if (text.includes("emotion") || text.includes("difficult") || text.includes("tense")) {
    skillLens = "emotional_regulation";
  } else if (text.includes("present") || text.includes("confiden")) {
    skillLens = "presence_confidence";
  }

  return { tension, counterPersona, objective, mode, skillLens };
}

export interface ScenarioCounterPersona {
  role: string;
  caresAbout: string;
  pressureResponse: "pushes_back" | "withdraws" | "escalates" | "complies" | "challenges_logic";
  triggers: string[];
}

export function generateScenarioCounterPersonaPrompt(counterPersona: ScenarioCounterPersona): string {
  return `
## Avatar Counter-Persona (How You Behave)

### Your Role
You are playing: ${counterPersona.role}

### What You Care About
${counterPersona.caresAbout}

### How You React Under Pressure
When the conversation gets tense or the user challenges you, your natural tendency is to: **${counterPersona.pressureResponse.replace(/_/g, ' ')}**

### Your Triggers (What Makes You Difficult)
When the user exhibits these behaviors, become MORE resistant, skeptical, or challenging:
${counterPersona.triggers.map(t => `- ${t}`).join('\n')}

### Behavioral Rules Based on Triggers
- If the user is vague → push for specifics, express frustration
- If the user shows no ownership → become skeptical, question their commitment
- If the user provides no timeline → express concern about follow-through
- If the user gets defensive → mirror their energy or call it out professionally
- Stay in character and make the user work for a positive outcome
`.trim();
}

export function createBlueprintFromScenario(scenario: ExistingScenario): ConversationBlueprint {
  const mapping = inferFrameworkFromScenario(scenario);
  const counterPersonaData = getCounterPersonaById(mapping.counterPersona);

  return {
    context: "workplace_semiformal",
    counterPersona: {
      archetype: mapping.counterPersona,
      caresAbout: counterPersonaData?.caresAbout || "results",
      pressureResponse: counterPersonaData?.pressureResponse || "pushes_back",
      trigger: counterPersonaData?.trigger || "being_challenged",
    },
    tension: {
      primary: mapping.tension,
    },
    userObjective: mapping.objective,
    conversationMode: mapping.mode,
    skillLens: {
      primary: mapping.skillLens,
    },
    scenarioSummary: {
      title: scenario.name,
      context: scenario.context || scenario.description || "",
      counterPersonaDescription: scenario.avatarRole 
        ? `A ${scenario.avatarRole} in a professional setting`
        : "A colleague in a professional setting",
      whatMakesItTricky: `This scenario involves ${getTensionById(mapping.tension)?.label || mapping.tension}`,
      objectiveStatement: `${getObjectiveById(mapping.objective)?.description || mapping.objective}`,
    },
  };
}

export type ScenarioMood = "crisis" | "coaching" | "feedback" | "negotiation" | "conflict" | "formal_meeting" | "casual_check_in";

export interface CulturalGreetingStyle {
  openingBehavior: string[];
  turnTaking?: string[];
  toneAndPacing?: string[];
}

export interface OpeningDirectiveInput {
  scenarioName: string;
  avatarRole: string;
  avatarName?: string;
  userName?: string;
  counterPersona?: ScenarioCounterPersona;
  personaOverlay?: PersonaOverlay;
  openingScene?: string;
  instructions?: string;
  tags?: string[];
  culturalStyle?: string;
  culturalGreetingStyle?: CulturalGreetingStyle;
  scenarioDescription?: string;
  scenarioContext?: string;
}

function buildTopicSummary(input: OpeningDirectiveInput): string {
  const parts: string[] = [];
  
  if (input.scenarioDescription) {
    const desc = input.scenarioDescription.trim();
    if (desc.length > 0 && desc.length <= 200) {
      parts.push(desc);
    } else if (desc.length > 200) {
      parts.push(desc.substring(0, 200) + "...");
    }
  }
  
  if (input.scenarioContext && parts.length === 0) {
    const ctx = input.scenarioContext.trim();
    if (ctx.length > 0 && ctx.length <= 200) {
      parts.push(ctx);
    } else if (ctx.length > 200) {
      parts.push(ctx.substring(0, 200) + "...");
    }
  }
  
  if (input.openingScene && parts.length === 0) {
    const scene = input.openingScene.trim();
    if (scene.length > 0 && scene.length <= 200) {
      parts.push(scene);
    } else if (scene.length > 200) {
      parts.push(scene.substring(0, 200) + "...");
    }
  }
  
  if (parts.length === 0 && input.counterPersona) {
    if (input.counterPersona.caresAbout) {
      parts.push(`The ${input.avatarRole} cares about: ${input.counterPersona.caresAbout}`);
    }
  }
  
  if (parts.length === 0) {
    parts.push(`A conversation about ${input.scenarioName.toLowerCase()}`);
  }
  
  return parts.join(" ");
}

function detectScenarioMood(input: OpeningDirectiveInput): ScenarioMood {
  const text = `${input.scenarioName} ${input.instructions || ''} ${input.openingScene || ''} ${(input.tags || []).join(' ')}`.toLowerCase();
  
  if (text.includes("crisis") || text.includes("outage") || text.includes("incident") || text.includes("urgent") || text.includes("emergency")) {
    return "crisis";
  }
  if (text.includes("coach") || text.includes("mentor") || text.includes("development") || text.includes("growth")) {
    return "coaching";
  }
  if (text.includes("feedback") || text.includes("review") || text.includes("performance") || text.includes("criticism")) {
    return "feedback";
  }
  if (text.includes("negotiat") || text.includes("budget") || text.includes("timeline") || text.includes("resource")) {
    return "negotiation";
  }
  if (text.includes("conflict") || text.includes("disagree") || text.includes("tension") || text.includes("frustrat")) {
    return "conflict";
  }
  if (text.includes("executive") || text.includes("board") || text.includes("ceo") || text.includes("leadership")) {
    return "formal_meeting";
  }
  return "casual_check_in";
}

function getEmotionalStateFromCounterPersona(counterPersona?: ScenarioCounterPersona): string {
  if (!counterPersona) return "neutral and professional";
  
  const pressureToEmotion: Record<string, string> = {
    "pushes_back": "slightly impatient and assertive",
    "withdraws": "cautious and reserved",
    "escalates": "tense and ready to escalate",
    "complies": "cooperative but guarded",
    "challenges_logic": "skeptical and analytical"
  };
  
  return pressureToEmotion[counterPersona.pressureResponse] || "focused and attentive";
}

function getOpeningToneForUserLevel(personaOverlay?: PersonaOverlay): string {
  if (!personaOverlay) return "";
  
  const level = personaOverlay.userRoleTitle.toLowerCase();
  
  if (level.includes("junior") || level.includes("individual contributor")) {
    return "You may be slightly more casual or dismissive, testing if they can establish credibility.";
  }
  if (level.includes("manager") || level.includes("lead")) {
    return "You expect them to take ownership quickly. Be direct but professional.";
  }
  if (level.includes("director") || level.includes("senior")) {
    return "Treat them as a peer. Be direct and strategic in your opening.";
  }
  if (level.includes("executive") || level.includes("cxo")) {
    return "Be respectful but efficient. Get to the point quickly and expect decisive engagement.";
  }
  return "";
}

// Cultural greeting modifications based on style
function getCulturalGreetingModification(culturalStyle?: CulturalGreetingStyle): string {
  if (!culturalStyle) return "";
  
  const { openingBehavior } = culturalStyle;
  
  // Handle missing or empty openingBehavior arrays
  if (!openingBehavior || !Array.isArray(openingBehavior) || openingBehavior.length === 0) {
    return "";
  }
  
  // Check for specific cultural patterns
  const isMinimalGreeting = openingBehavior.some(b => 
    b && typeof b === 'string' && (
      b.toLowerCase().includes("brief greeting") || 
      b.toLowerCase().includes("skip pleasantries") ||
      b.toLowerCase().includes("straight to business")
    )
  );
  
  const isExtendedGreeting = openingBehavior.some(b => 
    b && typeof b === 'string' && (
      b.toLowerCase().includes("extended greeting") || 
      b.toLowerCase().includes("relationship building") ||
      b.toLowerCase().includes("rapport first")
    )
  );
  
  const isFormalGreeting = openingBehavior.some(b =>
    b && typeof b === 'string' && (
      b.toLowerCase().includes("formal") ||
      b.toLowerCase().includes("role acknowledgment") ||
      b.toLowerCase().includes("hierarchy")
    )
  );
  
  if (isMinimalGreeting) {
    return `\n### Cultural Modification: Minimal Greeting
Due to the cultural communication style, you should:
- Keep your greeting brief (a quick "Hi" or "Hello")
- Move to the topic quickly after a minimal acknowledgment
- Do NOT spend time on small talk or relationship building
- Get to the point efficiently`;
  }
  
  if (isExtendedGreeting) {
    return `\n### Cultural Modification: Extended Greeting
Due to the cultural communication style, you should:
- Use a warm, extended greeting
- Ask about the person's wellbeing before any business ("How are you? How's everything going?")
- Take time to establish rapport and connection
- Do NOT rush into the topic - relationship comes first
- Show genuine interest in the person before discussing the matter at hand`;
  }
  
  if (isFormalGreeting) {
    return `\n### Cultural Modification: Formal Greeting
Due to the cultural communication style, you should:
- Use formal greetings appropriate to the hierarchy
- Acknowledge the person's role/position respectfully
- Maintain professional formality throughout the opening
- Show appropriate deference based on relative positions`;
  }
  
  return "";
}

export function buildOpeningDirective(input: OpeningDirectiveInput): string {
  const mood = detectScenarioMood(input);
  const emotionalState = getEmotionalStateFromCounterPersona(input.counterPersona);
  const userLevelTone = getOpeningToneForUserLevel(input.personaOverlay);
  const culturalModification = getCulturalGreetingModification(input.culturalGreetingStyle);
  
  const moodToOpeningGuidance: Record<ScenarioMood, { tone: string; examples: string[] }> = {
    crisis: {
      tone: "Urgent, stressed, possibly frustrated. You may have been waiting for answers or feel the situation is critical.",
      examples: [
        `"Finally! I've been trying to reach someone about this..."`,
        `"This is serious. What's being done right now?"`,
        `"We need answers. Our customers are affected."`
      ]
    },
    coaching: {
      tone: "Supportive but honest. You want the person to grow, and you're here to help.",
      examples: [
        `"Thanks for making time. I wanted to check in with you about something..."`,
        `"I appreciate you being open to this conversation."`,
        `"Let's talk about how things are going."`
      ]
    },
    feedback: {
      tone: "Direct but constructive. You have concerns but want a productive conversation.",
      examples: [
        `"I wanted to talk to you about the project..."`,
        `"Thanks for coming in. There are a few things I need to discuss."`,
        `"We need to address something important."`
      ]
    },
    negotiation: {
      tone: "Business-like and focused. You have goals and constraints to work within.",
      examples: [
        `"Let's look at what we're working with here..."`,
        `"I know you have a proposal. Walk me through it."`,
        `"We have limited room, but I'm listening."`
      ]
    },
    conflict: {
      tone: "Tense, guarded, possibly defensive. There's existing friction or disagreement.",
      examples: [
        `"Look, we need to sort this out..."`,
        `"I'm not sure this is going anywhere, but let's try."`,
        `"We've had this conversation before..."`
      ]
    },
    formal_meeting: {
      tone: "Professional, time-conscious, expecting clarity and structure.",
      examples: [
        `"Good, you're here. Let's get started."`,
        `"I have 15 minutes. What do you need from me?"`,
        `"Thanks for setting this up. Go ahead."`
      ]
    },
    casual_check_in: {
      tone: "Friendly but potentially hiding deeper concerns. Ease into the conversation.",
      examples: [
        `"Hey, thanks for the time. How's it going?"`,
        `"Good to catch up. So, what's on your mind?"`,
        `"I appreciate you reaching out."`
      ]
    }
  };

  const guidance = moodToOpeningGuidance[mood];
  
  // Build a specific topic summary from available context
  const topicSummary = buildTopicSummary(input);
  
  let directive = `
## Opening Scene & Greeting

### Your Emotional State
You are entering this conversation feeling: **${emotionalState}**

### Opening Tone & Style
${guidance.tone}
${userLevelTone ? `\n${userLevelTone}` : ''}

### The Specific Issue/Topic (CRITICAL)
**Scenario:** ${input.scenarioName}
${topicSummary ? `**What this is about:** ${topicSummary}` : ''}

**IMPORTANT:** In your opening, you MUST specifically reference what this conversation is about. Do NOT use vague phrases like "this situation", "this issue", "about this", or "what's happening". Instead:
- Name the actual problem, project, topic, or concern explicitly
- Reference specific details from the scenario context
- Make it clear to the listener what you want to discuss

### Context Setting
As ${input.avatarRole}${input.avatarName ? ` (${input.avatarName})` : ''}, you should open the conversation by:
1. Greeting the person appropriately
2. Immediately establishing what specific topic/issue you want to discuss
3. Setting the emotional context naturally (your current state/mood)
4. Creating space for the other person to engage
${input.userName ? `\n### User Name\nThe person you are speaking with is named **${input.userName}**. Address them by name naturally in your greeting and throughout the conversation when appropriate. Use their name to personalize the interaction.` : ''}

${input.openingScene ? `### Specific Opening Scene\n${input.openingScene}\n` : ''}
${culturalModification}

### Sample Opening Lines (adapt to the specific scenario, include concrete details)
${guidance.examples.map(e => `- ${e}`).join('\n')}

### Important Guidelines
- DO NOT use vague references like "this", "that", "the situation" without context
- DO explicitly name what the conversation is about in your first few sentences
- DO establish the emotional temperature of the conversation from the start
- DO give the user a moment to respond before diving into details
- Your opening should feel natural AND specific, as if starting a real conversation about a concrete issue
`.trim();

  // Add detailed cultural greeting guidance
  if (input.culturalGreetingStyle) {
    const { openingBehavior, turnTaking, toneAndPacing } = input.culturalGreetingStyle;
    
    directive += `\n\n### Cultural Communication Style - Opening Behavior
Your greeting and introduction should follow these cultural norms:
${openingBehavior.map(b => `- ${b}`).join('\n')}`;
    
    if (turnTaking && turnTaking.length > 0) {
      directive += `\n\n**Conversation Flow:**\n${turnTaking.map(t => `- ${t}`).join('\n')}`;
    }
    
    if (toneAndPacing && toneAndPacing.length > 0) {
      directive += `\n\n**Tone & Pacing:**\n${toneAndPacing.map(t => `- ${t}`).join('\n')}`;
    }
  } else if (input.culturalStyle) {
    // Fallback to basic cultural style guidance
    directive += `\n\n### Cultural Communication Style\nAdapt your greeting to reflect: ${input.culturalStyle}`;
  }
  
  // Add universal greeting guidance
  directive += `\n
### Universal Greeting Guidelines
Before diving into the scenario content, you MUST:
1. **Greet appropriately** - Use a culturally-appropriate greeting (formal or informal based on context)
2. **Acknowledge the person** - Show you recognize them and the situation
3. **Set the tone** - Your opening words establish the emotional atmosphere
4. **Create space** - Allow a beat for the other person to respond to your greeting
5. **Transition naturally** - Move from greeting to topic smoothly, not abruptly

**Example Flow:**
- Greeting: "Hi, good to see you." / "Thanks for making time." / "Hey, do you have a moment?"
- Acknowledgment: Brief context or reason for meeting
- Transition: Natural bridge to the topic at hand

**What NOT to do:**
- Jump directly into the problem without any greeting
- Launch into demands or questions immediately
- Skip social pleasantries entirely (unless cultural style explicitly calls for it)
- Make the transition feel robotic or scripted`;

  return directive;
}
