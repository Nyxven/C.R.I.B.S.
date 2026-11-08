import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
let articleExists = true;
vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));
vi.mock("@/server/content/repo", () => ({ getArticle: async () => (articleExists ? { slug: "x" } : undefined), listModules: async () => [], listArticleSummaries: async () => [] }));
vi.mock("./repo", () => ({
  setSaved: async (u: string, s: string, v: boolean) => { calls.push(`saved:${u}:${s}:${v}`); },
  setRead: async (u: string, s: string, v: boolean) => { calls.push(`read:${u}:${s}:${v}`); },
  listProgress: async () => [],
  getEntry: async () => undefined,
}));

import { markRead, saveGuide } from "./service";

beforeEach(() => { calls.length = 0; articleExists = true; });

describe("progress service", () => {
  it("saves and unsaves a guide for the given user", async () => {
    expect(await saveGuide("u1", { slug: "what-is-autism", value: true })).toEqual({ ok: true });
    expect(await saveGuide("u1", { slug: "what-is-autism", value: false })).toEqual({ ok: true });
    expect(calls).toEqual(["saved:u1:what-is-autism:true", "saved:u1:what-is-autism:false"]);
  });
  it("marks a guide read", async () => {
    expect(await markRead("u2", { slug: "a-b", value: true })).toEqual({ ok: true });
    expect(calls).toEqual(["read:u2:a-b:true"]);
  });
  it("rejects bad input without writing", async () => {
    for (const bad of [null, {}, { slug: "A B", value: true }, { slug: "ok", value: "yes" }, { slug: "../x", value: true }]) {
      expect((await saveGuide("u1", bad)).ok).toBe(false);
    }
    expect(calls).toEqual([]);
  });
  it("rejects a guide that does not exist", async () => {
    articleExists = false;
    expect(await markRead("u1", { slug: "ghost", value: true })).toEqual({ ok: false, error: "We could not find that guide." });
    expect(calls).toEqual([]);
  });
});
