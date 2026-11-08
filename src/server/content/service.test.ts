import { describe, expect, it, vi } from "vitest";

vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));
vi.mock("./repo", () => ({}));

import { groupModules } from "./service";

describe("groupModules", () => {
  it("puts each article under its module and keeps order", () => {
    const mods = [{ id: "a", name: "A", shortName: "a", description: "" }, { id: "b", name: "B", shortName: "b", description: "" }];
    const arts = [
      { slug: "1", moduleId: "a", title: "", readTime: "", reviewStatus: "draft" },
      { slug: "2", moduleId: "b", title: "", readTime: "", reviewStatus: "draft" },
      { slug: "3", moduleId: "a", title: "", readTime: "", reviewStatus: "draft" },
    ];
    const out = groupModules(mods, arts);
    expect(out[0]!.articles.map((x) => x.slug)).toEqual(["1", "3"]);
    expect(out[1]!.articles.map((x) => x.slug)).toEqual(["2"]);
  });
  it("gives an empty list to a module with no guides", () => {
    expect(groupModules([{ id: "x", name: "", shortName: "", description: "" }], [])[0]!.articles).toEqual([]);
  });
});
