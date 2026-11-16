import { describe, expect, it } from "vitest";
import { en, type Key } from "./en";
import { fil } from "./fil";
import { DEFAULT_LOCALE, LOCALES, missingKeys, normalizeLocale, translate } from "./core";

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("language rules", () => {
  it("accepts only known languages and falls back to English", () => {
    expect(normalizeLocale("fil")).toBe("fil");
    expect(normalizeLocale("en")).toBe("en");
    for (const bad of ["tl", "FIL", "", null, undefined, 3, {}]) expect(normalizeLocale(bad)).toBe(DEFAULT_LOCALE);
  });
  it("lists English first and every language once", () => {
    expect(LOCALES[0].value).toBe("en");
    expect(new Set(LOCALES.map((l) => l.value)).size).toBe(LOCALES.length);
  });
  it("fills placeholders and keeps unknown ones visible", () => {
    expect(translate("en", "home.hello", { name: "Ana" })).toBe("Hello, Ana!");
    expect(translate("fil", "home.hello", { name: "Ana" })).toBe("Kumusta, Ana!");
    expect(translate("en", "home.hello")).toBe("Hello, {name}!");
  });
  it("falls back to English for a key a language has not translated", () => {
    const key = "home.hello" as Key;
    const saved = fil[key];
    delete fil[key];
    expect(translate("fil", key, { name: "Ana" })).toBe("Hello, Ana!");
    fil[key] = saved;
  });
});

describe("Filipino dictionary", () => {
  it("has no keys that English does not have", () => {
    for (const k of Object.keys(fil)) expect(Object.keys(en)).toContain(k);
  });
  it("uses the same placeholders as English in every string", () => {
    for (const k of Object.keys(fil) as Key[]) expect(vars(fil[k] ?? "")).toEqual(vars(en[k]));
  });
  it("has no empty strings", () => {
    for (const v of Object.values(fil)) expect((v ?? "").trim()).not.toBe("");
  });
  it("covers every key today (a new English key must be added here too, or it shows English)", () => {
    expect(missingKeys("fil")).toEqual([]);
  });
});
