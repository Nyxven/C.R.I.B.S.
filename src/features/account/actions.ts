"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import { endSession } from "@/server/auth/session";
import * as account from "@/server/account/service";
import { saveStep } from "@/server/onboarding/service";
import { dbGuard } from "@/server/security/repo";

// Thin boundary for Settings. The person always comes from the session; every call is rate-limited.
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function run<T>(fn: (s: { userId: string; sessionId: string }) => Promise<R<T>>): Promise<R<T>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Please sign in again." };
  try {
    if (!(await dbGuard.consume(`acct:act:${session.user.id}`, 1, 40, 60)).allowed) return { ok: false, error: "Please slow down and try again in a minute." };
    return await fn({ userId: session.user.id, sessionId: session.id });
  } catch (e) {
    console.error("[account] unexpected error:", e instanceof Error ? e.name : "unknown");
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export const changePasswordAction = async (input: unknown) => run(({ userId, sessionId }) => account.changePassword(userId, sessionId, input, dbGuard));
export const signOutOthersAction = async () => run(({ userId, sessionId }) => account.signOutOtherDevices(userId, sessionId, dbGuard));
export const exportDataAction = async () => run(({ userId }) => account.exportData(userId, dbGuard));
export const updateSettingsAction = async (input: unknown) => run(async ({ userId }) => { const r = await account.updateSettings(userId, input); revalidatePath("/settings"); return r; });
/** Edit one part of the child's profile later (same checks as the quiz, but the quiz position is left alone). */
export const saveProfileStepAction = async (input: unknown) => run(async ({ userId }) => { const r = await saveStep(userId, input, { advance: false }); revalidatePath("/home"); return r; });
export const deleteAccountAction = async (input: unknown) => {
  const r = await run(({ userId }) => account.deleteAccount(userId, input, dbGuard));
  if (r.ok) await endSession().catch(() => undefined); // the session row is already gone; this clears the cookie
  return r;
};
