import { beforeEach, describe, expect, it } from "vitest";
import { resetAuthEnvCache } from "@/config/env";
import { codeMatches, generateCode, hashCode, hashPassword, tokenDigests, verifyPassword } from "./crypto";

const A = "a".repeat(40), B = "b".repeat(40), C = "c".repeat(40), D = "d".repeat(40);
function env(v: Record<string, string | undefined>) {
  for (const k of ["AUTH_SECRET", "AUTH_SECRET_PREVIOUS", "PASSWORD_PEPPER", "PASSWORD_PEPPER_PREVIOUS"]) delete process.env[k];
  for (const [k, val] of Object.entries(v)) if (val !== undefined) process.env[k] = val;
  resetAuthEnvCache();
}
beforeEach(() => env({ AUTH_SECRET: A, PASSWORD_PEPPER: B }));

describe("passwords", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect((await verifyPassword(h, "correct horse battery")).ok).toBe(true);
    expect((await verifyPassword(h, "wrong password!!")).ok).toBe(false);
  });
  it("salts every hash", async () => {
    expect(await hashPassword("same-password-1")).not.toBe(await hashPassword("same-password-1"));
  });
  it("never contains the plain password", async () => {
    expect(await hashPassword("super-secret-pw")).not.toContain("super-secret-pw");
  });
  it("a different pepper cannot verify (DB leak alone is useless)", async () => {
    const h = await hashPassword("correct horse battery");
    env({ AUTH_SECRET: A, PASSWORD_PEPPER: C });
    expect((await verifyPassword(h, "correct horse battery")).ok).toBe(false);
  });
  it("pepper rotation: old hashes still work and are flagged for rehash", async () => {
    const h = await hashPassword("correct horse battery");
    env({ AUTH_SECRET: A, PASSWORD_PEPPER: C, PASSWORD_PEPPER_PREVIOUS: B });
    expect(await verifyPassword(h, "correct horse battery")).toEqual({ ok: true, needsRehash: true });
    const h2 = await hashPassword("correct horse battery");
    expect(await verifyPassword(h2, "correct horse battery")).toEqual({ ok: true, needsRehash: false });
  });
  it("garbage hash fails closed", async () => {
    expect((await verifyPassword("not-a-hash", "whatever-password")).ok).toBe(false);
  });
});

describe("codes", () => {
  it("are 6 digits", () => { for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/); });
  it("match only for the same email, purpose and code", () => {
    const h = hashCode("a@b.com", "verify", "123456");
    expect(codeMatches(h, "a@b.com", "verify", "123456")).toBe(true);
    expect(codeMatches(h, "a@b.com", "verify", "123457")).toBe(false);
    expect(codeMatches(h, "x@b.com", "verify", "123456")).toBe(false);
    expect(codeMatches(h, "a@b.com", "reset", "123456")).toBe(false);
  });
  it("survive AUTH_SECRET rotation", () => {
    const h = hashCode("a@b.com", "verify", "123456");
    env({ AUTH_SECRET: D, AUTH_SECRET_PREVIOUS: A, PASSWORD_PEPPER: B });
    expect(codeMatches(h, "a@b.com", "verify", "123456")).toBe(true);
  });
});

describe("session tokens", () => {
  it("digests change with the secret and include the previous one while rotating", () => {
    const [d1] = tokenDigests("tok");
    env({ AUTH_SECRET: D, AUTH_SECRET_PREVIOUS: A, PASSWORD_PEPPER: B });
    const list = tokenDigests("tok");
    expect(list).toHaveLength(2);
    expect(list[0]).not.toBe(d1);
    expect(list[1]).toBe(d1);
  });
});

describe("env validation", () => {
  it("rejects short secrets without printing them", () => {
    env({ AUTH_SECRET: "short", PASSWORD_PEPPER: B });
    expect(() => hashCode("a@b.com", "verify", "123456")).toThrow(/AUTH_SECRET/);
    try { hashCode("a@b.com", "verify", "123456"); } catch (e) { expect(String(e)).not.toContain("short"); }
  });
});
