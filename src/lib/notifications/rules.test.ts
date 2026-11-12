import { describe, expect, it } from "vitest";
import { isHelpfulMilestone, isImportant, safeLink, shouldNotify, texts, timeAgo } from "./rules";

describe("notification rules", () => {
  it("always delivers account and moderation notices, and respects the switch for the rest", () => {
    expect(shouldNotify("reply", false)).toBe(false);
    expect(shouldNotify("helpful", false)).toBe(false);
    expect(shouldNotify("article", false)).toBe(false);
    expect(shouldNotify("account", false)).toBe(true);
    expect(shouldNotify("moderation", false)).toBe(true);
    expect(shouldNotify("reply", true)).toBe(true);
    expect(isImportant("account")).toBe(true);
    expect(isImportant("reply")).toBe(false);
  });
  it("only notifies about helpful at milestones", () => {
    expect([1, 2, 4, 5, 6, 10, 11, 25, 50, 100, 101].filter(isHelpfulMilestone)).toEqual([1, 5, 10, 25, 50, 100]);
  });
  it("words things plainly", () => {
    expect(texts.reply("Ana")).toBe("Ana replied to your post.");
    expect(texts.helpful(1)).toBe("Someone found your post helpful.");
    expect(texts.helpful(5)).toBe("5 parents found your post helpful.");
  });
  it("says how long ago", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    const ago = (ms: number) => timeAgo(new Date(now.getTime() - ms), now);
    expect(ago(10_000)).toBe("just now");
    expect(ago(5 * 60_000)).toBe("5m ago");
    expect(ago(3 * 3_600_000)).toBe("3h ago");
    expect(ago(30 * 3_600_000)).toBe("Yesterday");
    expect(ago(4 * 86_400_000)).toBe("4d ago");
    expect(ago(20 * 86_400_000)).toBe("2026-10-21");
    expect(timeAgo(new Date(now.getTime() + 5000), now)).toBe("just now"); // a clock a little ahead
  });
  it("only allows links inside the site", () => {
    expect(safeLink("/community#post-1")).toBe("/community#post-1");
    for (const bad of ["https://evil.example", "//evil.example", "javascript:alert(1)", "", null, 5, "/x y"]) expect(safeLink(bad)).toBeNull();
  });
});
