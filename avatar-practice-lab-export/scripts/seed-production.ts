import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL;

if (!PRODUCTION_DATABASE_URL) {
  console.error("Error: PRODUCTION_DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: PRODUCTION_DATABASE_URL });
const db = drizzle(pool, { schema });

async function seedProduction() {
  console.log("Starting production database seed...\n");

  try {
    console.log("Seeding avatars...");
    await db.insert(schema.avatars).values([
      { id: "Kristin_public_2_20240108", name: "Maya", gender: "female" },
      { id: "Wayne_20240711", name: "Liam", gender: "male" },
      { id: "cc2984a6004c4ec588f690a5b7cf57d2", name: "Sophia", gender: "female" },
      { id: "ef08039a41354c209a8f64714661dadc", name: "Ethan", gender: "male" },
    ]).onConflictDoNothing();
    console.log("  Avatars seeded successfully");

    console.log("Seeding tones...");
    await db.insert(schema.tones).values([
      { tone: "Supportive", description: "Be supportive and encouraging in tone. Acknowledge the user's efforts and provide constructive feedback in a gentle manner." },
      { tone: "Neutral", description: "Maintain a professional, balanced tone. Be direct but fair in your responses without being overly positive or negative." },
      { tone: "Challenging", description: "Be direct and push back on ideas. Challenge the user's assumptions and arguments to help them think more critically." },
    ]).onConflictDoNothing();
    console.log("  Tones seeded successfully");

    console.log("Seeding personas...");
    await db.insert(schema.personas).values([
      { persona: "Direct Manager", description: "Your immediate supervisor who oversees your daily work" },
      { persona: "Senior Colleague", description: "An experienced peer who has been with the company longer" },
      { persona: "HR Representative", description: "A human resources professional handling workplace matters" },
      { persona: "Client", description: "An external customer or stakeholder" },
      { persona: "New Team Member", description: "A recently hired colleague who is still learning" },
    ]).onConflictDoNothing();
    console.log("  Personas seeded successfully");

    console.log("Seeding skills...");
    await db.insert(schema.skills).values([
      { id: 1, name: "Difficult Conversations", description: "Navigate challenging workplace discussions with empathy and clarity", definition: "The ability to engage in challenging discussions while maintaining professionalism and empathy", level: 1 },
      { id: 2, name: "Giving Feedback", description: "Deliver constructive feedback that motivates and guides improvement", definition: "The skill of providing actionable, specific feedback that helps others grow", level: 1 },
      { id: 3, name: "Receiving Feedback", description: "Accept and process feedback gracefully to accelerate growth", definition: "The ability to listen openly to feedback and use it constructively", level: 1 },
      { id: 4, name: "Conflict Resolution", description: "Resolve disagreements constructively while preserving relationships", definition: "The skill of finding mutually acceptable solutions to conflicts", level: 1, frameworkMapping: "TKI" },
      { id: 5, name: "Negotiation", description: "Reach mutually beneficial agreements through effective dialogue", definition: "The ability to find win-win outcomes through strategic discussion", level: 1 },
      { id: 6, name: "Emotional Intelligence", description: "Recognize and manage emotions in yourself and others", definition: "The capacity to understand and manage emotional dynamics", level: 1, frameworkMapping: "EQ" },
      { id: 7, name: "Coaching", description: "Guide others to discover solutions and develop their potential", definition: "The skill of helping others find their own answers through questioning", level: 1, frameworkMapping: "GROW" },
      { id: 8, name: "Active Listening", description: "Fully engage with speakers to understand their perspective", definition: "The practice of fully concentrating on what is being said", level: 1 },
    ]).onConflictDoNothing();
    console.log("  Skills seeded successfully");

    console.log("Seeding scenarios...");
    const scenarioData = [
      { skillId: 1, name: "Addressing Repeated Missed Deadlines", description: "Talk to a team member who has missed several project deadlines", avatarName: "Maya", avatarRole: "Team Member" },
      { skillId: 1, name: "Discussing a Difficult Performance Review", description: "Deliver a performance review with areas needing significant improvement", avatarName: "Liam", avatarRole: "Direct Report" },
      { skillId: 2, name: "Giving Constructive Criticism on a Project", description: "Provide feedback on a colleague's work that needs improvement", avatarName: "Sophia", avatarRole: "Colleague" },
      { skillId: 2, name: "Recognizing Good Work Publicly", description: "Acknowledge a team member's exceptional contribution in a meeting", avatarName: "Maya", avatarRole: "Team Member" },
      { skillId: 3, name: "Receiving Unexpected Negative Feedback", description: "Your manager shares concerns about your recent performance", avatarName: "Liam", avatarRole: "Manager" },
      { skillId: 4, name: "Mediating a Team Disagreement", description: "Two colleagues have conflicting approaches to a project", avatarName: "Ethan", avatarRole: "Team Member" },
      { skillId: 4, name: "Resolving Resource Allocation Conflict", description: "Competing teams need the same limited resources", avatarName: "Sophia", avatarRole: "Department Head" },
      { skillId: 5, name: "Negotiating Project Timeline", description: "A stakeholder wants a faster delivery than your team can manage", avatarName: "Liam", avatarRole: "Stakeholder" },
      { skillId: 5, name: "Salary Negotiation", description: "Discuss a raise or promotion with your manager", avatarName: "Maya", avatarRole: "Manager" },
      { skillId: 6, name: "Supporting a Stressed Colleague", description: "A team member is visibly overwhelmed with work pressure", avatarName: "Sophia", avatarRole: "Colleague" },
      { skillId: 7, name: "Coaching a New Team Member", description: "Help a junior colleague solve a challenging problem", avatarName: "Ethan", avatarRole: "Junior Colleague" },
      { skillId: 7, name: "Career Development Conversation", description: "Help a team member plan their growth path", avatarName: "Maya", avatarRole: "Mentee" },
      { skillId: 8, name: "Understanding Client Needs", description: "A client is frustrated with the current solution", avatarName: "Liam", avatarRole: "Client" },
    ];
    
    for (const scenario of scenarioData) {
      await db.insert(schema.scenarios).values(scenario).onConflictDoNothing();
    }
    console.log("  Scenarios seeded successfully");

    console.log("Seeding scenario-skill mappings...");
    const scenarios = await db.select().from(schema.scenarios);
    for (const scenario of scenarios) {
      if (scenario.skillId) {
        await db.insert(schema.scenarioSkills).values({
          scenarioId: scenario.id,
          skillId: scenario.skillId,
        }).onConflictDoNothing();
      }
    }
    console.log("  Scenario-skill mappings seeded successfully");

    console.log("\n Production database seeded successfully!");
  } catch (error) {
    console.error("Error seeding production database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedProduction().catch((err) => {
  console.error(err);
  process.exit(1);
});
