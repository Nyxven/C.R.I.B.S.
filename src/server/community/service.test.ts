import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryGuard } from "@/lib/security/memoryGuard";

type P = { id: string; userId: string; parentId: string | null; displayName: string; anonymous: boolean; body: string; status: string; createdAt: Date };
const db = vi.hoisted(() => ({ posts: [] as P[], likes: [] as { postId: string; userId: string }[], reports: [] as { postId: string; userId: string; reason: string }[], notes: [] as { to: string; type: string; body: string; link?: string }[], seq: 0, names: { u1: "Ana Maria", u2: "Ben", u3: "Cara" } as Record<string, string> }));
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

vi.mock("@/server/onboarding/repo", () => ({ getProfile: async (u: string) => ({ displayName: db.names[u] ?? null }) }));
vi.mock("@/server/auth/repo", () => ({ findUserById: async () => ({ name: "Fallback Name" }) }));
vi.mock("@/server/notifications/service", () => ({ notify: async (to: string, type: string, body: string, link?: string) => { db.notes.push({ to, type, body, link }); } }));
vi.mock("./repo", () => ({
  insertPost: async (p: Omit<P, "id" | "status" | "createdAt">) => { const id = uid(++db.seq); db.posts.push({ ...p, id, status: "visible", createdAt: new Date(2026, 10, 1, 0, 0, db.seq) }); return id; },
  getPost: async (id: string) => db.posts.find((p) => p.id === id),
  listTop: async (viewer: string, limit: number, before?: { createdAt: Date; id: string }) =>
    db.posts.filter((p) => !p.parentId && (p.status === "visible" || (p.status === "hidden" && p.userId === viewer)) && (!before || p.createdAt < before.createdAt)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit),
  listReplies: async (viewer: string, ids: string[]) => db.posts.filter((p) => p.parentId && ids.includes(p.parentId) && (p.status === "visible" || (p.status === "hidden" && p.userId === viewer))),
  helpfulFor: async (viewer: string, ids: string[]) => new Map(ids.map((id) => [id, { count: db.likes.filter((l) => l.postId === id).length, mine: db.likes.some((l) => l.postId === id && l.userId === viewer) }])),
  addHelpful: async (postId: string, userId: string) => { if (db.likes.some((l) => l.postId === postId && l.userId === userId)) return false; db.likes.push({ postId, userId }); return true; },
  removeHelpful: async (postId: string, userId: string) => { const n = db.likes.length; db.likes = db.likes.filter((l) => !(l.postId === postId && l.userId === userId)); return db.likes.length < n; },
  helpfulCount: async (postId: string) => db.likes.filter((l) => l.postId === postId).length,
  addReport: async (postId: string, userId: string, reason: string) => { if (db.reports.some((r) => r.postId === postId && r.userId === userId)) return false; db.reports.push({ postId, userId, reason }); return true; },
  reportsFor: async (postId: string) => { const r = db.reports.filter((x) => x.postId === postId); return { reporters: r.length, reasons: r.map((x) => x.reason) }; },
  setStatus: async (id: string, status: string) => { const p = db.posts.find((x) => x.id === id); if (p) p.status = status; },
  removePost: async (id: string) => { const p = db.posts.find((x) => x.id === id); if (p) { p.status = "removed"; p.body = ""; } },
  softDeleteOwn: async (userId: string, id: string) => { const p = db.posts.find((x) => x.id === id && x.userId === userId && x.status !== "removed"); if (p) { p.status = "removed"; p.body = ""; } return !!p; },
  listHeld: async () => db.posts.filter((p) => p.status === "hidden").map((p) => ({ ...p, reports: db.reports.filter((r) => r.postId === p.id).length })),
}));

import { createPost, deleteOwnPost, feed, moderate, moderationQueue, reportPost, setHelpful } from "./service";

let guard = memoryGuard();
const old = { accountAgeHours: 100 };
beforeEach(() => { db.posts.length = 0; db.likes.length = 0; db.reports.length = 0; db.notes.length = 0; db.seq = 0; guard = memoryGuard(); delete process.env.MODERATOR_EMAILS; delete process.env.COMMUNITY_REPORT_HIDE_AT; });
const post = async (u: string, body = "Anyone have tips for bedtime?", extra: object = {}) => { const r = await createPost({ userId: u, ...old }, { body, ...extra }, guard); if (!r.ok) throw new Error(r.error); return r.id; };

describe("writing posts", () => {
  it("publishes a post with the first name only, or anonymously", async () => {
    const a = await post("u1"); const b = await post("u1", "Another question here", { anonymous: true });
    expect(db.posts.find((p) => p.id === a)!.displayName).toBe("Ana");
    expect(db.posts.find((p) => p.id === b)!.displayName).toBe("Anonymous parent");
  });
  it("refuses contact details, addresses and strong language without saving", async () => {
    for (const body of ["call 0917 123 4567", "we live at Blk 5 Lot 3", "you are an asshole"]) expect((await createPost({ userId: "u1", ...old }, { body }, guard)).ok).toBe(false);
    expect(db.posts).toHaveLength(0);
  });
  it("rejects unknown fields and a missing body", async () => {
    expect((await createPost({ userId: "u1", ...old }, { body: "Hello there", role: "admin" }, guard)).ok).toBe(false);
    expect((await createPost({ userId: "u1", ...old }, {}, guard)).ok).toBe(false);
  });
  it("limits posts per hour, and gives new accounts a lower daily limit", async () => {
    for (let i = 0; i < 5; i++) await post("u1", `Question number ${i} here`);
    expect((await createPost({ userId: "u1", ...old }, { body: "One more question" }, guard)).ok).toBe(false);
    const fresh = { userId: "u9", accountAgeHours: 1 };
    expect((await createPost(fresh, { body: "First post here" }, guard)).ok).toBe(true);
    expect((await createPost(fresh, { body: "Second post here" }, guard)).ok).toBe(true);
    expect((await createPost(fresh, { body: "Third post here" }, guard)).ok).toBe(false);
  });
});

describe("replies", () => {
  it("adds a reply to a visible top-level post and tells its author (not when replying to yourself)", async () => {
    const top = await post("u1");
    await createPost({ userId: "u2", ...old }, { body: "Visual schedules helped us a lot", parentId: top }, guard);
    expect(db.notes).toEqual([{ to: "u1", type: "reply", body: "Ben replied to your post.", link: `/community#post-${top}` }]);
    await createPost({ userId: "u1", ...old }, { body: "Thanks, I will try that", parentId: top }, guard);
    expect(db.notes).toHaveLength(1);
  });
  it("refuses replies to missing, held or reply posts", async () => {
    const top = await post("u1");
    const reply = (await createPost({ userId: "u2", ...old }, { body: "A first reply here", parentId: top }, guard) as { id: string }).id;
    expect((await createPost({ userId: "u3", ...old }, { body: "Reply to a reply", parentId: reply }, guard)).ok).toBe(false);
    expect((await createPost({ userId: "u3", ...old }, { body: "Reply to nothing", parentId: uid(999) }, guard)).ok).toBe(false);
    db.posts.find((p) => p.id === top)!.status = "hidden";
    expect((await createPost({ userId: "u3", ...old }, { body: "Reply to a held post", parentId: top }, guard)).ok).toBe(false);
  });
});

describe("the feed", () => {
  it("shows labeled examples only while there are no real posts", async () => {
    const empty = await feed("u1");
    expect(empty.posts.length).toBeGreaterThan(0);
    expect(empty.posts.every((p) => p.example)).toBe(true);
    await post("u1");
    expect((await feed("u1")).posts.some((p) => p.example)).toBe(false);
  });
  it("lists newest first with replies and helpful counts, and pages", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 22; i++) { const g = memoryGuard(); ids.push(((await createPost({ userId: "u1", ...old }, { body: `Post number ${i} here` }, g)) as { id: string }).id); }
    await createPost({ userId: "u2", ...old }, { body: "A kind reply here", parentId: ids[21] }, guard);
    const first = await feed("u2");
    expect(first.posts).toHaveLength(20);
    expect(first.posts[0]!.id).toBe(ids[21]);
    expect(first.posts[0]!.replies.map((r) => r.body)).toEqual(["A kind reply here"]);
    expect(first.next).not.toBeNull();
    const second = await feed("u2", first.next);
    expect(second.posts).toHaveLength(2);
    expect(second.next).toBeNull();
    expect((await feed("u2", "garbage")).posts).toHaveLength(20); // a bad cursor just starts over
  });
  it("shows an author their own held post, but nobody else", async () => {
    const a = await post("u1"); await post("u2", "Another visible post");
    db.posts.find((p) => p.id === a)!.status = "hidden";
    expect((await feed("u1")).posts.find((p) => p.id === a)!.held).toBe(true);
    expect((await feed("u3")).posts.some((p) => p.id === a)).toBe(false);
  });
});

describe("helpful", () => {
  it("counts once per person, not for your own post, and notifies at the first one", async () => {
    const a = await post("u1");
    expect(await setHelpful("u1", a, true, guard)).toMatchObject({ ok: false });
    expect(await setHelpful("u2", a, true, guard)).toEqual({ ok: true, count: 1 });
    expect(await setHelpful("u2", a, true, guard)).toEqual({ ok: true, count: 1 });
    expect(db.notes).toEqual([{ to: "u1", type: "helpful", body: "Someone found your post helpful.", link: `/community#post-${a}` }]);
    expect(await setHelpful("u3", a, true, guard)).toEqual({ ok: true, count: 2 });
    expect(db.notes).toHaveLength(1); // 2 is not a milestone
    expect(await setHelpful("u2", a, false, guard)).toEqual({ ok: true, count: 1 });
  });
  it("refuses bad input and held posts", async () => {
    expect((await setHelpful("u2", "nope", true, guard)).ok).toBe(false);
    const a = await post("u1"); db.posts[0]!.status = "hidden";
    expect((await setHelpful("u2", a, true, guard)).ok).toBe(false);
  });
});

describe("reports and moderation", () => {
  it("holds a post at once for personal details, and tells the author", async () => {
    const a = await post("u1");
    expect(await reportPost("u2", a, "personal_info", guard)).toEqual({ ok: true });
    expect(db.posts[0]!.status).toBe("hidden");
    expect(db.notes.at(-1)).toMatchObject({ to: "u1", type: "moderation" });
  });
  it("needs two different people for other reasons (one troll cannot silence a post)", async () => {
    const a = await post("u1");
    await reportPost("u2", a, "unkind", guard); await reportPost("u2", a, "unkind", guard);
    expect(db.posts[0]!.status).toBe("visible");
    await reportPost("u3", a, "unkind", guard);
    expect(db.posts[0]!.status).toBe("hidden");
  });
  it("lets the threshold be changed, and refuses own posts and bad reasons", async () => {
    process.env.COMMUNITY_REPORT_HIDE_AT = "1";
    const a = await post("u1");
    expect((await reportPost("u1", a, "spam", guard)).ok).toBe(false);
    expect((await reportPost("u2", a, "not-a-reason", guard)).ok).toBe(false);
    await reportPost("u2", a, "spam", guard);
    expect(db.posts[0]!.status).toBe("hidden");
  });
  it("only moderators on the list can see the queue or act", async () => {
    process.env.MODERATOR_EMAILS = "mod@example.com";
    const a = await post("u1"); db.posts[0]!.status = "hidden";
    expect((await moderationQueue("user@example.com")).ok).toBe(false);
    expect((await moderate("user@example.com", a, "restore")).ok).toBe(false);
    const q = await moderationQueue("MOD@example.com");
    expect(q.ok && q.items).toHaveLength(1);
    expect(await moderate("mod@example.com", a, "restore")).toEqual({ ok: true });
    expect(db.posts[0]!.status).toBe("visible");
    expect(db.notes.at(-1)).toMatchObject({ to: "u1", type: "moderation", body: expect.stringContaining("put it back") });
  });
  it("removing erases the words and tells the author; it only works on held posts", async () => {
    process.env.MODERATOR_EMAILS = "mod@example.com";
    const a = await post("u1");
    expect((await moderate("mod@example.com", a, "remove")).ok).toBe(false); // not held
    db.posts[0]!.status = "hidden";
    expect(await moderate("mod@example.com", a, "remove")).toEqual({ ok: true });
    expect(db.posts[0]).toMatchObject({ status: "removed", body: "" });
    expect((await moderate("mod@example.com", a, "delete")).ok).toBe(false);
  });
  it("nobody is a moderator when no list is set", async () => expect((await moderationQueue("mod@example.com")).ok).toBe(false));
});

describe("deleting your own post", () => {
  it("erases the words, and only for the author", async () => {
    const a = await post("u1");
    expect((await deleteOwnPost("u2", a)).ok).toBe(false);
    expect(await deleteOwnPost("u1", a)).toEqual({ ok: true });
    expect(db.posts[0]).toMatchObject({ status: "removed", body: "" });
    expect((await deleteOwnPost("u1", a)).ok).toBe(false);
  });
});
