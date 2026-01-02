import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
  smallint,
  varchar,
  real,
  primaryKey,
  numeric,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
import { z } from "zod";

// =====================
// Auth Tables (Replit Auth)
// =====================

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Auth users table for username/password authentication
export const authUsers = pgTable("auth_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertAuthUser = typeof authUsers.$inferInsert;
export type AuthUser = typeof authUsers.$inferSelect;

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
  openingScene: text("opening_scene"),
  avatarName: varchar("avatar_name"),
  avatarRole: varchar("avatar_role"),
  difficulty: text("difficulty"),
  duration: numeric("duration"),
  scenarioKey: varchar("scenario_key").unique(),
  shortTitle: varchar("short_title"),
  displayTitle: text("display_title"),
  tags: jsonb("tags").$type<string[]>(),
  personaOverlays: jsonb("persona_overlays").$type<{
    ic?: PersonaOverlay;
    manager?: PersonaOverlay;
    senior?: PersonaOverlay;
    exec?: PersonaOverlay;
  }>(),
  counterPersona: jsonb("counter_persona").$type<CounterPersona>(),
});

export type CounterPersona = {
  role: string;
  caresAbout: string;
  pressureResponse: "pushes_back" | "withdraws" | "escalates" | "complies" | "challenges_logic";
  triggers: string[];
};

export type PersonaOverlay = {
  userRoleTitle: string;
  authorityAndConstraints: string[];
  successCriteria: string[];
  commonMistakes: string[];
  toneGuidance: string;
  avatarPushbackLevel: "low" | "medium" | "high";
};

export const scenarioSkills = pgTable(
  "scenario_skills",
  {
    scenarioId: integer("scenario_id")
      .references(() => scenarios.id, { onDelete: "cascade" })
      .notNull(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.scenarioId, t.skillId] }),
  }),
);

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
// Custom Personas (User/Org-defined persona overlays)
// =====================

export const customPersonas = pgTable("custom_personas", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => authUsers.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id"),
  name: varchar("name").notNull(),
  userRoleTitle: varchar("user_role_title").notNull(),
  authorityAndConstraints: jsonb("authority_and_constraints").$type<string[]>().notNull(),
  successCriteria: jsonb("success_criteria").$type<string[]>().notNull(),
  commonMistakes: jsonb("common_mistakes").$type<string[]>().notNull(),
  toneGuidance: text("tone_guidance").notNull(),
  avatarPushbackLevel: varchar("avatar_pushback_level").$type<"low" | "medium" | "high">().notNull().default("medium"),
  isDefault: boolean("is_default").default(false),
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
  sessionConfig: jsonb("session_config").$type<SessionConfig>(),
});

export type SessionConfig = {
  personaOverlayKey?: "ic" | "manager" | "senior" | "exec" | "custom";
  customPersonaId?: number;
  selectedPersona?: PersonaOverlay;
  scenarioId?: number;
  culturalPresetId?: string;
  language?: string;
};

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
  globeSmartProfile: jsonb("globesmart_profile").$type<{
    directness: string;
    taskVsRelationship: string;
    hierarchy: string;
    expressiveness: string;
    riskTolerance: string;
    timeOrientation: string;
  }>(),
  behaviorRules: jsonb("behavior_rules").$type<{
    turnTaking: string[];
    toneAndPacing: string[];
    disagreementStyle: string[];
    emotionalExpression: string[];
    openingBehavior: string[];
    closingBehavior: string[];
  }>(),
  typicalUserLearnings: jsonb("typical_user_learnings").$type<string[]>(),
  accentGuidance: jsonb("accent_guidance").$type<{
    pacing: string;
    intonation: string;
    sentenceLength: string;
  }>(),
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
    .$type<"active" | "ended" | "stale" | "error" | "expired">()
    .notNull()
    .default("active"),
  mode: text("mode")
    .$type<"voice" | "video">()
    .notNull()
    .default("voice"),
  quality: text("quality")
    .$type<"low" | "medium" | "high">()
    .default("low"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  endedAt: timestamp("ended_at"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  sessionDurationSec: integer("session_duration_sec").default(360),
  actualDurationSec: integer("actual_duration_sec"),
  endReason: text("end_reason")
    .$type<"user_ended" | "timeout" | "error" | "stale" | "admin">(),
  metadata: jsonb("metadata").$type<{
    knowledgeId?: string;
    knowledgeBase?: string;
    language?: string;
    userAgent?: string;
    ipAddress?: string;
  }>(),
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
    .$type<"queued" | "assigned" | "cancelled" | "expired">()
    .notNull()
    .default("queued"),
  mode: text("mode")
    .$type<"voice" | "video">()
    .notNull()
    .default("voice"),
  priority: smallint("priority").default(0),
  queuedAt: timestamp("queued_at").defaultNow().notNull(),
  assignedAt: timestamp("assigned_at"),
  expiresAt: timestamp("expires_at"),
  assignedSessionId: integer("assigned_session_id")
    .references(() => heygenSessions.id, { onDelete: "set null" }),
  estimatedWaitSec: integer("estimated_wait_sec"),
  metadata: jsonb("metadata").$type<{
    knowledgeId?: string;
    knowledgeBase?: string;
    language?: string;
  }>(),
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
// Presentation Scenarios (User-Created for presentation practice)
// =====================

export const presentationScenarios = pgTable("presentation_scenarios", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  context: text("context"),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  totalSlides: integer("total_slides").notNull(),
  slidesData: jsonb("slides_data").notNull(),
  extractedText: text("extracted_text").notNull(),
  documentAnalysis: jsonb("document_analysis"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Presentation Practice Sessions
export const presentationSessions = pgTable("presentation_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  presentationScenarioId: integer("presentation_scenario_id")
    .notNull()
    .references(() => presentationScenarios.id, { onDelete: "cascade" }),
  sessionUid: text("session_uid").notNull().unique(),
  duration: integer("duration").default(0),
  slidesCovered: integer("slides_covered").default(0),
  totalSlides: integer("total_slides").default(0),
  transcript: text("transcript"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const presentationFeedback = pgTable("presentation_feedback", {
  id: serial("id").primaryKey(),
  presentationSessionId: integer("presentation_session_id")
    .references(() => presentationSessions.id, { onDelete: "cascade" })
    .notNull(),
  presentationScenarioId: integer("presentation_scenario_id")
    .references(() => presentationScenarios.id, { onDelete: "cascade" })
    .notNull(),
  overallScore: real("overall_score").notNull(),
  communicationScore: real("communication_score").notNull(),
  communicationFeedback: text("communication_feedback"),
  deliveryScore: real("delivery_score").notNull(),
  deliveryFeedback: text("delivery_feedback"),
  subjectMatterScore: real("subject_matter_score").notNull(),
  subjectMatterFeedback: text("subject_matter_feedback"),
  slideCoverage: jsonb("slide_coverage"),
  strengths: jsonb("strengths"),
  improvements: jsonb("improvements"),
  summary: text("summary"),
  skillAssessment: jsonb("skill_assessment"),
  documentAnalysis: jsonb("document_analysis"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
// Interview Practice Lab Tables
// =====================

// Role Kits - Pre-built interview role catalog (replaces scenarios for interview mode)
export const roleKits = pgTable("role_kits", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  level: text("level")
    .$type<"entry" | "mid" | "senior">()
    .notNull()
    .default("entry"),
  domain: varchar("domain").notNull(),
  description: text("description"),
  roleContext: text("role_context"),
  coreCompetencies: jsonb("core_competencies").$type<string[]>(),
  typicalQuestions: jsonb("typical_questions").$type<string[]>(),
  defaultInterviewTypes: jsonb("default_interview_types").$type<string[]>().default(["hr", "technical"]),
  defaultRubricId: integer("default_rubric_id"),
  skillsFocus: jsonb("skills_focus").$type<string[]>(),
  estimatedDuration: integer("estimated_duration").default(360),
  trackTags: jsonb("track_tags").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Interview Rubrics - Defines dimensions and scoring rules
export const interviewRubrics = pgTable("interview_rubrics", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  dimensions: jsonb("dimensions").$type<{
    name: string;
    description: string;
    weight: number;
  }[]>().notNull(),
  scoringGuide: jsonb("scoring_guide").$type<{
    dimension: string;
    scores: {
      score: number;
      description: string;
    }[];
  }[]>().notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Documents - Resume/JD uploads
export const userDocuments = pgTable("user_documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  docType: text("doc_type")
    .$type<"resume" | "job_description" | "company_notes" | "other">()
    .notNull(),
  fileName: varchar("file_name").notNull(),
  mimeType: varchar("mime_type"),
  s3Url: text("s3_url"),
  rawText: text("raw_text"),
  parsedJson: jsonb("parsed_json").$type<{
    headline?: string;
    workHistory?: {
      company: string;
      role: string;
      duration: string;
      highlights: string[];
    }[];
    projects?: {
      name: string;
      description: string;
      technologies: string[];
      impact: string;
    }[];
    skills?: string[];
    education?: {
      institution: string;
      degree: string;
      year: string;
    }[];
    certifications?: string[];
    riskFlags?: {
      type: string;
      description: string;
      severity: "low" | "medium" | "high";
    }[];
  }>(),
  sourceHash: varchar("source_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Profile Extracted - Derived interview profile from latest resume
export const userProfileExtracted = pgTable("user_profile_extracted", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  latestResumeDocId: integer("latest_resume_doc_id")
    .references(() => userDocuments.id, { onDelete: "set null" }),
  headline: text("headline"),
  workHistory: jsonb("work_history").$type<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }[]>(),
  projects: jsonb("projects").$type<{
    name: string;
    description: string;
    technologies: string[];
    impact: string;
  }[]>(),
  skillsClaimed: jsonb("skills_claimed").$type<string[]>(),
  riskFlags: jsonb("risk_flags").$type<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
  }[]>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =====================
// Job Targets - Real jobs users are preparing for (NEW: Job-Centric Practice)
// =====================

export const jobTargets = pgTable("job_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  source: text("source").$type<"linkedin" | "naukri" | "indeed" | "company" | "manual">().default("manual"),
  jobUrl: text("job_url"),
  companyName: text("company_name"),
  roleTitle: text("role_title").notNull(),
  location: text("location"),
  jdText: text("jd_text"),
  jdParsed: jsonb("jd_parsed").$type<{
    requiredSkills?: string[];
    preferredSkills?: string[];
    experienceLevel?: string;
    responsibilities?: string[];
    companyContext?: string;
    redFlags?: string[];
    focusAreas?: string[];
    salaryRange?: string;
  }>(),
  status: text("status")
    .$type<"saved" | "applied" | "interview" | "offer" | "rejected" | "archived">()
    .notNull()
    .default("saved"),
  readinessScore: integer("readiness_score"),
  lastPracticedAt: timestamp("last_practiced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Skill Patterns - Career memory tracking improvements (NEW: Learning Loop)
export const userSkillPatterns = pgTable("user_skill_patterns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  dimension: text("dimension").notNull(),
  occurrences: integer("occurrences").default(1),
  avgScore: real("avg_score"),
  trend: text("trend").$type<"improving" | "stagnant" | "declining">().default("stagnant"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Interview Configs - User's chosen interview settings for a session
export const interviewConfigs = pgTable("interview_configs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  roleKitId: integer("role_kit_id")
    .references(() => roleKits.id, { onDelete: "set null" }),
  jobTargetId: varchar("job_target_id")
    .references(() => jobTargets.id, { onDelete: "set null" }),
  resumeDocId: integer("resume_doc_id")
    .references(() => userDocuments.id, { onDelete: "set null" }),
  jdDocId: integer("jd_doc_id")
    .references(() => userDocuments.id, { onDelete: "set null" }),
  companyNotesDocId: integer("company_notes_doc_id")
    .references(() => userDocuments.id, { onDelete: "set null" }),
  interviewType: text("interview_type")
    .$type<"hr" | "hiring_manager" | "technical" | "panel">()
    .notNull()
    .default("hr"),
  style: text("style")
    .$type<"friendly" | "neutral" | "stress">()
    .notNull()
    .default("neutral"),
  seniority: text("seniority")
    .$type<"entry" | "mid" | "senior">()
    .notNull()
    .default("entry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Interview Plans - AI-generated plan used during runtime
export const interviewPlans = pgTable("interview_plans", {
  id: serial("id").primaryKey(),
  interviewConfigId: integer("interview_config_id")
    .notNull()
    .references(() => interviewConfigs.id, { onDelete: "cascade" }),
  planJson: jsonb("plan_json").$type<{
    phases: {
      name: string;
      duration: number;
      objectives: string[];
      questionPatterns: string[];
    }[];
    triggers: {
      type: string;
      source: string;
      probeRules: string[];
    }[];
    focusAreas: string[];
  }>().notNull(),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Interview Sessions - Links roleplay_session to interview-specific context
export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  roleplaySessionId: integer("roleplay_session_id")
    .references(() => roleplaySession.id, { onDelete: "cascade" }),
  interviewConfigId: integer("interview_config_id")
    .notNull()
    .references(() => interviewConfigs.id, { onDelete: "cascade" }),
  interviewPlanId: integer("interview_plan_id")
    .references(() => interviewPlans.id, { onDelete: "set null" }),
  rubricId: integer("rubric_id")
    .references(() => interviewRubrics.id, { onDelete: "set null" }),
  status: text("status")
    .$type<"created" | "running" | "ended" | "analyzed">()
    .notNull()
    .default("created"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Interview Analysis - Extended analysis for interview sessions
export const interviewAnalysis = pgTable("interview_analysis", {
  id: serial("id").primaryKey(),
  interviewSessionId: integer("interview_session_id")
    .notNull()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  transcriptId: varchar("transcript_id")
    .references(() => transcripts.id, { onDelete: "set null" }),
  overallRecommendation: text("overall_recommendation")
    .$type<"strong_yes" | "yes" | "lean_yes" | "lean_no" | "no">(),
  confidenceLevel: text("confidence_level")
    .$type<"high" | "medium" | "low">(),
  summary: text("summary"),
  dimensionScores: jsonb("dimension_scores").$type<{
    dimension: string;
    score: number;
    evidence: string[];
    rationale: string;
    improvement: string;
  }[]>(),
  strengths: jsonb("strengths").$type<string[]>(),
  risks: jsonb("risks").$type<string[]>(),
  roleFitNotes: jsonb("role_fit_notes").$type<string[]>(),
  betterAnswers: jsonb("better_answers").$type<{
    question: string;
    betterAnswer: string;
  }[]>(),
  practicePlan: jsonb("practice_plan").$type<{
    day: number;
    task: string;
    timeMinutes: number;
  }[]>(),
  wins: jsonb("wins").$type<string[]>(),
  improvements: jsonb("improvements").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Interview Artifacts - Store structured outputs
export const interviewArtifacts = pgTable("interview_artifacts", {
  id: serial("id").primaryKey(),
  interviewSessionId: integer("interview_session_id")
    .notNull()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  artifactType: text("artifact_type")
    .$type<"improved_answers" | "question_list" | "action_plan" | "transcript_highlights">()
    .notNull(),
  artifactJson: jsonb("artifact_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Interview Practice Lab Relations
export const roleKitsRelations = relations(roleKits, ({ one }) => ({
  defaultRubric: one(interviewRubrics, {
    fields: [roleKits.defaultRubricId],
    references: [interviewRubrics.id],
  }),
}));

export const userDocumentsRelations = relations(userDocuments, ({ one }) => ({
  user: one(authUsers, {
    fields: [userDocuments.userId],
    references: [authUsers.id],
  }),
}));

export const userProfileExtractedRelations = relations(userProfileExtracted, ({ one }) => ({
  user: one(authUsers, {
    fields: [userProfileExtracted.userId],
    references: [authUsers.id],
  }),
  latestResumeDoc: one(userDocuments, {
    fields: [userProfileExtracted.latestResumeDocId],
    references: [userDocuments.id],
  }),
}));

export const interviewConfigsRelations = relations(interviewConfigs, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [interviewConfigs.userId],
    references: [authUsers.id],
  }),
  roleKit: one(roleKits, {
    fields: [interviewConfigs.roleKitId],
    references: [roleKits.id],
  }),
  resumeDoc: one(userDocuments, {
    fields: [interviewConfigs.resumeDocId],
    references: [userDocuments.id],
  }),
  jdDoc: one(userDocuments, {
    fields: [interviewConfigs.jdDocId],
    references: [userDocuments.id],
  }),
  companyNotesDoc: one(userDocuments, {
    fields: [interviewConfigs.companyNotesDocId],
    references: [userDocuments.id],
  }),
  plans: many(interviewPlans),
  sessions: many(interviewSessions),
}));

export const interviewPlansRelations = relations(interviewPlans, ({ one }) => ({
  config: one(interviewConfigs, {
    fields: [interviewPlans.interviewConfigId],
    references: [interviewConfigs.id],
  }),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  roleplaySession: one(roleplaySession, {
    fields: [interviewSessions.roleplaySessionId],
    references: [roleplaySession.id],
  }),
  config: one(interviewConfigs, {
    fields: [interviewSessions.interviewConfigId],
    references: [interviewConfigs.id],
  }),
  plan: one(interviewPlans, {
    fields: [interviewSessions.interviewPlanId],
    references: [interviewPlans.id],
  }),
  rubric: one(interviewRubrics, {
    fields: [interviewSessions.rubricId],
    references: [interviewRubrics.id],
  }),
  analysis: many(interviewAnalysis),
  artifacts: many(interviewArtifacts),
}));

export const interviewAnalysisRelations = relations(interviewAnalysis, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [interviewAnalysis.interviewSessionId],
    references: [interviewSessions.id],
  }),
  transcript: one(transcripts, {
    fields: [interviewAnalysis.transcriptId],
    references: [transcripts.id],
  }),
}));

export const interviewArtifactsRelations = relations(interviewArtifacts, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [interviewArtifacts.interviewSessionId],
    references: [interviewSessions.id],
  }),
}));

// =====================
// Interview Exercise Mode Tables (Case Study + Coding Lab)
// =====================

// Case Templates - "Prompt packages" for case study interviews
export const caseTemplates = pgTable("case_templates", {
  id: serial("id").primaryKey(),
  roleKitId: integer("role_kit_id")
    .references(() => roleKits.id, { onDelete: "set null" }),
  name: varchar("name").notNull(),
  caseType: text("case_type")
    .$type<"business_diagnosis" | "execution_planning" | "stakeholder">()
    .notNull(),
  difficulty: text("difficulty")
    .$type<"easy" | "medium" | "hard">()
    .notNull()
    .default("medium"),
  promptStatement: text("prompt_statement").notNull(),
  context: text("context"),
  clarifyingQuestionsAllowed: integer("clarifying_questions_allowed").default(3),
  revealableData: jsonb("revealable_data").$type<{
    dataPoint: string;
    triggerQuestion: string;
    value: string;
  }[]>(),
  evaluationFocus: jsonb("evaluation_focus").$type<string[]>(),
  probingMap: jsonb("probing_map").$type<{
    ifVague: string[];
    ifWrong: string[];
    ifStrong: string[];
  }>(),
  expectedDurationMinutes: integer("expected_duration_minutes").default(15),
  tags: jsonb("tags").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Coding Exercises - Code snippets for Explain/Debug/Modify activities
export const codingExercises = pgTable("coding_exercises", {
  id: serial("id").primaryKey(),
  roleKitId: integer("role_kit_id")
    .references(() => roleKits.id, { onDelete: "set null" }),
  name: varchar("name").notNull(),
  activityType: text("activity_type")
    .$type<"explain" | "debug" | "modify">()
    .notNull(),
  language: varchar("language").notNull().default("javascript"),
  difficulty: text("difficulty")
    .$type<"easy" | "medium" | "hard">()
    .notNull()
    .default("medium"),
  codeSnippet: text("code_snippet").notNull(),
  bugDescription: text("bug_description"),
  failingTestCase: text("failing_test_case"),
  modificationRequirement: text("modification_requirement"),
  expectedBehavior: text("expected_behavior"),
  expectedSignals: jsonb("expected_signals").$type<{
    signal: string;
    importance: "critical" | "important" | "nice_to_have";
  }[]>(),
  commonFailureModes: jsonb("common_failure_modes").$type<{
    mistake: string;
    feedback: string;
  }[]>(),
  suggestedFix: text("suggested_fix"),
  edgeCases: jsonb("edge_cases").$type<string[]>(),
  complexityExpected: text("complexity_expected"),
  probingQuestions: jsonb("probing_questions").$type<string[]>(),
  tags: jsonb("tags").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exercise Sessions - Track case study and coding lab sessions
export const exerciseSessions = pgTable("exercise_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  exerciseType: text("exercise_type")
    .$type<"case_study" | "coding_lab">()
    .notNull(),
  caseTemplateId: integer("case_template_id")
    .references(() => caseTemplates.id, { onDelete: "set null" }),
  codingExerciseId: integer("coding_exercise_id")
    .references(() => codingExercises.id, { onDelete: "set null" }),
  roleKitId: integer("role_kit_id")
    .references(() => roleKits.id, { onDelete: "set null" }),
  jobTargetId: varchar("job_target_id")
    .references(() => jobTargets.id, { onDelete: "set null" }),
  interviewType: text("interview_type")
    .$type<"hiring_manager" | "panel">()
    .default("hiring_manager"),
  style: text("style")
    .$type<"friendly" | "neutral" | "stress">()
    .default("neutral"),
  thinkingTimeUsed: integer("thinking_time_used").default(0),
  sessionUid: text("session_uid").notNull().unique(),
  transcript: text("transcript"),
  userCodeSubmission: text("user_code_submission"),
  duration: integer("duration").default(0),
  status: text("status")
    .$type<"created" | "thinking" | "active" | "ended" | "analyzed">()
    .notNull()
    .default("created"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exercise Rubrics - Scoring dimensions for case study and coding exercises
export const exerciseRubrics = pgTable("exercise_rubrics", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  exerciseType: text("exercise_type")
    .$type<"case_study" | "coding_lab">()
    .notNull(),
  dimensions: jsonb("dimensions").$type<{
    name: string;
    description: string;
    weight: number;
    anchors: {
      score: number;
      description: string;
    }[];
  }[]>().notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exercise Analysis - Detailed feedback for exercise sessions
export const exerciseAnalysis = pgTable("exercise_analysis", {
  id: serial("id").primaryKey(),
  exerciseSessionId: integer("exercise_session_id")
    .notNull()
    .references(() => exerciseSessions.id, { onDelete: "cascade" }),
  rubricId: integer("rubric_id")
    .references(() => exerciseRubrics.id, { onDelete: "set null" }),
  overallScore: real("overall_score").notNull(),
  dimensionScores: jsonb("dimension_scores").$type<{
    dimension: string;
    score: number;
    maxScore: number;
    evidence: string[];
    feedback: string;
  }[]>().notNull(),
  strengthsIdentified: jsonb("strengths_identified").$type<string[]>(),
  areasForImprovement: jsonb("areas_for_improvement").$type<string[]>(),
  rewrittenAnswer: text("rewritten_answer"),
  betterClarifyingQuestions: jsonb("better_clarifying_questions").$type<string[]>(),
  missedEdgeCases: jsonb("missed_edge_cases").$type<string[]>(),
  suggestedPatch: text("suggested_patch"),
  practicePlan: jsonb("practice_plan").$type<{
    day: number;
    task: string;
    timeMinutes: number;
  }[]>(),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exercise Sessions Relations
export const caseTemplatesRelations = relations(caseTemplates, ({ one }) => ({
  roleKit: one(roleKits, {
    fields: [caseTemplates.roleKitId],
    references: [roleKits.id],
  }),
}));

export const codingExercisesRelations = relations(codingExercises, ({ one }) => ({
  roleKit: one(roleKits, {
    fields: [codingExercises.roleKitId],
    references: [roleKits.id],
  }),
}));

export const exerciseSessionsRelations = relations(exerciseSessions, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [exerciseSessions.userId],
    references: [authUsers.id],
  }),
  caseTemplate: one(caseTemplates, {
    fields: [exerciseSessions.caseTemplateId],
    references: [caseTemplates.id],
  }),
  codingExercise: one(codingExercises, {
    fields: [exerciseSessions.codingExerciseId],
    references: [codingExercises.id],
  }),
  roleKit: one(roleKits, {
    fields: [exerciseSessions.roleKitId],
    references: [roleKits.id],
  }),
  jobTarget: one(jobTargets, {
    fields: [exerciseSessions.jobTargetId],
    references: [jobTargets.id],
  }),
  analysis: many(exerciseAnalysis),
}));

// Job Targets Relations
export const jobTargetsRelations = relations(jobTargets, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [jobTargets.userId],
    references: [authUsers.id],
  }),
  interviewConfigs: many(interviewConfigs),
  exerciseSessions: many(exerciseSessions),
}));

// User Skill Patterns Relations
export const userSkillPatternsRelations = relations(userSkillPatterns, ({ one }) => ({
  user: one(authUsers, {
    fields: [userSkillPatterns.userId],
    references: [authUsers.id],
  }),
}));

export const exerciseAnalysisRelations = relations(exerciseAnalysis, ({ one }) => ({
  session: one(exerciseSessions, {
    fields: [exerciseAnalysis.exerciseSessionId],
    references: [exerciseSessions.id],
  }),
  rubric: one(exerciseRubrics, {
    fields: [exerciseAnalysis.rubricId],
    references: [exerciseRubrics.id],
  }),
}));

// =====================
// Admin Tables
// =====================

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  authUserId: varchar("auth_user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  role: text("role")
    .$type<"admin" | "coach" | "learner">()
    .notNull()
    .default("learner"),
  assignedBy: varchar("assigned_by")
    .references(() => authUsers.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userLoginEvents = pgTable("user_login_events", {
  id: serial("id").primaryKey(),
  authUserId: varchar("auth_user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  eventType: text("event_type")
    .$type<"login" | "logout" | "session_start" | "session_end">()
    .notNull(),
  sessionId: varchar("session_id"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<{
    source?: string;
    deviceType?: string;
    location?: string;
  }>(),
});

export const apiUsageEvents = pgTable("api_usage_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  authUserId: varchar("auth_user_id")
    .references(() => authUsers.id, { onDelete: "set null" }),
  sessionId: integer("session_id")
    .references(() => roleplaySession.id, { onDelete: "set null" }),
  service: text("service")
    .$type<"openai" | "tavily" | "heygen" | "whisper" | "other">()
    .notNull(),
  operation: text("operation").notNull(),
  model: text("model"),
  tokensIn: integer("tokens_in").default(0),
  tokensOut: integer("tokens_out").default(0),
  requestUnits: real("request_units").default(1),
  unitCost: real("unit_cost").default(0),
  estimatedCost: real("estimated_cost").default(0),
  currency: varchar("currency").default("USD"),
  durationMs: integer("duration_ms"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<{
    endpoint?: string;
    responseSize?: number;
    quality?: string;
    avatarId?: string;
  }>(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export const sessionJourneyEvents = pgTable("session_journey_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  authUserId: varchar("auth_user_id")
    .references(() => authUsers.id, { onDelete: "set null" }),
  sessionId: integer("session_id")
    .references(() => roleplaySession.id, { onDelete: "set null" }),
  step: text("step")
    .$type<"landing" | "mode_selection" | "pre_session_setup" | "avatar_loaded" | "session_started" | "session_completed" | "analysis_viewed">()
    .notNull(),
  mode: text("mode")
    .$type<"scenario" | "custom_scenario" | "presentation" | "impromptu">(),
  device: text("device")
    .$type<"desktop" | "mobile" | "tablet">(),
  language: varchar("language"),
  avatarId: varchar("avatar_id"),
  metadata: jsonb("metadata").$type<{
    scenarioId?: number;
    customScenarioId?: number;
    duration?: number;
    dropOffReason?: string;
  }>(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export const budgetGuards = pgTable("budget_guards", {
  id: serial("id").primaryKey(),
  guardType: text("guard_type")
    .$type<"max_cost_per_session" | "max_daily_cost" | "max_daily_cost_per_org" | "max_tavily_per_user_day" | "max_heygen_minutes_per_user_day">()
    .notNull()
    .unique(),
  limitValue: real("limit_value").notNull(),
  currency: varchar("currency").default("USD"),
  isActive: boolean("is_active").default(true),
  fallbackAction: text("fallback_action")
    .$type<"block" | "warn" | "disable_feature" | "notify_admin">()
    .default("warn"),
  description: text("description"),
  updatedBy: varchar("updated_by")
    .references(() => authUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const budgetAlerts = pgTable("budget_alerts", {
  id: serial("id").primaryKey(),
  guardId: integer("guard_id")
    .references(() => budgetGuards.id, { onDelete: "cascade" }),
  alertType: text("alert_type")
    .$type<"threshold_reached" | "limit_exceeded" | "anomaly_detected">()
    .notNull(),
  thresholdPercent: real("threshold_percent"),
  currentValue: real("current_value"),
  limitValue: real("limit_value"),
  message: text("message"),
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedBy: varchar("acknowledged_by")
    .references(() => authUsers.id, { onDelete: "set null" }),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export const adminSettings = pgTable("admin_settings", {
  key: varchar("key").primaryKey(),
  value: jsonb("value").notNull(),
  category: text("category")
    .$type<"media" | "api" | "features" | "pricing" | "general">()
    .notNull()
    .default("general"),
  description: text("description"),
  updatedBy: varchar("updated_by")
    .references(() => authUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userMediaPreferences = pgTable("user_media_preferences", {
  id: serial("id").primaryKey(),
  authUserId: varchar("auth_user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  mediaMode: text("media_mode")
    .$type<"voice" | "video" | "both">()
    .notNull()
    .default("both"),
  effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
  updatedBy: varchar("updated_by")
    .references(() => authUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiCostDailyRollup = pgTable("api_cost_daily_rollup", {
  id: serial("id").primaryKey(),
  service: text("service")
    .$type<"openai" | "tavily" | "heygen" | "whisper" | "other">()
    .notNull(),
  date: timestamp("date").notNull(),
  totalRequests: integer("total_requests").default(0),
  totalTokensIn: integer("total_tokens_in").default(0),
  totalTokensOut: integer("total_tokens_out").default(0),
  totalCost: real("total_cost").default(0),
  currency: varchar("currency").default("USD"),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

// Admin table relations
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(authUsers, {
    fields: [userRoles.authUserId],
    references: [authUsers.id],
  }),
  assignedByUser: one(authUsers, {
    fields: [userRoles.assignedBy],
    references: [authUsers.id],
  }),
}));

export const userLoginEventsRelations = relations(userLoginEvents, ({ one }) => ({
  user: one(authUsers, {
    fields: [userLoginEvents.authUserId],
    references: [authUsers.id],
  }),
}));

export const apiUsageEventsRelations = relations(apiUsageEvents, ({ one }) => ({
  user: one(users, {
    fields: [apiUsageEvents.userId],
    references: [users.id],
  }),
  authUser: one(authUsers, {
    fields: [apiUsageEvents.authUserId],
    references: [authUsers.id],
  }),
  session: one(roleplaySession, {
    fields: [apiUsageEvents.sessionId],
    references: [roleplaySession.id],
  }),
}));

export const userMediaPreferencesRelations = relations(userMediaPreferences, ({ one }) => ({
  user: one(authUsers, {
    fields: [userMediaPreferences.authUserId],
    references: [authUsers.id],
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
export const insertPresentationScenarioSchema = createInsertSchema(presentationScenarios).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPresentationSessionSchema = createInsertSchema(presentationSessions).omit({ id: true, createdAt: true });
export const insertPresentationFeedbackSchema = createInsertSchema(presentationFeedback).omit({ id: true, createdAt: true });

// Job Targets Insert Schemas
export const insertJobTargetSchema = createInsertSchema(jobTargets).omit({ createdAt: true, updatedAt: true });
export const insertUserSkillPatternSchema = createInsertSchema(userSkillPatterns).omit({ id: true, createdAt: true, updatedAt: true });

// Interview Practice Lab Insert Schemas
export const insertRoleKitSchema = createInsertSchema(roleKits).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInterviewRubricSchema = createInsertSchema(interviewRubrics).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserDocumentSchema = createInsertSchema(userDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserProfileExtractedSchema = createInsertSchema(userProfileExtracted).omit({ id: true });
export const insertInterviewConfigSchema = createInsertSchema(interviewConfigs).omit({ id: true, createdAt: true });
export const insertInterviewPlanSchema = createInsertSchema(interviewPlans).omit({ id: true, createdAt: true });
export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInterviewAnalysisSchema = createInsertSchema(interviewAnalysis).omit({ id: true, createdAt: true });
export const insertInterviewArtifactSchema = createInsertSchema(interviewArtifacts).omit({ id: true, createdAt: true });

// Interview Exercise Mode Insert Schemas
export const insertCaseTemplateSchema = createInsertSchema(caseTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCodingExerciseSchema = createInsertSchema(codingExercises).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExerciseSessionSchema = createInsertSchema(exerciseSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExerciseRubricSchema = createInsertSchema(exerciseRubrics).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExerciseAnalysisSchema = createInsertSchema(exerciseAnalysis).omit({ id: true, createdAt: true });

// Admin Insert Schemas
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserLoginEventSchema = createInsertSchema(userLoginEvents).omit({ id: true });
export const insertApiUsageEventSchema = createInsertSchema(apiUsageEvents).omit({ id: true });
export const insertSessionJourneyEventSchema = createInsertSchema(sessionJourneyEvents).omit({ id: true });
export const insertBudgetGuardSchema = createInsertSchema(budgetGuards).omit({ id: true });
export const insertBudgetAlertSchema = createInsertSchema(budgetAlerts).omit({ id: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ createdAt: true, updatedAt: true });
export const insertUserMediaPreferenceSchema = createInsertSchema(userMediaPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApiCostDailyRollupSchema = createInsertSchema(apiCostDailyRollup).omit({ id: true });

// =====================
// Types
// =====================

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;
export type Tone = typeof tones.$inferSelect;
export type InsertTone = z.infer<typeof insertToneSchema>;
export type Avatar = typeof avatars.$inferSelect;
export type InsertAvatar = z.infer<typeof insertAvatarSchema>;
export type RoleplaySession = typeof roleplaySession.$inferSelect;
export type InsertRoleplaySession = z.infer<typeof insertRoleplaySessionSchema>;
export type Transcript = typeof transcripts.$inferSelect;
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type TranscriptMessage = typeof transcriptMessages.$inferSelect;
export type InsertTranscriptMessage = z.infer<typeof insertTranscriptMessageSchema>;
export type AiSessionAnalysis = typeof aiSessionAnalysis.$inferSelect;
export type InsertAiSessionAnalysis = z.infer<typeof insertAiSessionAnalysisSchema>;
export type HeygenSession = typeof heygenSessions.$inferSelect;
export type InsertHeygenSession = z.infer<typeof insertHeygenSessionSchema>;
export type HeygenQueue = typeof heygenQueue.$inferSelect;
export type InsertHeygenQueue = z.infer<typeof insertHeygenQueueSchema>;
export type CustomScenario = typeof customScenarios.$inferSelect;
export type InsertCustomScenario = z.infer<typeof insertCustomScenarioSchema>;
export type Skill = typeof skills.$inferSelect;
export type SkillDimensionAssessment = typeof skillDimensionAssessments.$inferSelect;
export type InsertSkillDimensionAssessment = z.infer<typeof insertSkillDimensionAssessmentSchema>;
export type SkillAssessmentSummary = typeof skillAssessmentSummary.$inferSelect;
export type InsertSkillAssessmentSummary = z.infer<typeof insertSkillAssessmentSummarySchema>;
export type CustomScenarioSkillMapping = typeof customScenarioSkillMappings.$inferSelect;
export type InsertCustomScenarioSkillMapping = z.infer<typeof insertCustomScenarioSkillMappingSchema>;
export type CulturalStylePreset = typeof culturalStylePresets.$inferSelect;
export type InsertCulturalStylePreset = z.infer<typeof insertCulturalStylePresetSchema>;
export type PresentationScenario = typeof presentationScenarios.$inferSelect;
export type InsertPresentationScenario = z.infer<typeof insertPresentationScenarioSchema>;
export type PresentationFeedbackType = typeof presentationFeedback.$inferSelect;
export type InsertPresentationFeedback = z.infer<typeof insertPresentationFeedbackSchema>;

// Job Targets Types
export type JobTarget = typeof jobTargets.$inferSelect;
export type InsertJobTarget = z.infer<typeof insertJobTargetSchema>;
export type UserSkillPattern = typeof userSkillPatterns.$inferSelect;
export type InsertUserSkillPattern = z.infer<typeof insertUserSkillPatternSchema>;

// Interview Practice Lab Types
export type RoleKit = typeof roleKits.$inferSelect;
export type InsertRoleKit = z.infer<typeof insertRoleKitSchema>;
export type InterviewRubric = typeof interviewRubrics.$inferSelect;
export type InsertInterviewRubric = z.infer<typeof insertInterviewRubricSchema>;
export type UserDocument = typeof userDocuments.$inferSelect;
export type InsertUserDocument = z.infer<typeof insertUserDocumentSchema>;
export type UserProfileExtracted = typeof userProfileExtracted.$inferSelect;
export type InsertUserProfileExtracted = z.infer<typeof insertUserProfileExtractedSchema>;
export type InterviewConfig = typeof interviewConfigs.$inferSelect;
export type InsertInterviewConfig = z.infer<typeof insertInterviewConfigSchema>;
export type InterviewPlan = typeof interviewPlans.$inferSelect;
export type InsertInterviewPlan = z.infer<typeof insertInterviewPlanSchema>;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewAnalysisType = typeof interviewAnalysis.$inferSelect;
export type InsertInterviewAnalysis = z.infer<typeof insertInterviewAnalysisSchema>;
export type InterviewArtifact = typeof interviewArtifacts.$inferSelect;
export type InsertInterviewArtifact = z.infer<typeof insertInterviewArtifactSchema>;

// Interview Exercise Mode Types
export type CaseTemplate = typeof caseTemplates.$inferSelect;
export type InsertCaseTemplate = z.infer<typeof insertCaseTemplateSchema>;
export type CodingExercise = typeof codingExercises.$inferSelect;
export type InsertCodingExercise = z.infer<typeof insertCodingExerciseSchema>;
export type ExerciseSession = typeof exerciseSessions.$inferSelect;
export type InsertExerciseSession = z.infer<typeof insertExerciseSessionSchema>;
export type ExerciseRubric = typeof exerciseRubrics.$inferSelect;
export type InsertExerciseRubric = z.infer<typeof insertExerciseRubricSchema>;
export type ExerciseAnalysisType = typeof exerciseAnalysis.$inferSelect;
export type InsertExerciseAnalysis = z.infer<typeof insertExerciseAnalysisSchema>;

// Admin Types
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserLoginEvent = typeof userLoginEvents.$inferSelect;
export type InsertUserLoginEvent = z.infer<typeof insertUserLoginEventSchema>;
export type ApiUsageEvent = typeof apiUsageEvents.$inferSelect;
export type InsertApiUsageEvent = z.infer<typeof insertApiUsageEventSchema>;
export type SessionJourneyEvent = typeof sessionJourneyEvents.$inferSelect;
export type InsertSessionJourneyEvent = z.infer<typeof insertSessionJourneyEventSchema>;
export type BudgetGuard = typeof budgetGuards.$inferSelect;
export type InsertBudgetGuard = z.infer<typeof insertBudgetGuardSchema>;
export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type InsertBudgetAlert = z.infer<typeof insertBudgetAlertSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type UserMediaPreference = typeof userMediaPreferences.$inferSelect;
export type InsertUserMediaPreference = z.infer<typeof insertUserMediaPreferenceSchema>;
export type ApiCostDailyRollup = typeof apiCostDailyRollup.$inferSelect;
export type InsertApiCostDailyRollup = z.infer<typeof insertApiCostDailyRollupSchema>;
