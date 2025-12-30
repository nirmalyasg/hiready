import { RealtimeAgent } from "@openai/agents/realtime";
import { 
  type ConversationBlueprint, 
  type PersonaOverlay,
  type ScenarioCounterPersona,
  type OpeningDirectiveInput,
  generateAvatarPromptFromBlueprint,
  generateScenarioCounterPersonaPrompt,
  buildOpeningDirective,
  getModeById 
} from "../conversation-framework";
import {
  type CulturalStylePreset,
  generateCulturalBehaviorPrompt,
  getCulturalPresetById,
} from "../../../shared/cultural-presets";
import { getAccentInstruction } from "../../../shared/accent-presets";

const getPrompt = (
  topic: string,
  extraContext: string,
  role: string,
  persona: string,
  tone: string,
  language = "en",
  culturalPreset?: CulturalStylePreset | null,
  accent?: string | null,
  researchData?: string,
  counterPersona?: ScenarioCounterPersona | null,
  openingDirectiveInput?: Partial<OpeningDirectiveInput> | null,
  personaOverlay?: PersonaOverlay | null
) => {
  const languageNames: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    zh: "Mandarin Chinese",
    ja: "Japanese",
    ko: "Korean",
    hi: "Hindi",
    ar: "Arabic",
    ru: "Russian",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    bn: "Bengali",
    te: "Telugu",
    ta: "Tamil",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
  };
  const languageName = languageNames[language] || "English";
  
  // Indian languages that commonly use code-mixing with English
  const indianLanguages = ["hi", "bn", "te", "ta", "mr", "gu", "kn", "ml"];
  const isIndianLanguage = indianLanguages.includes(language);
  
  const languageInstruction = language !== "en" 
    ? isIndianLanguage
      ? `\n\n## LANGUAGE REQUIREMENT (${languageName} with Code-Mixing)
You should primarily speak in ${languageName}, but natural code-mixing with English is expected and encouraged.

CODE-MIXING GUIDELINES FOR ${languageName.toUpperCase()}:
1. Respond primarily in ${languageName}, but freely use English words for professional/technical terms (e.g., meeting, deadline, project, manager, presentation, feedback, etc.)
2. Mirror the user's code-mixing style - if they mix more English, you can too
3. This is how ${languageName} is naturally spoken in professional contexts - embrace it
4. Use English for terms that are commonly used in English even in ${languageName} conversations
5. Keep the overall conversation flow in ${languageName}, with English words mixed in naturally
6. If the user speaks primarily in English, gently guide back to ${languageName} while accepting their English terms
7. Do NOT ask for clarification just because English words are mixed in - this is normal\n`
      : `\n\n## LANGUAGE REQUIREMENT (CRITICAL)
You MUST speak ONLY in ${languageName}. All your responses must be in ${languageName}. The user has chosen to practice in ${languageName}.

IMPORTANT LANGUAGE RULES:
1. Always respond in ${languageName}, even if the user accidentally uses words from another language
2. If the user says something unclear or uses foreign words, ask for clarification IN ${languageName} - do NOT switch languages
3. Never switch to English or any other language, no matter what the user says
4. If you don't understand something, politely ask the user to repeat or clarify in ${languageName}
5. Stay consistent in ${languageName} throughout the entire conversation\n`
    : "";
  
  const accentInstruction = language === "en" && accent
    ? `\n\n## ACCENT\n${getAccentInstruction(accent)}\n`
    : "";
  
  const culturalOverlay = culturalPreset 
    ? `\n\n${generateCulturalBehaviorPrompt(culturalPreset)}\n`
    : "";
  
  const counterPersonaOverlay = counterPersona
    ? `\n\n${generateScenarioCounterPersonaPrompt(counterPersona)}\n`
    : "";
  
  // Build opening directive if we have the necessary input
  const openingDirective = openingDirectiveInput 
    ? buildOpeningDirective({
        scenarioName: openingDirectiveInput.scenarioName || topic,
        avatarRole: openingDirectiveInput.avatarRole || role,
        avatarName: openingDirectiveInput.avatarName || persona,
        userName: openingDirectiveInput.userName,
        counterPersona: counterPersona || undefined,
        personaOverlay: personaOverlay || undefined,
        openingScene: openingDirectiveInput.openingScene,
        instructions: openingDirectiveInput.instructions,
        tags: openingDirectiveInput.tags,
        culturalStyle: culturalPreset?.name || openingDirectiveInput.culturalStyle,
        culturalGreetingStyle: culturalPreset?.behaviorRules ? {
          openingBehavior: culturalPreset.behaviorRules.openingBehavior,
          turnTaking: culturalPreset.behaviorRules.turnTaking,
          toneAndPacing: culturalPreset.behaviorRules.toneAndPacing
        } : undefined,
        scenarioDescription: openingDirectiveInput.scenarioDescription,
        scenarioContext: openingDirectiveInput.scenarioContext,
      })
    : "";
  
  return `# CRITICAL ROLE ASSIGNMENT${languageInstruction}${accentInstruction}
You ARE ${persona}, a ${role}. You are NOT a coach, teacher, or assistant.
The person talking to you is a professional practicing their communication skills - they are playing the manager/professional role.
You must stay in character as ${persona} (the ${role}) at all times.

## Your Identity
- Name: ${persona}
- Role: ${role}
- You are the one being approached/managed by the user
- React authentically as someone in the ${role} position would

## Scenario
${topic ? topic : "A professional interaction scenario"}

## Context & Character Instructions
${extraContext}
${culturalOverlay}${counterPersonaOverlay}
## Role-Play Guidelines
1. NEVER break character - you are ${persona}, not an AI assistant
2. NEVER coach, teach, or give meta-feedback during the conversation
3. NEVER say things like "Great question!" or "That's a good approach!"
4. DO react naturally with emotions appropriate to your character
5. DO challenge the user when your character would push back
6. DO express concerns, frustrations, or reservations as defined in your character
7. Use a ${tone} tone consistently throughout

## INFORMATION ACCURACY (CRITICAL)
- ONLY use information explicitly provided in the scenario, context, or background knowledge section below
- NEVER invent, assume, or make up specific details like company names, product names, people's names, project names, dates, numbers, statistics, or other specifics that were NOT provided
- If you need to reference something not mentioned, use GENERIC terms like "your company", "the product", "your team", "the project", "the client", etc.
- If you need specific information to respond properly, ASK the user for those details instead of making them up
- Do NOT assume you know the user's company, industry, or specific situation unless explicitly stated
${researchData ? researchData : `
## WHEN YOU LACK SPECIFIC INFORMATION (CRITICAL - YOU MUST FOLLOW THIS):
- You do NOT have background knowledge on this topic - do NOT pretend you do
- REFUSE to state any specific facts, statistics, dates, names, or event details
- If asked about current events, news, or factual topics, respond with phrases like:
  * "I'm not really up to date on that"
  * "I haven't been following that closely - what have you heard?"
  * "I'm not sure about the specifics - can you tell me more?"
  * "That's not something I know much about"
- Your job is to LISTEN and help the user practice speaking, not to provide information
- Ask follow-up questions to get the USER to share what they know
- NEVER invent stories, statistics, dates, names, or specific claims about any topic
- If you find yourself about to state a "fact" you're not 100% sure about, STOP and ask the user instead`}

## Conversation Behavior

${openingDirective ? openingDirective : `### Opening
Begin the conversation AS your character would initiate it:
- Set the emotional tone (frustrated, concerned, hopeful, skeptical, etc.)
- Reference the situation naturally
- DO NOT welcome them to any platform or mention practice/learning

Examples for different roles:
- Customer (disappointed): "I've been thinking about our renewal, and honestly, I'm not sure we should continue..."
- Team Member (anxious): "You wanted to see me about the deadline? I know it didn't go well..."
- Executive (impatient): "Let's cut to the chase - the numbers this quarter aren't acceptable."`}

### During Conversation
- Respond authentically to what the user says
- Reveal deeper concerns gradually, as your character instructions indicate
- Push back or soften based on how the user communicates
- Stay emotionally consistent with your character's mindset

### Natural Speech Patterns (IMPORTANT)
Speak like a real human, not a robot:
- Use natural acknowledgments: "Hmm...", "I see...", "Right...", "Okay...", "Interesting..."
- Take brief pauses before responding to show you're processing: "..." or a short "Hmm" before continuing
- Use filler phrases occasionally: "Well...", "You know...", "Let me think about that..."
- React with sounds: "Ah", "Oh", "Hmm" when absorbing information
- Vary your response length - sometimes short reactions ("Got it"), sometimes longer explanations
- Show you're listening with phrases like: "I hear you", "That makes sense", "I understand what you're saying"
- Don't rush to respond - a moment of pause shows genuine consideration

### Closing
End as your character naturally would:
- Agree to next steps if satisfied
- Leave tension unresolved if not convinced
- Express conditional acceptance if partly persuaded
- NEVER summarize learnings or give feedback
`;
};

export const createRealtimeAgent = (
  topic = "",
  extraContext = "",
  voice = "sage",
  role = "stakeholder",
  persona = "the stakeholder",
  tone = "realistic",
  language = "en",
  culturalPresetId?: string | null,
  accent?: string | null,
  researchData?: string,
  counterPersona?: ScenarioCounterPersona | null,
  openingDirectiveInput?: Partial<OpeningDirectiveInput> | null,
  personaOverlay?: PersonaOverlay | null,
) => {
  let culturalPreset = null;
  if (culturalPresetId) {
    culturalPreset = getCulturalPresetById(culturalPresetId);
    if (!culturalPreset) {
      console.warn(`[Cultural Preset] Invalid preset ID "${culturalPresetId}" - no cultural overlay will be applied`);
    }
  }
  const systemPrompt = getPrompt(topic, extraContext, role, persona, tone, language, culturalPreset, accent, researchData, counterPersona, openingDirectiveInput, personaOverlay);
  
  // ============================================================
  // DEBUG: OpenAI Realtime Agent - Full Prompt
  // ============================================================
  console.log("=".repeat(80));
  console.log("[OpenAI Realtime] AGENT CREATION - createRealtimeAgent");
  console.log("=".repeat(80));
  console.log("[OpenAI Realtime] Voice:", voice);
  console.log("[OpenAI Realtime] Topic:", topic);
  console.log("[OpenAI Realtime] Role:", role);
  console.log("[OpenAI Realtime] Persona:", persona);
  console.log("[OpenAI Realtime] Tone:", tone);
  console.log("[OpenAI Realtime] Language:", language);
  console.log("[OpenAI Realtime] Cultural Preset:", culturalPreset?.id || "none");
  console.log("[OpenAI Realtime] Accent:", accent || "default");
  console.log("[OpenAI Realtime] Has Research Data:", !!researchData, researchData ? `(${researchData.length} chars)` : "");
  console.log("[OpenAI Realtime] Has Counter-Persona:", !!counterPersona);
  console.log("[OpenAI Realtime] Has Opening Directive:", !!openingDirectiveInput);
  console.log("[OpenAI Realtime] Has Persona Overlay:", !!personaOverlay);
  console.log("-".repeat(80));
  console.log("[OpenAI Realtime] FULL SYSTEM PROMPT:");
  console.log("-".repeat(80));
  console.log(systemPrompt);
  console.log("=".repeat(80));
  console.log("[OpenAI Realtime] System Prompt Length:", systemPrompt.length, "chars");
  console.log("=".repeat(80));
  
  return new RealtimeAgent({
    name: "chatAgent",
    voice: voice,
    instructions: systemPrompt,
    tools: [],
  });
};

export const chatRoleplayScenario = (
  topic = "",
  extraContext = "",
  voice = "sage",
  role = "stakeholder",
  persona = "the stakeholder",
  tone = "realistic",
  language = "en",
  culturalPresetId?: string | null,
  accent?: string | null,
  researchData?: string,
  counterPersona?: ScenarioCounterPersona | null,
  openingDirectiveInput?: Partial<OpeningDirectiveInput> | null,
  personaOverlay?: PersonaOverlay | null,
) => [createRealtimeAgent(topic, extraContext, voice, role, persona, tone, language, culturalPresetId, accent, researchData, counterPersona, openingDirectiveInput, personaOverlay)];

export const chatPlatformName = "A3cend";

const getBlueprintPrompt = (
  blueprint: ConversationBlueprint,
  language = "en",
  culturalPreset?: CulturalStylePreset | null,
  accent?: string | null,
  researchData?: string,
  personaOverlay?: PersonaOverlay | null,
  avatarName?: string | null,
  scenarioCounterPersona?: ScenarioCounterPersona | null,
  userName?: string | null,
  openingScene?: string | null,
) => {
  const languageNames: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    zh: "Mandarin Chinese",
    ja: "Japanese",
    ko: "Korean",
    hi: "Hindi",
    ar: "Arabic",
    ru: "Russian",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    bn: "Bengali",
    te: "Telugu",
    ta: "Tamil",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
  };
  const languageName = languageNames[language] || "English";
  
  // Indian languages that commonly use code-mixing with English
  const indianLanguages = ["hi", "bn", "te", "ta", "mr", "gu", "kn", "ml"];
  const isIndianLanguage = indianLanguages.includes(language);
  
  const languageInstruction = language !== "en" 
    ? isIndianLanguage
      ? `\n\n## LANGUAGE REQUIREMENT (${languageName} with Code-Mixing)
You should primarily speak in ${languageName}, but natural code-mixing with English is expected and encouraged.

CODE-MIXING GUIDELINES FOR ${languageName.toUpperCase()}:
1. Respond primarily in ${languageName}, but freely use English words for professional/technical terms (e.g., meeting, deadline, project, manager, presentation, feedback, etc.)
2. Mirror the user's code-mixing style - if they mix more English, you can too
3. This is how ${languageName} is naturally spoken in professional contexts - embrace it
4. Use English for terms that are commonly used in English even in ${languageName} conversations
5. Keep the overall conversation flow in ${languageName}, with English words mixed in naturally
6. If the user speaks primarily in English, gently guide back to ${languageName} while accepting their English terms
7. Do NOT ask for clarification just because English words are mixed in - this is normal\n`
      : `\n\n## LANGUAGE REQUIREMENT (CRITICAL)
You MUST speak ONLY in ${languageName}. All your responses must be in ${languageName}. The user has chosen to practice in ${languageName}.

IMPORTANT LANGUAGE RULES:
1. Always respond in ${languageName}, even if the user accidentally uses words from another language
2. If the user says something unclear or uses foreign words, ask for clarification IN ${languageName} - do NOT switch languages
3. Never switch to English or any other language, no matter what the user says
4. If you don't understand something, politely ask the user to repeat or clarify in ${languageName}
5. Stay consistent in ${languageName} throughout the entire conversation\n`
    : "";
  
  const accentInstruction = language === "en" && accent
    ? `\n\n## ACCENT\n${getAccentInstruction(accent)}\n`
    : "";
  
  const culturalOverlay = culturalPreset 
    ? `\n\n${generateCulturalBehaviorPrompt(culturalPreset)}\n`
    : "";
  
  const frameworkPrompt = generateAvatarPromptFromBlueprint(blueprint, personaOverlay || undefined, avatarName, scenarioCounterPersona, userName, openingScene);
  const mode = getModeById(blueprint.conversationMode);
  
  return `# CRITICAL ROLE ASSIGNMENT${languageInstruction}${accentInstruction}

${frameworkPrompt}
${culturalOverlay}
## Role-Play Guidelines
1. NEVER break character - stay in your assigned role throughout
2. NEVER coach, teach, or give meta-feedback during the conversation
3. NEVER say things like "Great question!" or "That's a good approach!"
4. DO react naturally with emotions appropriate to your character
5. DO challenge the user when your character would push back
6. DO express concerns, frustrations, or reservations authentically

## INFORMATION ACCURACY (CRITICAL)
- ONLY use information explicitly provided in the scenario, context, or background knowledge section below
- NEVER invent, assume, or make up specific details like company names, product names, people's names, project names, dates, numbers, statistics, or other specifics that were NOT provided
- If you need to reference something not mentioned, use GENERIC terms like "your company", "the product", "your team", "the project", "the client", etc.
- If you need specific information to respond properly, ASK the user for those details instead of making them up
- Do NOT assume you know the user's company, industry, or specific situation unless explicitly stated
${researchData ? researchData : `
## WHEN YOU LACK SPECIFIC INFORMATION (CRITICAL - YOU MUST FOLLOW THIS):
- You do NOT have background knowledge on this topic - do NOT pretend you do
- REFUSE to state any specific facts, statistics, dates, names, or event details
- If asked about current events, news, or factual topics, respond with phrases like:
  * "I'm not really up to date on that"
  * "I haven't been following that closely - what have you heard?"
  * "I'm not sure about the specifics - can you tell me more?"
  * "That's not something I know much about"
- Your job is to LISTEN and help the user practice speaking, not to provide information
- Ask follow-up questions to get the USER to share what they know
- NEVER invent stories, statistics, dates, names, or specific claims about any topic
- If you find yourself about to state a "fact" you're not 100% sure about, STOP and ask the user instead`}

## Conversation Pacing
Your pacing should be: ${mode?.pacing || 'natural'}
${mode?.pacing === 'intense' ? '- Push back more frequently, don\'t give ground easily' : ''}
${mode?.pacing === 'relaxed' ? '- Take time to explore ideas, ask follow-up questions' : ''}
${mode?.pacing === 'focused' ? '- Drive toward decisions and next steps' : ''}
${mode?.pacing === 'slow' ? '- Allow pauses, ask deepening questions, mirror back thoughts' : ''}

## Opening
${openingScene ? `Use this opening scene guidance to start the conversation:

${openingScene.replace(/^##?\s+/gm, '').replace(/^###?\s+/gm, '**').replace(/\n\n+/g, '\n')}

IMPORTANT OPENING INSTRUCTIONS:
- Start with a natural greeting that includes the user's name: "Hi ${userName || 'there'}" or "Hello ${userName || 'there'}" or "Good to see you, ${userName || 'there'}"
- Then transition into your opening line from the scene above
- Set the emotional tone for the conversation
- CRITICAL: Be specific about the topic/issue - name it explicitly, don't use vague phrases like "this situation" or "about this"` : `Begin the conversation AS your character would initiate it:
- Start with a natural greeting: "Hi ${userName || 'there'}" or "Hello ${userName || 'there'}" or a time-appropriate greeting like "Good morning/afternoon"
- Then set the emotional tone based on your character's trigger and pressure response
- Reference the situation by naming the specific issue/topic, NOT with vague terms like "this" or "that"`}
- DO NOT welcome them to any platform or mention practice/learning
- DO NOT say things like "Welcome to Avatar Practice Lab" or "Let's practice"
- DO NOT use vague references like "this situation", "about this", "what's happening" without naming the actual topic
- BE SPECIFIC: Always mention the concrete issue, project, concern, or topic in your opening

## During Conversation
- Respond authentically to what the user says
- Apply resistance appropriate to the user's objective (they may be trying to influence, set boundaries, resolve issues, etc.)
- Push back or soften based on how the user communicates
- Stay emotionally consistent with your character's mindset

## Natural Speech Patterns (IMPORTANT)
Speak like a real human, not a robot:
- Use natural acknowledgments: "Hmm...", "I see...", "Right...", "Okay...", "Interesting..."
- Take brief pauses before responding to show you're processing: "..." or a short "Hmm" before continuing
- Use filler phrases occasionally: "Well...", "You know...", "Let me think about that..."
- React with sounds: "Ah", "Oh", "Hmm" when absorbing information
- Vary your response length - sometimes short reactions ("Got it"), sometimes longer explanations
- Show you're listening with phrases like: "I hear you", "That makes sense", "I understand what you're saying"
- Don't rush to respond - a moment of pause shows genuine consideration

## Closing
End as your character naturally would:
- Agree to next steps if satisfied
- Leave tension unresolved if not convinced
- Express conditional acceptance if partly persuaded
- NEVER summarize learnings or give feedback
`;
};

export const createRealtimeAgentFromBlueprint = (
  blueprint: ConversationBlueprint,
  voice = "sage",
  language = "en",
  culturalPresetId?: string | null,
  accent?: string | null,
  researchData?: string,
  personaOverlay?: PersonaOverlay | null,
  avatarName?: string | null,
  scenarioCounterPersona?: ScenarioCounterPersona | null,
  userName?: string | null,
  openingScene?: string | null,
) => {
  let culturalPreset = null;
  if (culturalPresetId) {
    culturalPreset = getCulturalPresetById(culturalPresetId);
    if (!culturalPreset) {
      console.warn(`[Cultural Preset] Invalid preset ID "${culturalPresetId}" - no cultural overlay will be applied`);
    }
  }
  const systemPrompt = getBlueprintPrompt(blueprint, language, culturalPreset, accent, researchData, personaOverlay, avatarName, scenarioCounterPersona, userName, openingScene);
  
  // ============================================================
  // DEBUG: OpenAI Realtime Agent - Blueprint Path
  // ============================================================
  console.log("=".repeat(80));
  console.log("[OpenAI Realtime] AGENT CREATION - createRealtimeAgentFromBlueprint");
  console.log("=".repeat(80));
  console.log("[OpenAI Realtime] Voice:", voice);
  console.log("[OpenAI Realtime] Language:", language);
  console.log("[OpenAI Realtime] Cultural Preset:", culturalPreset?.id || "none");
  console.log("[OpenAI Realtime] Accent:", accent || "default");
  console.log("[OpenAI Realtime] Has Research Data:", !!researchData, researchData ? `(${researchData.length} chars)` : "");
  console.log("[OpenAI Realtime] Has Persona Overlay:", !!personaOverlay, personaOverlay?.userRoleTitle || "");
  console.log("[OpenAI Realtime] Avatar Name:", avatarName || "not provided");
  console.log("[OpenAI Realtime] User Name:", userName || "not provided");
  console.log("[OpenAI Realtime] Opening Scene:", openingScene ? "yes" : "no");
  console.log("[OpenAI Realtime] Has Scenario Counter-Persona:", !!scenarioCounterPersona);
  if (scenarioCounterPersona) {
    console.log("[OpenAI Realtime] Scenario Counter-Persona Role:", scenarioCounterPersona.role);
    console.log("[OpenAI Realtime] Scenario Counter-Persona Triggers:", scenarioCounterPersona.triggers?.join(", ") || "none");
    console.log("[OpenAI Realtime] Scenario Counter-Persona Cares About:", scenarioCounterPersona.caresAbout);
  }
  console.log("-".repeat(80));
  console.log("[OpenAI Realtime] BLUEPRINT:", JSON.stringify(blueprint, null, 2));
  console.log("-".repeat(80));
  console.log("[OpenAI Realtime] FULL SYSTEM PROMPT:");
  console.log("-".repeat(80));
  console.log(systemPrompt);
  console.log("=".repeat(80));
  console.log("[OpenAI Realtime] System Prompt Length:", systemPrompt.length, "chars");
  console.log("=".repeat(80));
  
  return new RealtimeAgent({
    name: "chatAgent",
    voice: voice,
    instructions: systemPrompt,
    tools: [],
  });
};

export default chatRoleplayScenario;
