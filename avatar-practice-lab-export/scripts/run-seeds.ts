import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeds() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("Starting database seeding...\n");

    const seedsDir = path.join(__dirname, "..", "database", "seeds");
    
    const seedFiles = [
      "init.sql",
      "cultural_presets.sql",
      "role_archetypes.sql",
      "role_interview_structure_defaults.sql",
      "companies_india.sql",
    ];

    console.log(`Running ${seedFiles.length} seed files:\n`);
    seedFiles.forEach((file) => console.log(`  - ${file}`));
    console.log("");

    for (const file of seedFiles) {
      const filePath = path.join(seedsDir, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠ ${file} not found, skipping...`);
        continue;
      }

      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`Running seed: ${file}...`);

      try {
        await pool.query(sql);
        console.log(`  ✓ ${file} completed successfully`);
      } catch (err: any) {
        if (err.message.includes("duplicate key") || err.message.includes("already exists")) {
          console.log(`  ⚠ ${file} - Data already exists, continuing...`);
        } else {
          console.error(`  ✗ ${file} failed:`, err.message);
          throw err;
        }
      }
    }

    console.log("\n✓ All seeds completed successfully!");
  } catch (error) {
    console.error("\n✗ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeeds();
