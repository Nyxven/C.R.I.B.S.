import { describe, expect, it } from "vitest";
import { firstBroken } from "./guard";
import { memoryGuard } from "./memoryGuard";

describe("memoryGuard (the contract the database guard must follow)", () => {
  it("allows up to the limit, then refuses, and starts again after the window", async () => {
    let now = 0;
    const g = memoryGuard(() => now);
    expect((await g.consume("k", 1, 2, 60)).allowed).toBe(true);
    expect((await g.consume("k", 1, 2, 60)).allowed).toBe(true);
    expect((await g.consume("k", 1, 2, 60)).allowed).toBe(false);
    now = 61_000;
    expect((await g.consume("k", 1, 2, 60)).allowed).toBe(true);
  });
  it("adds amounts (token budgets) and reports use", async () => {
    const g = memoryGuard(() => 0);
    await g.consume("t", 500, Number.MAX_SAFE_INTEGER, 86400);
    await g.consume("t", 700, Number.MAX_SAFE_INTEGER, 86400);
    expect(await g.used("t")).toBe(1200);
    expect(await g.used("none")).toBe(0);
  });
  it("locks: second taker is refused until release or expiry", async () => {
    let now = 0;
    const g = memoryGuard(() => now);
    expect(await g.lock("l", 30)).toBe(true);
    expect(await g.lock("l", 30)).toBe(false);
    await g.unlock("l");
    expect(await g.lock("l", 30)).toBe(true);
    now = 31_000;
    expect(await g.lock("l", 30)).toBe(true);
  });
  it("flags switch themselves off", async () => {
    let now = 0;
    const g = memoryGuard(() => now);
    await g.flag("f", 60);
    expect(await g.flagged("f")).toBe(true);
    now = 61_000;
    expect(await g.flagged("f")).toBe(false);
  });
});

describe("firstBroken", () => {
  it("returns the first rule that is over its limit and stops there", async () => {
    const g = memoryGuard(() => 0);
    const rules = [
      { key: "a", limit: 5, windowSec: 60, scope: "ip" as const },
      { key: "b", limit: 1, windowSec: 60, scope: "user" as const },
      { key: "c", limit: 5, windowSec: 60, scope: "global" as const },
    ];
    expect(await firstBroken(g, rules)).toBeNull();
    const broken = await firstBroken(g, rules);
    expect(broken?.key).toBe("b");
    expect(await g.used("c")).toBe(1); // "c" was not counted on the second round
  });
});
