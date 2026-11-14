// Pure rules for the one-question-per-screen onboarding. No React, no Next, no database.
// A "step" is still the unit the server saves (see STEPS in onboarding.ts, unchanged). A "panel" is one
// question on screen. Several panels can belong to one step; the step is saved when its last panel is done.
import { normalizePhone, stepIndex, type DataStepId, type OnboardingData, type StepId } from "./onboarding";

export type PanelId =
  | "name" | "relationship" | "nickname" | "age" | "pronouns" | "journey" | "commLevel" | "commTools"
  | "sensory" | "calming" | "interests" | "challenges" | "school" | "therapist" | "wandering" | "avoid"
  | "contact" | "tag" | "review";

export type Panel = { id: PanelId; step: StepId; fields: readonly (keyof OnboardingData)[]; skippable: boolean };

const p = (id: PanelId, step: StepId, fields: readonly (keyof OnboardingData)[], skippable: boolean): Panel => ({ id, step, fields, skippable });

/** Order a parent meets the questions in: who you are, the child, then optional personalization, safety last. */
export const PANELS: readonly Panel[] = [
  p("name", "about", ["displayName"], false),
  p("relationship", "about", ["relationship"], false),
  p("nickname", "child", ["nickname"], false),
  p("age", "child", ["ageYears"], true),
  p("pronouns", "child", ["pronouns"], true),
  p("journey", "journey", ["journeyStage"], true),
  p("commLevel", "communication", ["communicationLevel"], true),
  p("commTools", "communication", ["commTools"], true),
  p("sensory", "sensory", ["sensory"], true),
  p("calming", "calming", ["calming"], true),
  p("interests", "calming", ["interests"], true),
  p("challenges", "challenges", ["challenges"], true),
  p("school", "daily", ["school"], true),
  p("therapist", "daily", ["hasTherapist"], true),
  p("wandering", "safety", ["wanderingRisk"], true),
  p("avoid", "safety", ["avoid"], true),
  p("contact", "safety", ["contactName", "contactPhone"], true),
  p("tag", "safety", ["wearsTag", "tagNetwork"], true),
  p("review", "review", [], false),
];

export const panelsOf = (step: StepId): Panel[] => PANELS.filter((x) => x.step === step);
/** 1-based position of a panel on screen, for "Question 4 of 19". */
export const panelNumber = (step: StepId, panel: number): number => PANELS.findIndex((x) => x.step === step) + panel + 1;
export const lastPanelOf = (step: StepId): number => panelsOf(step).length - 1;
/** Which step a stored step number opens on (always its first question). */
export const firstPanelOfStepIndex = (index: number): number => PANELS.findIndex((x) => stepIndex(x.step) === index);

/** Every data answer belongs to exactly one panel (tested). */
export const panelFieldKeys = (): (keyof OnboardingData)[] => PANELS.flatMap((x) => [...x.fields]);

/** Puts one panel's answers back to what was last saved (used by Skip). */
export function resetPanel(data: OnboardingData, saved: OnboardingData, panel: Panel): OnboardingData {
  const next: Record<string, unknown> = { ...data };
  for (const k of panel.fields) next[k] = saved[k];
  return next as OnboardingData;
}

/** Quick check before moving to the next question. The server checks everything again when the step is saved. */
export function validatePanel(id: PanelId, d: OnboardingData): string | null {
  switch (id) {
    case "name": return d.displayName.trim() ? null : "Please tell us your name.";
    case "relationship": return d.relationship ? null : "Please choose one.";
    case "nickname": return d.nickname.trim() ? null : "Please add a name or nickname for your child.";
    case "contact": {
      const phone = normalizePhone(d.contactPhone);
      if (d.contactPhone.trim() && !phone) return "That phone number doesn't look right. Use digits, like 0917 123 4567.";
      if (Boolean(d.contactName.trim()) !== Boolean(phone)) return "Please add both a name and a number, or leave both empty.";
      return null;
    }
    default: return null;
  }
}

export type { DataStepId };
