"use server";
import { getSession } from "@/server/auth/session";
import { dbGuard } from "@/server/security/repo";
import * as logs from "@/server/logs/service";
import type { LogKind, LogResult } from "@/server/logs/service";

// Thin boundary between the log forms and the server. The user always comes from the session.
async function run(fn: (userId: string) => Promise<LogResult>): Promise<LogResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Please sign in again." };
  try {
    return await fn(session.user.id);
  } catch (e) {
    console.error("[logs] unexpected error:", e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : "unknown");
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export const addLogAction = async (kind: LogKind, input: unknown) => run((id) => logs.addEntry(id, kind, input, dbGuard));
export const deleteLogAction = async (input: unknown) => run((id) => logs.deleteEntry(id, input));
