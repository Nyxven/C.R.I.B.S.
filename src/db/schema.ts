import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

// --- Better Auth core tables (verify against `npm run auth:generate`) ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
