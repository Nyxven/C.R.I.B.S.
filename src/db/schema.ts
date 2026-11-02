import { pgTable, text, timestamp, boolean, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

// --- Auth tables (own implementation; secrets live in env, never in the DB) ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(), // stored lowercased
  passwordHash: text("password_hash").notNull(), // argon2id(HMAC(pepper, password))
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(), // HMAC of the cookie token, never the token itself
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});
export const loginCode = pgTable(
  "login_code",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    purpose: text("purpose").notNull(), // "verify" | "reset"
    codeHash: text("code_hash").notNull(), // HMAC of the 6-digit code
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("login_code_email_purpose").on(t.email, t.purpose)],
);
export const rateLimit = pgTable("rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
});

// --- App tables (P3 expands these) ---
export const profile = pgTable("profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  relationship: text("relationship"),
  language: text("language").notNull().default("en"),
  theme: text("theme").notNull().default("sunrise"),
  textSize: integer("text_size").notNull().default(100),
  sensoryMode: boolean("sensory_mode").notNull().default(false),
  notifOn: boolean("notif_on").notNull().default(true),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
});
export const child = pgTable("child", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  ageYears: integer("age_years"),
  journeyStage: text("journey_stage"),
  communicationLevel: text("communication_level"),
  commTools: jsonb("comm_tools").$type<string[]>().default([]),
  sensory: jsonb("sensory").$type<Record<string, "seeks" | "avoids" | "none">>().default({}),
  calming: text("calming"),
  interests: text("interests"),
  challenges: jsonb("challenges").$type<string[]>().default([]),
  school: text("school"),
  hasTherapist: text("has_therapist"),
  wanderingRisk: text("wandering_risk"),
  avoid: text("avoid"),
  wearsTag: boolean("wears_tag").default(false),
  tagNetwork: text("tag_network"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const emergencyContact = pgTable("emergency_contact", {
  id: text("id").primaryKey(),
  childId: text("child_id").notNull().references(() => child.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
});
