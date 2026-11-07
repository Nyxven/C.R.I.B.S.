import { describe, expect, it } from "vitest";
import { firstMessage, saveStepInput, skipStepInput } from "./schema";

const parse = (step: string, data: unknown) => saveStepInput.safeParse({ step, data });
const msg = (step: string, data: unknown) => { const r = parse(step, data); return r.success ? null : firstMessage(r.error); };

describe("required steps", () => {
  it("needs a name and a relationship", () => {
    expect(parse("about", { displayName: " Ana ", relationship: "mother" }).success).toBe(true);
    expect(msg("about", { displayName: "  ", relationship: "mother" })).toBe("Please tell us your name.");
    expect(msg("about", { displayName: "Ana", relationship: "" })).toBe("Please choose one.");
  });
  it("needs a nickname and a sensible age", () => {
    expect(parse("child", { nickname: "Bo", ageYears: null, pronouns: "" }).success).toBe(true);
    expect(msg("child", { nickname: "", ageYears: 5, pronouns: "" })).toBe("Please add a name or nickname for your child.");
    expect(msg("child", { nickname: "Bo", ageYears: 40, pronouns: "" })).toBe("This guide is for children up to 18.");
    expect(msg("child", { nickname: "Bo", ageYears: 5.5, pronouns: "" })).toBe("Please check your answers and try again.");
  });
});

describe("optional steps", () => {
  it("accepts empty answers", () => {
    expect(parse("journey", { journeyStage: "" }).success).toBe(true);
    expect(parse("communication", { communicationLevel: "", commTools: [] }).success).toBe(true);
    expect(parse("sensory", { sensory: {} }).success).toBe(true);
  });
  it("rejects values that are not on the list", () => {
    expect(parse("journey", { journeyStage: "hacked" }).success).toBe(false);
    expect(parse("sensory", { sensory: { sound: "loud" } }).success).toBe(false);
  });
  it("allows at most 3 challenges and removes duplicates", () => {
    expect(msg("challenges", { challenges: ["sleep", "eating", "meltdowns", "toileting"] })).toBe("Please pick up to 3.");
    const r = parse("challenges", { challenges: ["sleep", "sleep", "eating"] });
    expect(r.success && r.data.step === "challenges" && r.data.data.challenges).toEqual(["sleep", "eating"]);
  });
  it("trims long text and rejects over-long text", () => {
    expect(parse("calming", { calming: "  music  ", interests: "" }).success).toBe(true);
    expect(msg("calming", { calming: "x".repeat(301), interests: "" })).toBe("Please keep this under 300 characters.");
  });
});

describe("safety step", () => {
  const base = { wanderingRisk: "", avoid: "", contactName: "", contactPhone: "", wearsTag: false, tagNetwork: "" };
  it("allows no contact at all", () => {
    expect(parse("safety", base).success).toBe(true);
  });
  it("cleans the phone number", () => {
    const r = parse("safety", { ...base, contactName: "Lola", contactPhone: "0917 123 4567" });
    expect(r.success && r.data.step === "safety" && r.data.data.contactPhone).toBe("09171234567");
  });
  it("needs a name and a number together", () => {
    expect(msg("safety", { ...base, contactName: "Lola" })).toBe("Please add both a name and a number, or leave both empty.");
    expect(msg("safety", { ...base, contactPhone: "0917 123 4567" })).toBe("Please add both a name and a number, or leave both empty.");
    expect(msg("safety", { ...base, contactName: "Lola", contactPhone: "abc" })).toMatch(/doesn't look right/);
  });
});

describe("input shape", () => {
  it("rejects unknown steps and the review step", () => {
    expect(parse("nope", {}).success).toBe(false);
    expect(parse("review", {}).success).toBe(false);
  });
  it("skip accepts any step id", () => {
    expect(skipStepInput.safeParse({ step: "sensory" }).success).toBe(true);
    expect(skipStepInput.safeParse({ step: "x" }).success).toBe(false);
  });
});
