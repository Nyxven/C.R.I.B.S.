import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "./cron";

const secret = "s".repeat(24);
describe("isAuthorizedCron", () => {
  it("accepts the exact bearer secret", () => expect(isAuthorizedCron(`Bearer ${secret}`, secret)).toBe(true));
  it("refuses everything else", () => {
    expect(isAuthorizedCron(null, secret)).toBe(false);
    expect(isAuthorizedCron("", secret)).toBe(false);
    expect(isAuthorizedCron(secret, secret)).toBe(false);
    expect(isAuthorizedCron(`Bearer ${secret}x`, secret)).toBe(false);
    expect(isAuthorizedCron("Bearer wrong", secret)).toBe(false);
  });
  it("refuses all requests when no secret is set (never open by default)", () => {
    expect(isAuthorizedCron("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorizedCron(`Bearer `, "")).toBe(false);
  });
});
