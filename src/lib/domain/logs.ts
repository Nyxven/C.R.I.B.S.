// Parent logs: a Behavior log (ABC chart: Antecedent, Behavior, Consequence) and a Communication log.
// Pure: option lists, labels and the plain-count summary. No diagnosis, no AI: just what the parent wrote, counted.

export const SETTINGS = ["home", "school", "community", "other"] as const;
export const CONTEXTS = ["sleep", "sensory", "schedule", "hunger", "unwell", "new_place", "other"] as const;
export const MODES = ["speech", "aac", "sign", "gesture", "picture", "other"] as const;
export const INITIATIONS = ["child", "prompted"] as const;
export const PURPOSES = ["request", "reject", "comment", "greet", "other"] as const;

export type Setting = (typeof SETTINGS)[number];
export type Context = (typeof CONTEXTS)[number];

export type BehaviorEntry = {
  id: string; occurredAt: Date; setting: string | null; antecedent: string; behavior: string; consequence: string | null;
  intensity: number | null; durationMin: number | null; context: string[]; notes: string | null;
};
export type CommunicationEntry = {
  id: string; occurredAt: Date; mode: string; initiation: string; purpose: string; understood: boolean;
  setting: string | null; example: string | null; context: string[]; notes: string | null;
};

/** Counts of each value, most common first (ties: original order). */
export function tally<T extends string>(values: readonly (T | null | undefined)[]): { value: T; count: number }[] {
  const m = new Map<T, number>();
  for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

const DAY = 86_400_000;
const inLast = (d: Date, days: number, now: Date) => now.getTime() - new Date(d).getTime() <= days * DAY && new Date(d).getTime() <= now.getTime() + 60_000;

export type BehaviorSummary = { count: number; avgIntensity: number | null; topSetting: string | null; topContext: string | null; busiestPart: "morning" | "afternoon" | "evening" | "night" | null };

/** What the last `days` days of behavior entries show, in plain counts. */
export function summarizeBehavior(entries: readonly BehaviorEntry[], now: Date, days = 7): BehaviorSummary {
  const recent = entries.filter((e) => inLast(e.occurredAt, days, now));
  const rated = recent.map((e) => e.intensity).filter((n): n is number => typeof n === "number");
  const parts = recent.map((e) => partOfDay(new Date(e.occurredAt)));
  return {
    count: recent.length,
    avgIntensity: rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null,
    topSetting: tally(recent.map((e) => e.setting))[0]?.value ?? null,
    topContext: tally(recent.flatMap((e) => e.context))[0]?.value ?? null,
    busiestPart: recent.length >= 2 ? tally(parts)[0]?.value ?? null : null,
  };
}

export type CommunicationSummary = { count: number; understoodPct: number | null; childLedPct: number | null; topMode: string | null; topPurpose: string | null };

/** What the last `days` days of communication entries show, in plain counts. */
export function summarizeCommunication(entries: readonly CommunicationEntry[], now: Date, days = 7): CommunicationSummary {
  const recent = entries.filter((e) => inLast(e.occurredAt, days, now));
  const pct = (n: number) => (recent.length ? Math.round((n / recent.length) * 100) : null);
  return {
    count: recent.length,
    understoodPct: pct(recent.filter((e) => e.understood).length),
    childLedPct: pct(recent.filter((e) => e.initiation === "child").length),
    topMode: tally(recent.map((e) => e.mode))[0]?.value ?? null,
    topPurpose: tally(recent.map((e) => e.purpose))[0]?.value ?? null,
  };
}

/** Morning 5-11, afternoon 12-16, evening 17-20, night 21-4 (local time of the date given). */
export function partOfDay(d: Date): "morning" | "afternoon" | "evening" | "night" {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

/** A local "YYYY-MM-DDTHH:mm" value for an <input type="datetime-local">. */
export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** True when the value is one of the listed options (otherwise it is the parent's own "Other" text). */
export const isOption = (list: readonly string[], v: string): boolean => list.includes(v);

/** The value to store for a choice: the parent's typed text when they picked "Other" and wrote something, else the option. */
export function withOther(choice: string | undefined, otherText: string): string | undefined {
  if (choice !== "other") return choice;
  const typed = otherText.trim();
  return typed.length >= 2 ? typed.slice(0, 40) : "other";
}
