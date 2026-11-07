"use server";
import { getSession } from "@/server/auth/session";
import * as onboarding from "@/server/onboarding/service";
import type { OnboardingResult } from "@/server/onboarding/service";

// Thin boundary between the quiz UI and the server. The user always comes from the session, never from the request.
async function run(fn: (userId: string) => Promise<OnboardingResult>): Promise<OnboardingResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Please sign in again." };
  try {
    return await fn(session.user.id);
  } catch (e) { // Name + message only: never the answers (child data is sensitive).
    console.error("[onboarding] unexpected error:", e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : "unknown");
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export const saveStepAction = async (input: unknown) => run((id) => onboarding.saveStep(id, input));
export const skipStepAction = async (input: unknown) => run((id) => onboarding.skipStep(id, input));
export const finishOnboardingAction = async () => run((id) => onboarding.finish(id));
