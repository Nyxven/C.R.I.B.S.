import { deleteExpiredLimits } from "@/server/security/repo";
import { deleteOlderThan as deleteOldNotifications } from "@/server/notifications/repo";
import { KEEP_DAYS } from "@/server/notifications/service";
import * as repo from "./repo";

export const UNVERIFIED_DAYS = 7;
export type CleanupReport = { limits: number; sessions: number; codes: number; unverifiedUsers: number; chats: number; notifications: number };

/** The daily cleanup. Each step runs on its own, so one failure does not stop the rest. */
export async function runCleanup(log: (m: string) => void = console.error): Promise<CleanupReport> {
  const step = async (name: string, fn: () => Promise<number>) => {
    try { return await fn(); } catch (e) { log(`[cleanup] ${name} failed: ${e instanceof Error ? e.name : "unknown"}`); return -1; }
  };
  return {
    limits: await step("limits", deleteExpiredLimits),
    sessions: await step("sessions", repo.deleteExpiredSessions),
    codes: await step("codes", repo.deleteExpiredCodes),
    unverifiedUsers: await step("unverified users", () => repo.deleteStaleUnverifiedUsers(UNVERIFIED_DAYS)),
    chats: await step("chats", repo.deleteExpiredChats),
    notifications: await step("notifications", () => deleteOldNotifications(KEEP_DAYS)),
  };
}
