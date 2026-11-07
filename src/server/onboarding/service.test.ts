import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- in-memory fake of the repo layer, keyed by user so ownership can be checked ----
type P = { userId: string; displayName: string | null; relationship: string | null; onboardingStep: number; onboardingCompletedAt: Date | null };
type C = Record<string, unknown> & { id: string; userId: string; nickname: string; createdAt: Date };
const store = vi.hoisted(() => ({
  profiles: new Map<string, P>(),
  children: [] as C[],
  contacts: new Map<string, { name: string; phone: string }>(),
}));
const prof = (userId: string): P => {
  if (!store.profiles.has(userId)) store.profiles.set(userId, { userId, displayName: null, relationship: null, onboardingStep: 0, onboardingCompletedAt: null });
  return store.profiles.get(userId)!;
};

vi.mock("./repo", () => ({
  getProfile: async (u: string) => store.profiles.get(u),
  getChild: async (u: string) => store.children.find((c) => c.userId === u),
  getContact: async (id: string) => { const c = store.contacts.get(id); return c ? { id: `contact-${id}`, childId: id, isPublic: true, ...c } : undefined; },
  upsertProfile: async (u: string, patch: { displayName: string; relationship: string }) => { Object.assign(prof(u), patch); },
  advanceStep: async (u: string, n: number) => { const p = prof(u); p.onboardingStep = Math.max(p.onboardingStep, n); },
  completeOnboarding: async (u: string) => { const p = prof(u); p.onboardingCompletedAt ??= new Date(); },
  insertChild: async (userId: string, id: string, v: Record<string, unknown> & { nickname: string }) => { store.children.push({ createdAt: new Date(), ...v, id, userId }); },
  updateChild: async (userId: string, id: string, patch: Record<string, unknown>) => { const c = store.children.find((x) => x.id === id && x.userId === userId); if (c) Object.assign(c, patch); },
  setContact: async (childId: string, c: { name: string; phone: string } | null) => { if (c) store.contacts.set(childId, c); else store.contacts.delete(childId); },
}));

import * as svc from "./service";

const A = "user-a";
const B = "user-b";
const childOf = (u: string) => store.children.find((c) => c.userId === u)!;
const aboutOk = { step: "about", data: { displayName: "Ana", relationship: "mother" } };
const childOk = { step: "child", data: { nickname: "Bo", ageYears: 6, pronouns: "they" } };

beforeEach(() => { store.profiles.clear(); store.children.length = 0; store.contacts.clear(); });

describe("saving steps", () => {
  it("saves about, then the child, and moves the pointer forward", async () => {
    expect(await svc.saveStep(A, aboutOk)).toEqual({ ok: true });
    expect(store.profiles.get(A)).toMatchObject({ displayName: "Ana", relationship: "mother", onboardingStep: 1 });
    expect(await svc.saveStep(A, childOk)).toEqual({ ok: true });
    expect(childOf(A)).toMatchObject({ nickname: "Bo", ageYears: 6, pronouns: "they" });
    expect(store.profiles.get(A)!.onboardingStep).toBe(2);
  });
  it("updates the same child instead of adding another", async () => {
    await svc.saveStep(A, childOk);
    await svc.saveStep(A, { step: "child", data: { nickname: "Bobo", ageYears: 7, pronouns: "" } });
    expect(store.children).toHaveLength(1);
    expect(childOf(A)).toMatchObject({ nickname: "Bobo", ageYears: 7, pronouns: null });
  });
  it("refuses later steps until the child exists", async () => {
    const r = await svc.saveStep(A, { step: "journey", data: { journeyStage: "diagnosed" } });
    expect(r.ok).toBe(false);
    expect(store.profiles.get(A)).toBeUndefined();
  });
  it("rejects bad input without touching the data", async () => {
    const r = await svc.saveStep(A, { step: "about", data: { displayName: "", relationship: "mother" } });
    expect(r).toEqual({ ok: false, error: "Please tell us your name." });
    expect(store.profiles.size).toBe(0);
  });
  it("stores empty choices as null and only real sensory answers", async () => {
    await svc.saveStep(A, childOk);
    await svc.saveStep(A, { step: "journey", data: { journeyStage: "" } });
    await svc.saveStep(A, { step: "sensory", data: { sensory: { sound: "avoids", light: "none", touch: "seeks" } } });
    expect(childOf(A).journeyStage).toBeNull();
    expect(childOf(A).sensory).toEqual({ sound: "avoids", touch: "seeks" });
  });
  it("saves safety answers and the emergency contact, and clears the contact", async () => {
    await svc.saveStep(A, childOk);
    const safety = { wanderingRisk: "sometimes", avoid: "loud hand dryers", contactName: "Lola", contactPhone: "0917 123 4567", wearsTag: true, tagNetwork: "apple" };
    expect(await svc.saveStep(A, { step: "safety", data: safety })).toEqual({ ok: true });
    expect(childOf(A)).toMatchObject({ wanderingRisk: "sometimes", wearsTag: true, tagNetwork: "apple" });
    expect(store.contacts.get(childOf(A).id)).toEqual({ name: "Lola", phone: "09171234567" });
    await svc.saveStep(A, { step: "safety", data: { ...safety, contactName: "", contactPhone: "" } });
    expect(store.contacts.has(childOf(A).id)).toBe(false);
  });
  it("never touches another user's child", async () => {
    await svc.saveStep(A, childOk);
    await svc.saveStep(B, { step: "child", data: { nickname: "Zed", ageYears: null, pronouns: "" } });
    await svc.saveStep(B, { step: "calming", data: { calming: "music", interests: "" } });
    expect(childOf(A).calming).toBeUndefined();
    expect(childOf(B)).toMatchObject({ nickname: "Zed", calming: "music" });
  });
});

describe("skipping", () => {
  it("moves on from optional steps without changing answers", async () => {
    await svc.saveStep(A, aboutOk);
    await svc.saveStep(A, childOk);
    expect(await svc.skipStep(A, { step: "journey" })).toEqual({ ok: true });
    expect(store.profiles.get(A)!.onboardingStep).toBe(3);
    expect(childOf(A).journeyStage).toBeUndefined();
  });
  it("does not skip the required steps", async () => {
    expect((await svc.skipStep(A, { step: "about" })).ok).toBe(false);
    expect((await svc.skipStep(A, { step: "child" })).ok).toBe(false);
    expect((await svc.skipStep(A, { step: "review" })).ok).toBe(false);
    expect((await svc.skipStep(A, { step: "bogus" })).ok).toBe(false);
  });
});

describe("finishing", () => {
  it("needs a parent name and a child nickname", async () => {
    expect((await svc.finish(A)).ok).toBe(false);
    await svc.saveStep(A, aboutOk);
    expect((await svc.finish(A)).ok).toBe(false);
    await svc.saveStep(A, childOk);
    expect(await svc.finish(A)).toEqual({ ok: true });
    expect(await svc.isOnboarded(A)).toBe(true);
    expect(await svc.isOnboarded(B)).toBe(false);
  });
  it("keeps the first completion date when finishing twice", async () => {
    await svc.saveStep(A, aboutOk); await svc.saveStep(A, childOk);
    await svc.finish(A);
    const first = store.profiles.get(A)!.onboardingCompletedAt;
    await svc.finish(A);
    expect(store.profiles.get(A)!.onboardingCompletedAt).toBe(first);
  });
  it("gives names for the Home greeting", async () => {
    await svc.saveStep(A, aboutOk); await svc.saveStep(A, childOk);
    expect(await svc.getGreeting(A)).toEqual({ parent: "Ana", child: "Bo" });
    expect(await svc.getGreeting(B)).toEqual({ parent: "", child: "" });
  });
});

describe("loading", () => {
  it("starts empty with the sign-up name filled in", async () => {
    const s = await svc.loadOnboarding(A, "Ana Cruz");
    expect(s.step).toBe(0);
    expect(s.data.displayName).toBe("Ana Cruz");
    expect(s.data.nickname).toBe("");
  });
  it("resumes where the parent stopped, with saved answers", async () => {
    await svc.saveStep(A, aboutOk); await svc.saveStep(A, childOk);
    await svc.saveStep(A, { step: "challenges", data: { challenges: ["sleep"] } });
    const s = await svc.loadOnboarding(A, "x");
    expect(s.step).toBe(7);
    expect(s.data).toMatchObject({ displayName: "Ana", relationship: "mother", nickname: "Bo", ageYears: 6, pronouns: "they", challenges: ["sleep"] });
  });
  it("does not resume past a required answer", async () => {
    await svc.skipStep(A, { step: "journey" });
    expect((await svc.loadOnboarding(A, "Ana")).step).toBe(0);
    await svc.saveStep(A, aboutOk);
    expect((await svc.loadOnboarding(A, "Ana")).step).toBe(1);
  });
  it("ignores values that are no longer on the lists", async () => {
    await svc.saveStep(A, aboutOk); await svc.saveStep(A, childOk);
    Object.assign(childOf(A), { journeyStage: "old-value", commTools: ["aac", "x"], sensory: { sound: "avoids", light: "weird" } });
    const s = await svc.loadOnboarding(A, "x");
    expect(s.data.journeyStage).toBe("");
    expect(s.data.commTools).toEqual(["aac"]);
    expect(s.data.sensory).toEqual({ sound: "avoids" });
  });
  it("loads the emergency contact", async () => {
    await svc.saveStep(A, childOk);
    await svc.saveStep(A, { step: "safety", data: { wanderingRisk: "", avoid: "", contactName: "Lola", contactPhone: "09171234567", wearsTag: false, tagNetwork: "" } });
    const s = await svc.loadOnboarding(A, "x");
    expect(s.data).toMatchObject({ contactName: "Lola", contactPhone: "09171234567" });
  });
});
