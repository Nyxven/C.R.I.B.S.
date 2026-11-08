import { describe, expect, it } from "vitest";
import { splitCitations, stripMarkers } from "./citations";

const known = {
  "visual-supports": { id: "visual-supports", title: "Visual supports", href: "/learn/comm/visual-supports" },
  "faq-01": { id: "faq-01", title: "FAQ", href: "/faq" },
};

describe("splitCitations", () => {
  it("removes markers and returns the real sources once each, in order", () => {
    const r = splitCitations("Use picture cards. [[visual-supports]] They help. [[faq-01]] [[visual-supports]]", known);
    expect(r.text).toBe("Use picture cards. They help.");
    expect(r.sources.map((s) => s.id)).toEqual(["visual-supports", "faq-01"]);
  });
  it("drops ids that are not in the knowledge (made up by the model)", () => {
    const r = splitCitations("Try this [[made-up-guide]] [[constructor]] [[__proto__]]", known);
    expect(r.sources).toEqual([]);
    expect(r.text).toBe("Try this");
  });
  it("is case-insensitive and ignores spaces inside the brackets", () => {
    expect(splitCitations("Hi [[ Visual-Supports ]]", known).sources).toHaveLength(1);
  });
  it("leaves normal brackets alone", () => {
    expect(splitCitations("Use a timer [5 minutes] first.", known).text).toBe("Use a timer [5 minutes] first.");
  });
});

describe("stripMarkers (streaming)", () => {
  it("hides a half-typed marker at the end", () => {
    for (const partial of ["Hello [", "Hello [[", "Hello [[visual-su", "Hello [[visual-supports]"]) expect(stripMarkers(partial)).toBe("Hello");
  });
  it("keeps text before a complete marker", () => expect(stripMarkers("Hello [[visual-supports]] world")).toBe("Hello world"));
});
