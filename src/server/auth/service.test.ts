import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAuthEnvCache } from "@/config/env";

// ---- in-memory fake of the repo layer ----
type U = { id: string; name: string; email: string; passwordHash: string; emailVerifiedAt: Date | null };
const db = vi.hoisted(() => ({
  users: [] as { id: string; name: string; email: string; passwordHash: string; emailVerifiedAt: Date | null }[],
  codes: new Map<string, { id: string; codeHash: string; expiresAt: Date; attempts: number }>(),
  limits: new Map<string, number>(),
  sessionsDeleted: [] as string[],
  mails: [] as { to: string; subject: string; html: string }[],
  started: [] as string[],
}));
const ck = (e: string, p: string) => `${e}|${p}`;

vi.mock("./repo", () => ({
  findUserByEmail: async (e: string) => db.users.find((u) => u.email === e),
  insertUser: async (v: { id: string; name: string; email: string; passwordHash: string }) => { db.users.push({ ...v, emailVerifiedAt: null }); },
  resetUnverifiedUser: async (id: string, v: { name: string; passwordHash: string }) => { Object.assign(db.users.find((u) => u.id === id)!, v); },
  markEmailVerified: async (id: string) => { db.users.find((u) => u.id === id)!.emailVerifiedAt = new Date(); },
  setPasswordHash: async (id: string, h: string) => { db.users.find((u) => u.id === id)!.passwordHash = h; },
  upsertLoginCode: async (v: { id: string; email: string; purpose: string; codeHash: string; expiresAt: Date }) => { db.codes.set(ck(v.email, v.purpose), { id: v.id, codeHash: v.codeHash, expiresAt: v.expiresAt, attempts: 0 }); },
  getLoginCode: async (e: string, p: string) => db.codes.get(ck(e, p)),
  bumpCodeAttempts: async (id: string) => { for (const c of db.codes.values()) if (c.id === id) c.attempts++; },
  deleteLoginCode: async (e: string, p: string) => { db.codes.delete(ck(e, p)); },
  deleteUserSessions: async (id: string) => { db.sessionsDeleted.push(id); },
  hitRateLimit: async (key: string, limit: number) => { const n = (db.limits.get(key) ?? 0) + 1; db.limits.set(key, n); return { allowed: n <= limit }; },
}));
vi.mock("./session", () => ({ startSession: async (id: string) => { db.started.push(id); }, endSession: async () => {} }));
vi.mock("@/lib/mail", async (orig) => ({ ...(await orig<typeof import("@/lib/mail")>()), sendMail: async (m: { to: string; subject: string; html: string }) => { db.mails.push(m); } }));

import * as svc from "./service";

const lastCode = () => /(\d{6})/.exec(db.mails.at(-1)!.html)![1];
const good = { name: "Ana", email: "ana@example.com", password: "a-long-password-1" };

beforeEach(() => {
  process.env.AUTH_SECRET = "a".repeat(40); process.env.PASSWORD_PEPPER = "b".repeat(40);
  resetAuthEnvCache();
  db.users.length = 0; db.codes.clear(); db.limits.clear(); db.sessionsDeleted.length = 0; db.mails.length = 0; db.started.length = 0;
});

describe("sign-up and verify", () => {
  it("creates an unverified user, emails a code, then verifies and signs in", async () => {
    expect(await svc.signUp(good, "1.1.1.1")).toEqual({ ok: true });
    expect(db.users).toHaveLength(1);
    expect(db.users[0].passwordHash).not.toContain(good.password);
    expect(db.users[0].emailVerifiedAt).toBeNull();
    expect((await svc.verifyEmail({ email: good.email, code: "000000" }, "1.1.1.1")).ok).toBe(false);
    expect(await svc.verifyEmail({ email: good.email, code: lastCode() }, "1.1.1.1")).toEqual({ ok: true });
    expect(db.users[0].emailVerifiedAt).not.toBeNull();
    expect(db.started).toEqual([db.users[0].id]);
  });
  it("normalizes email case", async () => {
    await svc.signUp({ ...good, email: "  ANA@Example.com " }, "ip");
    expect(db.users[0].email).toBe("ana@example.com");
  });
  it("rejects short passwords", async () => {
    const r = await svc.signUp({ ...good, password: "short" }, "ip");
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining("10 characters") });
    expect(db.users).toHaveLength(0);
  });
  it("does not reveal existing accounts (same response, no new user, notice email)", async () => {
    await svc.signUp(good, "ip"); await svc.verifyEmail({ email: good.email, code: lastCode() }, "ip");
    const r = await svc.signUp({ ...good, name: "Mallory", password: "another-long-pass-2" }, "ip2");
    expect(r).toEqual({ ok: true });
    expect(db.users).toHaveLength(1);
    expect(db.users[0].name).toBe("Ana");
    expect(db.mails.at(-1)!.subject).toMatch(/already have/);
  });
  it("locks a code after 5 wrong attempts, even if the right code follows", async () => {
    await svc.signUp(good, "ip");
    const code = lastCode();
    for (let i = 0; i < 5; i++) await svc.verifyEmail({ email: good.email, code: "999999" === code ? "111111" : "999999" }, "ip");
    expect((await svc.verifyEmail({ email: good.email, code }, "ip")).ok).toBe(false);
  });
  it("rate-limits repeated sign-ups for one email", async () => {
    for (let i = 0; i < 3; i++) expect((await svc.signUp(good, `ip${i}`)).ok).toBe(true);
    expect((await svc.signUp(good, "ip9")).ok).toBe(false);
  });
});

describe("sign-in", () => {
  async function verifiedUser() {
    await svc.signUp(good, "ip"); await svc.verifyEmail({ email: good.email, code: lastCode() }, "ip");
    db.started.length = 0; db.limits.clear();
  }
  it("signs in with the right password", async () => {
    await verifiedUser();
    expect(await svc.signIn({ email: good.email, password: good.password }, "ip")).toEqual({ ok: true });
    expect(db.started).toHaveLength(1);
  });
  it("gives the same error for a wrong password and an unknown email", async () => {
    await verifiedUser();
    const a = await svc.signIn({ email: good.email, password: "wrong-password-1" }, "ip");
    const b = await svc.signIn({ email: "nobody@example.com", password: "wrong-password-1" }, "ip");
    expect(a).toEqual(b);
    expect(db.started).toHaveLength(0);
  });
  it("asks unverified users to verify instead of signing in", async () => {
    await svc.signUp(good, "ip"); db.limits.clear();
    expect(await svc.signIn({ email: good.email, password: good.password }, "ip")).toEqual({ ok: true, needsVerify: true });
    expect(db.started).toHaveLength(0);
  });
  it("blocks brute force on one email", async () => {
    await verifiedUser();
    for (let i = 0; i < 8; i++) await svc.signIn({ email: good.email, password: "wrong-password-1" }, `ip${i}`);
    const r = await svc.signIn({ email: good.email, password: good.password }, "ip-new");
    expect(r.ok).toBe(false);
    expect(db.started).toHaveLength(0);
  });
});

describe("password reset", () => {
  it("returns ok for unknown emails and sends nothing", async () => {
    expect(await svc.requestPasswordReset({ email: "ghost@example.com" }, "ip")).toEqual({ ok: true });
    expect(db.mails).toHaveLength(0);
  });
  it("sets a new password, signs out all sessions, old password stops working", async () => {
    await svc.signUp(good, "ip"); await svc.verifyEmail({ email: good.email, code: lastCode() }, "ip"); db.limits.clear();
    await svc.requestPasswordReset({ email: good.email }, "ip");
    expect(await svc.resetPassword({ email: good.email, code: lastCode(), password: "brand-new-password-3" }, "ip")).toEqual({ ok: true });
    expect(db.sessionsDeleted).toEqual([db.users[0].id]);
    db.limits.clear();
    expect((await svc.signIn({ email: good.email, password: good.password }, "ip")).ok).toBe(false);
    expect((await svc.signIn({ email: good.email, password: "brand-new-password-3" }, "ip")).ok).toBe(true);
  });
  it("a reset code cannot be reused", async () => {
    await svc.signUp(good, "ip"); await svc.verifyEmail({ email: good.email, code: lastCode() }, "ip"); db.limits.clear();
    await svc.requestPasswordReset({ email: good.email }, "ip");
    const code = lastCode();
    await svc.resetPassword({ email: good.email, code, password: "brand-new-password-3" }, "ip");
    expect((await svc.resetPassword({ email: good.email, code, password: "another-password-4" }, "ip")).ok).toBe(false);
  });
});
