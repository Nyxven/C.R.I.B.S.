import { and, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { chatThread, loginCode, session, user } from "@/db/schema";

// Housekeeping deletes. Only things that are already useless: expired, or abandoned before verifying.
export async function deleteExpiredSessions(): Promise<number> {
  return (await db.delete(session).where(lt(session.expiresAt, new Date())).returning({ id: session.id })).length;
}
export async function deleteExpiredCodes(): Promise<number> {
  return (await db.delete(loginCode).where(lt(loginCode.expiresAt, new Date())).returning({ id: loginCode.id })).length;
}
/** Accounts that never verified their email within `days`. Their rows cascade away. */
export async function deleteStaleUnverifiedUsers(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  return (await db.delete(user).where(and(isNull(user.emailVerifiedAt), lt(user.createdAt, cutoff))).returning({ id: user.id })).length;
}
/** Saved Ask chats past their 30 days (messages go with them). */
export async function deleteExpiredChats(): Promise<number> {
  return (await db.delete(chatThread).where(lt(chatThread.expiresAt, new Date())).returning({ id: chatThread.id })).length;
}
