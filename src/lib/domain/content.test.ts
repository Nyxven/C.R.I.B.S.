import { describe, expect, it } from "vitest";
import { filterByRole, isExpertReviewed, rolesOf, isSampleListing, slugify, stripHtml } from "./content";

describe("content helpers", () => {
  it("strips tags, entities and extra spaces", () => {
    expect(stripHtml("<p>Hello <b>there</b>&nbsp;&amp; welcome</p><ul><li>One</li></ul>")).toBe("Hello there & welcome One");
    expect(stripHtml("<style>p{}</style><p>Hi</p>")).toBe("Hi");
  });
  it("badges only expert-reviewed guides", () => {
    expect(isExpertReviewed({ reviewStatus: "expert-reviewed" })).toBe(true);
    expect(isExpertReviewed({ reviewStatus: "draft" })).toBe(false);
    expect(isExpertReviewed({ reviewStatus: "prototype-content" })).toBe(false);
  });
  it("labels a listing as sample until verified", () => {
    expect(isSampleListing({ verifiedAt: null })).toBe(true);
    expect(isSampleListing({ verifiedAt: new Date() })).toBe(false);
  });
  it("makes plain slugs", () => {
    expect(slugify("Dr. María's Clinic (Taguig)")).toBe("dr-maria-s-clinic-taguig");
  });
});

describe("directory filter", () => {
  const list = [{ id: "1", role: "OT" }, { id: "2", role: "SLP" }, { id: "3", role: "OT" }];
  it("lists roles once, in order", () => expect(rolesOf(list)).toEqual(["OT", "SLP"]));
  it("filters by role", () => expect(filterByRole(list, "OT").map((p) => p.id)).toEqual(["1", "3"]));
  it("keeps everyone for an empty or unknown role", () => {
    expect(filterByRole(list, undefined)).toHaveLength(3);
    expect(filterByRole(list, "Nope")).toHaveLength(3);
  });
});
