import { beforeEach, describe, expect, it, vi } from "vitest";

const s = vi.hoisted(() => ({
  rows: [] as { id: string; endpoint: string; p256dh: string; auth: string; locale: string }[],
  removed: [] as string[], upserts: [] as { endpoint: string; locale: string }[],
  sent: [] as { endpoint: string; payload: string }[], status: {} as Record<string, number>,
}));
vi.mock("web-push", () => ({ default: { sendNotification: async (sub: { endpoint: string }, payload: string) => {
  const code = s.status[sub.endpoint];
  if (code) throw Object.assign(new Error("push"), { statusCode: code });
  s.sent.push({ endpoint: sub.endpoint, payload });
} } }));
vi.mock("./repo", () => ({
  listForUser: async () => s.rows,
  removeIds: async (ids: string[]) => { s.removed.push(...ids); },
  upsert: async (_u: string, r: { endpoint: string; locale: string }) => { s.upserts.push(r); },
  removeEndpoint: async () => true, hasEndpoint: async () => true, setLocale: async () => undefined,
}));
import { sendToUser, subscribe } from "./service";

const KEY = "B" + "x".repeat(86);
const row = (id: string, locale = "en") => ({ id, endpoint: `https://push.example/${id}`, p256dh: KEY, auth: "a".repeat(22), locale });

beforeEach(() => {
  s.rows = []; s.removed = []; s.upserts = []; s.sent = []; s.status = {};
  process.env.VAPID_PUBLIC_KEY = KEY;
  process.env.VAPID_PRIVATE_KEY = "p".repeat(43);
});

describe("sendToUser", () => {
  it("sends to each device in its own language, with a safe link", async () => {
    s.rows = [row("1", "en"), row("2", "fil")];
    const n = await sendToUser("u1", (l) => ({ title: l === "fil" ? "Paalala" : "Reminder", body: "b", link: "https://evil.example" }));
    expect(n).toBe(2);
    const payloads = s.sent.map((x) => JSON.parse(x.payload));
    expect(payloads.map((p) => p.title).sort()).toEqual(["Paalala", "Reminder"]);
    expect(payloads.every((p) => p.link === "/home")).toBe(true);
  });
  it("forgets devices the push service says are gone, and never throws", async () => {
    s.rows = [row("1"), row("2"), row("3")];
    s.status = { "https://push.example/1": 410, "https://push.example/2": 500 };
    expect(await sendToUser("u1", { title: "t", body: "b" })).toBe(1);
    expect(s.removed).toEqual(["1"]);
  });
  it("does nothing without keys", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    s.rows = [row("1")];
    expect(await sendToUser("u1", { title: "t", body: "b" })).toBe(0);
    expect(s.sent).toHaveLength(0);
  });
});

describe("subscribe", () => {
  it("accepts a real-looking subscription and rejects junk", async () => {
    expect(await subscribe("u1", { endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: KEY, auth: "a".repeat(22) } }, "fil")).toEqual({ ok: true });
    expect(s.upserts[0]).toMatchObject({ endpoint: "https://fcm.googleapis.com/x", locale: "fil" });
    expect((await subscribe("u1", { endpoint: "http://insecure.example", keys: { p256dh: KEY, auth: "a".repeat(22) } }, "en")).ok).toBe(false);
    expect((await subscribe("u1", { endpoint: "https://x.example", keys: { p256dh: "<script>", auth: "a" } }, "en")).ok).toBe(false);
  });
});
