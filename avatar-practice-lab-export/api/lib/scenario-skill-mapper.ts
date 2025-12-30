import OpenAI from "openai";
import { Pool } from "pg";
import { trackOpenAIUsage } from "../utils/api-usage-tracker.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SkillMappingCandidate {
  skillId: number;
  skillName: string;
  confidenceScore: number;
  rationale: string;
  relevantDimensions: string[];
}

export interface ScenarioMappingResult {
  customScenarioId: number;
  mappings: SkillMappingCandidate[];
  unmappedReason?: string;
}

interface SkillCatalogEntry {
  id: number;
  name: string;
  description: string;
  definition: string;
  frameworkMapping: string | null;
  assessmentDimensions: string | null;
  category: string | null;
}

const SkillMappingResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mappings", "unmappedReason"],
  properties: {
    mappings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skillId", "skillName", "confidenceScore", "rationale", "relevantDimensions"],
        properties: {
          skillId: { type: "number", description: "The ID of the matched skill from the catalog" },
          skillName: { type: "string", description: "Name of the matched skill" },
          confidenceScore: { 
            type: "number", 
            minimum: 0, 
            maximum: 1,
            description: "Confidence in the mapping (0.0 to 1.0)" 
          },
          rationale: { 
            type: "string", 
            description: "Brief explanation of why this skill matches the scenario" 
          },
          relevantDimensions: { 
            type: "array", 
            items: { type: "string" },
            description: "Which assessment dimensions are most relevant" 
          },
        },
      },
    },
    unmappedReason: {
      type: ["string", "null"],
      description: "If no skills match well, explain why and suggest what new skill might be needed. Null if skills were matched."
    }
  },
};

function buildMappingPrompt(
  scenarioTitle: string,
  scenarioDescription: string,
  scenarioBlueprint: any,
  skillCatalog: SkillCatalogEntry[]
): string {
  const catalogText = skillCatalog.map(skill => `
## Skill ID ${skill.id}: ${skill.name}
- Category: ${skill.category || "General"}
- Definition: ${skill.definition}
- Framework: ${skill.frameworkMapping || "None specified"}
- Assessment Dimensions: ${skill.assessmentDimensions || "General assessment"}
`).join("\n");

  const blueprintContext = scenarioBlueprint ? `
## Scenario Blueprint Details:
- Goal: ${scenarioBlueprint.conversationGoal || "Not specified"}
- Persona: ${scenarioBlueprint.personaDetails || "Not specified"}
- Context: ${scenarioBlueprint.contextBackground || "Not specified"}
- Objectives: ${Array.isArray(scenarioBlueprint.objectives) ? scenarioBlueprint.objectives.join(", ") : "Not specified"}
` : "";

  return `You are an expert learning designer matching practice scenarios to communication skill frameworks.

Analyze this custom practice scenario and identify which skills from our catalog it best helps develop.

## Custom Scenario:
Title: ${scenarioTitle}
User Description: ${scenarioDescription}
${blueprintContext}

## Available Skills Catalog:
${catalogText}

## Instructions:
1. Identify all skills (1-3 maximum) that this scenario would help practice
2. Assign a confidence score (0.0-1.0) for each mapping:
   - 0.9-1.0: Direct, primary skill match
   - 0.7-0.89: Strong secondary skill match
   - 0.5-0.69: Moderate relevance
   - Below 0.5: Don't include unless it's the only match
3. Explain WHY each skill matches based on scenario content
4. List which dimensions of the skill would be practiced
5. If no skills match well (all below 0.5), explain what new skill category might be needed

Prioritize quality over quantity. Only map skills that are genuinely practiced in this scenario.

Return your analysis as JSON matching the provided schema.`;
}

export async function analyzeScenarioForSkills(
  customScenarioId: number,
  title: string,
  description: string,
  blueprint: any,
  pool: Pool
): Promise<ScenarioMappingResult> {
  const skillsResult = await pool.query<SkillCatalogEntry>(`
    SELECT 
      id, name, description, definition, 
      framework_mapping as "frameworkMapping",
      assessment_dimensions as "assessmentDimensions",
      category
    FROM skills 
    WHERE is_active = true
    ORDER BY name
  `);

  const skillCatalog = skillsResult.rows;

  if (skillCatalog.length === 0) {
    return {
      customScenarioId,
      mappings: [],
      unmappedReason: "No skills available in the catalog"
    };
  }

  const prompt = buildMappingPrompt(title, description, blueprint, skillCatalog);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert learning designer. Analyze scenarios and map them to communication skills based on established frameworks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "skill_mapping_response",
          strict: true,
          schema: SkillMappingResponseSchema,
        },
      },
      temperature: 0.3,
    });

    // Track OpenAI usage
    const usage = response.usage;
    if (usage) {
      await trackOpenAIUsage("scenario_skill_mapping", "gpt-4o", usage.prompt_tokens || 0, usage.completion_tokens || 0);
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content) as {
      mappings: SkillMappingCandidate[];
      unmappedReason?: string;
    };

    return {
      customScenarioId,
      mappings: parsed.mappings.filter(m => m.confidenceScore >= 0.5),
      unmappedReason: parsed.unmappedReason,
    };
  } catch (error) {
    console.error("Error analyzing scenario for skills:", error);
    return {
      customScenarioId,
      mappings: [],
      unmappedReason: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function saveScenarioSkillMappings(
  result: ScenarioMappingResult,
  pool: Pool
): Promise<void> {
  await pool.query(
    "DELETE FROM custom_scenario_skill_mappings WHERE custom_scenario_id = $1",
    [result.customScenarioId]
  );

  for (const mapping of result.mappings) {
    await pool.query(`
      INSERT INTO custom_scenario_skill_mappings 
        (custom_scenario_id, skill_id, confidence_score, ai_rationale, dimension_weights, is_confirmed)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      result.customScenarioId,
      mapping.skillId,
      mapping.confidenceScore,
      mapping.rationale,
      JSON.stringify({ relevantDimensions: mapping.relevantDimensions }),
      mapping.confidenceScore >= 0.8,
    ]);
  }
}

export async function mapCustomScenarioToSkills(
  customScenarioId: number,
  title: string,
  description: string,
  blueprint: any,
  pool: Pool
): Promise<ScenarioMappingResult> {
  const result = await analyzeScenarioForSkills(
    customScenarioId,
    title,
    description,
    blueprint,
    pool
  );

  await saveScenarioSkillMappings(result, pool);

  return result;
}

export async function getSkillMappingsForCustomScenario(
  customScenarioId: number,
  pool: Pool
): Promise<Array<{
  skillId: number;
  skillName: string;
  confidenceScore: number;
  rationale: string;
  isConfirmed: boolean;
  frameworkMapping: string | null;
}>> {
  const result = await pool.query(`
    SELECT 
      cssm.skill_id as "skillId",
      s.name as "skillName",
      cssm.confidence_score as "confidenceScore",
      cssm.ai_rationale as "rationale",
      cssm.is_confirmed as "isConfirmed",
      s.framework_mapping as "frameworkMapping"
    FROM custom_scenario_skill_mappings cssm
    JOIN skills s ON cssm.skill_id = s.id
    WHERE cssm.custom_scenario_id = $1
    ORDER BY cssm.confidence_score DESC
  `, [customScenarioId]);

  return result.rows;
}
