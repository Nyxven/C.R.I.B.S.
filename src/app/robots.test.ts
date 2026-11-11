import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("keeps if-found pages and the API out of search results", () => {
    const rule = (Array.isArray(robots().rules) ? robots().rules[0] : robots().rules) as { disallow: string[] };
    expect(rule.disallow).toEqual(expect.arrayContaining(["/f/", "/api/"]));
  });
});
