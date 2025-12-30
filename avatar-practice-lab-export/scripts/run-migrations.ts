import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("Starting database migrations...\n");

    const migrationsDir = path.join(__dirname, "..", "database", "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files:\n`);
    migrationFiles.forEach((file) => console.log(`  - ${file}`));
    console.log("");

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`Running migration: ${file}...`);

      try {
        await pool.query(sql);
        console.log(`  ✓ ${file} completed successfully`);
      } catch (err: any) {
        if (
          err.message.includes("already exists") ||
          err.message.includes("does not exist")
        ) {
          console.log(`  ⚠ ${file} - Some objects already exist, continuing...`);
        } else {
          console.error(`  ✗ ${file} failed:`, err.message);
          throw err;
        }
      }
    }

    console.log("\n✓ All migrations completed successfully!");
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
