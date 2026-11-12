import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { notification } from "@/db/schema";

// The only file that touches notifications. Every query is scoped by the signed-in person's id.
export type NotificationRow = { id: string; type: string; body: string; link: string | null; readAt: Date | null; createdAt: Date };

export async function insert(userId: string, n: { type: string; body: string; link: string | null }): Promise<void> {
  await db.insert(notification).values({ id: randomUUID(), userId, ...n });
}
export const list = (userId: string, limit: number): Promise<NotificationRow[]> =>
  db.select({ id: notification.id, type: notification.type, body: notification.body, link: notification.link, readAt: notification.readAt, createdAt: notification.createdAt })
    .from(notification).where(eq(notification.userId, userId)).orderBy(desc(notification.createdAt)).limit(limit);
export async function unreadCount(userId: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(notification).where(and(eq(notification.userId, userId), isNull(notification.readAt)));
  return r?.n ?? 0;
}
export async function markRead(userId: string, id: string): Promise<boolean> {
  return (await db.update(notification).set({ readAt: new Date() }).where(and(eq(notification.id, id), eq(notification.userId, userId), isNull(notification.readAt))).returning({ id: notification.id })).length > 0;
}
export async function markAllRead(userId: string): Promise<number> {
  return (await db.update(notification).set({ readAt: new Date() }).where(and(eq(notification.userId, userId), isNull(notification.readAt))).returning({ id: notification.id })).length;
}
/** For the daily cleanup. */
export async function deleteOlderThan(days: number): Promise<number> {
  return (await db.delete(notification).where(lt(notification.createdAt, new Date(Date.now() - days * 86_400_000))).returning({ id: notification.id })).length;
}
