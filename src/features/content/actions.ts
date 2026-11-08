"use server";
import { getSession } from "@/server/auth/session";
import * as progress from "@/server/progress/service";
import type { ProgressResult } from "@/server/progress/service";

// Thin boundary between the reading buttons and the server. The user always comes from the session.
async function run(fn: (userId: string) => Promise<ProgressResult>): Promise<ProgressResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Please sign in again." };
  try {
    return await fn(session.user.id);
  } catch (e) {
    console.error("[content] unexpected error:", e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : "unknown");
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export const saveGuideAction = async (input: unknown) => run((id) => progress.saveGuide(id, input));
export const markReadAction = async (input: unknown) => run((id) => progress.markRead(id, input));
