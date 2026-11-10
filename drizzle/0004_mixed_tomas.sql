CREATE TABLE IF NOT EXISTS "found_token" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"public_fields" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"access_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp,
	CONSTRAINT "found_token_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "found_token" ADD CONSTRAINT "found_token_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "found_token_child_idx" ON "found_token" USING btree ("child_id");