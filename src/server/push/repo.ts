import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { behaviorLog, communicationLog, profile, pushSubscription } from "@/db/schema";

// The only file that touches phone-notification rows. Every query a person can trigger includes their user id.
export type PushRow = { id: string; endpoint: string; p256dh: string; auth: string; locale: string };
const cols = { id: pushSubscription.id, endpoint: pushSubscription.endpoint, p256dh: pushSubscription.p256dh, auth: pushSubscription.auth, locale: pushSubscription.locale };

/** A device that says yes again (or moves to another account) keeps one row. */
export async function upsert(userId: string, s: { endpoint: string; p256dh: string; auth: string; locale: string }): Promise<void> {
  await db.insert(pushSubscription).values({ id: randomUUID(), userId, ...s })
    .onConflictDoUpdate({ target: pushSubscription.endpoint, set: { userId, p256dh: s.p256dh, auth: s.auth, locale: s.locale } });
}
export const listForUser = (userId: string): Promise<PushRow[]> =>
  db.select(cols).from(pushSubscription).where(eq(pushSubscription.userId, userId)).orderBy(asc(pushSubscription.createdAt));
export async function removeEndpoint(userId: string, endpoint: string): Promise<boolean> {
  return (await db.delete(pushSubscription).where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint))).returning({ id: pushSubscription.id })).length > 0;
}
/** For the sender: the push service said these devices are gone. */
export async function removeIds(ids: string[]): Promise<void> {
  if (ids.length) await db.delete(pushSubscription).where(inArray(pushSubscription.id, ids));
}
export async function setLocale(userId: string, locale: string): Promise<void> {
  await db.update(pushSubscription).set({ locale }).where(eq(pushSubscription.userId, userId));
}
export async function hasEndpoint(userId: string, endpoint: string): Promise<boolean> {
  const [r] = await db.select({ id: pushSubscription.id }).from(pushSubscription)
    .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint))).limit(1);
  return !!r;
}

/** For the daily reminders: everyone with at least one device turned on. */
export async function usersWithPush(): Promise<string[]> {
  return (await db.selectDistinct({ userId: pushSubscription.userId }).from(pushSubscription)).map((r) => r.userId);
}
export async function countLogsSince(userId: string, since: Date): Promise<number> {
  const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(behaviorLog).where(and(eq(behaviorLog.userId, userId), gte(behaviorLog.occurredAt, since)));
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(communicationLog).where(and(eq(communicationLog.userId, userId), gte(communicationLog.occurredAt, since)));
  return (b?.n ?? 0) + (c?.n ?? 0);
}
export async function setLastReminder(userId: string, at: Date): Promise<void> {
  await db.update(profile).set({ lastReminderAt: at }).where(eq(profile.userId, userId));
}
