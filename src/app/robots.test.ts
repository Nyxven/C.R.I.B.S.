import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("keeps if-found pages and the API out of search results", () => {
    const rules = robots().rules;
    const rule = (Array.isArray(rules) ? rules[0] : rules) as { disallow: string[] };
    expect(rule.disallow).toEqual(expect.arrayContaining(["/f/", "/api/"]));
  });
});
