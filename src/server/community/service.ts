import { z } from "zod";
import { getCommunityConfig } from "@/config/env";
import { isUuid } from "@/lib/chat/history";
import { CURSOR_PAGE, checkPostText, decodeCursor, displayNameFor, encodeCursor, isModerator, isReason, shouldHide, type ReportReason } from "@/lib/community/rules";
import { isHelpfulMilestone, texts } from "@/lib/notifications/rules";
import type { AbuseGuard } from "@/lib/security/guard";
import * as authRepo from "@/server/auth/repo";
import { notify } from "@/server/notifications/service";
import { getProfile } from "@/server/onboarding/repo";
import { EXAMPLE_POSTS } from "@/lib/community/examples";
import * as repo from "./repo";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
export type FeedPost = { id: string; displayName: string; body: string; createdAt: Date; isMine: boolean; held: boolean; example: boolean; helpful: { count: number; mine: boolean }; replies: FeedPost[] };

const TRY_LATER = "You have posted a lot for now. Please try again a little later.";
const GONE = "That post is not available.";
const createInput = z.object({ body: z.string().max(2000), anonymous: z.boolean().default(false), parentId: z.string().uuid().optional() }).strict();

/** Writes a post or a reply. Checks the words first, then the limits (new accounts get a lower daily limit). */
export async function createPost(ctx: { userId: string; accountAgeHours: number }, input: unknown, guard: AbuseGuard): Promise<Result<{ id: string }>> {
  const p = createInput.safeParse(input);
  if (!p.success) return { ok: false, error: "Please write something first." };
  const checked = checkPostText(p.data.body);
  if (!checked.ok) return { ok: false, error: checked.error };
  const day = ctx.accountAgeHours < 24 ? 2 : 20;
  if (!(await guard.consume(`comm:post:hr:${ctx.userId}`, 1, 5, 3600)).allowed || !(await guard.consume(`comm:post:day:${ctx.userId}`, 1, day, 86_400)).allowed) return { ok: false, error: TRY_LATER };

  let parent: repo.PostRow | undefined;
  if (p.data.parentId) {
    parent = await repo.getPost(p.data.parentId);
    if (!parent || parent.status !== "visible" || parent.parentId !== null) return { ok: false, error: GONE }; // replies go to visible top-level posts only
  }
  const name = (await getProfile(ctx.userId))?.displayName ?? (await authRepo.findUserById(ctx.userId))?.name ?? null;
  const displayName = displayNameFor(name, p.data.anonymous);
  const id = await repo.insertPost({ userId: ctx.userId, parentId: parent?.id ?? null, displayName, anonymous: p.data.anonymous, body: checked.text });
  if (parent && parent.userId !== ctx.userId) await notify(parent.userId, "reply", texts.reply(displayName), `/community#post-${parent.id}`);
  return { ok: true, id };
}

const toFeed = (r: repo.PostRow, viewerId: string, helpful: Map<string, { count: number; mine: boolean }>): FeedPost => ({
  id: r.id, displayName: r.displayName, body: r.body, createdAt: r.createdAt, isMine: r.userId === viewerId, held: r.status === "hidden", example: false,
  helpful: helpful.get(r.id) ?? { count: 0, mine: false }, replies: [],
});

/** One page of the feed, newest first, with replies and helpful counts. Example posts show only while there are no real ones. */
export async function feed(viewerId: string, cursor?: unknown): Promise<{ posts: FeedPost[]; next: string | null }> {
  const before = cursor ? decodeCursor(cursor) : null;
  const rows = await repo.listTop(viewerId, CURSOR_PAGE + 1, before ?? undefined);
  const page = rows.slice(0, CURSOR_PAGE);
  if (!page.length && !before) return { posts: EXAMPLE_POSTS, next: null };
  const replies = await repo.listReplies(viewerId, page.map((r) => r.id));
  const helpful = await repo.helpfulFor(viewerId, [...page.map((r) => r.id), ...replies.map((r) => r.id)]);
  const posts = page.map((r) => ({ ...toFeed(r, viewerId, helpful), replies: replies.filter((x) => x.parentId === r.id).map((x) => toFeed(x, viewerId, helpful)) }));
  const last = page.at(-1);
  return { posts, next: rows.length > CURSOR_PAGE && last ? encodeCursor(last.createdAt, last.id) : null };
}

/** Marks a post helpful (or takes it back). You cannot mark your own post. */
export async function setHelpful(userId: string, postId: unknown, on: unknown, guard: AbuseGuard): Promise<Result<{ count: number }>> {
  if (!isUuid(postId) || typeof on !== "boolean") return { ok: false, error: GONE };
  if (!(await guard.consume(`comm:react:${userId}`, 1, 60, 3600)).allowed) return { ok: false, error: TRY_LATER };
  const target = await repo.getPost(postId);
  if (!target || target.status !== "visible") return { ok: false, error: GONE };
  if (target.userId === userId) return { ok: false, error: "You cannot mark your own post." };
  if (on) {
    const added = await repo.addHelpful(postId, userId);
    const count = await repo.helpfulCount(postId);
    if (added && isHelpfulMilestone(count)) await notify(target.userId, "helpful", texts.helpful(count), `/community#post-${target.parentId ?? target.id}`);
    return { ok: true, count };
  }
  await repo.removeHelpful(postId, userId);
  return { ok: true, count: await repo.helpfulCount(postId) };
}

/** Reports a post. Urgent reasons hold it at once; otherwise it is held when enough different people report it. */
export async function reportPost(userId: string, postId: unknown, reason: unknown, guard: AbuseGuard): Promise<Result> {
  if (!isUuid(postId) || !isReason(reason)) return { ok: false, error: "Please choose a reason." };
  if (!(await guard.consume(`comm:report:${userId}`, 1, 10, 86_400)).allowed) return { ok: false, error: "You have sent a lot of reports today. Our moderators will look at them." };
  const target = await repo.getPost(postId);
  if (!target || target.status !== "visible") return { ok: false, error: GONE };
  if (target.userId === userId) return { ok: false, error: "You cannot report your own post. You can delete it instead." };
  if (!(await repo.addReport(postId, userId, reason as ReportReason))) return { ok: true }; // already reported: nothing more to do
  const r = await repo.reportsFor(postId);
  if (shouldHide({ reporters: r.reporters, reasons: r.reasons, hideAt: getCommunityConfig().reportHideAt })) {
    await repo.setStatus(postId, "hidden");
    await notify(target.userId, "moderation", texts.held, "/community");
  }
  return { ok: true };
}

export async function deleteOwnPost(userId: string, postId: unknown): Promise<Result> {
  return isUuid(postId) && (await repo.softDeleteOwn(userId, postId)) ? { ok: true } : { ok: false, error: GONE };
}

const NOT_MOD = "Only moderators can do that.";
const mods = (email: string | null | undefined) => isModerator(email, getCommunityConfig().moderatorEmails);

export async function moderationQueue(email: string | null | undefined): Promise<Result<{ items: (repo.PostRow & { reports: number })[] }>> {
  return mods(email) ? { ok: true, items: await repo.listHeld(50) } : { ok: false, error: NOT_MOD };
}

/** A moderator puts a held post back, or removes it for good. The author is told either way. */
export async function moderate(email: string | null | undefined, postId: unknown, action: unknown): Promise<Result> {
  if (!mods(email)) return { ok: false, error: NOT_MOD };
  if (!isUuid(postId) || (action !== "restore" && action !== "remove")) return { ok: false, error: GONE };
  const target = await repo.getPost(postId);
  if (!target || target.status !== "hidden") return { ok: false, error: GONE };
  if (action === "restore") await repo.setStatus(postId, "visible"); else await repo.removePost(postId);
  await notify(target.userId, "moderation", action === "restore" ? texts.restored : texts.removed, "/community");
  return { ok: true };
}

export const isMod = (email: string | null | undefined): boolean => mods(email);
