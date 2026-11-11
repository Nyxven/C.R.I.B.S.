import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryGuard } from "@/lib/security/memoryGuard";

const s = vi.hoisted(() => ({
  user: { id: "u1", name: "Ana", email: "ana@example.com", passwordHash: "H:old-password-1", createdAt: new Date("2026-11-01T00:00:00Z") } as { id: string; name: string; email: string; passwordHash: string; createdAt: Date } | undefined,
  calls: [] as string[], mails: [] as string[], mailFails: false, settings: [] as unknown[],
}));

vi.mock("@/server/auth/crypto", () => ({
  hashPassword: async (pw: string) => `H:${pw}`,
  verifyPassword: async (hash: string, pw: string) => ({ ok: hash === `H:${pw}` }),
}));
vi.mock("@/lib/mail", async (orig) => ({ ...(await orig<typeof import("@/lib/mail")>()), sendMail: async (m: { to: string; subject: string }) => { if (s.mailFails) throw new Error("mail down"); s.mails.push(`${m.to}|${m.subject}`); } }));
vi.mock("@/server/auth/repo", () => ({
  findUserById: async () => s.user,
  setPasswordHash: async (_id: string, h: string) => { s.calls.push(`setPassword:${h}`); if (s.user) s.user.passwordHash = h; },
  deleteOtherSessions: async (_u: string, keep: string) => { s.calls.push(`signOutOthers:keep=${keep}`); return 2; },
  deleteUserCodes: async (email: string) => { s.calls.push(`deleteCodes:${email}`); },
  deleteUser: async (id: string) => { s.calls.push(`deleteUser:${id}`); },
}));
vi.mock("@/server/onboarding/repo", () => ({
  getProfile: async () => ({ displayName: "Ana", relationship: "mother", language: "en", theme: "sunrise", textSize: 100, sensoryMode: false, notifOn: true, chatHistoryEnabled: true, userId: "u1" }),
  getChild: async () => ({ id: "c1", userId: "u1", nickname: "Bunso", ageYears: 4 }),
  getContact: async () => ({ name: "Ate Rose", phone: "0917", isPublic: true }),
  updateSettings: async (_u: string, patch: unknown) => { s.settings.push(patch); },
}));
vi.mock("@/server/progress/repo", () => ({ listProgress: async () => [{ slug: "a", saved: true, read: true }] }));
vi.mock("@/server/chat/repo", () => ({
  listThreads: async () => [{ id: "t1", title: "Bedtime", updatedAt: new Date("2026-11-09T00:00:00Z") }],
  listMessages: async () => [{ id: "m1", role: "user", content: "Q", sources: [], feedback: null, createdAt: new Date("2026-11-09T00:00:00Z") }],
}));
vi.mock("@/server/found/repo", () => ({ activeTag: async () => ({ id: "tag1", enabled: true, createdAt: new Date("2026-11-05T00:00:00Z"), accessCount: 2, lastAccessedAt: null, publicFields: {} }) }));

import { changePassword, deleteAccount, exportData, signOutOtherDevices, updateSettings } from "./service";

let guard = memoryGuard();
beforeEach(() => {
  s.user = { id: "u1", name: "Ana", email: "ana@example.com", passwordHash: "H:old-password-1", createdAt: new Date("2026-11-01T00:00:00Z") };
  s.calls.length = 0; s.mails.length = 0; s.settings.length = 0; s.mailFails = false; guard = memoryGuard();
});

describe("changePassword", () => {
  const input = { current: "old-password-1", next: "brand-new-password-2" };
  it("changes it, signs out the other devices (keeping this one), and emails a notice", async () => {
    expect(await changePassword("u1", "sess-9", input, guard)).toEqual({ ok: true });
    expect(s.calls).toEqual(["setPassword:H:brand-new-password-2", "signOutOthers:keep=sess-9"]);
    expect(s.mails).toEqual(["ana@example.com|Your C.R.I.B.S. password was changed"]);
  });
  it("refuses a wrong current password and changes nothing", async () => {
    expect(await changePassword("u1", "s", { ...input, current: "nope-nope-nope" }, guard)).toEqual({ ok: false, error: "That password is not right." });
    expect(s.calls).toEqual([]);
  });
  it("refuses a weak or unchanged password", async () => {
    expect((await changePassword("u1", "s", { current: "old-password-1", next: "short" }, guard)).ok).toBe(false);
    expect((await changePassword("u1", "s", { current: "old-password-1", next: "old-password-1" }, guard)).ok).toBe(false);
    expect(s.calls).toEqual([]);
  });
  it("limits guessing of the current password", async () => {
    for (let i = 0; i < 5; i++) await changePassword("u1", "s", { ...input, current: `wrong-guess-${i}` }, guard);
    expect(await changePassword("u1", "s", input, guard)).toEqual({ ok: false, error: "Too many tries. Please wait a while and try again." });
    expect(s.calls).toEqual([]);
  });
  it("still succeeds when the notice email cannot be sent", async () => {
    s.mailFails = true;
    expect(await changePassword("u1", "s", input, guard)).toEqual({ ok: true });
  });
  it("rejects unknown fields", async () => expect((await changePassword("u1", "s", { ...input, admin: true }, guard)).ok).toBe(false));
});

describe("signOutOtherDevices", () => {
  it("signs out the others and reports how many", async () => {
    expect(await signOutOtherDevices("u1", "sess-1", guard)).toEqual({ ok: true, signedOut: 2 });
    expect(s.calls).toEqual(["signOutOthers:keep=sess-1"]);
  });
});

describe("deleteAccount", () => {
  const good = { password: "old-password-1", confirm: "DELETE" };
  it("deletes the codes and the account when the password and the word match", async () => {
    expect(await deleteAccount("u1", good, guard)).toEqual({ ok: true });
    expect(s.calls).toEqual(["deleteCodes:ana@example.com", "deleteUser:u1"]);
  });
  it("needs the exact word and the right password", async () => {
    for (const bad of [{ password: "old-password-1", confirm: "delete" }, { password: "old-password-1" }, { confirm: "DELETE" }, { password: "wrong-password!", confirm: "DELETE" }]) {
      expect((await deleteAccount("u1", bad, guard)).ok).toBe(false);
    }
    expect(s.calls).toEqual([]);
  });
  it("limits attempts", async () => {
    for (let i = 0; i < 3; i++) await deleteAccount("u1", { password: `wrong-guess-${i}`, confirm: "DELETE" }, guard);
    expect(await deleteAccount("u1", good, guard)).toEqual({ ok: false, error: "Too many tries. Please wait a while and try again." });
    expect(s.calls).toEqual([]);
  });
});

describe("exportData", () => {
  it("returns readable JSON with the person's data and no ids or secrets", async () => {
    const r = await exportData("u1", guard);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fileName).toMatch(/^cribs-my-data-\d{4}-\d{2}-\d{2}\.json$/);
    const data = JSON.parse(r.json);
    expect(data.account.email).toBe("ana@example.com");
    expect(data.child).toEqual({ nickname: "Bunso", ageYears: 4 });
    expect(data.askChats[0].messages[0].text).toBe("Q");
    expect(data.ifFoundTag).toMatchObject({ enabled: true, timesOpened: 2 });
    for (const leak of ["passwordHash", "H:old-password", "tag1", "userId", '"id"']) expect(r.json).not.toContain(leak);
  });
  it("limits how often it can be requested", async () => {
    for (let i = 0; i < 3; i++) await exportData("u1", guard);
    expect((await exportData("u1", guard)).ok).toBe(false);
  });
});

describe("updateSettings", () => {
  it("passes only the allowed fields through", async () => {
    expect(await updateSettings("u1", { theme: "ocean", textSize: 120, notifOn: false })).toEqual({ ok: true });
    expect(s.settings).toEqual([{ theme: "ocean", textSize: 120, notifOn: false }]);
  });
  it("rejects empty, unknown and out-of-range values without saving", async () => {
    for (const bad of [{}, { theme: "neon" }, { textSize: 300 }, { relationship: "stranger" }, { isAdmin: true }, { displayName: "  " }, { language: "xx" }]) expect((await updateSettings("u1", bad)).ok).toBe(false);
    expect(s.settings).toEqual([]);
  });
});
