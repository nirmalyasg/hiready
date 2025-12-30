import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../shared/schema.js";
import { sql } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL;
const DATABASE_URL = process.env.DATABASE_URL;

if (!PRODUCTION_DATABASE_URL) {
  console.error("Error: PRODUCTION_DATABASE_URL environment variable is required");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is required");
  process.exit(1);
}

const devPool = new Pool({ connectionString: DATABASE_URL });
const devDb = drizzle(devPool, { schema });

const prodPool = new Pool({ connectionString: PRODUCTION_DATABASE_URL });
const prodDb = drizzle(prodPool, { schema });

async function migrateUsersToProduction() {
  console.log("Starting user migration to production...\n");

  try {
    console.log("Fetching auth_users from development database...");
    const authUsers = await devDb.select().from(schema.authUsers);
    console.log(`  Found ${authUsers.length} auth_users`);

    console.log("\nMigrating auth_users to production...");
    for (const authUser of authUsers) {
      console.log(`  Migrating auth_user: ${authUser.username || authUser.email || authUser.id}`);
      await prodDb.insert(schema.authUsers).values({
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        profileImageUrl: authUser.profileImageUrl,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
        username: authUser.username,
        passwordHash: authUser.passwordHash,
      }).onConflictDoNothing();
    }
    console.log("  Auth users migrated successfully");

    console.log("\nFetching users from development database...");
    const users = await devDb.select().from(schema.users);
    console.log(`  Found ${users.length} users`);

    console.log("\nMigrating users to production...");
    for (const user of users) {
      console.log(`  Migrating user: ${user.username}`);
      await prodDb.insert(schema.users).values({
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        authUserId: user.authUserId,
      }).onConflictDoNothing();
    }
    console.log("  Users migrated successfully");

    console.log("\nFetching presentation scenarios from development...");
    const presentationScenarios = await devDb.select().from(schema.presentationScenarios);
    console.log(`  Found ${presentationScenarios.length} presentation scenarios`);

    console.log("\nMigrating presentation scenarios to production...");
    for (const scenario of presentationScenarios) {
      console.log(`  Migrating scenario: ${scenario.title}`);
      await prodDb.insert(schema.presentationScenarios).values({
        id: scenario.id,
        userId: scenario.userId,
        title: scenario.title,
        topic: scenario.topic,
        fileName: scenario.fileName,
        totalSlides: scenario.totalSlides,
        slidesData: scenario.slidesData,
        extractedText: scenario.extractedText,
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
        fileUrl: scenario.fileUrl,
        fileType: scenario.fileType,
        context: scenario.context,
      }).onConflictDoNothing();
    }
    console.log("  Presentation scenarios migrated successfully");

    console.log("\nFetching presentation sessions from development...");
    const presentationSessions = await devDb.select().from(schema.presentationSessions);
    console.log(`  Found ${presentationSessions.length} presentation sessions`);

    console.log("\nMigrating presentation sessions to production...");
    for (const session of presentationSessions) {
      console.log(`  Migrating session: ${session.sessionUid}`);
      await prodDb.insert(schema.presentationSessions).values({
        id: session.id,
        userId: session.userId,
        presentationScenarioId: session.presentationScenarioId,
        sessionUid: session.sessionUid,
        duration: session.duration,
        slidesCovered: session.slidesCovered,
        totalSlides: session.totalSlides,
        transcript: session.transcript,
        createdAt: session.createdAt,
      }).onConflictDoNothing();
    }
    console.log("  Presentation sessions migrated successfully");

    console.log("\nFetching presentation feedback from development...");
    const presentationFeedback = await devDb.select().from(schema.presentationFeedback);
    console.log(`  Found ${presentationFeedback.length} presentation feedback entries`);

    console.log("\nMigrating presentation feedback to production...");
    for (const feedback of presentationFeedback) {
      console.log(`  Migrating feedback for session: ${feedback.presentationSessionId}`);
      await prodDb.insert(schema.presentationFeedback).values({
        id: feedback.id,
        presentationScenarioId: feedback.presentationScenarioId,
        overallScore: feedback.overallScore,
        communicationScore: feedback.communicationScore,
        communicationFeedback: feedback.communicationFeedback,
        deliveryScore: feedback.deliveryScore,
        deliveryFeedback: feedback.deliveryFeedback,
        subjectMatterScore: feedback.subjectMatterScore,
        subjectMatterFeedback: feedback.subjectMatterFeedback,
        slideCoverage: feedback.slideCoverage,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        summary: feedback.summary,
        createdAt: feedback.createdAt,
        presentationSessionId: feedback.presentationSessionId,
      }).onConflictDoNothing();
    }
    console.log("  Presentation feedback migrated successfully");

    console.log("\n User migration completed successfully!");
    console.log("\nSummary:");
    console.log(`  - Auth Users: ${authUsers.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Presentation Scenarios: ${presentationScenarios.length}`);
    console.log(`  - Presentation Sessions: ${presentationSessions.length}`);
    console.log(`  - Presentation Feedback: ${presentationFeedback.length}`);

  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

migrateUsersToProduction().catch((err) => {
  console.error(err);
  process.exit(1);
});
