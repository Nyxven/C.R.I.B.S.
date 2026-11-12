import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { post, postReaction, postReport } from "@/db/schema";

// The only file that touches community posts. The service decides who may do what; this file only runs the queries.
export type PostRow = { id: string; userId: string; parentId: string | null; displayName: string; anonymous: boolean; body: string; status: string; createdAt: Date };
const cols = { id: post.id, userId: post.userId, parentId: post.parentId, displayName: post.displayName, anonymous: post.anonymous, body: post.body, status: post.status, createdAt: post.createdAt };

export async function insertPost(p: { userId: string; parentId: string | null; displayName: string; anonymous: boolean; body: string }): Promise<string> {
  const id = randomUUID();
  await db.insert(post).values({ id, ...p });
  return id;
}
export async function getPost(id: string): Promise<PostRow | undefined> {
  const [row] = await db.select(cols).from(post).where(eq(post.id, id)).limit(1);
  return row;
}

/** Top-level posts, newest first. Everyone sees visible ones; an author also sees their own held posts. */
export async function listTop(viewerId: string, limit: number, before?: { createdAt: Date; id: string }): Promise<PostRow[]> {
  const shown = or(eq(post.status, "visible"), and(eq(post.status, "hidden"), eq(post.userId, viewerId)));
  const page = before ? or(lt(post.createdAt, before.createdAt), and(eq(post.createdAt, before.createdAt), lt(post.id, before.id))) : undefined;
  return db.select(cols).from(post).where(and(isNull(post.parentId), shown, page)).orderBy(desc(post.createdAt), desc(post.id)).limit(limit);
}
export async function listReplies(viewerId: string, parentIds: string[]): Promise<PostRow[]> {
  if (!parentIds.length) return [];
  const shown = or(eq(post.status, "visible"), and(eq(post.status, "hidden"), eq(post.userId, viewerId)));
  return db.select(cols).from(post).where(and(inArray(post.parentId, parentIds), shown)).orderBy(asc(post.createdAt), asc(post.id));
}

/** Helpful counts and whether the viewer already marked each post. */
export async function helpfulFor(viewerId: string, ids: string[]): Promise<Map<string, { count: number; mine: boolean }>> {
  const out = new Map<string, { count: number; mine: boolean }>();
  if (!ids.length) return out;
  const rows = await db.select({ postId: postReaction.postId, n: sql<number>`count(*)::int`, mine: sql<boolean>`bool_or(${postReaction.userId} = ${viewerId})` })
    .from(postReaction).where(and(inArray(postReaction.postId, ids), eq(postReaction.kind, "helpful"))).groupBy(postReaction.postId);
  for (const r of rows) out.set(r.postId, { count: r.n, mine: r.mine });
  return out;
}

export async function addHelpful(postId: string, userId: string): Promise<boolean> {
  return (await db.insert(postReaction).values({ postId, userId, kind: "helpful" }).onConflictDoNothing().returning({ postId: postReaction.postId })).length > 0;
}
export async function removeHelpful(postId: string, userId: string): Promise<boolean> {
  return (await db.delete(postReaction).where(and(eq(postReaction.postId, postId), eq(postReaction.userId, userId), eq(postReaction.kind, "helpful"))).returning({ postId: postReaction.postId })).length > 0;
}
export async function helpfulCount(postId: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(postReaction).where(and(eq(postReaction.postId, postId), eq(postReaction.kind, "helpful")));
  return r?.n ?? 0;
}

/** False when this person already reported this post. */
export async function addReport(postId: string, userId: string, reason: string): Promise<boolean> {
  return (await db.insert(postReport).values({ id: randomUUID(), postId, userId, reason }).onConflictDoNothing().returning({ id: postReport.id })).length > 0;
}
export async function reportsFor(postId: string): Promise<{ reporters: number; reasons: string[] }> {
  const rows = await db.select({ reason: postReport.reason }).from(postReport).where(eq(postReport.postId, postId));
  return { reporters: rows.length, reasons: rows.map((r) => r.reason) };
}

export async function setStatus(id: string, status: "visible" | "hidden" | "removed"): Promise<void> {
  await db.update(post).set({ status }).where(eq(post.id, id));
}
/** The author deletes their own post: the words are erased, only an empty "removed" shell stays so replies keep their place. */
export async function softDeleteOwn(userId: string, id: string): Promise<boolean> {
  return (await db.update(post).set({ body: "", status: "removed" }).where(and(eq(post.id, id), eq(post.userId, userId), sql`${post.status} <> 'removed'`)).returning({ id: post.id })).length > 0;
}

/** Posts waiting for a moderator, oldest first, with how many people reported them. */
export async function listHeld(limit: number): Promise<(PostRow & { reports: number })[]> {
  const rows = await db.select({ ...cols, reports: sql<number>`(select count(*)::int from post_report r where r.post_id = "post"."id")` })
    .from(post).where(eq(post.status, "hidden")).orderBy(asc(post.createdAt)).limit(limit);
  return rows;
}

/** A moderator removes a post: the words are erased too. */
export async function removePost(id: string): Promise<void> {
  await db.update(post).set({ body: "", status: "removed" }).where(eq(post.id, id));
}
