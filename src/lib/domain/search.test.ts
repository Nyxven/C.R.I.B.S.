import { describe, expect, it } from "vitest";
import raw from "../../../seed/content.json";
import { buildSeedRows, type SeedFile } from "@/server/content/seedRows";
import { buildSearchDocs, isSearchable, normalize, search, tokenize, type SearchDoc } from "./search";

const doc = (o: Partial<SearchDoc> & { title: string }): SearchDoc => ({ kind: "guide", id: o.title, meta: "", text: "", href: "/x", ...o });

describe("tokenize", () => {
  it("lowercases, drops accents and punctuation, removes repeats", () => {
    expect(tokenize("  María, MARIA! sleep?? ")).toEqual(["maria", "sleep"]);
  });
  it("caps the length and the number of words", () => {
    expect(tokenize("a b c d e f g h")).toHaveLength(6);
    expect(tokenize("x".repeat(500)).join("").length).toBeLessThanOrEqual(80);
  });
  it("needs at least 2 characters to search", () => {
    expect(isSearchable("a")).toBe(false);
    expect(isSearchable("  ")).toBe(false);
    expect(isSearchable("ot")).toBe(true);
  });
  it("normalizes accents", () => expect(normalize("Niño Café")).toBe("nino cafe"));
});

describe("search", () => {
  const docs = [
    doc({ title: "Responding to Meltdowns with Calm", text: "Stay calm. A meltdown is not a tantrum." }),
    doc({ title: "Homework Strategies", text: "Short breaks help after a meltdown at school." }),
    doc({ title: "Sleep and bedtime", meta: "Routines", text: "A steady routine." }),
  ];
  it("matches the start of words (meltdown finds meltdowns)", () => {
    const r = search(docs, "meltdown");
    expect(r.map((h) => h.title)).toEqual(["Responding to Meltdowns with Calm", "Homework Strategies"]);
  });
  it("ranks a title match above a text match", () => {
    expect(search(docs, "meltdown")[0]!.title).toContain("Meltdowns");
  });
  it("needs every word to match", () => {
    expect(search(docs, "meltdown school").map((h) => h.title)).toEqual(["Homework Strategies"]);
    expect(search(docs, "meltdown zebra")).toEqual([]);
  });
  it("matches the label (meta)", () => expect(search(docs, "routines")[0]!.title).toBe("Sleep and bedtime"));
  it("does not match the middle of a word", () => expect(search(docs, "down")).toEqual([]));
  it("returns nothing for a too-short query and respects the limit", () => {
    expect(search(docs, "a")).toEqual([]);
    expect(search(docs, "a", 1)).toEqual([]);
    expect(search([doc({ title: "aa one" }), doc({ title: "aa two" })], "aa", 1)).toHaveLength(1);
  });
  it("shows a short snippet around the match", () => {
    const long = doc({ title: "T", text: `${"word ".repeat(40)}needle ${"end ".repeat(40)}` });
    const s = search([long], "needle")[0]!.snippet;
    expect(s).toContain("needle");
    expect(s.length).toBeLessThan(200);
    expect(s.startsWith("…")).toBe(true);
  });
});

describe("search over the seed content", () => {
  const rows = buildSeedRows(raw as SeedFile);
  const docs = buildSearchDocs({
    articles: rows.articles.map((a) => ({ ...a, moduleName: "M", moduleShortName: "m" })),
    faqs: rows.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    professionals: rows.professionals.map((p) => ({ ...p, verifiedAt: null, source: null })),
  });
  it("covers guides, FAQs and listings", () => {
    expect(docs).toHaveLength(12 + 6 + 5);
    expect(new Set(docs.map((d) => d.kind))).toEqual(new Set(["guide", "faq", "specialist"]));
  });
  it("finds the meltdown guide and a speech therapist", () => {
    expect(search(docs, "meltdown")[0]!.href).toBe("/learn/behave/responding-to-meltdowns-with-calm");
    expect(search(docs, "speech").some((h) => h.kind === "specialist")).toBe(true);
  });
});
