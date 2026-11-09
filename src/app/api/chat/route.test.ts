import { beforeEach, describe, expect, it, vi } from "vitest";

let signedIn = true;
vi.mock("@/server/auth/session", () => ({ getSession: async () => (signedIn ? { id: "s1", user: { id: "u1", name: "N", email: "e@x.y", createdAt: new Date(Date.now() - 10 * 24 * 3600_000) } } : null) }));
const h = vi.hoisted(() => ({ guard: null as unknown as import("@/lib/security/guard").AbuseGuard }));
vi.mock("@/server/ai/deps", async () => {
  const { memoryGuard } = await import("@/lib/security/memoryGuard");
  const { buildPolicy } = await import("@/lib/ai/policy");
  h.guard = memoryGuard();
  return { defaultChatDeps: () => ({
    provider: { async stream(_a: unknown, onText: (t: string) => void) { onText("Hello [[a]]"); return { inputTokens: 1, outputTokens: 1 }; } },
    policy: buildPolicy({ perHour: 20, perDay: 60, userTokensPerDay: 40000, globalPerMin: 10, globalPerDay: 400, globalTokensPerDay: 400000 }),
    maxOutputTokens: 300,
    guard: h.guard,
    loadKnowledge: async () => ({ entries: [], sources: { a: { id: "a", title: "A", href: "/a" } } }),
    loadChild: async () => null,
    log: () => {},
  }) };
});

import { MAX_INPUT_CHARS } from "@/lib/ai/limits";
import { POST } from "./route";

const ok = { origin: "http://localhost:3000", host: "localhost:3000", "content-type": "application/json", "x-forwarded-for": "203.0.113.9" };
const req = (body: unknown, headers: Record<string, string> = ok) =>
  new Request("http://localhost:3000/api/chat", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });
const ask = (content: string) => ({ messages: [{ role: "user", content }] });

beforeEach(() => { signedIn = true; });

describe("POST /api/chat", () => {
  it("refuses other origins and a missing origin", async () => {
    expect((await POST(req(ask("hi"), { ...ok, origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(req(ask("hi"), { host: "localhost:3000", "content-type": "application/json" }))).status).toBe(403);
  });
  it("refuses people who are signed out", async () => {
    signedIn = false;
    expect((await POST(req(ask("hi")))).status).toBe(401);
  });
  it("rejects bad bodies", async () => {
    expect((await POST(req("not json"))).status).toBe(400);
    expect((await POST(req({ messages: [] }))).status).toBe(400);
    expect((await POST(req({ messages: [{ role: "system", content: "x" }] }))).status).toBe(400);
    expect((await POST(req({ messages: [{ role: "user", content: "x" }], extra: 1 }))).status).toBe(400);
    expect((await POST(req("x".repeat(40_000)))).status).toBe(413);
    expect((await POST(req(ask("x".repeat(MAX_INPUT_CHARS + 1))))).status).toBe(400);
    expect((await POST(req(ask("hi"), { ...ok, "content-type": "text/plain" }))).status).toBe(415);
  });
  it("streams one JSON event per line", async () => {
    const res = await POST(req(ask("How can I help?")));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const lines = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
    expect(lines[0]).toEqual({ t: "start", kind: "answer" });
    expect(lines.at(-1)).toEqual({ t: "done", sources: [{ id: "a", title: "A", href: "/a" }] });
  });
  it("refuses repeated requests and tells the browser when to retry", async () => {
    let last = 200;
    let retry: string | null = null;
    for (let i = 0; i < 12; i++) {
      signedIn = true;
      const res = await POST(req(ask(`question ${i}`), { ...ok, "x-forwarded-for": "198.51.100.77" }));
      await res.text();
      last = res.status;
      retry = res.headers.get("retry-after");
      if (res.status !== 200) break;
    }
    expect(last).toBe(429);
    expect(retry).toBe("60");
  });
  it("answers an emergency without the model", async () => {
    const res = await POST(req(ask("my child is not breathing")));
    const lines = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
    expect(lines[0]).toEqual({ t: "start", kind: "emergency" });
    expect(lines[1].d).toContain("911");
  });
});
