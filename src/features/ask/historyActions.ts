"use server";
import { revalidatePath } from "next/cache";
import type { Feedback } from "@/lib/chat/history";
import { getSession } from "@/server/auth/session";
import * as chat from "@/server/chat/service";
import { dbGuard } from "@/server/security/repo";

// Thin boundary for the history screens. The person always comes from the session, and every call is rate-limited.
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function run<T>(fn: (userId: string) => Promise<R<T>>): Promise<R<T>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Please sign in again." };
  try {
    if (!(await dbGuard.consume(`hist:${session.user.id}`, 1, 60, 60)).allowed) return { ok: false, error: "Please slow down and try again in a minute." };
    return await fn(session.user.id);
  } catch (e) {
    console.error("[chat-history] unexpected error:", e instanceof Error ? e.name : "unknown");
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export const tapFeedbackAction = async (input: { messageId: string; value: Feedback }) => run((id) => chat.tapFeedback(id, input));
export const deleteThreadAction = async (threadId: string) => run(async (id) => { const r = await chat.deleteMyThread(id, threadId); revalidatePath("/ask/history"); return r; });
export const deleteAllThreadsAction = async () => run(async (id) => { const r = await chat.deleteAllMyThreads(id); revalidatePath("/ask/history"); return r; });
export const setHistoryEnabledAction = async (enabled: boolean) => run(async (id) => { const r = await chat.setHistorySetting(id, enabled); revalidatePath("/ask/history"); return r; });
