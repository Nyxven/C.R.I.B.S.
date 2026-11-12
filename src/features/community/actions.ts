"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import * as community from "@/server/community/service";
import { markAll, markOne } from "@/server/notifications/service";
import { dbGuard } from "@/server/security/repo";

// Thin boundary for the community and notification screens. The person always comes from the session.
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function run<T>(fn: (u: { userId: string; email: string; ageHours: number }) => Promise<R<T>>): Promise<R<T>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Please sign in again." };
  try {
    if (!(await dbGuard.consume(`comm:act:${session.user.id}`, 1, 60, 60)).allowed) return { ok: false, error: "Please slow down and try again in a minute." };
    return await fn({ userId: session.user.id, email: session.user.email, ageHours: (Date.now() - session.user.createdAt.getTime()) / 3_600_000 });
  } catch (e) {
    console.error("[community] unexpected error:", e instanceof Error ? e.name : "unknown");
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export const createPostAction = async (input: unknown) => run(async (u) => { const r = await community.createPost({ userId: u.userId, accountAgeHours: u.ageHours }, input, dbGuard); revalidatePath("/community"); return r; });
export const setHelpfulAction = async (input: { postId: string; on: boolean }) => run((u) => community.setHelpful(u.userId, input.postId, input.on, dbGuard));
export const reportPostAction = async (input: { postId: string; reason: string }) => run((u) => community.reportPost(u.userId, input.postId, input.reason, dbGuard));
export const deletePostAction = async (postId: string) => run(async (u) => { const r = await community.deleteOwnPost(u.userId, postId); revalidatePath("/community"); return r; });
export const moderateAction = async (input: { postId: string; action: string }) => run(async (u) => { const r = await community.moderate(u.email, input.postId, input.action); revalidatePath("/community/moderation"); return r; });
export const loadMoreAction = async (cursor: string) => run(async (u) => ({ ok: true as const, ...(await community.feed(u.userId, cursor)) }));
export const markAllReadAction = async () => run(async (u) => { const r = await markAll(u.userId); revalidatePath("/notifications"); return r; });
export const markReadAction = async (id: string) => run(async (u) => { const r = await markOne(u.userId, id); return r.ok ? { ok: true as const } : { ok: false as const, error: "Not found." }; });
