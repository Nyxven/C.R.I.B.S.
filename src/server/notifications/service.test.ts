import { beforeEach, describe, expect, it, vi } from "vitest";

const s = vi.hoisted(() => ({ notifOn: true, rows: [] as { userId: string; type: string; body: string; link: string | null }[], failInsert: false, pushed: [] as { userId: string; link?: string }[] }));
vi.mock("@/server/push/service", () => ({ sendToUser: async (userId: string, m: { link?: string }) => { s.pushed.push({ userId, link: m.link }); return 1; } }));
vi.mock("@/server/onboarding/repo", () => ({ getProfile: async () => ({ notifOn: s.notifOn }) }));
vi.mock("./repo", () => ({
  insert: async (userId: string, n: { type: string; body: string; link: string | null }) => { if (s.failInsert) throw new Error("db"); s.rows.push({ userId, ...n }); },
  list: async () => [], unreadCount: async () => 0,
  markRead: async (_u: string, id: string) => id.endsWith("1"), markAllRead: async () => 3,
}));
import { markAll, markOne, notify } from "./service";

beforeEach(() => { s.notifOn = true; s.rows.length = 0; s.failInsert = false; s.pushed.length = 0; });

describe("notify", () => {
  it("creates a notice with a safe link", async () => {
    await notify("u1", "reply", "Ana replied to your post.", "/community#post-1");
    expect(s.rows).toEqual([{ userId: "u1", type: "reply", body: "Ana replied to your post.", link: "/community#post-1" }]);
  });
  it("also sends it to the person's phone, but not when the switch is off", async () => {
    await notify("u1", "reply", "Ana replied to your post.", "/community#post-1");
    expect(s.pushed).toEqual([{ userId: "u1", link: "/community#post-1" }]);
    s.notifOn = false;
    await notify("u1", "helpful", "x");
    expect(s.pushed).toHaveLength(1);
  });
  it("drops links that leave the site", async () => {
    await notify("u1", "reply", "x", "https://evil.example");
    expect(s.rows[0]!.link).toBeNull();
  });
  it("respects the switch, except for account and moderation notices", async () => {
    s.notifOn = false;
    await notify("u1", "reply", "x"); await notify("u1", "helpful", "x");
    expect(s.rows).toHaveLength(0);
    await notify("u1", "account", "pw changed"); await notify("u1", "moderation", "held");
    expect(s.rows.map((r) => r.type)).toEqual(["account", "moderation"]);
  });
  it("never throws, so it cannot break what triggered it", async () => {
    s.failInsert = true;
    await expect(notify("u1", "reply", "x")).resolves.toBeUndefined();
  });
});

describe("marking read", () => {
  it("needs a real id", async () => {
    expect(await markOne("u1", "../x")).toEqual({ ok: false });
    expect(await markOne("u1", "3f2b8c1e-9d4a-4e6b-8a1c-0b5d7e9f1a21")).toEqual({ ok: true });
    expect(await markAll("u1")).toEqual({ ok: true, marked: 3 });
  });
});
