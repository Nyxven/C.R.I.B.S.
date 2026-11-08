import { describe, expect, it } from "vitest";
import raw from "../../../seed/content.json";
import { buildSeedRows, type SeedFile } from "./seedRows";

const rows = buildSeedRows(raw as SeedFile);

describe("buildSeedRows", () => {
  it("keeps every seed item", () => {
    expect(rows.modules).toHaveLength(4);
    expect(rows.articles).toHaveLength(12);
    expect(rows.faqs).toHaveLength(6);
    expect(rows.professionals).toHaveLength(5);
  });
  it("keeps article text word for word", () => {
    const seedArticles = (raw as SeedFile).modules.flatMap((m) => m.articles);
    for (const a of seedArticles) {
      const row = rows.articles.find((r) => r.slug === a.slug)!;
      expect(row.html).toBe(a.html);
      expect(row.title).toBe(a.title);
    }
  });
  it("gives unique, stable ids", () => {
    for (const list of [rows.articles.map((a) => a.slug), rows.faqs.map((f) => f.id), rows.professionals.map((p) => p.id)]) {
      expect(new Set(list).size).toBe(list.length);
    }
    expect(rows.faqs[0]!.id).toBe("faq-01");
  });
  it("points every article at a real module and orders them", () => {
    const ids = new Set(rows.modules.map((m) => m.id));
    for (const a of rows.articles) expect(ids.has(a.moduleId)).toBe(true);
    expect(rows.articles.filter((a) => a.moduleId === "info").map((a) => a.sortOrder)).toEqual([0, 1, 2]);
  });
});
