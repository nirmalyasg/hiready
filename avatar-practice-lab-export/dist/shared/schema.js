import { pgTable, text, serial, integer, boolean, jsonb, timestamp, smallint, varchar, real, primaryKey, numeric, uuid, index, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
// =====================
// Auth Tables (Replit Auth)
// =====================
// Session storage table for Replit Auth
export const sessions = pgTable("sessions", {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);
// Auth users table for username/password authentication
export const authUsers = pgTable("auth_users", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    username: varchar("username").notNull().unique(),
    email: varchar("email").unique(),
    passwordHash: varchar("password_hash").notNull(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// =====================
// Core Tables
// =====================
// Legacy Users table (kept for backward compatibility)
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    isActive: boolean("is_active").notNull().default(true),
    authUserId: varchar("auth_user_id").references(() => authUsers.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
});
// Skills (scenarios reference these)
export const skills = pgTable("skills", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    definition: text("definition").notNull(),
    level: integer("level").notNull(),
    parentSkillId: integer("parent_skill_id"),
    category: text("category").default("General"),
    isActive: boolean("is_active").notNull().default(true),
    frameworkMapping: text("framework_mapping"),
    referenceSource: text("reference_source"),
    assessmentDimensions: text("assessment_dimensions"),
    scoringModelLogic: text("scoring_model_logic"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
});
// =====================
// Avatar Practice Lab Tables
// =====================
export const scenarios = pgTable("scenarios", {
    id: serial("id").primaryKey(),
    skillId: integer("skill_id").references(() => skills.id),
    name: varchar("name").notNull(),
    description: text("description"),
    context: text("context"),
    instructions: text("instructions"),
    avatarName: varchar("avatar_name"),
    avatarRole: varchar("avatar_role"),
    difficulty: text("difficulty"),
    duration: numeric("duration"),
});
export const scenarioSkills = pgTable("scenario_skills", {
    scenarioId: integer("scenario_id")
        .references(() => scenarios.id, { onDelete: "cascade" })
        .notNull(),
    skillId: integer("skill_id")
        .references(() => skills.id, { onDelete: "cascade" })
        .notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.scenarioId, t.skillId] }),
}));
export const personas = pgTable("personas", {
    id: serial("id").primaryKey(),
    persona: varchar("persona").notNull(),
    description: text("description"),
});
export const tones = pgTable("tones", {
    id: serial("id").primaryKey(),
    tone: varchar("tone").notNull(),
    description: text("description"),
});
export const avatars = pgTable("avatars", {
    id: varchar("id").primaryKey(),
    name: varchar("name"),
    look: varchar("look"),
    ethnicity: varchar("ethnicity"),
    gender: varchar("gender"),
    role: varchar("role"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// =====================
// Session Management
// =====================
export const roleplaySession = pgTable("roleplay_session", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    avatarId: varchar("avatar_id")
        .notNull()
        .references(() => avatars.id),
    knowledgeId: varchar("knowledge_id"),
    transcriptId: varchar("transcript_id"),
    culturalPresetId: varchar("cultural_preset_id"),
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time").defaultNow(),
    duration: integer("duration"),
    audioUrl: varchar("audio_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const aiSessions = pgTable("ai_sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionType: text("session_type").notNull(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onUpdate: "cascade", onDelete: "cascade" }),
    avatarId: varchar("avatar_id"),
    knowledgeId: varchar("knowledge_id"),
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time"),
    duration: integer("duration"),
    audioUrl: text("audio_url"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});
export const transcripts = pgTable("transcripts", {
    id: varchar("id").primaryKey(),
    avatarId: varchar("avatar_id").notNull(),
    knowledgeId: varchar("knowledge_id"),
    context: text("context"),
    instructions: text("instructions"),
    scenario: text("scenario"),
    skill: text("skill"),
    duration: integer("duration"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onUpdate: "cascade", onDelete: "cascade" }),
    sessionId: integer("session_id")
        .notNull()
        .references(() => roleplaySession.id, { onDelete: "cascade" }),
    aiSessionId: uuid("ai_session_id").references(() => aiSessions.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
    }),
    skillId: integer("skill_id"),
    scenarioId: integer("scenario_id").references(() => scenarios.id, { onDelete: "set null" }),
    sessionType: varchar("session_type").default("streaming_avatar"),
    customScenarioId: integer("custom_scenario_id").references(() => customScenarios.id, { onDelete: "set null" }),
    culturalPresetId: varchar("cultural_preset_id"),
});
export const transcriptMessages = pgTable("transcript_messages", {
    id: text("id").primaryKey(),
    transcriptId: text("transcript_id")
        .references(() => transcripts.id)
        .notNull(),
    messages: jsonb("messages").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const aiSessionAnalysis = pgTable("ai_session_analysis", {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
        .references(() => roleplaySession.id)
        .notNull(),
    sessionType: text("session_type").default("audio_roleplay").notNull(),
    transcriptId: varchar("transcript_id").references(() => transcripts.id),
    overallScore: integer("overall_score").notNull(),
    userTalkTime: real("user_talk_time").notNull(),
    otherTalkTime: real("other_talk_time").notNull(),
    userTalkPercentage: real("user_talk_percentage").notNull(),
    fillerWords: jsonb("filler_words").notNull(),
    weakWords: jsonb("weak_words").notNull(),
    sentenceOpeners: jsonb("sentence_openers").notNull(),
    activeListening: boolean("active_listening").notNull(),
    engagementLevel: integer("engagement_level").notNull(),
    questionsAsked: integer("questions_asked").notNull(),
    acknowledgments: integer("acknowledgments").notNull(),
    interruptions: integer("interruptions").notNull(),
    averagePacing: real("average_pacing").notNull(),
    pacingVariation: jsonb("pacing_variation").notNull(),
    tone: jsonb("tone").notNull(),
    pauseCount: integer("pause_count").notNull(),
    averagePauseLength: real("average_pause_length").notNull(),
    strengths: jsonb("strengths").notNull(),
    growthAreas: jsonb("growth_areas").notNull(),
    followUpQuestions: jsonb("follow_up_questions").notNull(),
    summary: text("summary").notNull(),
    pronunciationIssues: jsonb("pronunciation_issues").notNull(),
    pronunciationSuggestions: jsonb("pronunciation_suggestions").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// =====================
// Skill Dimension Assessments (Framework-based scoring per session)
// =====================
export const skillDimensionAssessments = pgTable("skill_dimension_assessments", {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
        .references(() => roleplaySession.id, { onDelete: "cascade" })
        .notNull(),
    skillId: integer("skill_id")
        .references(() => skills.id, { onDelete: "cascade" })
        .notNull(),
    dimensionName: text("dimension_name").notNull(),
    score: real("score").notNull(),
    maxScore: real("max_score").notNull().default(5),
    evidence: text("evidence"),
    frameworkReference: text("framework_reference"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const skillAssessmentSummary = pgTable("skill_assessment_summary", {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
        .references(() => roleplaySession.id, { onDelete: "cascade" })
        .notNull(),
    skillId: integer("skill_id")
        .references(() => skills.id, { onDelete: "cascade" })
        .notNull(),
    overallSkillScore: real("overall_skill_score").notNull(),
    frameworkUsed: text("framework_used"),
    assessmentNotes: text("assessment_notes"),
    strengthDimensions: jsonb("strength_dimensions"),
    improvementDimensions: jsonb("improvement_dimensions"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
// =====================
// Cultural Style Presets (for intercultural communication practice)
// =====================
export const culturalStylePresets = pgTable("cultural_style_presets", {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    userFacingDescription: text("user_facing_description"),
    globeSmartProfile: jsonb("globesmart_profile").$type(),
    behaviorRules: jsonb("behavior_rules").$type(),
    typicalUserLearnings: jsonb("typical_user_learnings").$type(),
    accentGuidance: jsonb("accent_guidance").$type(),
    isDefault: boolean("is_default").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// =====================
// HeyGen Session Management
// =====================
export const heygenSessions = pgTable("heygen_sessions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .references(() => users.id, { onDelete: "cascade" }),
    scenarioId: integer("scenario_id")
        .references(() => scenarios.id, { onDelete: "set null" }),
    avatarId: varchar("avatar_id")
        .references(() => avatars.id),
    heygenSessionId: varchar("heygen_session_id"),
    culturalPresetId: varchar("cultural_preset_id"),
    status: text("status")
        .$type()
        .notNull()
        .default("active"),
    mode: text("mode")
        .$type()
        .notNull()
        .default("voice"),
    quality: text("quality")
        .$type()
        .default("low"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    endedAt: timestamp("ended_at"),
    lastSeenAt: timestamp("last_seen_at").defaultNow(),
    sessionDurationSec: integer("session_duration_sec").default(360),
    actualDurationSec: integer("actual_duration_sec"),
    endReason: text("end_reason")
        .$type(),
    metadata: jsonb("metadata").$type(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const heygenQueue = pgTable("heygen_queue", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    scenarioId: integer("scenario_id")
        .references(() => scenarios.id, { onDelete: "set null" }),
    avatarId: varchar("avatar_id")
        .references(() => avatars.id),
    status: text("status")
        .$type()
        .notNull()
        .default("queued"),
    mode: text("mode")
        .$type()
        .notNull()
        .default("voice"),
    priority: smallint("priority").default(0),
    queuedAt: timestamp("queued_at").defaultNow().notNull(),
    assignedAt: timestamp("assigned_at"),
    expiresAt: timestamp("expires_at"),
    assignedSessionId: integer("assigned_session_id")
        .references(() => heygenSessions.id, { onDelete: "set null" }),
    estimatedWaitSec: integer("estimated_wait_sec"),
    metadata: jsonb("metadata").$type(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// =====================
// Relations
// =====================
export const heygenSessionsRelations = relations(heygenSessions, ({ one }) => ({
    user: one(users, {
        fields: [heygenSessions.userId],
        references: [users.id],
    }),
    scenario: one(scenarios, {
        fields: [heygenSessions.scenarioId],
        references: [scenarios.id],
    }),
    avatar: one(avatars, {
        fields: [heygenSessions.avatarId],
        references: [avatars.id],
    }),
}));
export const heygenQueueRelations = relations(heygenQueue, ({ one }) => ({
    user: one(users, {
        fields: [heygenQueue.userId],
        references: [users.id],
    }),
    scenario: one(scenarios, {
        fields: [heygenQueue.scenarioId],
        references: [scenarios.id],
    }),
    avatar: one(avatars, {
        fields: [heygenQueue.avatarId],
        references: [avatars.id],
    }),
    assignedSession: one(heygenSessions, {
        fields: [heygenQueue.assignedSessionId],
        references: [heygenSessions.id],
    }),
}));
// =====================
// Custom Scenarios (User-Created)
// =====================
export const customScenarios = pgTable("custom_scenarios", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
        .notNull()
        .references(() => authUsers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    userDescription: text("user_description").notNull(),
    blueprint: jsonb("blueprint").notNull(),
    userRole: text("user_role"),
    avatarRole: text("avatar_role"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Custom Scenario Skill Mappings - AI-generated links between custom scenarios and skills
export const customScenarioSkillMappings = pgTable("custom_scenario_skill_mappings", {
    id: serial("id").primaryKey(),
    customScenarioId: integer("custom_scenario_id")
        .notNull()
        .references(() => customScenarios.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
        .notNull()
        .references(() => skills.id, { onDelete: "cascade" }),
    confidenceScore: real("confidence_score").notNull().default(0),
    aiRationale: text("ai_rationale"),
    isConfirmed: boolean("is_confirmed").notNull().default(false),
    confirmedByUserId: varchar("confirmed_by_user_id")
        .references(() => authUsers.id, { onDelete: "set null" }),
    dimensionWeights: jsonb("dimension_weights"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const customScenariosRelations = relations(customScenarios, ({ one, many }) => ({
    user: one(authUsers, {
        fields: [customScenarios.userId],
        references: [authUsers.id],
    }),
    skillMappings: many(customScenarioSkillMappings),
}));
export const customScenarioSkillMappingsRelations = relations(customScenarioSkillMappings, ({ one }) => ({
    customScenario: one(customScenarios, {
        fields: [customScenarioSkillMappings.customScenarioId],
        references: [customScenarios.id],
    }),
    skill: one(skills, {
        fields: [customScenarioSkillMappings.skillId],
        references: [skills.id],
    }),
}));
// =====================
// Insert Schemas
// =====================
export const insertCustomScenarioSchema = createInsertSchema(customScenarios).omit({ id: true, createdAt: true, updatedAt: true });
export const insertScenarioSchema = createInsertSchema(scenarios).omit({ id: true });
export const insertPersonaSchema = createInsertSchema(personas).omit({ id: true });
export const insertToneSchema = createInsertSchema(tones).omit({ id: true });
export const insertAvatarSchema = createInsertSchema(avatars);
export const insertRoleplaySessionSchema = createInsertSchema(roleplaySession).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTranscriptSchema = createInsertSchema(transcripts);
export const insertTranscriptMessageSchema = createInsertSchema(transcriptMessages);
export const insertAiSessionAnalysisSchema = createInsertSchema(aiSessionAnalysis).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHeygenSessionSchema = createInsertSchema(heygenSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHeygenQueueSchema = createInsertSchema(heygenQueue).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSkillDimensionAssessmentSchema = createInsertSchema(skillDimensionAssessments).omit({ id: true, createdAt: true });
export const insertSkillAssessmentSummarySchema = createInsertSchema(skillAssessmentSummary).omit({ id: true, createdAt: true });
export const insertCustomScenarioSkillMappingSchema = createInsertSchema(customScenarioSkillMappings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCulturalStylePresetSchema = createInsertSchema(culturalStylePresets).omit({ createdAt: true, updatedAt: true });
