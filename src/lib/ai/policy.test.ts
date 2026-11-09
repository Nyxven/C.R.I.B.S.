import { describe, expect, it } from "vitest";
import { buildPolicy, globalRules, ipRules, isNewAccount, userRules, estimateTokens } from "./policy";

const limits = { perHour: 20, perDay: 60, userTokensPerDay: 40000, globalPerMin: 10, globalPerDay: 400, globalTokensPerDay: 400000 };
const p = buildPolicy(limits);

describe("buildPolicy", () => {
  it("derives the minute limits from the hourly one", () => {
    expect(p.user).toEqual({ perMin: 4, perHour: 20, perDay: 60, newPerDay: 15 });
    expect(p.ip).toEqual({ perMin: 8, perHour: 40 });
  });
  it("keeps the minute limit between 2 and 6", () => {
    expect(buildPolicy({ ...limits, perHour: 1 }).user.perMin).toBe(2);
    expect(buildPolicy({ ...limits, perHour: 500 }).user.perMin).toBe(6);
  });
  it("never lets new accounts have more than everyone else", () => {
    expect(buildPolicy({ ...limits, perDay: 5 }).user.newPerDay).toBe(5);
  });
});

describe("rules", () => {
  it("builds keyed IP rules that contain only the hashed bucket", () => {
    const r = ipRules(p, "abc123");
    expect(r.map((x) => x.key)).toEqual(["ai:ip:min:abc123", "ai:ip:hr:abc123"]);
    expect(r.every((x) => x.scope === "ip")).toBe(true);
  });
  it("gives new accounts a lower daily limit", () => {
    expect(userRules(p, "u1", 1).find((x) => x.key.includes(":day:"))!.limit).toBe(15);
    expect(userRules(p, "u1", 48).find((x) => x.key.includes(":day:"))!.limit).toBe(60);
    expect(isNewAccount(23.9)).toBe(true);
    expect(isNewAccount(24)).toBe(false);
  });
  it("covers minute, hour and day for a user, and minute and day for everyone", () => {
    expect(userRules(p, "u1", 100).map((x) => x.windowSec)).toEqual([60, 3600, 86400]);
    expect(globalRules(p).map((x) => [x.limit, x.windowSec, x.scope])).toEqual([[10, 60, "global"], [400, 86400, "global"]]);
  });
  it("estimates tokens", () => expect(estimateTokens("x".repeat(401))).toBe(101));
});
