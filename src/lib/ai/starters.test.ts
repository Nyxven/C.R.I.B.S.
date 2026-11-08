import { describe, expect, it } from "vitest";
import { starterChips } from "./starters";

describe("starterChips", () => {
  it("puts the person's challenges first", () => {
    expect(starterChips(["sleep", "meltdowns"])).toEqual(["Any ideas for bedtime routines?", "What can I do during a meltdown?", "What are visual supports?"]);
  });
  it("skips challenges with no guide and fills with general starters", () => {
    expect(starterChips(["wandering", "toileting"])).toEqual(["What are visual supports?", "How do I build a predictable routine?", "What are early signs to notice?"]);
  });
  it("never goes over the limit and handles no answers", () => {
    expect(starterChips(["sleep", "meltdowns", "school", "communication"])).toHaveLength(3);
    expect(starterChips([], 2)).toHaveLength(2);
  });
});
