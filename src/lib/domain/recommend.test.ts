import { describe, expect, it } from "vitest";
import raw from "../../../seed/content.json";
import { recommend, type RecommendProfile } from "./recommend";

const slugs = (raw as { modules: { articles: { slug: string }[] }[] }).modules.flatMap((m) => m.articles.map((a) => a.slug));
const base: RecommendProfile = { challenges: [], communicationLevel: null, journeyStage: null, sensory: {} };
const rec = (p: Partial<RecommendProfile>, read: string[] = [], available = slugs) => recommend({ ...base, ...p }, available, new Set(read));

describe("recommend", () => {
  it("follows the challenges in the order they were chosen", () => {
    const r = rec({ challenges: ["meltdowns", "school"] });
    expect(r.map((x) => x.slug)).toEqual(["responding-to-meltdowns-with-calm", "working-with-your-child-s-school", "individualized-education-plans-explained"]);
    expect(r[0]!.reason).toBe("Because meltdowns are hard right now");
  });
  it("adds the sensory guide when any sensory answer is avoid or seek", () => {
    expect(rec({ sensory: { sound: "avoids", light: "none" } })[0]!.slug).toBe("understanding-sensory-sensitivities");
    expect(rec({ sensory: { sound: "none" } })[0]!.slug).not.toBe("understanding-sensory-sensitivities");
  });
  it("suggests visual supports when words are few", () => {
    expect(rec({ communicationLevel: "few_words" }).map((x) => x.slug)).toContain("visual-supports-that-help");
    expect(rec({ communicationLevel: "verbal" }).map((x) => x.slug)).not.toContain("visual-supports-that-help");
  });
  it("uses the journey stage for new parents", () => {
    expect(rec({ journeyStage: "suspect" }).map((x) => x.slug)).toEqual(["early-signs-to-notice", "what-is-autism-spectrum-disorder"]);
    expect(rec({ journeyStage: "diagnosed" })[0]!.slug).toBe("every-child-is-different");
  });
  it("skips guides already read, and never repeats a guide", () => {
    const r = rec({ challenges: ["transitions", "communication"] }, ["creating-predictable-routines"]);
    expect(r.map((x) => x.slug)).toEqual(["visual-supports-that-help", "building-two-way-communication"]);
  });
  it("stops at 3", () => expect(rec({ challenges: ["meltdowns", "school", "communication"] })).toHaveLength(3));
  it("has no guide for wandering, toileting, screen time or safety, so it falls back to a starter guide", () => {
    const r = rec({ challenges: ["wandering", "toileting", "screen_time", "safety_outside"] });
    expect(r[0]).toEqual({ slug: "every-child-is-different", reason: "A good place to start" });
  });
  it("works with no profile and ignores guides that do not exist", () => {
    expect(recommend(null, slugs, new Set())).toHaveLength(3);
    expect(recommend(null, ["nothing"], new Set())).toEqual([]);
  });
  it("every guide it can name exists in the seed content", () => {
    const all = rec({ challenges: ["meltdowns", "transitions", "sleep", "eating", "communication", "school"], sensory: { a: "seeks" }, communicationLevel: "nonspeaking", journeyStage: "suspect" }, [], slugs);
    for (const x of all) expect(slugs).toContain(x.slug);
  });
});
