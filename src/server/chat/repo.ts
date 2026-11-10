import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatMessage, chatThread, profile } from "@/db/schema";
import type { Source } from "@/lib/ai/citations";
import type { Feedback } from "@/lib/chat/history";

// The only file that touches saved conversations. EVERY query is scoped by the signed-in user's id (no IDOR).
export type ThreadRow = { id: string; title: string; updatedAt: Date };
export type MessageRow = { id: string; role: "user" | "assistant"; content: string; sources: Source[]; feedback: Feedback | null; createdAt: Date };

export async function isHistoryEnabled(userId: string): Promise<boolean> {
  const [row] = await db.select({ on: profile.chatHistoryEnabled }).from(profile).where(eq(profile.userId, userId)).limit(1);
  return row?.on ?? true;
}
export async function setHistoryEnabled(userId: string, value: boolean): Promise<void> {
  await db.insert(profile).values({ userId, chatHistoryEnabled: value }).onConflictDoUpdate({ target: profile.userId, set: { chatHistoryEnabled: value } });
}

export async function countThreads(userId: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(chatThread).where(eq(chatThread.userId, userId));
  return r?.n ?? 0;
}
export async function oldestThreadIds(userId: string, keep: number): Promise<string[]> {
  const rows = await db.select({ id: chatThread.id }).from(chatThread).where(eq(chatThread.userId, userId)).orderBy(desc(chatThread.updatedAt)).offset(keep);
  return rows.map((r) => r.id);
}
export async function createThread(userId: string, title: string, expiresAt: Date): Promise<string> {
  const id = randomUUID();
  await db.insert(chatThread).values({ id, userId, title, expiresAt });
  return id;
}
export async function getThread(userId: string, id: string): Promise<{ id: string; title: string } | undefined> {
  const [row] = await db.select({ id: chatThread.id, title: chatThread.title }).from(chatThread).where(and(eq(chatThread.id, id), eq(chatThread.userId, userId))).limit(1);
  return row;
}
export const listThreads = (userId: string, limit: number): Promise<ThreadRow[]> =>
  db.select({ id: chatThread.id, title: chatThread.title, updatedAt: chatThread.updatedAt }).from(chatThread).where(eq(chatThread.userId, userId)).orderBy(desc(chatThread.updatedAt)).limit(limit);

/** Oldest first. Joined to the thread so another person's id returns nothing. */
export async function listMessages(userId: string, threadId: string, limit: number): Promise<MessageRow[]> {
  const rows = await db
    .select({ id: chatMessage.id, role: chatMessage.role, content: chatMessage.content, sources: chatMessage.sources, feedback: chatMessage.feedback, createdAt: chatMessage.createdAt })
    .from(chatMessage).innerJoin(chatThread, eq(chatThread.id, chatMessage.threadId))
    .where(and(eq(chatThread.id, threadId), eq(chatThread.userId, userId)))
    .orderBy(asc(chatMessage.createdAt), asc(chatMessage.role)).limit(limit);
  return rows.map((r) => ({ ...r, role: r.role === "assistant" ? "assistant" : "user", feedback: r.feedback === "up" || r.feedback === "down" ? r.feedback : null }));
}
export async function countMessages(threadId: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(chatMessage).where(eq(chatMessage.threadId, threadId));
  return r?.n ?? 0;
}

/** Adds a question and its answer, and moves the chat's expiry forward. Caller has already checked ownership. */
export async function addTurn(threadId: string, t: { question: string; answer: string; sources: Source[]; inputTokens: number; outputTokens: number }, now: Date, expiresAt: Date): Promise<string> {
  const assistantId = randomUUID();
  await db.insert(chatMessage).values([
    { id: randomUUID(), threadId, role: "user", content: t.question, createdAt: now },
    { id: assistantId, threadId, role: "assistant", content: t.answer, sources: t.sources, inputTokens: t.inputTokens, outputTokens: t.outputTokens, createdAt: new Date(now.getTime() + 1) },
  ]);
  await db.update(chatThread).set({ updatedAt: now, expiresAt }).where(eq(chatThread.id, threadId));
  return assistantId;
}

/** Sets or clears a thumb on an answer in one of the person's own chats. True when a row changed. */
export async function setFeedback(userId: string, messageId: string, value: Feedback | null): Promise<boolean> {
  const mine = db.select({ id: chatThread.id }).from(chatThread).where(eq(chatThread.userId, userId));
  const rows = await db.update(chatMessage).set({ feedback: value }).where(and(eq(chatMessage.id, messageId), eq(chatMessage.role, "assistant"), inArray(chatMessage.threadId, mine))).returning({ id: chatMessage.id });
  return rows.length > 0;
}
export async function getFeedback(userId: string, messageId: string): Promise<Feedback | null | undefined> {
  const [row] = await db.select({ f: chatMessage.feedback }).from(chatMessage).innerJoin(chatThread, eq(chatThread.id, chatMessage.threadId)).where(and(eq(chatMessage.id, messageId), eq(chatThread.userId, userId))).limit(1);
  if (!row) return undefined;
  return row.f === "up" || row.f === "down" ? row.f : null;
}

export async function deleteThread(userId: string, id: string): Promise<boolean> {
  return (await db.delete(chatThread).where(and(eq(chatThread.id, id), eq(chatThread.userId, userId))).returning({ id: chatThread.id })).length > 0;
}
export async function deleteThreads(userId: string, ids: string[]): Promise<void> {
  if (ids.length) await db.delete(chatThread).where(and(eq(chatThread.userId, userId), inArray(chatThread.id, ids)));
}
export async function deleteAllThreads(userId: string): Promise<number> {
  return (await db.delete(chatThread).where(eq(chatThread.userId, userId)).returning({ id: chatThread.id })).length;
}
/** For the daily cleanup. */
export async function deleteExpiredThreads(): Promise<number> {
  return (await db.delete(chatThread).where(lt(chatThread.expiresAt, new Date())).returning({ id: chatThread.id })).length;
}
