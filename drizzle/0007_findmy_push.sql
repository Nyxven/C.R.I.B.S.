-- Session 13: Find My link, phone notifications and reminders. Safe to run more than once (Neon SQL Editor).
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "find_my_url" text;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "find_my_added_at" timestamp;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "remind_read" boolean DEFAULT true NOT NULL;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "remind_log" boolean DEFAULT true NOT NULL;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "last_reminder_at" timestamp;

CREATE TABLE IF NOT EXISTS "push_subscription" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "endpoint" text NOT NULL UNIQUE,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "locale" text DEFAULT 'en' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "push_subscription_user_idx" ON "push_subscription" ("user_id");
