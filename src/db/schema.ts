import type { FoundFields } from "@/lib/found/card";
import { pgTable, text, timestamp, boolean, integer, jsonb, uniqueIndex, primaryKey, index } from "drizzle-orm/pg-core";

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
  onboardingStep: integer("onboarding_step").notNull().default(0), // next quiz step to show (resume)
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  chatHistoryEnabled: boolean("chat_history_enabled").notNull().default(true), // false = Ask conversations are not saved
});
export const child = pgTable("child", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  pronouns: text("pronouns"), // optional: "she" | "he" | "they"
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

// ---------- content (seeded by `npm run db:seed`, never written by users) ----------
export const contentModule = pgTable("module", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const article = pgTable("article", {
  slug: text("slug").primaryKey(),
  moduleId: text("module_id").notNull().references(() => contentModule.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  readTime: text("read_time").notNull(),
  html: text("html").notNull(), // trusted first-party seed HTML; sanitize before storing anything user-written
  reviewStatus: text("review_status").notNull().default("draft"), // prototype-content | draft | expert-reviewed
  sources: jsonb("sources").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("article_module_idx").on(t.moduleId)]);

export const faq = pgTable("faq", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const professional = pgTable("professional", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
  note: text("note").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  verifiedAt: timestamp("verified_at"), // empty = "Sample listing"
  source: text("source"),
});

// ---------- per-user reading state ----------
export const articleProgress = pgTable("article_progress", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  articleSlug: text("article_slug").notNull().references(() => article.slug, { onDelete: "cascade" }),
  saved: boolean("saved").notNull().default(false),
  read: boolean("read").notNull().default(false),
  readAt: timestamp("read_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.articleSlug] })]);

// ---------- Ask CRIBS history (kept 30 days after the last message; deleted by the daily cleanup) ----------
export const chatThread = pgTable("chat_thread", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (t) => [index("chat_thread_user_idx").on(t.userId, t.updatedAt), index("chat_thread_expires_idx").on(t.expiresAt)]);

export const chatMessage = pgTable("chat_message", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull().references(() => chatThread.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  sources: jsonb("sources").$type<{ id: string; title: string; href: string }[]>().notNull().default([]),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  feedback: text("feedback"), // "up" | "down" | null (assistant messages only)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("chat_message_thread_idx").on(t.threadId, t.createdAt)]);

// ---------- Find CRIBS "if found" tags (the QR link holds a random token; only its hash is stored) ----------
export const foundToken = pgTable("found_token", {
  id: text("id").primaryKey(),
  childId: text("child_id").notNull().references(() => child.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(), // sha256 of a 256-bit random token
  publicFields: jsonb("public_fields").$type<FoundFields>().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
  accessCount: integer("access_count").notNull().default(0), // a count only: no visitor details are kept
  lastAccessedAt: timestamp("last_accessed_at"),
}, (t) => [index("found_token_child_idx").on(t.childId)]);
