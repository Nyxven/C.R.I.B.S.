import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { articleProgress } from "@/db/schema";
import type { ProgressEntry } from "@/lib/domain/progress";

// The only file that touches reading progress. Every query includes the user id (no IDOR).
export async function listProgress(userId: string): Promise<ProgressEntry[]> {
  const rows = await db
    .select({ slug: articleProgress.articleSlug, saved: articleProgress.saved, read: articleProgress.read })
    .from(articleProgress)
    .where(eq(articleProgress.userId, userId));
  return rows;
}

export async function setSaved(userId: string, slug: string, value: boolean) {
  const now = new Date();
  await db.insert(articleProgress).values({ userId, articleSlug: slug, saved: value, updatedAt: now })
    .onConflictDoUpdate({ target: [articleProgress.userId, articleProgress.articleSlug], set: { saved: value, updatedAt: now } });
}

export async function setRead(userId: string, slug: string, value: boolean) {
  const now = new Date();
  const readAt = value ? now : null;
  await db.insert(articleProgress).values({ userId, articleSlug: slug, read: value, readAt, updatedAt: now })
    .onConflictDoUpdate({ target: [articleProgress.userId, articleProgress.articleSlug], set: { read: value, readAt, updatedAt: now } });
}

export async function getEntry(userId: string, slug: string): Promise<ProgressEntry | undefined> {
  const [row] = await db
    .select({ slug: articleProgress.articleSlug, saved: articleProgress.saved, read: articleProgress.read })
    .from(articleProgress)
    .where(and(eq(articleProgress.userId, userId), eq(articleProgress.articleSlug, slug)))
    .limit(1);
  return row;
}
