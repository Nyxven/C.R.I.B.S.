import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./origin";

describe("isSameOrigin", () => {
  it("accepts our own origin", () => expect(isSameOrigin("https://cribs.vercel.app", "cribs.vercel.app")).toBe(true));
  it("accepts localhost with a port", () => expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true));
  it("refuses other sites, look-alikes and missing headers", () => {
    expect(isSameOrigin("https://evil.example", "cribs.vercel.app")).toBe(false);
    expect(isSameOrigin("https://cribs.vercel.app.evil.example", "cribs.vercel.app")).toBe(false);
    expect(isSameOrigin(null, "cribs.vercel.app")).toBe(false);
    expect(isSameOrigin("https://cribs.vercel.app", null)).toBe(false);
    expect(isSameOrigin("null", "cribs.vercel.app")).toBe(false);
  });
});
