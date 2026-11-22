-- Session 12: parent logs, Home layout, Filipino guide text. Safe to run more than once (Neon SQL Editor).
CREATE TABLE IF NOT EXISTS "behavior_log" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "occurred_at" timestamp NOT NULL,
  "setting" text,
  "antecedent" text NOT NULL,
  "behavior" text NOT NULL,
  "consequence" text,
  "intensity" integer,
  "duration_min" integer,
  "context" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "behavior_log_user_idx" ON "behavior_log" ("user_id", "occurred_at");

CREATE TABLE IF NOT EXISTS "communication_log" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "occurred_at" timestamp NOT NULL,
  "mode" text NOT NULL,
  "initiation" text NOT NULL,
  "purpose" text NOT NULL,
  "understood" boolean NOT NULL,
  "setting" text,
  "example" text,
  "context" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "communication_log_user_idx" ON "communication_log" ("user_id", "occurred_at");

ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "home_layout" jsonb;
ALTER TABLE "article" ADD COLUMN IF NOT EXISTS "title_fil" text;
ALTER TABLE "article" ADD COLUMN IF NOT EXISTS "html_fil" text;
