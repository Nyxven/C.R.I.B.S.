import { describe, expect, it } from "vitest";
import { behaviorInput, communicationInput } from "@/features/logs/schema";
import { withOther, partOfDay, summarizeBehavior, summarizeCommunication, tally, toLocalInput, type BehaviorEntry, type CommunicationEntry } from "./logs";

const now = new Date(2026, 10, 20, 18, 0);
const ago = (days: number, hour = 10) => { const d = new Date(now); d.setDate(d.getDate() - days); d.setHours(hour, 0, 0, 0); return d; };
const b = (o: Partial<BehaviorEntry>): BehaviorEntry => ({ id: "x", occurredAt: ago(1), setting: "home", antecedent: "Told to stop TV", behavior: "Cried", consequence: null, intensity: null, durationMin: null, context: [], notes: null, ...o });
const c = (o: Partial<CommunicationEntry>): CommunicationEntry => ({ id: "y", occurredAt: ago(1), mode: "aac", initiation: "child", purpose: "request", understood: true, setting: "home", example: null, context: [], notes: null, ...o });

describe("tally", () => {
  it("counts values, most common first, ignoring empty ones", () => {
    expect(tally(["a", "b", "a", null, undefined, "c", "a", "b"])).toEqual([{ value: "a", count: 3 }, { value: "b", count: 2 }, { value: "c", count: 1 }]);
  });
});

describe("summarizeBehavior", () => {
  it("counts only the last 7 days and finds the common setting, context and time of day", () => {
    const s = summarizeBehavior([
      b({ occurredAt: ago(1, 16), intensity: 4, setting: "school", context: ["sensory"] }),
      b({ occurredAt: ago(2, 15), intensity: 2, setting: "school", context: ["sensory", "sleep"] }),
      b({ occurredAt: ago(3, 9), setting: "home" }),
      b({ occurredAt: ago(20), intensity: 5, setting: "community" }),
    ], now);
    expect(s).toEqual({ count: 3, avgIntensity: 3, topSetting: "school", topContext: "sensory", busiestPart: "afternoon" });
  });
  it("is empty-safe", () => {
    expect(summarizeBehavior([], now)).toEqual({ count: 0, avgIntensity: null, topSetting: null, topContext: null, busiestPart: null });
  });
});

describe("summarizeCommunication", () => {
  it("gives understood and child-led percentages and the common mode and purpose", () => {
    const s = summarizeCommunication([c({}), c({ understood: false, initiation: "prompted", mode: "gesture" }), c({ purpose: "greet" }), c({ occurredAt: ago(9) })], now);
    expect(s).toEqual({ count: 3, understoodPct: 67, childLedPct: 67, topMode: "aac", topPurpose: "request" });
  });
});

describe("partOfDay and toLocalInput", () => {
  it("splits the day", () => {
    expect([5, 11, 12, 16, 17, 20, 21, 2].map((h) => partOfDay(new Date(2026, 0, 1, h)))).toEqual(["morning", "morning", "afternoon", "afternoon", "evening", "evening", "night", "night"]);
  });
  it("formats for datetime-local inputs", () => expect(toLocalInput(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03"));
});

describe("log inputs", () => {
  const recent = new Date(Date.now() - 3_600_000).toISOString();
  it("accepts a full behavior entry and trims text", () => {
    const r = behaviorInput.safeParse({ occurredAt: recent, setting: "home", antecedent: "  Loud blender ", behavior: "Covered ears and screamed", consequence: "", intensity: 3, durationMin: 5, context: ["sensory"] });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.antecedent).toBe("Loud blender"); expect(r.data.consequence).toBeNull(); }
  });
  it("rejects missing ABC parts, bad ranges, future times and unknown options", () => {
    expect(behaviorInput.safeParse({ occurredAt: recent, antecedent: "", behavior: "Cried" }).success).toBe(false);
    expect(behaviorInput.safeParse({ occurredAt: recent, antecedent: "No", behavior: "Cried", intensity: 9 }).success).toBe(false);
    expect(behaviorInput.safeParse({ occurredAt: new Date(Date.now() + 86_400_000).toISOString(), antecedent: "No", behavior: "Cried" }).success).toBe(false);
    expect(behaviorInput.safeParse({ occurredAt: recent, antecedent: "No", behavior: "Cried", context: ["x"] }).success).toBe(false); // own "Other" text needs 2+ letters
    expect(behaviorInput.safeParse({ occurredAt: recent, antecedent: "No", behavior: "Cried", setting: "y".repeat(41) }).success).toBe(false);
    expect(behaviorInput.safeParse({ occurredAt: recent, antecedent: "No", behavior: "Cried", userId: "someone-else" }).success).toBe(false);
  });
  it("accepts a communication entry, own Other words, and rejects a bad initiation", () => {
    expect(communicationInput.safeParse({ occurredAt: recent, mode: "aac", initiation: "child", purpose: "request", understood: true, example: "AAC, 3 messages" }).success).toBe(true);
    expect(communicationInput.safeParse({ occurredAt: recent, mode: "Sang a song", initiation: "child", purpose: "Asked to play", understood: true, setting: "Lola's house", context: ["sensory", "Loud karaoke"] }).success).toBe(true);
    expect(communicationInput.safeParse({ occurredAt: recent, mode: "aac", initiation: "maybe", purpose: "request", understood: true }).success).toBe(false);
  });
});

describe("withOther", () => {
  it("stores the typed text for Other, the option otherwise", () => {
    expect(withOther("other", "  Lola's house ")).toBe("Lola's house");
    expect(withOther("other", " ")).toBe("other");
    expect(withOther("home", "ignored")).toBe("home");
    expect(withOther(undefined, "x")).toBeUndefined();
    expect(withOther("other", "z".repeat(60))).toHaveLength(40);
  });
});
