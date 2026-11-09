import { describe, expect, it } from "vitest";
import { parseSiteverify, verifyBot } from "./turnstile";

const reply = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });

describe("verifyBot", () => {
  it("is off (everyone passes) when no secret is set", async () => {
    expect(await verifyBot(undefined, { secret: "" })).toEqual({ ok: true });
  });
  it("passes only on an explicit success", async () => {
    expect((await verifyBot("tok", { secret: "s3cret-key", fetchImpl: reply({ success: true }) })).ok).toBe(true);
    expect((await verifyBot("tok", { secret: "s3cret-key", fetchImpl: reply({ success: false }) })).ok).toBe(false);
    expect((await verifyBot("tok", { secret: "s3cret-key", fetchImpl: reply({}) })).ok).toBe(false);
    expect((await verifyBot("tok", { secret: "s3cret-key", fetchImpl: reply({ success: true }, 500) })).ok).toBe(false);
  });
  it("fails closed: no token, huge token, or Cloudflare unreachable", async () => {
    expect((await verifyBot(undefined, { secret: "s3cret-key", fetchImpl: reply({ success: true }) })).ok).toBe(false);
    expect((await verifyBot("x".repeat(3000), { secret: "s3cret-key", fetchImpl: reply({ success: true }) })).ok).toBe(false);
    expect((await verifyBot("tok", { secret: "s3cret-key", fetchImpl: async () => { throw new Error("down"); } })).ok).toBe(false);
  });
  it("sends the secret and token as a form, nothing else", async () => {
    let sent = "";
    await verifyBot("tok-1", { secret: "s3cret-key", fetchImpl: async (_u, init) => { sent = String(init!.body); return new Response("{}"); } });
    expect(sent).toBe("secret=s3cret-key&response=tok-1");
  });
  it("parseSiteverify ignores junk", () => {
    for (const j of [null, 5, "x", [], { success: "true" }]) expect(parseSiteverify(j)).toBe(false);
  });
});
