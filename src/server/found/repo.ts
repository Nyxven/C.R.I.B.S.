import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { child, emergencyContact, foundToken } from "@/db/schema";
import type { FoundFields } from "@/lib/found/card";

// The only file that touches "if found" tags. Parent-side calls take the child's id, which the service got from the
// signed-in user's id; the public lookup takes only a token hash.
export type TagRow = { id: string; enabled: boolean; createdAt: Date; accessCount: number; lastAccessedAt: Date | null; publicFields: FoundFields };

export async function activeTag(childId: string): Promise<TagRow | undefined> {
  const [row] = await db
    .select({ id: foundToken.id, enabled: foundToken.enabled, createdAt: foundToken.createdAt, accessCount: foundToken.accessCount, lastAccessedAt: foundToken.lastAccessedAt, publicFields: foundToken.publicFields })
    .from(foundToken).where(and(eq(foundToken.childId, childId), isNull(foundToken.revokedAt))).orderBy(desc(foundToken.createdAt)).limit(1);
  return row;
}

/** Stops every live link for this child. */
export async function revokeAll(childId: string): Promise<number> {
  return (await db.update(foundToken).set({ enabled: false, revokedAt: new Date() }).where(and(eq(foundToken.childId, childId), isNull(foundToken.revokedAt))).returning({ id: foundToken.id })).length;
}
export async function insertTag(childId: string, tokenHash: string, fields: FoundFields): Promise<void> {
  await db.insert(foundToken).values({ id: randomUUID(), childId, tokenHash, publicFields: fields });
}
export async function updateFields(childId: string, fields: FoundFields): Promise<boolean> {
  return (await db.update(foundToken).set({ publicFields: fields }).where(and(eq(foundToken.childId, childId), isNull(foundToken.revokedAt))).returning({ id: foundToken.id })).length > 0;
}
export async function setEnabled(childId: string, enabled: boolean): Promise<boolean> {
  return (await db.update(foundToken).set({ enabled }).where(and(eq(foundToken.childId, childId), isNull(foundToken.revokedAt))).returning({ id: foundToken.id })).length > 0;
}

export type PublicRow = {
  id: string; enabled: boolean; revokedAt: Date | null; publicFields: FoundFields;
  nickname: string; communicationLevel: string | null; calming: string | null; avoid: string | null;
  contactName: string | null; contactPhone: string | null; contactPublic: boolean | null;
};
/** By hash only. Returns what the public page may need; the service decides what is actually shown. */
export async function findByHash(hash: string): Promise<PublicRow | undefined> {
  const [row] = await db
    .select({
      id: foundToken.id, enabled: foundToken.enabled, revokedAt: foundToken.revokedAt, publicFields: foundToken.publicFields,
      nickname: child.nickname, communicationLevel: child.communicationLevel, calming: child.calming, avoid: child.avoid,
      contactName: emergencyContact.name, contactPhone: emergencyContact.phone, contactPublic: emergencyContact.isPublic,
    })
    .from(foundToken).innerJoin(child, eq(child.id, foundToken.childId)).leftJoin(emergencyContact, eq(emergencyContact.childId, child.id))
    .where(eq(foundToken.tokenHash, hash)).limit(1);
  return row;
}
/** A count and a time: nothing about the visitor. */
export async function bumpAccess(id: string): Promise<void> {
  await db.update(foundToken).set({ accessCount: sql`${foundToken.accessCount} + 1`, lastAccessedAt: new Date() }).where(eq(foundToken.id, id));
}
