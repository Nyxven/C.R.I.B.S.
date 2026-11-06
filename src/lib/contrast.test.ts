import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrast, mix } from "./contrast";

// Reads the real tokens from globals.css, so changing a color there re-checks it here.
const css = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");
const tokens = new Map<string, string>();
for (const m of css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) tokens.set(m[1]!, m[2]!);
const accent = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))![1]!;
const hex = (name: string) => (name === "white" ? "#FFFFFF" : tokens.get(name) ?? "missing:" + name);

const tints = ["tint-purple", "tint-mint", "tint-yellow", "tint-coral", "tint-pink", "tint-sage"];
const text: [string, string][] = [ // [text color, background], all need 4.5:1
  ...["cream", "white", ...tints].flatMap((bg): [string, string][] => [["ink", bg], ["ink-soft", bg]]),
  ["brand", "cream"], ["brand", "white"], ["brand", "tint-purple"],
  ["coral-dark", "cream"], ["coral-dark", "white"],
  ["sage-dark", "cream"], ["sage-dark", "white"], ["sage-dark", "tint-sage"],
  ["amber-dark", "cream"], ["amber-dark", "white"], ["amber-dark", "tint-yellow"], ["amber-dark", "tint-coral"],
  ["mint-dark", "cream"], ["mint-dark", "white"], ["mint-dark", "tint-mint"],
  ["pink-dark", "cream"], ["pink-dark", "white"], ["pink-dark", "tint-pink"],
  ["white", "brand"], ["white", "coral-dark"], ["white", "pink-dark"], ["white", "ink"],
];

describe("brand colors (WCAG AA)", () => {
  it("has every token the checks need", () => {
    for (const name of new Set([...text.flat(), "field"])) expect(hex(name).startsWith("#")).toBe(true);
  });
  it.each(text)("text %s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(hex(fg), hex(bg))).toBeGreaterThanOrEqual(4.5);
  });
  it("input borders are at least 3:1 on white and cream", () => {
    expect(contrast(hex("field"), "#FFFFFF")).toBeGreaterThanOrEqual(3);
    expect(contrast(hex("field"), hex("cream"))).toBeGreaterThanOrEqual(3);
  });
  it("white text stays at least 4.5:1 along the whole button gradient", () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(contrast("#FFFFFF", mix(accent("accent-a"), accent("accent-b"), t))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
