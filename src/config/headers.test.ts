import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("headers for the public if-found page", () => {
  it("is never stored, indexed or leaked through a referrer", async () => {
    const rules = await nextConfig.headers!();
    const found = rules.find((r) => r.source === "/f/:path*")!;
    const h = Object.fromEntries(found.headers.map((x) => [x.key, x.value]));
    expect(h["Cache-Control"]).toContain("no-store");
    expect(h["Referrer-Policy"]).toBe("no-referrer");
    expect(h["X-Robots-Tag"]).toContain("noindex");
    expect(rules.find((r) => r.source === "/(.*)")).toBeTruthy(); // the site-wide security headers stay
    expect(rules.at(-1)!.source).toBe("/f/:path*"); // listed last so its values win
  });
});
