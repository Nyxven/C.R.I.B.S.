import { describe, expect, it } from "vitest";
import { findMyStatus, parseFindMyUrl } from "./findmy";

describe("parseFindMyUrl", () => {
  it("accepts Apple links", () => {
    expect(parseFindMyUrl("  https://www.icloud.com/find/item/abc123  ")).toBe("https://www.icloud.com/find/item/abc123");
    expect(parseFindMyUrl("https://find.apple.com/share/xyz")).toBe("https://find.apple.com/share/xyz");
  });
  it("rejects other sites, look-alikes, http and logins", () => {
    for (const bad of ["https://evil.com/icloud.com", "https://icloud.com.evil.com/x", "https://notapple.com/x", "http://www.icloud.com/find",
      "https://user:pw@www.icloud.com/find", "javascript:alert(1)", "icloud.com/find", "", 42, null, `https://www.icloud.com/${"a".repeat(700)}`]) {
      expect(parseFindMyUrl(bad)).toBeNull();
    }
  });
});

describe("findMyStatus", () => {
  const added = new Date("2026-11-20T08:00:00Z");
  it("counts down 7 days", () => {
    expect(findMyStatus(added, new Date("2026-11-21T08:00:00Z"))).toMatchObject({ state: "active", daysLeft: 6 });
    expect(findMyStatus(added, new Date("2026-11-27T00:00:00Z"))).toMatchObject({ state: "expiring", daysLeft: 1 });
    expect(findMyStatus(added, new Date("2026-11-27T08:00:00Z"))).toMatchObject({ state: "expired", daysLeft: 0 });
  });
});
