CREATE TABLE "ai_analysis_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"date_range" jsonb NOT NULL,
	"insights" jsonb NOT NULL,
	"improvements" jsonb,
	"recommendations" jsonb NOT NULL,
	"metrics" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"details" jsonb NOT NULL,
	"result" text NOT NULL,
	"error_message" text,
	"duration" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"rarity" text NOT NULL,
	"requirements" jsonb NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true,
	"image_url" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "badges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "broker_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"broker_type" text NOT NULL,
	"connection_type" text NOT NULL,
	"status" text DEFAULT 'disconnected',
	"credentials" jsonb,
	"config" jsonb,
	"last_sync" timestamp,
	"last_sync_status" text,
	"last_sync_error" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "broker_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broker_connection_id" uuid NOT NULL,
	"broker_trade_id" text NOT NULL,
	"symbol" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" text NOT NULL,
	"order_type" text,
	"exchange" text,
	"segment" text,
	"product" text,
	"validity" text,
	"disclosed_quantity" integer,
	"trigger_price" numeric(10, 2),
	"average_price" numeric(10, 2),
	"filled_quantity" integer,
	"pending_quantity" integer,
	"cancelled_quantity" integer,
	"order_timestamp" timestamp NOT NULL,
	"exchange_timestamp" timestamp,
	"broker_timestamp" timestamp,
	"broker_metadata" jsonb,
	"is_synced" boolean DEFAULT false,
	"synced_trade_id" uuid,
	"sync_error" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "coach_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text DEFAULT 'active',
	"assigned_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "compliance_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"report_type" text NOT NULL,
	"overall_score" integer NOT NULL,
	"passed" boolean NOT NULL,
	"violations" jsonb NOT NULL,
	"rules_checked" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"data_scope" jsonb NOT NULL,
	"generated_by" text NOT NULL,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"trade_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'sent',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "leaderboard_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leaderboard_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"score" numeric(10, 2) NOT NULL,
	"metrics" jsonb NOT NULL,
	"previous_rank" integer,
	"change" integer,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "leaderboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"timeframe" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"criteria" jsonb NOT NULL,
	"reset_schedule" text,
	"last_reset_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "mentor_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_recurring" boolean DEFAULT true,
	"timezone" text DEFAULT 'Asia/Kolkata',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "mentor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text NOT NULL,
	"specializations" jsonb NOT NULL,
	"experience" integer NOT NULL,
	"verification_status" text DEFAULT 'pending',
	"credentials" jsonb NOT NULL,
	"stats" jsonb NOT NULL,
	"pricing" jsonb NOT NULL,
	"availability" jsonb NOT NULL,
	"social_proof" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "mentor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "mentor_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"session_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"anonymous" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_mentor_student_session" UNIQUE("mentor_id","student_id","session_id")
);
--> statement-breakpoint
CREATE TABLE "mentorship_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"status" text DEFAULT 'scheduled',
	"price" numeric(10, 2) NOT NULL,
	"meeting_link" text,
	"recording_url" text,
	"notes" text,
	"feedback" jsonb,
	"payment_status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "post_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"content" text,
	"parent_interaction_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"risk_level" text NOT NULL,
	"details" jsonb NOT NULL,
	"is_alerted" boolean DEFAULT false,
	"alert_sent_at" timestamp,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"type" text NOT NULL,
	"trade_id" uuid,
	"achievement_id" uuid,
	"is_public" boolean DEFAULT true,
	"is_pinned" boolean DEFAULT false,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"tags" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "trade_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"trade_data" jsonb NOT NULL,
	"insights" jsonb NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"tags" jsonb,
	"status" text DEFAULT 'published',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "trade_story_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" uuid,
	"likes" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "trade_story_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_story_user" UNIQUE("story_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"entry_price" numeric(10, 2) NOT NULL,
	"exit_price" numeric(10, 2),
	"stop_loss" numeric(10, 2),
	"take_profit" numeric(10, 2),
	"pnl" numeric(10, 2),
	"status" text DEFAULT 'open',
	"entry_date" timestamp NOT NULL,
	"exit_date" timestamp,
	"notes" text,
	"strategy" text,
	"tags" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text,
	"badge_color" text DEFAULT '#3B82F6',
	"criteria" jsonb NOT NULL,
	"progress" jsonb NOT NULL,
	"earned_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_notified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"progress" jsonb NOT NULL,
	"earned_at" timestamp,
	"is_notified" boolean DEFAULT false,
	"is_displayed" boolean DEFAULT true,
	CONSTRAINT "unique_user_badge" UNIQUE("user_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'user',
	"trading_experience" text,
	"default_position_size" numeric(5, 2) DEFAULT '5.00',
	"risk_tolerance" text DEFAULT 'moderate',
	"email_notifications" boolean DEFAULT true,
	"subscription_plan" text DEFAULT 'basic',
	"subscription_status" text DEFAULT 'active',
	"subscription_ends_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_analysis_reports" ADD CONSTRAINT "ai_analysis_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_trades" ADD CONSTRAINT "broker_trades_broker_connection_id_broker_connections_id_fk" FOREIGN KEY ("broker_connection_id") REFERENCES "public"."broker_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_trades" ADD CONSTRAINT "broker_trades_synced_trade_id_trades_id_fk" FOREIGN KEY ("synced_trade_id") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_students" ADD CONSTRAINT "coach_students_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_students" ADD CONSTRAINT "coach_students_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_leaderboard_id_leaderboards_id_fk" FOREIGN KEY ("leaderboard_id") REFERENCES "public"."leaderboards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_availability" ADD CONSTRAINT "mentor_availability_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_reviews" ADD CONSTRAINT "mentor_reviews_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_reviews" ADD CONSTRAINT "mentor_reviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_reviews" ADD CONSTRAINT "mentor_reviews_session_id_mentorship_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentorship_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_interactions" ADD CONSTRAINT "post_interactions_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_interactions" ADD CONSTRAINT "post_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_achievement_id_user_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."user_achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_stories" ADD CONSTRAINT "trade_stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_story_comments" ADD CONSTRAINT "trade_story_comments_story_id_trade_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."trade_stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_story_comments" ADD CONSTRAINT "trade_story_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_story_likes" ADD CONSTRAINT "trade_story_likes_story_id_trade_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."trade_stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_story_likes" ADD CONSTRAINT "trade_story_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;