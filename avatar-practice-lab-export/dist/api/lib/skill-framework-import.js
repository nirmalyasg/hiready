import * as fs from "fs";
export function parseCSV(csvContent) {
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const skills = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        const values = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === "," && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ""));
                current = "";
            }
            else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ""));
        const skill = {};
        headers.forEach((header, idx) => {
            skill[header] = values[idx] || "";
        });
        if (skill.id && skill.name) {
            skills.push({
                id: parseInt(skill.id),
                name: skill.name,
                description: skill.description || "",
                definition: skill.definition || "",
                framework_mapping: skill.framework_mapping || "",
                reference_source: skill.reference_source || "",
                assessment_dimensions: skill.assessment_dimensions || "",
                scoring_model_logic: skill.scoring_model_logic || "",
            });
        }
    }
    return skills;
}
export async function importSkillFrameworks(pool, csvFilePath) {
    const errors = [];
    let updated = 0;
    try {
        const csvContent = fs.readFileSync(csvFilePath, "utf-8");
        const skills = parseCSV(csvContent);
        for (const skill of skills) {
            try {
                const result = await pool.query(`UPDATE skills 
           SET framework_mapping = $1,
               reference_source = $2,
               assessment_dimensions = $3,
               scoring_model_logic = $4,
               updated_at = NOW()
           WHERE id = $5`, [
                    skill.framework_mapping,
                    skill.reference_source,
                    skill.assessment_dimensions,
                    skill.scoring_model_logic,
                    skill.id,
                ]);
                if (result.rowCount && result.rowCount > 0) {
                    updated++;
                }
                else {
                    errors.push(`Skill ID ${skill.id} not found in database`);
                }
            }
            catch (err) {
                errors.push(`Error updating skill ${skill.id}: ${err.message}`);
            }
        }
    }
    catch (err) {
        errors.push(`Error reading CSV file: ${err.message}`);
    }
    return { updated, errors };
}
export function parseDimensions(dimensionsString) {
    if (!dimensionsString)
        return [];
    return dimensionsString
        .split(";")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
}
export async function getSkillWithFramework(pool, skillId) {
    const result = await pool.query(`SELECT id, name, description, definition, 
            framework_mapping, reference_source, 
            assessment_dimensions, scoring_model_logic
     FROM skills WHERE id = $1`, [skillId]);
    if (result.rows.length === 0)
        return null;
    const row = result.rows[0];
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        definition: row.definition,
        frameworkMapping: row.framework_mapping,
        referenceSource: row.reference_source,
        assessmentDimensions: parseDimensions(row.assessment_dimensions),
        scoringModelLogic: row.scoring_model_logic,
    };
}
export async function getSkillsForScenario(pool, scenarioId) {
    if (!scenarioId || scenarioId <= 0) {
        return [];
    }
    try {
        const result = await pool.query(`SELECT s.id, s.name, s.description, s.definition,
              s.framework_mapping, s.reference_source,
              s.assessment_dimensions, s.scoring_model_logic
       FROM skills s
       JOIN scenario_skills ss ON s.id = ss.skill_id
       WHERE ss.scenario_id = $1`, [scenarioId]);
        return result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            definition: row.definition,
            frameworkMapping: row.framework_mapping,
            referenceSource: row.reference_source,
            assessmentDimensions: parseDimensions(row.assessment_dimensions),
            scoringModelLogic: row.scoring_model_logic,
        }));
    }
    catch (error) {
        console.error("Error fetching skills for scenario:", error);
        return [];
    }
}
export async function getSkillsForCustomScenario(pool, customScenarioId) {
    if (!customScenarioId || customScenarioId <= 0) {
        return [];
    }
    try {
        const result = await pool.query(`SELECT s.id, s.name, s.description, s.definition,
              s.framework_mapping, s.reference_source,
              s.assessment_dimensions, s.scoring_model_logic
       FROM skills s
       JOIN custom_scenario_skill_mappings cssm ON s.id = cssm.skill_id
       WHERE cssm.custom_scenario_id = $1
         AND (cssm.is_confirmed = true OR cssm.confidence_score >= 0.7)
       ORDER BY cssm.confidence_score DESC`, [customScenarioId]);
        return result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            definition: row.definition,
            frameworkMapping: row.framework_mapping,
            referenceSource: row.reference_source,
            assessmentDimensions: parseDimensions(row.assessment_dimensions),
            scoringModelLogic: row.scoring_model_logic,
        }));
    }
    catch (error) {
        console.error("Error fetching skills for custom scenario:", error);
        return [];
    }
}
