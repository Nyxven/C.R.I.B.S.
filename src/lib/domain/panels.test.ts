import { describe, expect, it } from "vitest";
import { STEPS, STEP_FIELDS, emptyData } from "./onboarding";
import { PANELS, lastPanelOf, panelFieldKeys, panelNumber, panelsOf, resetPanel, validatePanel } from "./panels";

describe("panels", () => {
  it("every answer belongs to exactly one panel and matches its step", () => {
    const keys = panelFieldKeys();
    expect(new Set(keys).size).toBe(keys.length);
    const all = Object.values(STEP_FIELDS).flat();
    expect([...keys].sort()).toEqual([...all].sort());
    for (const s of STEPS) {
      if (s.id === "review") continue;
      const fromPanels = panelsOf(s.id).flatMap((x) => [...x.fields]).sort();
      expect(fromPanels).toEqual([...STEP_FIELDS[s.id]].sort());
    }
  });
  it("keeps steps in the same order as STEPS and ends on review", () => {
    const order = PANELS.map((x) => x.step).filter((s, i, a) => a.indexOf(s) === i);
    expect(order).toEqual(STEPS.map((s) => s.id));
    expect(PANELS[PANELS.length - 1].id).toBe("review");
  });
  it("numbers questions from 1 and finds a step's last panel", () => {
    expect(panelNumber("about", 0)).toBe(1);
    expect(panelNumber("review", 0)).toBe(PANELS.length);
    expect(lastPanelOf("safety")).toBe(3);
  });
  it("never lets a required panel be skipped", () => {
    for (const id of ["name", "relationship", "nickname", "review"] as const) expect(PANELS.find((x) => x.id === id)?.skippable).toBe(false);
  });
  it("validates required answers and the contact pair", () => {
    const d = emptyData();
    expect(validatePanel("name", d)).not.toBeNull();
    expect(validatePanel("name", { ...d, displayName: " Ana " })).toBeNull();
    expect(validatePanel("relationship", d)).not.toBeNull();
    expect(validatePanel("contact", d)).toBeNull();
    expect(validatePanel("contact", { ...d, contactName: "Ben" })).not.toBeNull();
    expect(validatePanel("contact", { ...d, contactName: "Ben", contactPhone: "0917 123 4567" })).toBeNull();
    expect(validatePanel("contact", { ...d, contactPhone: "abc" })).not.toBeNull();
  });
  it("reset puts only that panel's answers back", () => {
    const saved = { ...emptyData(), calming: "music", interests: "cars" };
    const now = { ...saved, calming: "typed", interests: "typed too" };
    const out = resetPanel(now, saved, PANELS.find((x) => x.id === "calming")!);
    expect(out.calming).toBe("music");
    expect(out.interests).toBe("typed too");
  });
});
