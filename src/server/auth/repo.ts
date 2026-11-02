import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { user, session, loginCode } from "@/db/schema";

export type UserRow = typeof user.$inferSelect;
export type Purpose = "verify" | "reset";

// ---------- users ----------
export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  return row;
}
export async function insertUser(v: { id: string; name: string; email: string; passwordHash: string }) {
  await db.insert(user).values(v);
}
export async function resetUnverifiedUser(id: string, v: { name: string; passwordHash: string }) {
  await db.update(user).set({ ...v, updatedAt: new Date() }).where(and(eq(user.id, id), sql`${user.emailVerifiedAt} is null`));
}
export async function markEmailVerified(id: string) {
  await db.update(user).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(user.id, id));
}
export async function setPasswordHash(id: string, passwordHash: string) {
  await db.update(user).set({ passwordHash, updatedAt: new Date() }).where(eq(user.id, id));
}

// ---------- one-time codes (one live code per email + purpose) ----------
export async function upsertLoginCode(v: { id: string; email: string; purpose: Purpose; codeHash: string; expiresAt: Date }) {
  await db
    .insert(loginCode)
    .values(v)
    .onConflictDoUpdate({
      target: [loginCode.email, loginCode.purpose],
      set: { id: v.id, codeHash: v.codeHash, expiresAt: v.expiresAt, attempts: 0, createdAt: new Date() },
    });
}
export async function getLoginCode(email: string, purpose: Purpose) {
  const [row] = await db.select().from(loginCode).where(and(eq(loginCode.email, email), eq(loginCode.purpose, purpose))).limit(1);
  return row;
}
export async function bumpCodeAttempts(id: string) {
  await db.update(loginCode).set({ attempts: sql`${loginCode.attempts} + 1` }).where(eq(loginCode.id, id));
}
export async function deleteLoginCode(email: string, purpose: Purpose) {
  await db.delete(loginCode).where(and(eq(loginCode.email, email), eq(loginCode.purpose, purpose)));
}

// ---------- sessions ----------
export async function insertSession(v: { id: string; userId: string; tokenHash: string; expiresAt: Date }) {
  await db.insert(session).values(v);
}
export async function findSessionByDigests(digests: string[]) {
  const [row] = await db
    .select({ session, user: { id: user.id, name: user.name, email: user.email } })
    .from(session)
    .innerJoin(user, eq(user.id, session.userId))
    .where(inArray(session.tokenHash, digests))
    .limit(1);
  return row;
}
export async function touchSession(id: string, expiresAt: Date) {
  await db.update(session).set({ lastSeenAt: new Date(), expiresAt }).where(eq(session.id, id));
}
export async function deleteSession(id: string) {
  await db.delete(session).where(eq(session.id, id));
}
export async function deleteUserSessions(userId: string) {
  await db.delete(session).where(eq(session.userId, userId));
}

// ---------- rate limit (fixed window, single atomic statement) ----------
export async function hitRateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean }> {
  const res = await db.execute(sql`
    insert into rate_limit (key, count, reset_at)
    values (${key}, 1, now() + make_interval(secs => ${windowSec}))
    on conflict (key) do update set
      count = case when rate_limit.reset_at < now() then 1 else rate_limit.count + 1 end,
      reset_at = case when rate_limit.reset_at < now() then now() + make_interval(secs => ${windowSec}) else rate_limit.reset_at end
    returning count`);
  const count = Number((res.rows[0] as { count: number | string }).count);
  return { allowed: count <= limit };
}
