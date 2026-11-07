import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { child, emergencyContact, profile } from "@/db/schema";

// The only file that talks to the database for the quiz. Every child query includes the user id (no IDOR).
export type ProfileRow = typeof profile.$inferSelect;
export type ChildRow = typeof child.$inferSelect;
export type ContactRow = typeof emergencyContact.$inferSelect;
export type ChildPatch = Partial<Omit<typeof child.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">>;

export async function getProfile(userId: string): Promise<ProfileRow | undefined> {
  const [row] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
  return row;
}
/** v1 has one child per account: the oldest one. */
export async function getChild(userId: string): Promise<ChildRow | undefined> {
  const [row] = await db.select().from(child).where(eq(child.userId, userId)).orderBy(asc(child.createdAt)).limit(1);
  return row;
}
export async function getContact(childId: string): Promise<ContactRow | undefined> {
  const [row] = await db.select().from(emergencyContact).where(eq(emergencyContact.childId, childId)).limit(1);
  return row;
}

export async function upsertProfile(userId: string, patch: { displayName: string; relationship: string }) {
  await db.insert(profile).values({ userId, ...patch }).onConflictDoUpdate({ target: profile.userId, set: patch });
}
/** Moves the resume pointer forward, never back. */
export async function advanceStep(userId: string, step: number) {
  await db
    .insert(profile)
    .values({ userId, onboardingStep: step })
    .onConflictDoUpdate({ target: profile.userId, set: { onboardingStep: sql`greatest(${profile.onboardingStep}, ${step})` } });
}
export async function completeOnboarding(userId: string) {
  await db
    .insert(profile)
    .values({ userId, onboardingCompletedAt: new Date() })
    .onConflictDoUpdate({ target: profile.userId, set: { onboardingCompletedAt: sql`coalesce(${profile.onboardingCompletedAt}, now())` } });
}

export async function insertChild(userId: string, id: string, values: ChildPatch & { nickname: string }) {
  await db.insert(child).values({ id, userId, ...values });
}
export async function updateChild(userId: string, id: string, patch: ChildPatch) {
  await db.update(child).set({ ...patch, updatedAt: new Date() }).where(and(eq(child.id, id), eq(child.userId, userId)));
}
/** One emergency contact per child in v1. `null` removes it. */
export async function setContact(childId: string, contact: { name: string; phone: string } | null) {
  const existing = await getContact(childId);
  if (!contact) {
    if (existing) await db.delete(emergencyContact).where(eq(emergencyContact.id, existing.id));
  } else if (existing) {
    await db.update(emergencyContact).set(contact).where(eq(emergencyContact.id, existing.id));
  } else {
    await db.insert(emergencyContact).values({ id: crypto.randomUUID(), childId, ...contact });
  }
}
