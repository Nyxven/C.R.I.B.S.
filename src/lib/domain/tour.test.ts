import { describe, expect, it } from "vitest";
import { TOUR_STEPS, isUsableRect, nextReadyStep, placeTip } from "./tour";

const view = { width: 390, height: 800 };
describe("tour rules", () => {
  it("puts the tip below the target when there is room, and never over it", () => {
    const t = { top: 100, left: 20, width: 100, height: 40 };
    const p = placeTip(t, { width: 300, height: 150 }, view);
    expect(p.placement).toBe("below");
    expect(p.top).toBeGreaterThanOrEqual(t.top + t.height);
  });
  it("puts the tip above a target near the bottom (mobile nav)", () => {
    const t = { top: 720, left: 300, width: 60, height: 60 };
    const p = placeTip(t, { width: 300, height: 150 }, view);
    expect(p.placement).toBe("above");
    expect(p.top + 150).toBeLessThanOrEqual(t.top);
  });
  it("keeps the tip inside the screen sideways", () => {
    const p = placeTip({ top: 100, left: 350, width: 30, height: 30 }, { width: 300, height: 100 }, view);
    expect(p.left + 300).toBeLessThanOrEqual(view.width);
    expect(p.left).toBeGreaterThanOrEqual(0);
  });
  it("treats empty or off-screen targets as not ready", () => {
    expect(isUsableRect({ top: 0, left: 0, width: 0, height: 0 }, view)).toBe(false);
    expect(isUsableRect({ top: 900, left: 0, width: 50, height: 50 }, view)).toBe(false);
    expect(isUsableRect({ top: 10, left: 10, width: 50, height: 50 }, view)).toBe(true);
  });
  it("skips steps for other pages or with no ready target", () => {
    expect(nextReadyStep(TOUR_STEPS, 0, "/faq", () => true)).toBe(-1);
    expect(nextReadyStep(TOUR_STEPS, 0, "/home", (s) => s.id !== "ask")).toBe(1);
    expect(nextReadyStep(TOUR_STEPS, 0, "/home", () => false)).toBe(-1);
  });
  it("only points at data-tour targets", () => {
    for (const s of TOUR_STEPS) expect(s.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
  });
});
