import { describe, expect, it } from "vitest";
import { classifyStatus, cooldownSeconds, parseRetryAfter, ProviderError } from "./providerError";

describe("providerError", () => {
  it("classifies statuses", () => {
    expect([429, 402, 401, 403, 500, 503, 408, 400, 404].map(classifyStatus)).toEqual(["rate_limited", "quota", "auth", "auth", "unavailable", "unavailable", "unavailable", "other", "other"]);
  });
  it("reads Retry-After safely", () => {
    expect(parseRetryAfter("30")).toBe(30);
    expect(parseRetryAfter("99999")).toBe(3600);
    expect(parseRetryAfter("soon")).toBeUndefined();
    expect(parseRetryAfter(null)).toBeUndefined();
  });
  it("pauses calls for a sensible time", () => {
    expect(cooldownSeconds(new ProviderError("rate_limited", "x"))).toBe(60);
    expect(cooldownSeconds(new ProviderError("rate_limited", "x", 5))).toBe(30);
    expect(cooldownSeconds(new ProviderError("rate_limited", "x", 9999))).toBe(300);
    expect(cooldownSeconds(new ProviderError("quota", "x"))).toBe(900);
    expect(cooldownSeconds(new ProviderError("auth", "x"))).toBe(600);
    expect(cooldownSeconds(new ProviderError("other", "x"))).toBe(0);
  });
});
