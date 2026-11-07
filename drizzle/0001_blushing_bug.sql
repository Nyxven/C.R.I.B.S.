ALTER TABLE "child" ADD COLUMN "pronouns" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "onboarding_step" integer DEFAULT 0 NOT NULL;