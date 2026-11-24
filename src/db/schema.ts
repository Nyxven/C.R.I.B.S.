import type { FoundFields } from "@/lib/found/card";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
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
  homeLayout: jsonb("home_layout").$type<{ id: string; visible: boolean }[]>(), // Home sections in the person's order; null = default
  findMyUrl: text("find_my_url"), // Apple Find My "Share Item Location" link the parent pasted; works for about 7 days
  findMyAddedAt: timestamp("find_my_added_at"),
  remindRead: boolean("remind_read").notNull().default(true), // phone reminders: a guide to read
  remindLog: boolean("remind_log").notNull().default(true), // phone reminders: add today's log
  lastReminderAt: timestamp("last_reminder_at"),
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
  titleFil: text("title_fil"), // Filipino translation (draft); null = show English
  htmlFil: text("html_fil"),
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

// ---------- Parent community (no private messages; reported posts are held for review) ----------
export const post = pgTable("post", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnyPgColumn => post.id, { onDelete: "cascade" }), // set for a reply to a top-level post; replies go when their post goes
  displayName: text("display_name").notNull(), // first name or "Anonymous parent", fixed when written
  anonymous: boolean("anonymous").notNull().default(false),
  body: text("body").notNull(), // emptied when the author deletes the post
  status: text("status").notNull().default("visible"), // visible | hidden | removed
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("post_feed_idx").on(t.status, t.createdAt), index("post_parent_idx").on(t.parentId, t.createdAt), index("post_user_idx").on(t.userId)]);

export const postReaction = pgTable("post_reaction", {
  postId: text("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("helpful"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.postId, t.userId, t.kind] })]);

export const postReport = pgTable("post_report", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), // the reporter
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("post_report_once").on(t.postId, t.userId)]);

// ---------- Notifications ----------
export const notification = pgTable("notification", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // reply | helpful | moderation | account | article
  body: text("body").notNull(), // plain text
  link: text("link"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("notification_user_idx").on(t.userId, t.createdAt)]);

// ---------- Parent logs (private to the account; deleted with it) ----------
// Behavior log: an ABC record (antecedent, behavior, consequence) plus setting, intensity, duration and context.
export const behaviorLog = pgTable("behavior_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  occurredAt: timestamp("occurred_at").notNull(),
  setting: text("setting"), // home | school | community | other
  antecedent: text("antecedent").notNull(),
  behavior: text("behavior").notNull(),
  consequence: text("consequence"),
  intensity: integer("intensity"), // 1 (mild) to 5 (severe)
  durationMin: integer("duration_min"),
  context: jsonb("context").$type<string[]>().notNull().default([]), // sleep | sensory | schedule | hunger | unwell | new_place
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("behavior_log_user_idx").on(t.userId, t.occurredAt)]);

// Communication log: how the child communicated, who started it, what for, and whether it was understood.
export const communicationLog = pgTable("communication_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  occurredAt: timestamp("occurred_at").notNull(),
  mode: text("mode").notNull(), // speech | aac | sign | gesture | picture | other
  initiation: text("initiation").notNull(), // child | prompted
  purpose: text("purpose").notNull(), // request | reject | comment | greet | other
  understood: boolean("understood").notNull(),
  setting: text("setting"),
  example: text("example"), // what was said or shown, e.g. "AAC device, 3 messages"
  context: jsonb("context").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("communication_log_user_idx").on(t.userId, t.occurredAt)]);

// ---------- Phone notifications (Web Push). One row per device that said yes; deleted with the account. ----------
export const pushSubscription = pgTable("push_subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  locale: text("locale").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("push_subscription_user_idx").on(t.userId)]);
