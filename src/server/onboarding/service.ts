import { randomUUID } from "node:crypto";
import {
  CHALLENGES, COMM_LEVELS, COMM_TOOLS, JOURNEY_STAGES, PRONOUNS, RELATIONSHIPS, SCHOOL_SETTINGS, SENSORY_KEYS,
  SENSORY_MODES, TAG_NETWORKS, THERAPIST, WANDERING, canFinish, clampStep, emptyData, isSkippable, stepIndex,
  type Option, type OnboardingData,
} from "@/lib/domain/onboarding";
import { firstMessage, saveStepInput, skipStepInput, type SaveStepInput } from "@/features/onboarding/schema";
import * as repo from "./repo";

export type OnboardingResult = { ok: true } | { ok: false; error: string };
export type OnboardingState = { step: number; data: OnboardingData };

const ok = (): OnboardingResult => ({ ok: true });
const fail = (error: string): OnboardingResult => ({ ok: false, error });
const NEED_CHILD = "Please tell us your child's name first, then we can save this.";
const NOT_SKIPPABLE = "This step can't be skipped.";
const NEED_BOTH = "Please add your name and your child's nickname first.";

const nul = (s: string) => (s === "" ? null : s);
/** Only values on the list come back; anything else (old or edited rows) becomes "". */
const asChoice = <T extends readonly Option[]>(list: T, v: string | null | undefined) =>
  (list.some((o) => o.value === v) ? v : "") as T[number]["value"] | "";

type OtherStep = Exclude<SaveStepInput, { step: "about" | "child" }>;
function toChildPatch(v: OtherStep): repo.ChildPatch {
  switch (v.step) {
    case "journey": return { journeyStage: nul(v.data.journeyStage) };
    case "communication": return { communicationLevel: nul(v.data.communicationLevel), commTools: v.data.commTools };
    case "sensory": {
      // "No strong reaction" is the same as not answering, so only real answers are stored.
      const sensory: Record<string, "seeks" | "avoids" | "none"> = {};
      for (const [k, m] of Object.entries(v.data.sensory)) if (m && m !== "none") sensory[k] = m;
      return { sensory };
    }
    case "calming": return { calming: nul(v.data.calming), interests: nul(v.data.interests) };
    case "challenges": return { challenges: v.data.challenges };
    case "daily": return { school: nul(v.data.school), hasTherapist: nul(v.data.hasTherapist) };
    case "safety":
      return { wanderingRisk: nul(v.data.wanderingRisk), avoid: nul(v.data.avoid), wearsTag: v.data.wearsTag, tagNetwork: nul(v.data.tagNetwork) };
  }
}

/** Saves one step. The step number moves forward only after the answers are stored. */
export async function saveStep(userId: string, input: unknown): Promise<OnboardingResult> {
  const p = saveStepInput.safeParse(input);
  if (!p.success) return fail(firstMessage(p.error));
  const v = p.data;

  if (v.step === "about") {
    await repo.upsertProfile(userId, { displayName: v.data.displayName, relationship: v.data.relationship });
  } else if (v.step === "child") {
    const patch = { nickname: v.data.nickname, ageYears: v.data.ageYears, pronouns: nul(v.data.pronouns) };
    const existing = await repo.getChild(userId);
    if (existing) await repo.updateChild(userId, existing.id, patch);
    else await repo.insertChild(userId, randomUUID(), patch);
  } else {
    const existing = await repo.getChild(userId);
    if (!existing) return fail(NEED_CHILD);
    await repo.updateChild(userId, existing.id, toChildPatch(v));
    if (v.step === "safety") {
      const { contactName, contactPhone } = v.data;
      await repo.setContact(existing.id, contactName && contactPhone ? { name: contactName, phone: contactPhone } : null);
    }
  }
  await repo.advanceStep(userId, stepIndex(v.step) + 1);
  return ok();
}

/** Skip keeps whatever was saved before and just moves on. */
export async function skipStep(userId: string, input: unknown): Promise<OnboardingResult> {
  const p = skipStepInput.safeParse(input);
  if (!p.success) return fail(firstMessage(p.error));
  if (!isSkippable(p.data.step)) return fail(NOT_SKIPPABLE);
  await repo.advanceStep(userId, stepIndex(p.data.step) + 1);
  return ok();
}

export async function finish(userId: string): Promise<OnboardingResult> {
  const [p, c] = await Promise.all([repo.getProfile(userId), repo.getChild(userId)]);
  if (!canFinish({ displayName: p?.displayName ?? "", nickname: c?.nickname ?? "" })) return fail(NEED_BOTH);
  await repo.completeOnboarding(userId);
  return ok();
}

export async function isOnboarded(userId: string): Promise<boolean> {
  return Boolean((await repo.getProfile(userId))?.onboardingCompletedAt);
}

/** Names for the Home greeting. */
export async function getGreeting(userId: string): Promise<{ parent: string; child: string }> {
  const [p, c] = await Promise.all([repo.getProfile(userId), repo.getChild(userId)]);
  return { parent: p?.displayName ?? "", child: c?.nickname ?? "" };
}

/** Everything the quiz screen needs: saved answers and where to resume. */
export async function loadOnboarding(userId: string, fallbackName: string): Promise<OnboardingState> {
  const [p, c] = await Promise.all([repo.getProfile(userId), repo.getChild(userId)]);
  const contact = c ? await repo.getContact(c.id) : undefined;
  const d = emptyData(p?.displayName ?? fallbackName);
  d.relationship = asChoice(RELATIONSHIPS, p?.relationship);
  if (c) {
    d.nickname = c.nickname;
    d.ageYears = c.ageYears;
    d.pronouns = asChoice(PRONOUNS, c.pronouns);
    d.journeyStage = asChoice(JOURNEY_STAGES, c.journeyStage);
    d.communicationLevel = asChoice(COMM_LEVELS, c.communicationLevel);
    d.commTools = (c.commTools ?? []).filter((t) => COMM_TOOLS.some((o) => o.value === t)) as OnboardingData["commTools"];
    for (const k of SENSORY_KEYS) {
      const m = c.sensory?.[k.value];
      if (m && m !== "none" && SENSORY_MODES.some((o) => o.value === m)) d.sensory[k.value] = m;
    }
    d.calming = c.calming ?? "";
    d.interests = c.interests ?? "";
    d.challenges = (c.challenges ?? []).filter((t) => CHALLENGES.some((o) => o.value === t)) as OnboardingData["challenges"];
    d.school = asChoice(SCHOOL_SETTINGS, c.school);
    d.hasTherapist = asChoice(THERAPIST, c.hasTherapist);
    d.wanderingRisk = asChoice(WANDERING, c.wanderingRisk);
    d.avoid = c.avoid ?? "";
    d.wearsTag = Boolean(c.wearsTag);
    d.tagNetwork = asChoice(TAG_NETWORKS, c.tagNetwork);
  }
  if (contact) { d.contactName = contact.name; d.contactPhone = contact.phone; }
  // Never resume past a required answer, even if the stored pointer says so.
  const limit = !d.displayName.trim() || !p?.displayName ? 0 : !c ? 1 : Number.MAX_SAFE_INTEGER;
  return { step: Math.min(clampStep(p?.onboardingStep), limit), data: d };
}
