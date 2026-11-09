import { describe, expect, it } from "vitest";
import { clientIp, ipBucketKey, normalizeIp } from "./clientIp";

const h = (o: Record<string, string>) => (n: string) => o[n] ?? null;

describe("clientIp", () => {
  it("vercel: trusts the platform headers in order", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "203.0.113.9", "x-forwarded-for": "1.1.1.1" }), "vercel")).toBe("203.0.113.9");
    expect(clientIp(h({ "x-forwarded-for": "198.51.100.7, 10.0.0.1" }), "vercel")).toBe("198.51.100.7");
  });
  it("cloudflare: only cf-connecting-ip counts", () => {
    expect(clientIp(h({ "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "1.1.1.1" }), "cloudflare")).toBe("203.0.113.9");
    expect(clientIp(h({ "x-forwarded-for": "1.1.1.1" }), "cloudflare")).toBeNull();
  });
  it("none: trusts nothing", () => expect(clientIp(h({ "x-forwarded-for": "1.1.1.1" }), "none")).toBeNull());
  it("ignores values that are not IP addresses", () => {
    expect(clientIp(h({ "x-forwarded-for": "not-an-ip" }), "vercel")).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": "<script>" }), "vercel")).toBeNull();
    expect(clientIp(h({}), "vercel")).toBeNull();
  });
});

describe("normalizeIp", () => {
  it("keeps IPv4 and unwraps IPv4-mapped IPv6", () => {
    expect(normalizeIp("203.0.113.9")).toBe("203.0.113.9");
    expect(normalizeIp("::ffff:203.0.113.9")).toBe("203.0.113.9");
  });
  it("shrinks IPv6 to its /64", () => {
    expect(normalizeIp("2001:db8:1:2:aaaa:bbbb:cccc:dddd")).toBe("2001:db8:1:2::/64");
    expect(normalizeIp("2001:db8:1:2::1")).toBe("2001:db8:1:2::/64");
    expect(normalizeIp("2001:0DB8:0001:0002:0000:0000:0000:0001")).toBe("2001:db8:1:2::/64");
    expect(normalizeIp("[2001:db8::1]")).toBe("2001:db8:0:0::/64");
    expect(normalizeIp("::1")).toBe("0:0:0:0::/64");
  });
  it("gives the same bucket to neighbours in one /64 but not to other networks", () => {
    expect(normalizeIp("2001:db8:1:2::a")).toBe(normalizeIp("2001:db8:1:2:ffff::b"));
    expect(normalizeIp("2001:db8:1:3::a")).not.toBe(normalizeIp("2001:db8:1:2::a"));
  });
  it("rejects junk", () => {
    for (const bad of ["", "abc", "999.1.1.1", "1:2:3", "1::2::3"]) expect(normalizeIp(bad)).toBeNull();
  });
});

describe("ipBucketKey", () => {
  it("is stable, keyed, and never contains the address", () => {
    const a = ipBucketKey("203.0.113.9", "secret-one");
    expect(a).toBe(ipBucketKey("203.0.113.9", "secret-one"));
    expect(a).not.toBe(ipBucketKey("203.0.113.9", "secret-two"));
    expect(a).not.toBe(ipBucketKey("203.0.113.10", "secret-one"));
    expect(a).toMatch(/^[0-9a-f]{24}$/);
    expect(a).not.toContain("203");
  });
  it("puts missing or bad addresses in one shared bucket", () => {
    expect(ipBucketKey(null, "s")).toBe("unknown");
    expect(ipBucketKey("nonsense", "s")).toBe("unknown");
  });
});
