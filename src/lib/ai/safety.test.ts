import { describe, expect, it } from "vitest";
import { detectEmergency, emergencyReply } from "./safety";

describe("detectEmergency: catches emergencies", () => {
  const cases: [string, ReturnType<typeof detectEmergency>][] = [
    ["I want to die", "self_harm"],
    ["Sometimes I think about ending my life", "self_harm"],
    ["I don’t want to live anymore", "self_harm"],
    ["I might hurt myself", "self_harm"],
    ["gusto ko nang mamatay", "self_harm"],
    ["ayoko na mabuhay", "self_harm"],
    ["I am afraid I might hurt my child", "abuse"],
    ["my son is being abused at school", "abuse"],
    ["he keeps hitting my child", "abuse"],
    ["sinasaktan ang anak ko ng yaya", "abuse"],
    ["my daughter went missing at the mall", "child_missing"],
    ["I can't find my son", "child_missing"],
    ["nawawala ang anak ko", "child_missing"],
    ["he is not breathing", "medical"],
    ["my child is choking", "medical"],
    ["she is having a seizure", "medical"],
    ["he swallowed a battery", "medical"],
    ["nalulunod ang anak ko", "medical"],
    ["hindi siya humihinga", "medical"],
    ["MY CHILD WON'T WAKE UP", "medical"],
  ];
  for (const [text, kind] of cases) it(`"${text}" -> ${kind}`, () => expect(detectEmergency(text)).toBe(kind));

  it("puts the most serious kind first when several match", () => {
    expect(detectEmergency("I want to die and my son is choking")).toBe("self_harm");
  });
  it("ignores case, accents and extra spaces", () => {
    expect(detectEmergency("  I   WANT   TO   DIE  ")).toBe("self_harm");
  });
});

describe("detectEmergency: leaves normal questions alone", () => {
  for (const text of [
    "How do I handle a meltdown at the grocery store?",
    "What is a seizure and is it common in autism?",
    "Does autism cause seizures?",
    "How can I prevent my child from wandering off?",
    "What helps with bedtime?",
    "Tips for a child who hits when frustrated at school",
    "How do I explain substance abuse prevention to teens?",
    "Paano ko matutulungan ang anak ko sa school?",
    "My child is missing the bus routine again, what can I do?",
    "I feel tired and stressed lately",
    "",
  ]) it(`"${text}" -> null`, () => expect(detectEmergency(text)).toBeNull());
});

describe("emergencyReply", () => {
  it("always gives the emergency number, a Filipino line and the disclaimer", () => {
    for (const k of ["self_harm", "abuse", "child_missing", "medical"] as const) {
      const r = emergencyReply(k, [], "911");
      expect(r).toContain("911");
      expect(r).toContain("Tumawag sa 911");
      expect(r).toContain("cannot help with emergencies");
      expect(r).not.toContain("Support lines");
    }
  });
  it("lists verified support lines only when some exist", () => {
    const r = emergencyReply("self_harm", [{ name: "Test line", number: "000", source: "test" }], "911");
    expect(r).toContain("Support lines:\nTest line: 000");
  });
  it("never suggests medication or a diagnosis", () => {
    for (const k of ["self_harm", "abuse", "child_missing", "medical"] as const) {
      expect(emergencyReply(k, [], "911").toLowerCase()).not.toMatch(/medication|dose|diagnos/);
    }
  });
});
