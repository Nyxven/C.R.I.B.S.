CREATE TABLE "child" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nickname" text NOT NULL,
	"age_years" integer,
	"journey_stage" text,
	"communication_level" text,
	"comm_tools" jsonb DEFAULT '[]'::jsonb,
	"sensory" jsonb DEFAULT '{}'::jsonb,
	"calming" text,
	"interests" text,
	"challenges" jsonb DEFAULT '[]'::jsonb,
	"school" text,
	"has_therapist" text,
	"wandering_risk" text,
	"avoid" text,
	"wears_tag" boolean DEFAULT false,
	"tag_network" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_code" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"purpose" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"relationship" text,
	"language" text DEFAULT 'en' NOT NULL,
	"theme" text DEFAULT 'sunrise' NOT NULL,
	"text_size" integer DEFAULT 100 NOT NULL,
	"sensory_mode" boolean DEFAULT false NOT NULL,
	"notif_on" boolean DEFAULT true NOT NULL,
	"onboarding_completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "child" ADD CONSTRAINT "child_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "login_code_email_purpose" ON "login_code" USING btree ("email","purpose");