import { describe, expect, it } from "vitest";
import raw from "../../../seed/content.json";
import { localModule, localModuleShort, localProgress, localReadTime, localReason, MODULES_WITH_FILIPINO, REASONS_WITH_FILIPINO } from "./localize";
import fs from "node:fs";

describe("localize", () => {
  const m = { id: "behave", name: "Child-Raising Behavior and Management Guide", shortName: "Behavior & Management Guide", description: "x" };
  it("keeps English when the app is in English", () => {
    expect(localModule(m, "en")).toBe(m);
    expect(localReadTime("4 min read", "en")).toBe("4 min read");
    expect(localReason("A good place to start", "en")).toBe("A good place to start");
    expect(localProgress({ read: 1, total: 4 }, "en")).toBe("1 of 4 read");
  });
  it("uses Filipino when chosen", () => {
    expect(localModule(m, "fil").shortName).toBe("Ugali at Pagpapalaki");
    expect(localModuleShort("info", "Autism Information Module", "fil")).toBe("Tungkol sa Autism");
    expect(localReadTime("5 min read", "fil")).toBe("5 minutong basa");
    expect(localReason("Routines can help with bedtime", "fil")).toBe("Nakakatulong ang routine sa pagtulog");
    expect(localProgress({ read: 0, total: 6 }, "fil")).toBe("0 sa 6 nabasa");
  });
  it("falls back to English for anything unknown", () => {
    expect(localModule({ ...m, id: "new" }, "fil")).toEqual({ ...m, id: "new" });
    expect(localReason("Something new", "fil")).toBe("Something new");
  });
  it("covers every module in the seed and every reason the recommender uses", () => {
    for (const mod of (raw as { modules: { id: string }[] }).modules) expect(MODULES_WITH_FILIPINO).toContain(mod.id);
    const src = fs.readFileSync("src/lib/domain/recommend.ts", "utf8");
    const used = [...src.matchAll(/"([A-Z][^"]{8,})"/g)].map((x) => x[1]!).filter((s) => !s.includes("-") && !s.includes("{"));
    for (const r of used) expect(REASONS_WITH_FILIPINO, r).toContain(r);
  });
});
