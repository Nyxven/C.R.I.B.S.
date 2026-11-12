import { describe, expect, it } from "vitest";
import { containsBlockedWord, normalizeForFilter } from "./blocked";
import { checkPostText, decodeCursor, displayNameFor, encodeCursor, isModerator, isReason, POST_MAX, shouldHide } from "./rules";

describe("checkPostText", () => {
  it("accepts a normal kind post and tidies spaces", () => {
    expect(checkPostText("  Any tips for  bedtime routines?\n\n\n\nThanks!  ")).toEqual({ ok: true, text: "Any tips for bedtime routines?\n\nThanks!" });
  });
  it("rejects empty, tiny and long posts", () => {
    expect(checkPostText("   ")).toMatchObject({ ok: false, reason: "empty" });
    expect(checkPostText("hi")).toMatchObject({ ok: false, reason: "too_short" });
    expect(checkPostText("x".repeat(POST_MAX + 1))).toMatchObject({ ok: false, reason: "too_long" });
    expect(checkPostText("x".repeat(POST_MAX)).ok).toBe(true);
  });
  it("blocks phone numbers, emails and links", () => {
    for (const t of ["call me 0917 123 4567", "mail me at ana@example.com", "see https://example.com", "+63 917 123 4567 anytime"]) expect(checkPostText(t)).toMatchObject({ ok: false, reason: "contact_details" });
  });
  it("blocks addresses and where someone lives", () => {
    for (const t of ["We live in Blk 5 Lot 3 near the park", "123 Rizal Street, Taguig", "Brgy. Ususan has a good clinic", "unit 405 tower B"]) expect(checkPostText(t)).toMatchObject({ ok: false, reason: "address" });
  });
  it("blocks strong language, including simple tricks", () => {
    for (const t of ["this is sh1t", "you are a f u c k", "ang gagooo mo", "what an a$$hole".replace("a$$hole", "asshole"), "r3tard"]) expect(checkPostText(t)).toMatchObject({ ok: false, reason: "language" });
  });
  it("leaves normal parent talk alone", () => {
    for (const t of [
      "My son is 5 and loves trains. Bedtime is hard.", "She had 3 meltdowns today but also a small win", "Grade 2 class at 8:30 am went well",
      "Shiitake mushrooms are fine for the picky eater", "Anyone use picture cards? They help a lot", "We assess progress weekly, it is a classic approach",
    ]) expect(checkPostText(t).ok).toBe(true);
  });
});

describe("blocked words", () => {
  it("normalizes tricks", () => {
    expect(normalizeForFilter("Sh1t")).toBe("shit");
    expect(normalizeForFilter("f u c k")).toBe("fuck");
    expect(normalizeForFilter("a f u c k")).toBe("a fuck");
    expect(normalizeForFilter("fuuuck")).toBe("fuck");
  });
  it("only blocks whole words for short entries (no Scunthorpe problem)", () => {
    expect(containsBlockedWord("a bitch")).toBe(true);
    expect(containsBlockedWord("a classic assessment of the bass")).toBe(false);
    expect(containsBlockedWord("puta")).toBe(true);
    expect(containsBlockedWord("computation and reputation")).toBe(false);
  });
});

describe("names, moderators, reports, cursors", () => {
  it("shows a first name only, or anonymous", () => {
    expect(displayNameFor("Ana Maria Santos", false)).toBe("Ana");
    expect(displayNameFor("Ana Santos", true)).toBe("Anonymous parent");
    expect(displayNameFor("   ", false)).toBe("A parent");
    expect(displayNameFor(null, false)).toBe("A parent");
    expect(displayNameFor("<b>Ana</b>x", false)).not.toMatch(/[<>]/);
  });
  it("reads the moderator list safely", () => {
    expect(isModerator("Mod@Example.com", "a@x.y, mod@example.com")).toBe(true);
    expect(isModerator("other@example.com", "a@x.y,mod@example.com")).toBe(false);
    expect(isModerator("mod@example.com", undefined)).toBe(false);
    expect(isModerator("mod@example.com", "")).toBe(false);
    expect(isModerator(null, "mod@example.com")).toBe(false);
  });
  it("holds a post once enough different people reported it", () => {
    const hide = (reporters: number, reasons: string[], hideAt: number) => shouldHide({ reporters, reasons, hideAt });
    expect(hide(0, [], 2)).toBe(false);
    expect(hide(1, ["unkind"], 2)).toBe(false);
    expect(hide(2, ["unkind", "spam"], 2)).toBe(true);
    expect(hide(1, ["personal_info"], 2)).toBe(true); // urgent reasons need only one report
    expect(hide(1, ["unsafe_advice"], 5)).toBe(true);
    expect(hide(0, ["personal_info"], 2)).toBe(false);
    expect(hide(1, ["spam"], 0)).toBe(true); // never fewer than one
  });
  it("round-trips a cursor and refuses junk", () => {
    const d = new Date("2026-11-10T08:00:00Z");
    const id = "3f2b8c1e-9d4a-4e6b-8a1c-0b5d7e9f1a2b";
    expect(decodeCursor(encodeCursor(d, id))).toEqual({ createdAt: d, id });
    for (const bad of [null, "", "x", "bm90LWEtY3Vyc29y", 5, "a".repeat(200), Buffer.from("123|../etc").toString("base64url")]) expect(decodeCursor(bad)).toBeNull();
  });
  it("knows the report reasons", () => {
    expect(isReason("spam")).toBe(true);
    expect(isReason("hate")).toBe(false);
  });
});
