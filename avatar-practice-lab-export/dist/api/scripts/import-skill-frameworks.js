import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
function parseCSV(csvContent) {
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
                framework_mapping: skill.framework_mapping || "",
                reference_source: skill.reference_source || "",
                assessment_dimensions: skill.assessment_dimensions || "",
                scoring_model_logic: skill.scoring_model_logic || "",
            });
        }
    }
    return skills;
}
async function importSkillFrameworks() {
    const csvPath = path.join(process.cwd(), "../attached_assets/skills_with_frameworks_dimensions_scoring_1765864305071.csv");
    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found at:", csvPath);
        process.exit(1);
    }
    console.log("Reading CSV file...");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const skills = parseCSV(csvContent);
    console.log(`Found ${skills.length} skills to update`);
    let updated = 0;
    let errors = [];
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
                console.log(`Updated skill ${skill.id}: ${skill.name}`);
            }
            else {
                errors.push(`Skill ID ${skill.id} (${skill.name}) not found in database`);
            }
        }
        catch (err) {
            errors.push(`Error updating skill ${skill.id}: ${err.message}`);
        }
    }
    console.log("\n=== Import Summary ===");
    console.log(`Total skills in CSV: ${skills.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors: ${errors.length}`);
    if (errors.length > 0) {
        console.log("\nErrors:");
        errors.forEach((e) => console.log(`  - ${e}`));
    }
    await pool.end();
}
importSkillFrameworks().catch(console.error);
