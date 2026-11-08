import { describe, expect, it } from "vitest";
import { isValidSlug, moduleProgress, progressLabel, readSlugs, savedSlugs } from "./progress";

const e = (slug: string, read = false, saved = false) => ({ slug, read, saved });

describe("moduleProgress", () => {
  it("counts only read guides of that module", () => {
    const p = moduleProgress(["a", "b", "c"], [e("a", true), e("b", false, true), e("z", true)]);
    expect(p).toEqual({ read: 1, total: 3, percent: 33, done: false });
  });
  it("is done when every guide is read", () => {
    expect(moduleProgress(["a", "b"], [e("a", true), e("b", true)]).done).toBe(true);
  });
  it("handles an empty module", () => {
    expect(moduleProgress([], [e("a", true)])).toEqual({ read: 0, total: 0, percent: 0, done: false });
  });
});

describe("sets and labels", () => {
  it("splits read and saved", () => {
    const list = [e("a", true), e("b", false, true), e("c", true, true)];
    expect([...readSlugs(list)]).toEqual(["a", "c"]);
    expect([...savedSlugs(list)]).toEqual(["b", "c"]);
  });
  it("words the label", () => {
    expect(progressLabel({ read: 2, total: 3, percent: 67, done: false })).toBe("2 of 3 read");
    expect(progressLabel({ read: 0, total: 0, percent: 0, done: false })).toBe("No guides yet");
  });
});

describe("isValidSlug", () => {
  it("accepts real slugs", () => expect(isValidSlug("working-with-your-child-s-school")).toBe(true));
  it("rejects odd input", () => {
    for (const bad of ["", "A", "a b", "a--b", "-a", "a-", "a/b", "../x", 5, null, undefined, "x".repeat(101)]) expect(isValidSlug(bad)).toBe(false);
  });
});
