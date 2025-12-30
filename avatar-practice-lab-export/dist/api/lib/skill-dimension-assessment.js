import OpenAI from "openai";
import { getSkillsForScenario, getSkillsForCustomScenario } from "./skill-framework-import.js";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    },
};
function buildSkillAssessmentPrompt(skills, conversationText) {
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
    return `You are an expert coach and assessor evaluating a practice conversation session.
  
Analyze the following conversation transcript and assess the user's demonstration of specific skills based on established frameworks.

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
6. Provide actionable notes for development

## Conversation Transcript:
${conversationText}

Return your assessment as JSON matching the provided schema.`;
}
export async function generateSkillDimensionAssessment(conversationText, skills) {
    if (skills.length === 0) {
        return [];
    }
    const prompt = buildSkillAssessmentPrompt(skills, conversationText);
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.1,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "skill_dimension_assessment",
                    strict: true,
                    schema: SkillDimensionAssessmentSchema,
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
        const msg = completion.choices[0]?.message?.content?.trim();
        if (!msg) {
            console.error("No skill assessment response generated");
            return [];
        }
        const parsed = JSON.parse(msg);
        return parsed.skillAssessments || [];
    }
    catch (error) {
        console.error("Error generating skill dimension assessment:", error);
        return [];
    }
}
export async function saveSkillDimensionAssessments(pool, sessionId, assessments) {
    for (const assessment of assessments) {
        try {
            await pool.query(`INSERT INTO skill_assessment_summary 
         (session_id, skill_id, overall_skill_score, framework_used, 
          assessment_notes, strength_dimensions, improvement_dimensions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`, [
                sessionId,
                assessment.skillId,
                assessment.overallScore,
                assessment.frameworkUsed,
                assessment.assessmentNotes,
                JSON.stringify(assessment.strengthDimensions),
                JSON.stringify(assessment.improvementDimensions),
            ]);
            for (const dim of assessment.dimensions) {
                await pool.query(`INSERT INTO skill_dimension_assessments
           (session_id, skill_id, dimension_name, score, max_score, evidence, framework_reference)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    sessionId,
                    assessment.skillId,
                    dim.dimensionName,
                    dim.score,
                    dim.maxScore,
                    dim.evidence,
                    dim.frameworkReference,
                ]);
            }
        }
        catch (error) {
            console.error(`Error saving assessment for skill ${assessment.skillId}:`, error);
        }
    }
}
export async function getSkillAssessmentsForSession(pool, sessionId) {
    if (!sessionId || sessionId <= 0) {
        return { summary: [], dimensions: [] };
    }
    try {
        const summaryResult = await pool.query(`SELECT sas.*, s.name as skill_name, s.framework_mapping
       FROM skill_assessment_summary sas
       JOIN skills s ON sas.skill_id = s.id
       WHERE sas.session_id = $1`, [sessionId]);
        const dimensionsResult = await pool.query(`SELECT sda.*, s.name as skill_name
       FROM skill_dimension_assessments sda
       JOIN skills s ON sda.skill_id = s.id
       WHERE sda.session_id = $1
       ORDER BY sda.skill_id, sda.dimension_name`, [sessionId]);
        return {
            summary: summaryResult.rows,
            dimensions: dimensionsResult.rows,
        };
    }
    catch (error) {
        console.error("Error fetching skill assessments for session:", error);
        return { summary: [], dimensions: [] };
    }
}
export async function performSkillAssessmentForSession(pool, sessionId, scenarioId, conversationText, customScenarioId) {
    if (!sessionId || sessionId <= 0) {
        console.log("No valid sessionId provided, skipping skill dimension assessment");
        return [];
    }
    if (!conversationText || conversationText.trim().length === 0) {
        console.log("No conversation text provided, skipping skill dimension assessment");
        return [];
    }
    let skills = [];
    try {
        // First try to get skills from custom scenario mappings
        if (customScenarioId && customScenarioId > 0) {
            skills = await getSkillsForCustomScenario(pool, customScenarioId);
            if (skills.length > 0) {
                console.log(`Found ${skills.length} skills from custom scenario ${customScenarioId}`);
            }
        }
        // Fall back to regular scenario skills if no custom scenario skills found
        if (skills.length === 0 && scenarioId && scenarioId > 0) {
            skills = await getSkillsForScenario(pool, scenarioId);
        }
    }
    catch (error) {
        console.error("Error fetching skills for scenario:", error);
        return [];
    }
    if (skills.length === 0) {
        console.log("No skills found for scenario, skipping skill dimension assessment");
        return [];
    }
    const skillsWithFrameworks = skills.filter((s) => s.frameworkMapping && s.assessmentDimensions.length > 0);
    if (skillsWithFrameworks.length === 0) {
        console.log("No skills with framework data found, skipping skill dimension assessment");
        return [];
    }
    console.log(`Performing skill dimension assessment for ${skillsWithFrameworks.length} skills`);
    const assessments = await generateSkillDimensionAssessment(conversationText, skillsWithFrameworks);
    if (assessments.length > 0) {
        await saveSkillDimensionAssessments(pool, sessionId, assessments);
        console.log(`Saved ${assessments.length} skill assessments for session ${sessionId}`);
    }
    return assessments;
}
