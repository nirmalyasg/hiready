import OpenAI from "openai";
import { Pool } from "pg";
import { getSkillsForScenario, getSkillsForCustomScenario, getSkillWithFramework, SkillWithFramework } from "./skill-framework-import.js";
import { trackOpenAIUsage } from "../utils/api-usage-tracker.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DimensionScore {
  dimensionName: string;
  score: number;
  maxScore: number;
  evidence: string;
  frameworkReference: string;
}

export interface SkillAssessmentResult {
  skillId: number;
  skillName: string;
  frameworkUsed: string;
  overallScore: number;
  dimensions: DimensionScore[];
  strengthDimensions: string[];
  improvementDimensions: string[];
  assessmentNotes: string;
}

export interface PersonaOverlay {
  userRoleTitle: string;
  authorityAndConstraints: string[];
  successCriteria: string[];
  commonMistakes: string[];
  toneGuidance: string;
  avatarPushbackLevel: "low" | "medium" | "high";
}

export interface CounterPersona {
  role: string;
  caresAbout: string;
  pressureResponse: "pushes_back" | "withdraws" | "escalates" | "complies" | "challenges_logic";
  triggers: string[];
}

export interface PersonaFitResult {
  persona: string;
  mistakesObserved: string[];
  authorityUsage: string;
  tailoredAdvice: string;
  successCriteriaMet: string[];
  overallPersonaFit: number;
}

const SkillDimensionAssessmentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["skillAssessments"],
  properties: {
    skillAssessments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "skillId",
          "skillName",
          "frameworkUsed",
          "overallScore",
          "dimensions",
          "strengthDimensions",
          "improvementDimensions",
          "assessmentNotes",
        ],
        properties: {
          skillId: { type: "number" },
          skillName: { type: "string" },
          frameworkUsed: { type: "string" },
          overallScore: { type: "number" },
          dimensions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["dimensionName", "score", "maxScore", "evidence", "frameworkReference"],
              properties: {
                dimensionName: { type: "string" },
                score: { type: "number" },
                maxScore: { type: "number" },
                evidence: { type: "string" },
                frameworkReference: { type: "string" },
              },
            },
          },
          strengthDimensions: { type: "array", items: { type: "string" } },
          improvementDimensions: { type: "array", items: { type: "string" } },
          assessmentNotes: { type: "string" },
        },
      },
    },
    personaFit: {
      type: "object",
      additionalProperties: false,
      required: ["persona", "mistakesObserved", "authorityUsage", "tailoredAdvice", "successCriteriaMet", "overallPersonaFit"],
      properties: {
        persona: { type: "string" },
        mistakesObserved: { type: "array", items: { type: "string" } },
        authorityUsage: { type: "string" },
        tailoredAdvice: { type: "string" },
        successCriteriaMet: { type: "array", items: { type: "string" } },
        overallPersonaFit: { type: "number" },
      },
    },
  },
};

const SkillDimensionAssessmentSchemaWithPersona = {
  type: "object",
  additionalProperties: false,
  required: ["skillAssessments", "personaFit"],
  properties: {
    skillAssessments: SkillDimensionAssessmentSchema.properties.skillAssessments,
    personaFit: SkillDimensionAssessmentSchema.properties.personaFit,
  },
};

function buildSkillAssessmentPrompt(
  skills: SkillWithFramework[], 
  conversationText: string,
  personaOverlay?: PersonaOverlay | null,
  counterPersona?: CounterPersona | null
): string {
  const skillsContext = skills
    .map((skill) => {
      const dimensions = skill.assessmentDimensions.length > 0 
        ? skill.assessmentDimensions.join("; ") 
        : "General skill assessment";
      return `
## Skill: ${skill.name} (ID: ${skill.id})
- Definition: ${skill.definition}
- Framework: ${skill.frameworkMapping || "General assessment"}
- Assessment Dimensions: ${dimensions}
- Scoring Approach: Score each dimension 0-5 using behavioral rubric (0=not observed, 5=exemplary)
`;
    })
    .join("\n");

  const counterPersonaContext = counterPersona ? `
## Avatar Behavior Context (Counter-Persona)
The avatar was playing: **${counterPersona.role}**
The avatar cared about: ${counterPersona.caresAbout}
The avatar's pressure response: ${counterPersona.pressureResponse.replace(/_/g, ' ')}

### Avatar's Trigger Behaviors
The avatar was programmed to become MORE difficult/resistant when the user exhibited these behaviors:
${counterPersona.triggers.map(t => `- ${t}`).join("\n")}

### Trigger-Based Feedback Instructions
When providing feedback, specifically note:
1. Did the user AVOID these triggering behaviors? (positive feedback)
2. Did the user exhibit any of these triggers? (areas for improvement)
3. How did the user adapt when the avatar pushed back?
4. Provide specific quotes/examples where triggers were avoided or activated
` : "";

  const personaContext = personaOverlay ? `
## User's Role Context (Persona Overlay)
The user was practicing as a **${personaOverlay.userRoleTitle}**. Evaluate their performance considering these role-specific expectations:

### Authority & Constraints for ${personaOverlay.userRoleTitle}:
${personaOverlay.authorityAndConstraints.map(c => `- ${c}`).join("\n")}

### Success Criteria for ${personaOverlay.userRoleTitle}:
${personaOverlay.successCriteria.map(c => `- ${c}`).join("\n")}

### Common Mistakes to Watch For:
${personaOverlay.commonMistakes.map(m => `- ${m}`).join("\n")}

### Expected Tone:
${personaOverlay.toneGuidance}

When assessing, consider:
1. Did the user operate within their role's authority boundaries?
2. Did they achieve the success criteria appropriate for their level?
3. Did they avoid the common mistakes for their role level?
4. Was their tone appropriate for someone at the ${personaOverlay.userRoleTitle} level?
` : "";

  const personaFitInstructions = personaOverlay ? `
7. Assess persona fit: How well did the user perform within the ${personaOverlay.userRoleTitle} role context?
   - Identify which common mistakes they made (if any)
   - Evaluate how they used (or overstepped) their authority
   - Provide tailored advice specific to their role level
   - List which success criteria they achieved
   - Score overall persona fit 1-5 (5 = perfectly aligned with role expectations)
` : "";

  return `You are an expert coach and assessor evaluating a practice conversation session.
  
Analyze the following conversation transcript and assess the user's demonstration of specific skills based on established frameworks.
${personaContext}${counterPersonaContext}
## Skills to Assess:
${skillsContext}

## Scoring Guidelines:
For each dimension, use this rubric:
- 0: Not observed - The behavior was not demonstrated
- 1: Emerging - Minimal or inconsistent demonstration
- 2: Developing - Some evidence but with significant gaps
- 3: Competent - Adequate demonstration meeting basic expectations
- 4: Proficient - Strong demonstration with only minor gaps
- 5: Exemplary - Outstanding demonstration, could serve as a model

## Instructions:
1. For each skill, score all its assessment dimensions (0-5)
2. Provide specific evidence from the transcript for each score
3. Reference the framework principles when explaining scores
4. Calculate overall skill score as the average of dimension scores
5. Identify which dimensions are strengths (score >= 4) and which need improvement (score <= 2)
6. Provide actionable notes for development${personaFitInstructions}

## Conversation Transcript:
${conversationText}

Return your assessment as JSON matching the provided schema.`;
}

export interface SkillAssessmentWithPersona {
  skillAssessments: SkillAssessmentResult[];
  personaFit?: PersonaFitResult;
}

export async function generateSkillDimensionAssessment(
  conversationText: string,
  skills: SkillWithFramework[],
  personaOverlay?: PersonaOverlay | null,
  counterPersona?: CounterPersona | null
): Promise<SkillAssessmentWithPersona> {
  if (skills.length === 0) {
    return { skillAssessments: [] };
  }

  const prompt = buildSkillAssessmentPrompt(skills, conversationText, personaOverlay, counterPersona);
  const usePersonaSchema = !!personaOverlay;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "skill_dimension_assessment",
          strict: true,
          schema: usePersonaSchema ? SkillDimensionAssessmentSchemaWithPersona : SkillDimensionAssessmentSchema,
        },
      },
      messages: [
        {
          role: "system",
          content: "You are an expert performance coach and assessor. Output ONLY valid JSON matching the schema. No markdown or extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const usage = completion.usage;
    if (usage) {
      await trackOpenAIUsage("skill_assessment", "gpt-4o", usage.prompt_tokens || 0, usage.completion_tokens || 0);
    }

    const msg = completion.choices[0]?.message?.content?.trim();
    if (!msg) {
      console.error("No skill assessment response generated");
      return { skillAssessments: [] };
    }

    const parsed = JSON.parse(msg);
    return {
      skillAssessments: parsed.skillAssessments || [],
      personaFit: parsed.personaFit || undefined,
    };
  } catch (error) {
    console.error("Error generating skill dimension assessment:", error);
    return { skillAssessments: [] };
  }
}

export async function saveSkillDimensionAssessments(
  pool: Pool,
  sessionId: number,
  assessments: SkillAssessmentResult[]
): Promise<void> {
  for (const assessment of assessments) {
    try {
      await pool.query(
        `INSERT INTO skill_assessment_summary 
         (session_id, skill_id, overall_skill_score, framework_used, 
          assessment_notes, strength_dimensions, improvement_dimensions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          sessionId,
          assessment.skillId,
          assessment.overallScore,
          assessment.frameworkUsed,
          assessment.assessmentNotes,
          JSON.stringify(assessment.strengthDimensions),
          JSON.stringify(assessment.improvementDimensions),
        ]
      );

      for (const dim of assessment.dimensions) {
        await pool.query(
          `INSERT INTO skill_dimension_assessments
           (session_id, skill_id, dimension_name, score, max_score, evidence, framework_reference)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            sessionId,
            assessment.skillId,
            dim.dimensionName,
            dim.score,
            dim.maxScore,
            dim.evidence,
            dim.frameworkReference,
          ]
        );
      }
    } catch (error) {
      console.error(`Error saving assessment for skill ${assessment.skillId}:`, error);
    }
  }
}

export async function getSkillAssessmentsForSession(
  pool: Pool,
  sessionId: number
): Promise<{ summary: any[]; dimensions: any[] }> {
  if (!sessionId || sessionId <= 0) {
    return { summary: [], dimensions: [] };
  }
  
  try {
    const summaryResult = await pool.query(
      `SELECT sas.*, s.name as skill_name, s.framework_mapping
       FROM skill_assessment_summary sas
       JOIN skills s ON sas.skill_id = s.id
       WHERE sas.session_id = $1`,
      [sessionId]
    );

    const dimensionsResult = await pool.query(
      `SELECT sda.*, s.name as skill_name
       FROM skill_dimension_assessments sda
       JOIN skills s ON sda.skill_id = s.id
       WHERE sda.session_id = $1
       ORDER BY sda.skill_id, sda.dimension_name`,
      [sessionId]
    );

    return {
      summary: summaryResult.rows,
      dimensions: dimensionsResult.rows,
    };
  } catch (error) {
    console.error("Error fetching skill assessments for session:", error);
    return { summary: [], dimensions: [] };
  }
}

export async function performSkillAssessmentForSession(
  pool: Pool,
  sessionId: number,
  scenarioId: number | null,
  conversationText: string,
  customScenarioId?: number | null,
  isImpromptuSession?: boolean,
  personaOverlay?: PersonaOverlay | null,
  counterPersona?: CounterPersona | null
): Promise<SkillAssessmentWithPersona> {
  if (!sessionId || sessionId <= 0) {
    console.log("No valid sessionId provided, skipping skill dimension assessment");
    return { skillAssessments: [] };
  }

  if (!conversationText || conversationText.trim().length === 0) {
    console.log("No conversation text provided, skipping skill dimension assessment");
    return { skillAssessments: [] };
  }

  let skills: SkillWithFramework[] = [];

  try {
    if (isImpromptuSession) {
      console.log("Impromptu session detected - using Impromptu Communication skill (ID 105)");
      const impromptuSkill = await getSkillWithFramework(pool, 105);
      if (impromptuSkill) {
        skills = [impromptuSkill];
        console.log("Found impromptu communication skill for assessment");
      } else {
        console.warn("Impromptu skill (ID 105) not found in database");
      }
    }
    
    if (skills.length === 0 && customScenarioId && customScenarioId > 0) {
      skills = await getSkillsForCustomScenario(pool, customScenarioId);
      if (skills.length > 0) {
        console.log(`Found ${skills.length} skills from custom scenario ${customScenarioId}`);
      }
    }
    
    if (skills.length === 0 && scenarioId && scenarioId > 0) {
      skills = await getSkillsForScenario(pool, scenarioId);
    }
  } catch (error) {
    console.error("Error fetching skills for scenario:", error);
    return { skillAssessments: [] };
  }

  if (skills.length === 0) {
    console.log("No skills found for scenario, skipping skill dimension assessment");
    return { skillAssessments: [] };
  }

  const skillsWithFrameworks = skills.filter(
    (s) => s.frameworkMapping && s.assessmentDimensions.length > 0
  );

  if (skillsWithFrameworks.length === 0) {
    console.log("No skills with framework data found, skipping skill dimension assessment");
    return { skillAssessments: [] };
  }

  console.log(`Performing skill dimension assessment for ${skillsWithFrameworks.length} skills${personaOverlay ? ` with persona overlay: ${personaOverlay.userRoleTitle}` : ""}${counterPersona ? ` with counter-persona: ${counterPersona.role}` : ""}`);

  const result = await generateSkillDimensionAssessment(conversationText, skillsWithFrameworks, personaOverlay, counterPersona);

  if (result.skillAssessments.length > 0) {
    await saveSkillDimensionAssessments(pool, sessionId, result.skillAssessments);
    console.log(`Saved ${result.skillAssessments.length} skill assessments for session ${sessionId}`);
  }

  return result;
}
