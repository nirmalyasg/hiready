CREATE TABLE IF NOT EXISTS "admin_settings" (
	"key" varchar PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"description" text,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_session_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"session_type" text DEFAULT 'audio_roleplay' NOT NULL,
	"transcript_id" varchar,
	"overall_score" integer NOT NULL,
	"user_talk_time" real NOT NULL,
	"other_talk_time" real NOT NULL,
	"user_talk_percentage" real NOT NULL,
	"filler_words" jsonb NOT NULL,
	"weak_words" jsonb NOT NULL,
	"sentence_openers" jsonb NOT NULL,
	"active_listening" boolean NOT NULL,
	"engagement_level" integer NOT NULL,
	"questions_asked" integer NOT NULL,
	"acknowledgments" integer NOT NULL,
	"interruptions" integer NOT NULL,
	"average_pacing" real NOT NULL,
	"pacing_variation" jsonb NOT NULL,
	"tone" jsonb NOT NULL,
	"pause_count" integer NOT NULL,
	"average_pause_length" real NOT NULL,
	"strengths" jsonb NOT NULL,
	"growth_areas" jsonb NOT NULL,
	"follow_up_questions" jsonb NOT NULL,
	"summary" text NOT NULL,
	"pronunciation_issues" jsonb NOT NULL,
	"pronunciation_suggestions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_type" text NOT NULL,
	"user_id" integer NOT NULL,
	"avatar_id" varchar,
	"knowledge_id" varchar,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"audio_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_cost_daily_rollup" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" text NOT NULL,
	"date" timestamp NOT NULL,
	"total_requests" integer DEFAULT 0,
	"total_tokens_in" integer DEFAULT 0,
	"total_tokens_out" integer DEFAULT 0,
	"total_cost" real DEFAULT 0,
	"currency" varchar DEFAULT 'USD',
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"auth_user_id" varchar,
	"session_id" integer,
	"service" text NOT NULL,
	"operation" text NOT NULL,
	"model" text,
	"tokens_in" integer DEFAULT 0,
	"tokens_out" integer DEFAULT 0,
	"request_units" real DEFAULT 1,
	"unit_cost" real DEFAULT 0,
	"estimated_cost" real DEFAULT 0,
	"currency" varchar DEFAULT 'USD',
	"duration_ms" integer,
	"success" boolean DEFAULT true,
	"error_message" text,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar,
	"password_hash" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_users_username_unique" UNIQUE("username"),
	CONSTRAINT "auth_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "avatars" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar,
	"look" varchar,
	"ethnicity" varchar,
	"gender" varchar,
	"role" varchar,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"guard_id" integer,
	"alert_type" text NOT NULL,
	"threshold_percent" real,
	"current_value" real,
	"limit_value" real,
	"message" text,
	"acknowledged" boolean DEFAULT false,
	"acknowledged_by" varchar,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget_guards" (
	"id" serial PRIMARY KEY NOT NULL,
	"guard_type" text NOT NULL,
	"limit_value" real NOT NULL,
	"currency" varchar DEFAULT 'USD',
	"is_active" boolean DEFAULT true,
	"fallback_action" text DEFAULT 'warn',
	"description" text,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "budget_guards_guard_type_unique" UNIQUE("guard_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_kit_id" integer,
	"name" varchar NOT NULL,
	"case_type" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"prompt_statement" text NOT NULL,
	"context" text,
	"clarifying_questions_allowed" integer DEFAULT 3,
	"revealable_data" jsonb,
	"evaluation_focus" jsonb,
	"probing_map" jsonb,
	"expected_duration_minutes" integer DEFAULT 15,
	"tags" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coding_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_kit_id" integer,
	"name" varchar NOT NULL,
	"activity_type" text NOT NULL,
	"language" varchar DEFAULT 'javascript' NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"code_snippet" text NOT NULL,
	"bug_description" text,
	"failing_test_case" text,
	"modification_requirement" text,
	"expected_behavior" text,
	"expected_signals" jsonb,
	"common_failure_modes" jsonb,
	"suggested_fix" text,
	"edge_cases" jsonb,
	"complexity_expected" text,
	"probing_questions" jsonb,
	"tags" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cultural_style_presets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"user_facing_description" text,
	"globesmart_profile" jsonb,
	"behavior_rules" jsonb,
	"typical_user_learnings" jsonb,
	"accent_guidance" jsonb,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_personas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"organization_id" varchar,
	"name" varchar NOT NULL,
	"user_role_title" varchar NOT NULL,
	"authority_and_constraints" jsonb NOT NULL,
	"success_criteria" jsonb NOT NULL,
	"common_mistakes" jsonb NOT NULL,
	"tone_guidance" text NOT NULL,
	"avatar_pushback_level" varchar DEFAULT 'medium' NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_scenario_skill_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"custom_scenario_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"ai_rationale" text,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_by_user_id" varchar,
	"dimension_weights" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"user_description" text NOT NULL,
	"blueprint" jsonb NOT NULL,
	"user_role" text,
	"avatar_role" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"exercise_session_id" integer NOT NULL,
	"rubric_id" integer,
	"overall_score" real NOT NULL,
	"dimension_scores" jsonb NOT NULL,
	"strengths_identified" jsonb,
	"areas_for_improvement" jsonb,
	"rewritten_answer" text,
	"better_clarifying_questions" jsonb,
	"missed_edge_cases" jsonb,
	"suggested_patch" text,
	"practice_plan" jsonb,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_rubrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"exercise_type" text NOT NULL,
	"dimensions" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"exercise_type" text NOT NULL,
	"case_template_id" integer,
	"coding_exercise_id" integer,
	"role_kit_id" integer,
	"interview_type" text DEFAULT 'hiring_manager',
	"style" text DEFAULT 'neutral',
	"thinking_time_used" integer DEFAULT 0,
	"session_uid" text NOT NULL,
	"transcript" text,
	"user_code_submission" text,
	"duration" integer DEFAULT 0,
	"status" text DEFAULT 'created' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_sessions_session_uid_unique" UNIQUE("session_uid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "heygen_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"scenario_id" integer,
	"avatar_id" varchar,
	"status" text DEFAULT 'queued' NOT NULL,
	"mode" text DEFAULT 'voice' NOT NULL,
	"priority" smallint DEFAULT 0,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"assigned_at" timestamp,
	"expires_at" timestamp,
	"assigned_session_id" integer,
	"estimated_wait_sec" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "heygen_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"scenario_id" integer,
	"avatar_id" varchar,
	"heygen_session_id" varchar,
	"cultural_preset_id" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"mode" text DEFAULT 'voice' NOT NULL,
	"quality" text DEFAULT 'low',
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"last_seen_at" timestamp DEFAULT now(),
	"session_duration_sec" integer DEFAULT 360,
	"actual_duration_sec" integer,
	"end_reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"interview_session_id" integer NOT NULL,
	"transcript_id" varchar,
	"overall_recommendation" text,
	"confidence_level" text,
	"summary" text,
	"dimension_scores" jsonb,
	"strengths" jsonb,
	"risks" jsonb,
	"role_fit_notes" jsonb,
	"better_answers" jsonb,
	"practice_plan" jsonb,
	"wins" jsonb,
	"improvements" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"interview_session_id" integer NOT NULL,
	"artifact_type" text NOT NULL,
	"artifact_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"role_kit_id" integer,
	"resume_doc_id" integer,
	"jd_doc_id" integer,
	"company_notes_doc_id" integer,
	"interview_type" text DEFAULT 'hr' NOT NULL,
	"style" text DEFAULT 'neutral' NOT NULL,
	"seniority" text DEFAULT 'entry' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"interview_config_id" integer NOT NULL,
	"plan_json" jsonb NOT NULL,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_rubrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"dimensions" jsonb NOT NULL,
	"scoring_guide" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"roleplay_session_id" integer,
	"interview_config_id" integer NOT NULL,
	"interview_plan_id" integer,
	"rubric_id" integer,
	"status" text DEFAULT 'created' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personas" (
	"id" serial PRIMARY KEY NOT NULL,
	"persona" varchar NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "presentation_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"presentation_session_id" integer NOT NULL,
	"presentation_scenario_id" integer NOT NULL,
	"overall_score" real NOT NULL,
	"communication_score" real NOT NULL,
	"communication_feedback" text,
	"delivery_score" real NOT NULL,
	"delivery_feedback" text,
	"subject_matter_score" real NOT NULL,
	"subject_matter_feedback" text,
	"slide_coverage" jsonb,
	"strengths" jsonb,
	"improvements" jsonb,
	"summary" text,
	"skill_assessment" jsonb,
	"document_analysis" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "presentation_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"topic" text NOT NULL,
	"context" text,
	"file_name" text NOT NULL,
	"file_url" text,
	"file_type" text,
	"total_slides" integer NOT NULL,
	"slides_data" jsonb NOT NULL,
	"extracted_text" text NOT NULL,
	"document_analysis" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "presentation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"presentation_scenario_id" integer NOT NULL,
	"session_uid" text NOT NULL,
	"duration" integer DEFAULT 0,
	"slides_covered" integer DEFAULT 0,
	"total_slides" integer DEFAULT 0,
	"transcript" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "presentation_sessions_session_uid_unique" UNIQUE("session_uid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_kits" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"level" text DEFAULT 'entry' NOT NULL,
	"domain" varchar NOT NULL,
	"description" text,
	"role_context" text,
	"core_competencies" jsonb,
	"typical_questions" jsonb,
	"default_interview_types" jsonb DEFAULT '["hr","technical"]'::jsonb,
	"default_rubric_id" integer,
	"skills_focus" jsonb,
	"estimated_duration" integer DEFAULT 360,
	"track_tags" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roleplay_session" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"avatar_id" varchar NOT NULL,
	"knowledge_id" varchar,
	"transcript_id" varchar,
	"cultural_preset_id" varchar,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp DEFAULT now(),
	"duration" integer,
	"audio_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scenario_skills" (
	"scenario_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	CONSTRAINT "scenario_skills_scenario_id_skill_id_pk" PRIMARY KEY("scenario_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"skill_id" integer,
	"name" varchar NOT NULL,
	"description" text,
	"context" text,
	"instructions" text,
	"opening_scene" text,
	"avatar_name" varchar,
	"avatar_role" varchar,
	"difficulty" text,
	"duration" numeric,
	"scenario_key" varchar,
	"short_title" varchar,
	"display_title" text,
	"tags" jsonb,
	"persona_overlays" jsonb,
	"counter_persona" jsonb,
	CONSTRAINT "scenarios_scenario_key_unique" UNIQUE("scenario_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_journey_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"auth_user_id" varchar,
	"session_id" integer,
	"step" text NOT NULL,
	"mode" text,
	"device" text,
	"language" varchar,
	"avatar_id" varchar,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_assessment_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"overall_skill_score" real NOT NULL,
	"framework_used" text,
	"assessment_notes" text,
	"strength_dimensions" jsonb,
	"improvement_dimensions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_dimension_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"dimension_name" text NOT NULL,
	"score" real NOT NULL,
	"max_score" real DEFAULT 5 NOT NULL,
	"evidence" text,
	"framework_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"definition" text NOT NULL,
	"level" integer NOT NULL,
	"parent_skill_id" integer,
	"category" text DEFAULT 'General',
	"is_active" boolean DEFAULT true NOT NULL,
	"framework_mapping" text,
	"reference_source" text,
	"assessment_dimensions" text,
	"scoring_model_logic" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tones" (
	"id" serial PRIMARY KEY NOT NULL,
	"tone" varchar NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcript_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"transcript_id" text NOT NULL,
	"messages" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcripts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"avatar_id" varchar NOT NULL,
	"knowledge_id" varchar,
	"context" text,
	"instructions" text,
	"scenario" text,
	"skill" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" integer NOT NULL,
	"session_id" integer NOT NULL,
	"ai_session_id" uuid,
	"skill_id" integer,
	"scenario_id" integer,
	"session_type" varchar DEFAULT 'streaming_avatar',
	"custom_scenario_id" integer,
	"cultural_preset_id" varchar,
	"session_config" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"doc_type" text NOT NULL,
	"file_name" varchar NOT NULL,
	"mime_type" varchar,
	"s3_url" text,
	"raw_text" text,
	"parsed_json" jsonb,
	"source_hash" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_login_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_user_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"session_id" varchar,
	"ip_address" varchar,
	"user_agent" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_media_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_user_id" varchar NOT NULL,
	"media_mode" text DEFAULT 'both' NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_media_preferences_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profile_extracted" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"latest_resume_doc_id" integer,
	"headline" text,
	"work_history" jsonb,
	"projects" jsonb,
	"skills_claimed" jsonb,
	"risk_flags" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_extracted_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_user_id" varchar NOT NULL,
	"role" text DEFAULT 'learner' NOT NULL,
	"assigned_by" varchar,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"auth_user_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_updated_by_auth_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_session_analysis" ADD CONSTRAINT "ai_session_analysis_session_id_roleplay_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "roleplay_session"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_session_analysis" ADD CONSTRAINT "ai_session_analysis_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "transcripts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_usage_events" ADD CONSTRAINT "api_usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_usage_events" ADD CONSTRAINT "api_usage_events_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_usage_events" ADD CONSTRAINT "api_usage_events_session_id_roleplay_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "roleplay_session"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_guard_id_budget_guards_id_fk" FOREIGN KEY ("guard_id") REFERENCES "budget_guards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_acknowledged_by_auth_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "auth_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_guards" ADD CONSTRAINT "budget_guards_updated_by_auth_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_templates" ADD CONSTRAINT "case_templates_role_kit_id_role_kits_id_fk" FOREIGN KEY ("role_kit_id") REFERENCES "role_kits"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coding_exercises" ADD CONSTRAINT "coding_exercises_role_kit_id_role_kits_id_fk" FOREIGN KEY ("role_kit_id") REFERENCES "role_kits"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_personas" ADD CONSTRAINT "custom_personas_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_scenario_skill_mappings" ADD CONSTRAINT "custom_scenario_skill_mappings_custom_scenario_id_custom_scenarios_id_fk" FOREIGN KEY ("custom_scenario_id") REFERENCES "custom_scenarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_scenario_skill_mappings" ADD CONSTRAINT "custom_scenario_skill_mappings_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_scenario_skill_mappings" ADD CONSTRAINT "custom_scenario_skill_mappings_confirmed_by_user_id_auth_users_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "auth_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_scenarios" ADD CONSTRAINT "custom_scenarios_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_analysis" ADD CONSTRAINT "exercise_analysis_exercise_session_id_exercise_sessions_id_fk" FOREIGN KEY ("exercise_session_id") REFERENCES "exercise_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_analysis" ADD CONSTRAINT "exercise_analysis_rubric_id_exercise_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "exercise_rubrics"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_case_template_id_case_templates_id_fk" FOREIGN KEY ("case_template_id") REFERENCES "case_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_coding_exercise_id_coding_exercises_id_fk" FOREIGN KEY ("coding_exercise_id") REFERENCES "coding_exercises"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_sessions" ADD CONSTRAINT "exercise_sessions_role_kit_id_role_kits_id_fk" FOREIGN KEY ("role_kit_id") REFERENCES "role_kits"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heygen_queue" ADD CONSTRAINT "heygen_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heygen_queue" ADD CONSTRAINT "heygen_queue_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heygen_queue" ADD CONSTRAINT "heygen_queue_avatar_id_avatars_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "avatars"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heygen_queue" ADD CONSTRAINT "heygen_queue_assigned_session_id_heygen_sessions_id_fk" FOREIGN KEY ("assigned_session_id") REFERENCES "heygen_sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heygen_sessions" ADD CONSTRAINT "heygen_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heygen_sessions" ADD CONSTRAINT "heygen_sessions_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heygen_sessions" ADD CONSTRAINT "heygen_sessions_avatar_id_avatars_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "avatars"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_analysis" ADD CONSTRAINT "interview_analysis_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "interview_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_analysis" ADD CONSTRAINT "interview_analysis_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "transcripts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_artifacts" ADD CONSTRAINT "interview_artifacts_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "interview_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_configs" ADD CONSTRAINT "interview_configs_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_configs" ADD CONSTRAINT "interview_configs_role_kit_id_role_kits_id_fk" FOREIGN KEY ("role_kit_id") REFERENCES "role_kits"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_configs" ADD CONSTRAINT "interview_configs_resume_doc_id_user_documents_id_fk" FOREIGN KEY ("resume_doc_id") REFERENCES "user_documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_configs" ADD CONSTRAINT "interview_configs_jd_doc_id_user_documents_id_fk" FOREIGN KEY ("jd_doc_id") REFERENCES "user_documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_configs" ADD CONSTRAINT "interview_configs_company_notes_doc_id_user_documents_id_fk" FOREIGN KEY ("company_notes_doc_id") REFERENCES "user_documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_plans" ADD CONSTRAINT "interview_plans_interview_config_id_interview_configs_id_fk" FOREIGN KEY ("interview_config_id") REFERENCES "interview_configs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_roleplay_session_id_roleplay_session_id_fk" FOREIGN KEY ("roleplay_session_id") REFERENCES "roleplay_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_interview_config_id_interview_configs_id_fk" FOREIGN KEY ("interview_config_id") REFERENCES "interview_configs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_interview_plan_id_interview_plans_id_fk" FOREIGN KEY ("interview_plan_id") REFERENCES "interview_plans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_rubric_id_interview_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "interview_rubrics"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentation_feedback" ADD CONSTRAINT "presentation_feedback_presentation_session_id_presentation_sessions_id_fk" FOREIGN KEY ("presentation_session_id") REFERENCES "presentation_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentation_feedback" ADD CONSTRAINT "presentation_feedback_presentation_scenario_id_presentation_scenarios_id_fk" FOREIGN KEY ("presentation_scenario_id") REFERENCES "presentation_scenarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentation_scenarios" ADD CONSTRAINT "presentation_scenarios_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentation_sessions" ADD CONSTRAINT "presentation_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presentation_sessions" ADD CONSTRAINT "presentation_sessions_presentation_scenario_id_presentation_scenarios_id_fk" FOREIGN KEY ("presentation_scenario_id") REFERENCES "presentation_scenarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roleplay_session" ADD CONSTRAINT "roleplay_session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roleplay_session" ADD CONSTRAINT "roleplay_session_avatar_id_avatars_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "avatars"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scenario_skills" ADD CONSTRAINT "scenario_skills_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scenario_skills" ADD CONSTRAINT "scenario_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_journey_events" ADD CONSTRAINT "session_journey_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_journey_events" ADD CONSTRAINT "session_journey_events_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_journey_events" ADD CONSTRAINT "session_journey_events_session_id_roleplay_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "roleplay_session"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_assessment_summary" ADD CONSTRAINT "skill_assessment_summary_session_id_roleplay_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "roleplay_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_assessment_summary" ADD CONSTRAINT "skill_assessment_summary_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_dimension_assessments" ADD CONSTRAINT "skill_dimension_assessments_session_id_roleplay_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "roleplay_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skill_dimension_assessments" ADD CONSTRAINT "skill_dimension_assessments_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcript_messages" ADD CONSTRAINT "transcript_messages_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "transcripts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_session_id_roleplay_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "roleplay_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_ai_session_id_ai_sessions_id_fk" FOREIGN KEY ("ai_session_id") REFERENCES "ai_sessions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_custom_scenario_id_custom_scenarios_id_fk" FOREIGN KEY ("custom_scenario_id") REFERENCES "custom_scenarios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_login_events" ADD CONSTRAINT "user_login_events_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_media_preferences" ADD CONSTRAINT "user_media_preferences_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_media_preferences" ADD CONSTRAINT "user_media_preferences_updated_by_auth_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profile_extracted" ADD CONSTRAINT "user_profile_extracted_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profile_extracted" ADD CONSTRAINT "user_profile_extracted_latest_resume_doc_id_user_documents_id_fk" FOREIGN KEY ("latest_resume_doc_id") REFERENCES "user_documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_auth_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "auth_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
