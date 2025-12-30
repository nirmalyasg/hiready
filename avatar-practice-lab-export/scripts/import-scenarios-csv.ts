import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  
  let currentRow = "";
  
  for (let i = 1; i < lines.length; i++) {
    currentRow += (currentRow ? '\n' : '') + lines[i];
    
    const quoteCount = (currentRow.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      const values = parseCSVLine(currentRow);
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = values[idx] || "";
      });
      rows.push(row);
      currentRow = "";
    }
  }
  
  return rows;
}

async function importScenarios() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("Starting scenario import from CSV...\n");

    const csvPath = path.join(__dirname, "..", "..", "attached_assets", "scenarios_rewrite_outputs1_1766479687272.csv");
    
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at: ${csvPath}`);
      process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, "utf8");
    const rows = parseCSV(csvContent);
    
    console.log(`Found ${rows.length} rows in CSV\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      const id = parseInt(row.id);
      
      if (isNaN(id)) {
        console.log(`  ⚠ Skipping row with invalid id: ${row.id}`);
        skipped++;
        continue;
      }

      let counterPersona = null;
      if (row.framework_counter_persona) {
        try {
          counterPersona = JSON.parse(row.framework_counter_persona);
        } catch (e) {
          console.log(`  ⚠ Could not parse counter_persona for id ${id}, skipping field`);
        }
      }

      let personaOverlays = null;
      if (row.persona_overlays) {
        try {
          personaOverlays = JSON.parse(row.persona_overlays);
        } catch (e) {
          console.log(`  ⚠ Could not parse persona_overlays for id ${id}, skipping field`);
        }
      }

      const description = row.rewritten_description || row.description || null;
      const context = row.rewritten_context || row.context || null;
      const instructions = row.rewritten_instructions || row.instructions || null;
      const scenarioKey = row.scenario_key || null;
      const shortTitle = row.short_title || null;
      const displayTitle = row.display_title || null;
      
      // Convert comma-separated tags to JSON array
      let tags: string[] | null = null;
      if (row.tags && row.tags.trim()) {
        tags = row.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      }

      if (!counterPersona && !description && !context && !instructions && !scenarioKey && !shortTitle && !displayTitle && (!tags || tags.length === 0) && !personaOverlays) {
        skipped++;
        continue;
      }

      try {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (counterPersona) {
          setClauses.push(`counter_persona = $${paramIndex++}`);
          values.push(JSON.stringify(counterPersona));
        }
        if (personaOverlays) {
          setClauses.push(`persona_overlays = $${paramIndex++}`);
          values.push(JSON.stringify(personaOverlays));
        }
        if (description) {
          setClauses.push(`description = $${paramIndex++}`);
          values.push(description);
        }
        if (context) {
          setClauses.push(`context = $${paramIndex++}`);
          values.push(context);
        }
        if (instructions) {
          setClauses.push(`instructions = $${paramIndex++}`);
          values.push(instructions);
        }
        if (scenarioKey) {
          setClauses.push(`scenario_key = $${paramIndex++}`);
          values.push(scenarioKey);
        }
        if (shortTitle) {
          setClauses.push(`short_title = $${paramIndex++}`);
          values.push(shortTitle);
        }
        if (displayTitle) {
          setClauses.push(`display_title = $${paramIndex++}`);
          values.push(displayTitle);
        }
        if (tags && tags.length > 0) {
          setClauses.push(`tags = $${paramIndex++}`);
          values.push(JSON.stringify(tags));
        }

        values.push(id);

        const query = `UPDATE scenarios SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;
        
        const result = await pool.query(query, values);
        
        if (result.rowCount && result.rowCount > 0) {
          console.log(`  ✓ Updated scenario id ${id}`);
          updated++;
        } else {
          console.log(`  ⚠ Scenario id ${id} not found in database`);
          skipped++;
        }
      } catch (err: any) {
        console.error(`  ✗ Error updating id ${id}:`, err.message);
        errors++;
      }
    }

    console.log(`\n=== Import Summary ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total rows: ${rows.length}`);

  } catch (error) {
    console.error("\n✗ Import failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importScenarios();
