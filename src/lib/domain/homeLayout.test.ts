import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT, HOME_SECTIONS, moveSection, normalizeLayout, toggleSection, visibleSections } from "./homeLayout";

describe("home layout", () => {
  it("uses the default for missing or broken values", () => {
    expect(normalizeLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout("nope")).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout([{ id: 42 }, null])).toEqual(DEFAULT_LAYOUT);
  });
  it("keeps the saved order, drops unknown and repeated ids, and adds new sections at the end", () => {
    const l = normalizeLayout([{ id: "guides", visible: false }, { id: "ghost", visible: true }, { id: "safety", visible: true }, { id: "guides", visible: true }]);
    expect(l.map((x) => x.id)).toEqual(["guides", "safety", "recommended", "logs", "help"]);
    expect(l[0]!.visible).toBe(false);
    expect(l).toHaveLength(HOME_SECTIONS.length);
  });
  it("moves and toggles sections", () => {
    const up = moveSection(DEFAULT_LAYOUT, "guides", -1);
    expect(up.map((x) => x.id)).toEqual(["safety", "recommended", "guides", "logs", "help"]);
    expect(moveSection(DEFAULT_LAYOUT, "safety", -1)).toBe(DEFAULT_LAYOUT);
    expect(moveSection(DEFAULT_LAYOUT, "help", 1)).toBe(DEFAULT_LAYOUT);
    expect(visibleSections(toggleSection(DEFAULT_LAYOUT, "logs"))).toEqual(["safety", "recommended", "guides", "help"]);
  });
});
