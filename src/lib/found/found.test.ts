import { describe, expect, it } from "vitest";
import { buildFoundCard, cleanText, DEFAULT_FIELDS, FINDER_TIPS, parseFields, type FoundFields } from "./card";
import { foundUrl, generateToken, hashToken, isTokenShape, pickAppUrl } from "./token";

const child = { nickname: "Bunso", communicationLevel: "nonspeaking", calming: "Quiet music and a hug", avoid: "Loud sirens and crowds" };
const contact = { name: "Ate Rose", phone: "0917 123 4567", isPublic: true };
const all: FoundFields = { nickname: true, autism: true, communication: true, calming: true, avoid: true, contact: true };

describe("buildFoundCard", () => {
  it("shows only what the parent chose (the defaults leave out the autism line)", () => {
    const c = buildFoundCard(child, contact, DEFAULT_FIELDS);
    expect(c.heading).toBe("Bunso");
    expect(c.facts.map((f) => f.label)).toEqual(["How they communicate", "What helps them calm down", "Please avoid"]);
    expect(c.call).toEqual({ name: "Ate Rose", display: "09171234567", href: "tel:09171234567" });
    expect(c.tips).toBe(FINDER_TIPS);
  });
  it("can show everything", () => {
    const c = buildFoundCard(child, contact, all);
    expect(c.facts[0]).toEqual({ label: "Good to know", text: expect.stringContaining("Bunso has autism") });
    expect(c.facts).toHaveLength(4);
  });
  it("hides every field the parent switched off, including the name and the number", () => {
    const none: FoundFields = { nickname: false, autism: false, communication: false, calming: false, avoid: false, contact: false };
    const c = buildFoundCard(child, contact, none);
    expect(c).toEqual({ heading: "A child who may be lost", facts: [], call: null, tips: FINDER_TIPS });
    expect(JSON.stringify(c)).not.toContain("Bunso");
    expect(JSON.stringify(c)).not.toContain("0917");
  });
  it("uses a neutral phrase for the autism line when the nickname is hidden", () => {
    const c = buildFoundCard(child, contact, { ...all, nickname: false });
    expect(c.facts[0]!.text.startsWith("This child has autism")).toBe(true);
  });
  it("shows no Call button for a private, empty or invalid number", () => {
    expect(buildFoundCard(child, { ...contact, isPublic: false }, all).call).toBeNull();
    expect(buildFoundCard(child, null, all).call).toBeNull();
    expect(buildFoundCard(child, { ...contact, phone: "call me maybe" }, all).call).toBeNull();
    expect(buildFoundCard(child, { ...contact, phone: "tel:+63917<script>" }, all).call).toBeNull();
  });
  it("skips empty answers and cleans free text", () => {
    const c = buildFoundCard({ ...child, calming: "  ", avoid: "no\u0000 shouting\n\nplease" }, contact, all);
    expect(c.facts.map((f) => f.label)).not.toContain("What helps them calm down");
    expect(c.facts.find((f) => f.label === "Please avoid")!.text).toBe("no shouting please");
  });
  it("never puts markup into the card (React escapes it, and the phone link only holds digits)", () => {
    const c = buildFoundCard({ ...child, nickname: "<img onerror=x>" }, { ...contact, phone: "+63 917 123 4567" }, all);
    expect(c.call!.href).toBe("tel:+639171234567");
    expect(c.heading).toBe("<img onerror=x>"); // plain text; the page renders it as text
  });
});

describe("parseFields / cleanText", () => {
  it("falls back to the defaults for missing or odd settings", () => {
    expect(parseFields(null)).toEqual(DEFAULT_FIELDS);
    expect(parseFields({ autism: true, avoid: "yes", extra: true })).toEqual({ ...DEFAULT_FIELDS, autism: true });
  });
  it("trims and limits text", () => expect(cleanText("x".repeat(500), 300)).toHaveLength(300));
});

describe("token", () => {
  it("is 256 random bits in 43 URL-safe characters, different every time", () => {
    const a = generateToken(), b = generateToken();
    expect(isTokenShape(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(a).toHaveLength(43);
  });
  it("hashes to a stable 64-character value that does not contain the token", () => {
    const t = generateToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).not.toContain(t.slice(0, 8));
  });
  it("rejects anything that is not the right shape before the database is touched", () => {
    for (const bad of ["", "short", "x".repeat(42), "x".repeat(44), `${"a".repeat(42)}!`, "../etc/passwd", null, undefined, 5]) expect(isTokenShape(bad)).toBe(false);
  });
  it("builds the QR address", () => expect(foundUrl("https://cribs.example/", "abc")).toBe("https://cribs.example/f/abc"));
});

describe("pickAppUrl", () => {
  it("prefers the configured address", () => expect(pickAppUrl("https://cribs.example/", "other.example")).toBe("https://cribs.example"));
  it("falls back to the host that served the request, over https", () => {
    expect(pickAppUrl(undefined, "cribs-ecru.vercel.app")).toBe("https://cribs-ecru.vercel.app");
    expect(pickAppUrl("", "localhost:3000")).toBe("http://localhost:3000");
  });
  it("refuses odd values", () => {
    expect(pickAppUrl("javascript:alert(1)", null)).toBeNull();
    expect(pickAppUrl("http://evil.example", null)).toBeNull();
    expect(pickAppUrl(undefined, "evil.example/path?x=1")).toBeNull();
    expect(pickAppUrl(undefined, null)).toBeNull();
  });
});
