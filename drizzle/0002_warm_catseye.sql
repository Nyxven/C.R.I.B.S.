CREATE TABLE IF NOT EXISTS "article" (
	"slug" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"title" text NOT NULL,
	"read_time" text NOT NULL,
	"html" text NOT NULL,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_progress" (
	"user_id" text NOT NULL,
	"article_slug" text NOT NULL,
	"saved" boolean DEFAULT false NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "article_progress_user_id_article_slug_pk" PRIMARY KEY("user_id","article_slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "module" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faq" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professional" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"location" text NOT NULL,
	"note" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"verified_at" timestamp,
	"source" text
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "article" ADD CONSTRAINT "article_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "article_progress" ADD CONSTRAINT "article_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "article_progress" ADD CONSTRAINT "article_progress_article_slug_article_slug_fk" FOREIGN KEY ("article_slug") REFERENCES "public"."article"("slug") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "article_module_idx" ON "article" USING btree ("module_id");