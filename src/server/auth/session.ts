import { cache } from "react";
import { cookies } from "next/headers";
import { newSessionToken, tokenDigests } from "./crypto";
import * as repo from "./repo";

const COOKIE = "cribs_session";
const ABSOLUTE_MS = 30 * 24 * 3600_000; // hard cap from sign-in
const IDLE_MS = 7 * 24 * 3600_000; // signed out after 7 idle days
const TOUCH_MS = 3600_000; // write last-seen at most hourly

export type SessionUser = { id: string; name: string; email: string; createdAt: Date };

/** New token on every sign-in (never reuse), stored only as a keyed hash. */
export async function startSession(userId: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + IDLE_MS);
  await repo.insertSession({ id: crypto.randomUUID(), userId, tokenHash: tokenDigests(token)[0], expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_MS / 1000,
  });
}

export const getSession = cache(async (): Promise<{ id: string; user: SessionUser } | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = await repo.findSessionByDigests(tokenDigests(token));
  if (!row) return null;
  const now = Date.now();
  const { session: s } = row;
  if (s.expiresAt.getTime() < now || s.createdAt.getTime() + ABSOLUTE_MS < now) {
    await repo.deleteSession(s.id);
    return null;
  }
  if (now - s.lastSeenAt.getTime() > TOUCH_MS) {
    await repo.touchSession(s.id, new Date(Math.min(now + IDLE_MS, s.createdAt.getTime() + ABSOLUTE_MS)));
  }
  return { id: s.id, user: row.user };
});

export async function endSession() {
  const s = await getSession();
  if (s) await repo.deleteSession(s.id);
  (await cookies()).delete(COOKIE);
}
