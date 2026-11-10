import { beforeEach, describe, expect, it, vi } from "vitest";

type Thread = { id: string; userId: string; title: string; updatedAt: Date; expiresAt: Date };
type Msg = { id: string; threadId: string; role: "user" | "assistant"; content: string; sources: unknown[]; feedback: "up" | "down" | null; createdAt: Date };
const db = vi.hoisted(() => ({ enabled: new Map<string, boolean>(), threads: [] as Thread[], msgs: [] as Msg[], seq: 0 }));
const own = (u: string, t: string) => db.threads.some((x) => x.id === t && x.userId === u);

vi.mock("./repo", () => ({
  isHistoryEnabled: async (u: string) => db.enabled.get(u) ?? true,
  setHistoryEnabled: async (u: string, v: boolean) => { db.enabled.set(u, v); },
  oldestThreadIds: async (u: string, keep: number) => db.threads.filter((t) => t.userId === u).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(keep).map((t) => t.id),
  deleteThreads: async (u: string, ids: string[]) => { db.threads = db.threads.filter((t) => !(t.userId === u && ids.includes(t.id))); },
  createThread: async (u: string, title: string, exp: Date) => { const id = `00000000-0000-4000-8000-${String(++db.seq).padStart(12, "0")}`; db.threads.push({ id, userId: u, title, updatedAt: new Date(db.seq * 1000), expiresAt: exp }); return id; },
  getThread: async (u: string, id: string) => db.threads.find((t) => t.id === id && t.userId === u),
  listThreads: async (u: string, n: number) => db.threads.filter((t) => t.userId === u).slice(0, n),
  listMessages: async (u: string, t: string) => (own(u, t) ? db.msgs.filter((m) => m.threadId === t) : []),
  addTurn: async (t: string, turn: { question: string; answer: string; sources: unknown[] }, now: Date) => {
    const id = `00000000-0000-4000-9000-${String(++db.seq).padStart(12, "0")}`;
    db.msgs.push({ id: `q${db.seq}`, threadId: t, role: "user", content: turn.question, sources: [], feedback: null, createdAt: now }, { id, threadId: t, role: "assistant", content: turn.answer, sources: turn.sources, feedback: null, createdAt: now });
    return id;
  },
  getFeedback: async (u: string, id: string) => { const m = db.msgs.find((x) => x.id === id); return m && own(u, m.threadId) ? m.feedback : undefined; },
  setFeedback: async (u: string, id: string, v: "up" | "down" | null) => { const m = db.msgs.find((x) => x.id === id && x.role === "assistant"); if (!m || !own(u, m.threadId)) return false; m.feedback = v; return true; },
  deleteThread: async (u: string, id: string) => { const n = db.threads.length; db.threads = db.threads.filter((t) => !(t.id === id && t.userId === u)); db.msgs = db.msgs.filter((m) => db.threads.some((t) => t.id === m.threadId)); return db.threads.length < n; },
  deleteAllThreads: async (u: string) => { const n = db.threads.filter((t) => t.userId === u).length; db.threads = db.threads.filter((t) => t.userId !== u); db.msgs = db.msgs.filter((m) => db.threads.some((t) => t.id === m.threadId)); return n; },
}));

import { createHistoryStore, deleteAllMyThreads, deleteMyThread, getMyThread, listMyThreads, setHistorySetting, tapFeedback } from "./service";

beforeEach(() => { db.enabled.clear(); db.threads = []; db.msgs = []; db.seq = 0; });
const store = createHistoryStore();
const turn = (q: string, a: string) => ({ question: q, answer: a, sources: [], inputTokens: 1, outputTokens: 1 });

describe("history store", () => {
  it("creates a chat, saves turns, and loads them back as plain turns", async () => {
    const id = await store.createThread("u1", "Bedtime");
    await store.saveTurn("u1", id, turn("Q1", "A1"));
    expect(await store.loadThread("u1", id)).toEqual({ turns: [{ role: "user", content: "Q1" }, { role: "assistant", content: "A1" }], full: false });
  });
  it("never loads someone else's chat, or an invalid id", async () => {
    const id = await store.createThread("u1", "Mine");
    expect(await store.loadThread("u2", id)).toBeNull();
    expect(await store.loadThread("u1", "../etc")).toBeNull();
  });
  it("says a chat is full when there is no room for another turn", async () => {
    const id = await store.createThread("u1", "Long");
    for (let i = 0; i < 30; i++) await store.saveTurn("u1", id, turn(`q${i}`, `a${i}`));
    expect((await store.loadThread("u1", id))!.full).toBe(true);
  });
  it("keeps at most 40 chats by removing the oldest", async () => {
    for (let i = 0; i < 45; i++) await store.createThread("u1", `t${i}`);
    expect(db.threads.filter((t) => t.userId === "u1").length).toBeLessThanOrEqual(40);
  });
  it("is on by default and respects the person's setting", async () => {
    expect(await store.enabled("u1")).toBe(true);
    await setHistorySetting("u1", false);
    expect(await store.enabled("u1")).toBe(false);
  });
});

describe("managing history", () => {
  it("lists and opens only my chats", async () => {
    const mine = await store.createThread("u1", "Mine"); await store.createThread("u2", "Theirs");
    expect((await listMyThreads("u1")).map((t) => t.title)).toEqual(["Mine"]);
    expect((await getMyThread("u1", mine))!.title).toBe("Mine");
    expect(await getMyThread("u2", mine)).toBeNull();
    expect(await getMyThread("u1", "nope")).toBeNull();
  });
  it("deletes one chat or all of mine, never another person's", async () => {
    const a = await store.createThread("u1", "A"); await store.createThread("u1", "B"); const c = await store.createThread("u2", "C");
    expect(await deleteMyThread("u2", a)).toEqual({ ok: false, error: "We could not find that chat." });
    expect(await deleteMyThread("u1", a)).toEqual({ ok: true });
    expect(await deleteAllMyThreads("u1")).toEqual({ ok: true, deleted: 1 });
    expect(db.threads.map((t) => t.id)).toEqual([c]);
  });
  it("turning history off deletes what was saved", async () => {
    await store.createThread("u1", "A");
    expect(await setHistorySetting("u1", false)).toEqual({ ok: true, enabled: false });
    expect(db.threads).toHaveLength(0);
    expect((await setHistorySetting("u1", "yes")).ok).toBe(false);
  });
});

describe("thumbs", () => {
  it("sets, switches and clears a thumb on my own answer", async () => {
    const id = await store.createThread("u1", "A");
    const answer = await store.saveTurn("u1", id, turn("Q", "A"));
    expect(await tapFeedback("u1", { messageId: answer, value: "up" })).toEqual({ ok: true, feedback: "up" });
    expect(await tapFeedback("u1", { messageId: answer, value: "down" })).toEqual({ ok: true, feedback: "down" });
    expect(await tapFeedback("u1", { messageId: answer, value: "down" })).toEqual({ ok: true, feedback: null });
  });
  it("refuses other people's answers and bad input", async () => {
    const id = await store.createThread("u1", "A");
    const answer = await store.saveTurn("u1", id, turn("Q", "A"));
    expect((await tapFeedback("u2", { messageId: answer, value: "up" })).ok).toBe(false);
    for (const bad of [{}, { messageId: "x", value: "up" }, { messageId: answer, value: "meh" }, { messageId: answer }]) expect((await tapFeedback("u1", bad)).ok).toBe(false);
  });
});
