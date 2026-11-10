import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryGuard } from "@/lib/security/memoryGuard";
import { hashToken } from "@/lib/found/token";
import type { FoundFields } from "@/lib/found/card";

type Tag = { id: string; childId: string; tokenHash: string; fields: FoundFields; enabled: boolean; revokedAt: Date | null; accessCount: number };
const db = vi.hoisted(() => ({
  tags: [] as Tag[], seq: 0, children: { u1: { id: "c1", nickname: "Bunso", communicationLevel: "few_words", calming: "Music", avoid: "Sirens" } } as Record<string, { id: string; nickname: string; communicationLevel: string; calming: string; avoid: string }>,
  contacts: { c1: { name: "Ate Rose", phone: "0917 123 4567", isPublic: true } } as Record<string, { name: string; phone: string; isPublic: boolean }>,
  failBump: false,
}));

vi.mock("@/server/onboarding/repo", () => ({ getChild: async (u: string) => db.children[u], getContact: async (c: string) => db.contacts[c] }));
vi.mock("./repo", () => ({
  activeTag: async (c: string) => { const t = db.tags.filter((x) => x.childId === c && !x.revokedAt).at(-1); return t && { id: t.id, enabled: t.enabled, createdAt: new Date(0), accessCount: t.accessCount, lastAccessedAt: null, publicFields: t.fields }; },
  revokeAll: async (c: string) => { let n = 0; for (const t of db.tags) if (t.childId === c && !t.revokedAt) { t.revokedAt = new Date(); t.enabled = false; n++; } return n; },
  insertTag: async (c: string, hash: string, fields: FoundFields) => { db.tags.push({ id: `t${++db.seq}`, childId: c, tokenHash: hash, fields, enabled: true, revokedAt: null, accessCount: 0 }); },
  updateFields: async (c: string, f: FoundFields) => { const t = db.tags.filter((x) => x.childId === c && !x.revokedAt).at(-1); if (t) t.fields = f; return !!t; },
  setEnabled: async (c: string, e: boolean) => { const t = db.tags.filter((x) => x.childId === c && !x.revokedAt).at(-1); if (t) t.enabled = e; return !!t; },
  findByHash: async (h: string) => {
    const t = db.tags.find((x) => x.tokenHash === h); if (!t) return undefined;
    const kid = Object.values(db.children).find((k) => k.id === t.childId)!; const ct = db.contacts[t.childId];
    return { id: t.id, enabled: t.enabled, revokedAt: t.revokedAt, publicFields: t.fields, nickname: kid.nickname, communicationLevel: kid.communicationLevel, calming: kid.calming, avoid: kid.avoid, contactName: ct?.name ?? null, contactPhone: ct?.phone ?? null, contactPublic: ct?.isPublic ?? null };
  },
  bumpAccess: async (id: string) => { if (db.failBump) throw new Error("db"); const t = db.tags.find((x) => x.id === id); if (t) t.accessCount++; },
}));

import { createTag, getStatus, lookupPublic, revokeTag, saveFields, switchTag } from "./service";

let guard = memoryGuard();
beforeEach(() => { db.tags = []; db.seq = 0; db.failBump = false; guard = memoryGuard(); });
const URL = "https://cribs.example";
const make = async () => { const r = await createTag("u1", URL, guard); if (!r.ok) throw new Error(r.error); return r; };
const visit = (token: unknown, ip = "ip1") => lookupPublic(token, ip, guard);

describe("making a tag", () => {
  it("returns the token once, stores only its hash, and builds the QR address", async () => {
    const r = await make();
    expect(r.url).toBe(`${URL}/f/${r.token}`);
    expect(db.tags[0]!.tokenHash).toBe(hashToken(r.token));
    expect(JSON.stringify(db.tags)).not.toContain(r.token);
  });
  it("switches the old link off when a new one is made, keeping the parent's choices", async () => {
    const first = await make();
    await saveFields("u1", { nickname: true, autism: true, communication: false, calming: true, avoid: true, contact: true });
    const second = await make();
    expect((await visit(first.token)).type).toBe("notfound");
    expect((await visit(second.token)).type).toBe("card");
    expect(db.tags.at(-1)!.fields.autism).toBe(true);
    expect(db.tags.at(-1)!.fields.communication).toBe(false);
  });
  it("needs a child profile and limits how often tags can be made", async () => {
    expect((await createTag("nobody", URL, guard)).ok).toBe(false);
    for (let i = 0; i < 5; i++) await make();
    expect((await createTag("u1", URL, guard)).ok).toBe(false);
  });
});

describe("the public page", () => {
  it("shows the card with only the chosen parts and counts the visit", async () => {
    const { token } = await make();
    const r = await visit(token);
    expect(r.type).toBe("card");
    if (r.type !== "card") return;
    expect(r.card.heading).toBe("Bunso");
    expect(r.card.call?.href).toBe("tel:09171234567");
    expect(r.card.facts.map((f) => f.label)).toEqual(["How they communicate", "What helps them calm down", "Please avoid"]);
    expect(db.tags[0]!.accessCount).toBe(1);
  });
  it("looks identical for a made-up, malformed, disabled or revoked link", async () => {
    const { token } = await make();
    expect((await visit("a".repeat(43))).type).toBe("notfound");
    expect((await visit("not-a-token")).type).toBe("notfound");
    expect((await visit(undefined)).type).toBe("notfound");
    await switchTag("u1", false);
    expect((await visit(token)).type).toBe("notfound");
    await switchTag("u1", true);
    expect((await visit(token)).type).toBe("card");
    await revokeTag("u1");
    expect((await visit(token)).type).toBe("notfound");
  });
  it("hides the number when the parent turns it off", async () => {
    const { token } = await make();
    await saveFields("u1", { nickname: true, autism: false, communication: true, calming: true, avoid: true, contact: false });
    const r = await visit(token);
    expect(r.type === "card" && r.card.call).toBeNull();
  });
  it("still shows the page when counting fails", async () => {
    const { token } = await make();
    db.failBump = true;
    expect((await visit(token)).type).toBe("card");
  });
  it("limits one address (guessing and scraping) without locking out other people", async () => {
    const { token } = await make();
    let limited = 0;
    for (let i = 0; i < 40; i++) if ((await visit(token, "scraper")).type === "limited") limited++;
    expect(limited).toBeGreaterThan(0);
    expect((await visit(token, "someone-else")).type).toBe("card");
  });
  it("limits guessing even when the guesses are malformed", async () => {
    let limited = 0;
    for (let i = 0; i < 40; i++) if ((await visit(`bad${i}`, "guesser")).type === "limited") limited++;
    expect(limited).toBeGreaterThan(0);
  });
});

describe("settings", () => {
  it("reports the tag status without ever including the token", async () => {
    expect(await getStatus("u1")).toEqual({ hasChild: true, hasContact: true, tag: null });
    const { token } = await make();
    const s = await getStatus("u1");
    expect(s.tag).toMatchObject({ enabled: true, accessCount: 0 });
    expect(JSON.stringify(s)).not.toContain(token);
    expect(await getStatus("nobody")).toEqual({ hasChild: false, hasContact: false, tag: null });
  });
  it("rejects bad field settings and needs a tag first", async () => {
    expect((await saveFields("u1", { nickname: true })).ok).toBe(false);
    expect((await saveFields("u1", { nickname: true, autism: true, communication: true, calming: true, avoid: true, contact: true, extra: 1 })).ok).toBe(false);
    expect(await saveFields("u1", { nickname: true, autism: true, communication: true, calming: true, avoid: true, contact: true })).toEqual({ ok: false, error: "Make a tag first." });
    expect((await switchTag("u1", "yes")).ok).toBe(false);
  });
});
