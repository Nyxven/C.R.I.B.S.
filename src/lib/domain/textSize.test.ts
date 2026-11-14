import { describe, expect, it } from "vitest";
import { normalizeTextSize, textSizeCss } from "./textSize";

describe("text size", () => {
  it("keeps the three offered steps", () => {
    expect([100, 115, 130].map(normalizeTextSize)).toEqual([100, 115, 130]);
  });
  it("snaps stored in-between values to the nearest step", () => {
    expect(normalizeTextSize(85)).toBe(100);
    expect(normalizeTextSize(110)).toBe(115);
    expect(normalizeTextSize(140)).toBe(130);
  });
  it("falls back to Standard for anything that is not a number", () => {
    expect([undefined, null, "130", NaN, Infinity].map(normalizeTextSize)).toEqual([100, 100, 100, 100, 100]);
  });
  it("adds no CSS for Standard and a root size otherwise", () => {
    expect(textSizeCss(100)).toBe("");
    expect(textSizeCss(115)).toBe("html{font-size:115%}");
    expect(textSizeCss("<script>")).toBe("");
  });
});
