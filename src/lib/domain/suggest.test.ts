import { describe, expect, it } from "vitest";
import raw from "../../../seed/content.json";
import { buildSeedRows, type SeedFile } from "@/server/content/seedRows";
import { buildSuggestIndex, POPULAR, suggest, topicFor, TOPICS } from "./suggest";

const rows = buildSeedRows(raw as SeedFile);
const short = new Map(rows.modules.map((m) => [m.id, m.shortName]));
const index = buildSuggestIndex({
  articles: rows.articles.map((a) => ({ slug: a.slug, moduleId: a.moduleId, title: a.title, moduleShortName: short.get(a.moduleId) ?? "" })),
  faqs: rows.faqs,
  professionals: rows.professionals,
});
const titles = (q: string) => suggest(index, q).map((s) => s.title);

describe("suggest (real seed content)", () => {
  it("gives nothing for an empty or one-letter query", () => {
    expect(suggest(index, "")).toEqual([]);
    expect(suggest(index, " m ")).toEqual([]);
  });
  it("completes a guide title while typing", () => {
    expect(titles("melt")[0]).toBe("Responding to Meltdowns with Calm");
    expect(titles("visual sup")[0]).toBe("Visual Supports That Help");
  });
  it("understands parents' own words, in English and Filipino", () => {
    expect(titles("tantrum")).toContain("Responding to Meltdowns with Calm");
    expect(titles("nagwawala")).toContain("Responding to Meltdowns with Calm");
    expect(titles("bedtime")).toContain("Creating Predictable Routines");
    expect(titles("hindi nagsasalita")).toContain("Building Two-Way Communication");
    expect(titles("maingay")).toContain("Understanding Sensory Sensitivities");
  });
  it("opens the safety page for wandering worries", () => {
    const s = suggest(index, "nawawala");
    expect(s[0]).toMatchObject({ kind: "page", href: "/find" });
    expect(suggest(index, "running off")[0]?.href).toBe("/find");
  });
  it("finds specialists by role or everyday word", () => {
    expect(suggest(index, "pedia").some((s) => s.kind === "specialist" && s.meta === "Developmental Pediatrician")).toBe(true);
    expect(suggest(index, "speech").some((s) => s.kind === "specialist")).toBe(true);
  });
  it("offers the related topic as a search when the person used another word", () => {
    const last = suggest(index, "sleep").at(-1);
    expect(last).toMatchObject({ kind: "topic", title: "routine", href: "/search?q=routine" });
    expect(suggest(index, "routine").some((s) => s.kind === "topic")).toBe(false);
  });
  it("links FAQs so the answer opens", () => {
    expect(suggest(index, "diagnosed").some((s) => s.kind === "faq" && s.href.startsWith("/faq?open=faq-"))).toBe(true);
  });
  it("never returns more than 7, with unique ids", () => {
    const s = suggest(index, "a");
    expect(s.length).toBeLessThanOrEqual(7);
    const t = suggest(index, "autism");
    expect(new Set(t.map((x) => x.id)).size).toBe(t.length);
  });
  it("finds the new level guides", () => {
    expect(titles("asperger")).toContain("Older Autism Terms You May Hear");
    expect(titles("level 2")[0]).toBeDefined();
    expect(titles("severe")).toContain("The Three Levels of Autism");
  });
  it("needs 3+ letters to guess a topic", () => {
    expect(topicFor("ot")).toBeNull();
    expect(topicFor("tantr")?.term).toBe("meltdown");
  });
  it("every popular topic and topic term finds at least one result", () => {
    for (const p of POPULAR) expect(suggest(index, p).length, p).toBeGreaterThan(0);
    for (const t of TOPICS) expect(suggest(index, t.term).length, t.term).toBeGreaterThan(0);
  });
});
