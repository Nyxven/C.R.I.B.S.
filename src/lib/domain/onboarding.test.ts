import { describe, expect, it } from "vitest";
import {
  STEPS, STEP_FIELDS, STEP_IDS, canFinish, clampStep, emptyData, isDataStep, isSkippable, normalizePhone,
  pickStep, resetStep, reviewSections, stepIndex, toggleValue, ageText, valuesOf, RELATIONSHIPS, appendIdea, CALMING_IDEAS, INTEREST_IDEAS,
} from "./onboarding";

describe("steps", () => {
  it("has 10 steps, review last, the first two required", () => {
    expect(STEPS).toHaveLength(10);
    expect(STEP_IDS.at(-1)).toBe("review");
    expect(isSkippable("about")).toBe(false);
    expect(isSkippable("child")).toBe(false);
    expect(isSkippable("review")).toBe(false);
    expect(isSkippable("sensory")).toBe(true);
    expect(stepIndex("child")).toBe(1);
  });
  it("recognises data steps", () => {
    expect(isDataStep("safety")).toBe(true);
    expect(isDataStep("review")).toBe(false);
    expect(isDataStep("nope")).toBe(false);
  });
  it("clamps stored step numbers", () => {
    expect(clampStep(-3)).toBe(0);
    expect(clampStep(99)).toBe(9);
    expect(clampStep(4.9)).toBe(4);
    expect(clampStep(undefined)).toBe(0);
    expect(clampStep(NaN)).toBe(0);
  });
});

describe("answers", () => {
  it("assigns every answer to exactly one step", () => {
    const all = Object.values(STEP_FIELDS).flat();
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(Object.keys(emptyData()).sort());
  });
  it("picks one step's answers", () => {
    const d = { ...emptyData("Ana"), nickname: "Bo", ageYears: 6, calming: "music" };
    expect(pickStep(d, "child")).toEqual({ nickname: "Bo", ageYears: 6, pronouns: "" });
  });
  it("resets a step to what was saved", () => {
    const saved = { ...emptyData("Ana"), calming: "music" };
    const typed = { ...saved, calming: "something else", interests: "trains" };
    expect(resetStep(typed, saved, "calming")).toEqual(saved);
  });
  it("toggles values and respects the limit", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleValue(["a", "b", "c"], "d", 3)).toEqual(["a", "b", "c"]);
    expect(toggleValue(["a", "b", "c"], "c", 3)).toEqual(["a", "b"]);
  });
  it("lists option values for validation", () => {
    expect(valuesOf(RELATIONSHIPS)).toEqual(["mother", "father", "grandparent", "guardian", "other"]);
  });
  it("needs a parent name and a child nickname to finish", () => {
    expect(canFinish({ displayName: "Ana", nickname: "Bo" })).toBe(true);
    expect(canFinish({ displayName: "Ana", nickname: "  " })).toBe(false);
    expect(canFinish({ displayName: "", nickname: "Bo" })).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("keeps digits and a leading plus", () => {
    expect(normalizePhone("0917 123 4567")).toBe("09171234567");
    expect(normalizePhone("+63 (917) 123-4567")).toBe("+639171234567");
  });
  it("rejects letters and bad lengths", () => {
    expect(normalizePhone("call me")).toBe("");
    expect(normalizePhone("12345")).toBe("");
    expect(normalizePhone("1".repeat(16))).toBe("");
    expect(normalizePhone("")).toBe("");
  });
});

describe("ageText", () => {
  it("reads naturally", () => {
    expect(ageText(null)).toBe("");
    expect(ageText(0)).toBe("Under 1 year");
    expect(ageText(1)).toBe("1 year");
    expect(ageText(7)).toBe("7 years");
  });
});

describe("reviewSections", () => {
  it("shows only what was answered and names the tag", () => {
    const d = {
      ...emptyData("Ana"), relationship: "mother" as const, nickname: "Bo", ageYears: 6,
      sensory: { sound: "avoids" as const, light: "none" as const }, challenges: ["sleep" as const, "meltdowns" as const],
      contactName: "Lola", contactPhone: "09171234567", wearsTag: true, tagNetwork: "apple" as const,
    };
    const s = reviewSections(d, "CRIBS");
    expect(s).toHaveLength(9);
    expect(s[0].lines).toEqual([{ label: "Your name", value: "Ana" }, { label: "You are their", value: "mother" }]);
    expect(s[2].lines).toEqual([]); // journey skipped
    expect(s[4].lines).toEqual([{ label: "Sounds", value: "Avoids it" }]);
    expect(s[6].lines[0].value).toBe("Sleep, Meltdowns");
    expect(s[8].lines).toContainEqual({ label: "Emergency contact", value: "Lola, 09171234567" });
    expect(s[8].lines).toContainEqual({ label: "Wears CRIBS", value: "Yes, Apple Find My" });
  });
});

describe("appendIdea", () => {
  it("adds the first idea as is, then lowercases later ones", () => {
    expect(appendIdea("", "Music", 300)).toBe("Music");
    expect(appendIdea("Music", "A quiet space", 300)).toBe("Music, a quiet space");
  });
  it("skips repeats (any case) and never goes over the limit", () => {
    expect(appendIdea("music, drawing", "Music", 300)).toBe("music, drawing");
    expect(appendIdea("1234567890", "Songs", 12)).toBe("1234567890");
  });
  it("keeps the idea lists short and unique", () => {
    for (const list of [CALMING_IDEAS, INTEREST_IDEAS]) {
      expect(new Set(list).size).toBe(list.length);
      for (const idea of list) expect(idea.length).toBeLessThanOrEqual(30);
    }
  });
});
