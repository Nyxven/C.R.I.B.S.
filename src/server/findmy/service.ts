import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { findMyStatus, parseFindMyUrl, type FindMyState } from "@/lib/domain/findmy";

// The parent's Find My "Share Item Location" link. Stored on their own profile row only.
export type FindMyLink = { url: string; addedAt: Date; state: FindMyState; expiresAt: Date };

export async function getFindMy(userId: string, now = new Date()): Promise<FindMyLink | null> {
  const [r] = await db.select({ url: profile.findMyUrl, addedAt: profile.findMyAddedAt }).from(profile).where(eq(profile.userId, userId)).limit(1);
  const url = parseFindMyUrl(r?.url); // re-checked on read, so an old bad value is never shown as a link
  if (!url || !r?.addedAt) return null;
  return { url, addedAt: r.addedAt, ...findMyStatus(r.addedAt, now) };
}

export async function saveFindMy(userId: string, raw: unknown): Promise<{ ok: true } | { ok: false; error: "bad" }> {
  const url = parseFindMyUrl(raw);
  if (!url) return { ok: false, error: "bad" };
  const addedAt = new Date();
  await db.insert(profile).values({ userId, findMyUrl: url, findMyAddedAt: addedAt })
    .onConflictDoUpdate({ target: profile.userId, set: { findMyUrl: url, findMyAddedAt: addedAt } });
  return { ok: true };
}

export async function removeFindMy(userId: string): Promise<void> {
  await db.update(profile).set({ findMyUrl: null, findMyAddedAt: null }).where(eq(profile.userId, userId));
}
