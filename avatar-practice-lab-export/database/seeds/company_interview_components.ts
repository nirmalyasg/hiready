import { db } from "../../api/db.js";
import { companies } from "../../shared/schema.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

const CSV_PATH = path.join(process.cwd(), "../attached_assets/Top_100_India_Recruiters_Interview_Components_1767680339890.csv");

interface CompanyRow {
  name: string;
  sector: string;
  archetype: string;
  confidence: string;
  evidenceUrl: string;
  notes: string;
  aptitude: boolean;
  codingChallenge: boolean;
  technicalDsaSql: boolean;
  systemDesign: boolean;
  caseStudy: boolean;
  hrScreen: boolean;
  behavioral: boolean;
  hiringManager: boolean;
  groupDiscussion: boolean;
  panel: boolean;
  presentation: boolean;
}

function parseCSV(content: string): CompanyRow[] {
  const lines = content.split("\n").filter(l => l.trim());
  const header = lines[0];
  const rows = lines.slice(1);
  
  return rows.map(line => {
    const cols = line.split(",");
    return {
      name: cols[0]?.trim() || "",
      sector: cols[1]?.trim() || "",
      archetype: cols[2]?.trim() || "",
      confidence: cols[3]?.trim() || "Medium",
      evidenceUrl: cols[4]?.trim() || "",
      notes: cols[5]?.trim() || "",
      aptitude: cols[6]?.trim().toLowerCase() === "yes",
      codingChallenge: cols[7]?.trim().toLowerCase() === "yes",
      technicalDsaSql: cols[8]?.trim().toLowerCase() === "yes",
      systemDesign: cols[9]?.trim().toLowerCase() === "yes",
      caseStudy: cols[10]?.trim().toLowerCase() === "yes",
      hrScreen: cols[11]?.trim().toLowerCase() === "yes",
      behavioral: cols[12]?.trim().toLowerCase() === "yes",
      hiringManager: cols[13]?.trim().toLowerCase() === "yes",
      groupDiscussion: cols[14]?.trim().toLowerCase() === "yes",
      panel: cols[15]?.trim().toLowerCase() === "yes",
      presentation: cols[16]?.trim().toLowerCase() === "yes",
    };
  }).filter(r => r.name);
}

function mapArchetypeToDb(archetype: string): string {
  const mapping: Record<string, string> = {
    "IT Services (Mass hiring / Services)": "it_services",
    "IT Services (Services / Captive)": "it_services",
    "IT Services (Services / Consulting)": "it_services",
    "IT Services (Product engineering / Services)": "it_services",
    "BPM / Shared services": "bpm",
    "Big Tech / Product": "big_tech",
    "Fintech": "fintech",
    "Consumer Tech": "consumer",
    "SaaS / Enterprise": "saas",
    "D2C / Consumer Tech": "consumer",
    "E-commerce": "consumer",
    "EdTech": "edtech",
    "Financial Services": "bfsi",
    "Investment Bank / Captive": "bfsi",
    "Bank (Global)": "bfsi",
    "FMCG / Consumer": "fmcg",
    "Manufacturing / Consumer": "manufacturing",
    "Conglomerate / Consumer": "conglomerate",
    "Telecom": "telecom",
    "Management Consulting": "consulting",
    "Big 4 / Professional Services": "consulting",
    "Mid-tier Consulting": "consulting",
    "Boutique Consulting": "consulting",
  };
  return mapping[archetype] || "services";
}

async function seedCompanyInterviewComponents() {
  console.log("Reading CSV file...");
  const content = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(content);
  console.log(`Parsed ${rows.length} companies from CSV`);
  
  for (const row of rows) {
    const dbArchetype = mapArchetypeToDb(row.archetype);
    const interviewComponents = {
      aptitude: row.aptitude,
      codingChallenge: row.codingChallenge,
      technicalDsaSql: row.technicalDsaSql,
      systemDesign: row.systemDesign,
      caseStudy: row.caseStudy,
      hrScreen: row.hrScreen,
      behavioral: row.behavioral,
      hiringManager: row.hiringManager,
      groupDiscussion: row.groupDiscussion,
      panel: row.panel,
      presentation: row.presentation,
    };
    
    try {
      await db.insert(companies).values({
        name: row.name,
        sector: row.sector,
        country: "India",
        tier: row.confidence === "High" ? "top50" : "top200",
        archetype: dbArchetype as any,
        interviewComponents,
      }).onConflictDoUpdate({
        target: companies.name,
        set: {
          sector: row.sector,
          archetype: dbArchetype as any,
          interviewComponents,
        }
      });
      console.log(`✓ ${row.name}`);
    } catch (error: any) {
      console.error(`✗ ${row.name}: ${error.message}`);
    }
  }
  
  console.log("\nDone seeding company interview components!");
}

seedCompanyInterviewComponents().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
