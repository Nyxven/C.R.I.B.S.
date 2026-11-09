import { describe, expect, it } from "vitest";
import type { AiLimits } from "@/config/env";
import type { ChatEvent } from "@/lib/ai/events";
import { MAX_INPUT_CHARS } from "@/lib/ai/limits";
import { buildPolicy, lockKey, tokenKey } from "@/lib/ai/policy";
import { ProviderError } from "@/lib/ai/providerError";
import { memoryGuard } from "@/lib/security/memoryGuard";
import { MSG, startChat, type ChatContext, type ChatDeps } from "./service";

const LIMITS: AiLimits = { perHour: 20, perDay: 60, userTokensPerDay: 40000, globalPerMin: 10, globalPerDay: 400, globalTokensPerDay: 400000 };
type Call = { system: string; messages: { role: string; content: string }[]; maxTokens: number };

function setup(o: { limits?: Partial<AiLimits>; reply?: string[]; fail?: Error; noProvider?: boolean; usage?: [number, number] } = {}) {
  let now = 1_000_000;
  const guard = memoryGuard(() => now);
  const calls: Call[] = [];
  const logs: [string, Record<string, string | number>][] = [];
  const deps: ChatDeps = {
    provider: o.noProvider ? null : {
      async stream(args, onText) {
        calls.push({ system: args.system, messages: args.messages, maxTokens: args.maxTokens });
        if (o.fail) throw o.fail;
        for (const d of o.reply ?? ["Try a visual schedule. ", "[[visual-supports]] ", "[[made-up]]"]) onText(d);
        return { inputTokens: o.usage?.[0] ?? 1200, outputTokens: o.usage?.[1] ?? 80 };
      },
    },
    policy: buildPolicy({ ...LIMITS, ...o.limits }),
    maxOutputTokens: 300,
    guard,
    loadKnowledge: async () => ({
      entries: [{ id: "visual-supports", kind: "guide", title: "Visual supports", text: "Pictures help." }],
      sources: { "visual-supports": { id: "visual-supports", title: "Visual supports", href: "/learn/comm/visual-supports" } },
    }),
    loadChild: async () => ({ ageYears: 4, communicationLevel: "few_words", sensory: { sound: "avoids" }, challenges: ["sleep"], school: "none" }),
    log: (m, d) => { logs.push([m, d]); },
  };
  return { deps, guard, calls, logs, advance: (ms: number) => { now += ms; } };
}
const ctx = (over: Partial<ChatContext> = {}): ChatContext => ({ userId: "u1", ipBucket: "ip1", accountAgeHours: 100, ...over });
const q = (content: string) => [{ role: "user" as const, content }];

type Started = Awaited<ReturnType<typeof startChat>>;
async function drain(started: Started) {
  const events: ChatEvent[] = [];
  if (started.type === "stream") await started.run((e) => events.push(e));
  return events;
}
const ask = async (s: ReturnType<typeof setup>, text: string, c: ChatContext = ctx()) => { const started = await startChat(s.deps, c, q(text)); return { started, events: await drain(started) }; };
const rejected = (r: Started) => (r.type === "rejected" ? { status: r.status, error: r.error } : null);

describe("a normal question", () => {
  it("streams the answer, returns only real sources, and passes the output limit", async () => {
    const s = setup();
    const { events } = await ask(s, "How can I help my child with routines?");
    expect(events[0]).toEqual({ t: "start", kind: "answer" });
    expect(events.at(-1)).toEqual({ t: "done", sources: [{ id: "visual-supports", title: "Visual supports", href: "/learn/comm/visual-supports" }] });
    expect(s.calls[0]!.maxTokens).toBe(300);
    expect(s.logs).toEqual([["[ai] usage", expect.objectContaining({ inputTokens: 1200, outputTokens: 80 })]]);
  });
  it("counts tokens against the person and the whole app", async () => {
    const s = setup();
    await ask(s, "hello there");
    expect(await s.guard.used(tokenKey.user("u1"))).toBe(1280);
    expect(await s.guard.used(tokenKey.global)).toBe(1280);
  });
  it("gives the model the knowledge and a non-identifying child context", async () => {
    const s = setup();
    await ask(s, "Hello there");
    expect(s.calls[0]!.system).toContain('<entry id="visual-supports"');
    expect(s.calls[0]!.system).toContain("Age band: 3 to 5 years");
  });
  it("removes phone numbers and emails before they reach the provider", async () => {
    const s = setup();
    await ask(s, "my number is 0917 123 4567 and mail is a.b@example.com, what helps at bedtime?");
    expect(s.calls[0]!.messages[0]!.content).toBe("my number is [number] and mail is [email], what helps at bedtime?");
  });
  it("never logs the question, the answer, the user or the address", async () => {
    const s = setup();
    await ask(s, "My secret question about bedtime", ctx({ userId: "user-777", ipBucket: "bucket-888" }));
    const text = JSON.stringify(s.logs);
    for (const leak of ["secret", "visual schedule", "user-777", "bucket-888"]) expect(text).not.toContain(leak);
  });
});

describe("emergencies skip the model and every limit", () => {
  it("answers with the fixed message, no model call, nothing counted", async () => {
    const s = setup();
    const { events } = await ask(s, "My son is not breathing");
    expect(events.map((e) => e.t)).toEqual(["start", "text", "done"]);
    expect(events[0]).toEqual({ t: "start", kind: "emergency" });
    expect((events[1] as { d: string }).d).toContain("911");
    expect(s.calls).toHaveLength(0);
    expect(s.guard.entries.size).toBe(0);
  });
  it("works with no provider, during a cooldown, and over every limit", async () => {
    expect((await startChat(setup({ noProvider: true }).deps, ctx(), q("I want to die"))).type).toBe("stream");
    const cooling = setup();
    await cooling.guard.flag("ai:cooldown", 600);
    expect((await startChat(cooling.deps, ctx(), q("he is choking"))).type).toBe("stream");
    const busy = setup({ limits: { globalPerMin: 1 } });
    await ask(busy, "hello");
    await ask(busy, "hello again", ctx({ userId: "u2" }));
    expect((await startChat(busy.deps, ctx({ userId: "u3" }), q("my child is not breathing"))).type).toBe("stream");
  });
  it("only checks the newest message", async () => {
    const s = setup();
    const started = await startChat(s.deps, ctx(), [{ role: "user", content: "I want to die" }, { role: "assistant", content: "Please call 911." }, { role: "user", content: "thanks, what helps with bedtime?" }]);
    expect((await drain(started))[0]).toEqual({ t: "start", kind: "answer" });
  });
});

describe("refusals", () => {
  it("503 when the guide is not configured, 400 for empty or long input, with nothing counted", async () => {
    const off = setup({ noProvider: true });
    expect(rejected(await startChat(off.deps, ctx(), q("hello")))).toEqual({ status: 503, error: MSG.unavailable });
    const s = setup();
    expect(rejected(await startChat(s.deps, ctx(), q("   ")))).toEqual({ status: 400, error: MSG.empty });
    expect(rejected(await startChat(s.deps, ctx(), q("x".repeat(MAX_INPUT_CHARS + 1))))).toEqual({ status: 400, error: MSG.tooLong });
    expect(s.guard.entries.size).toBe(0);
  });
});

describe("limits", () => {
  it("stops one person after their per-minute limit, and lets them back in after the window", async () => {
    const s = setup();
    for (let i = 0; i < 4; i++) expect((await ask(s, `question ${i}`)).started.type).toBe("stream");
    expect(rejected((await ask(s, "one more")).started)).toEqual({ status: 429, error: MSG.user });
    s.advance(61_000);
    expect((await ask(s, "after a minute")).started.type).toBe("stream");
  });
  it("gives new accounts a lower daily limit", async () => {
    const s = setup();
    let ok = 0;
    for (let i = 0; i < 30; i++) {
      const { started } = await ask(s, `question ${i}`, ctx({ accountAgeHours: 2 }));
      if (started.type === "stream") ok++; else { expect(rejected(started)).toEqual({ status: 429, error: MSG.userDaily }); break; }
      s.advance(61_000);
    }
    expect(ok).toBe(15);
  });
  it("limits a whole address, even across different accounts", async () => {
    const s = setup();
    for (let i = 0; i < 8; i++) expect((await ask(s, `q${i}`, ctx({ userId: `user-${i}` }))).started.type).toBe("stream");
    expect(rejected((await ask(s, "q9", ctx({ userId: "user-9" }))).started)).toEqual({ status: 429, error: MSG.user });
    expect((await ask(s, "other address", ctx({ userId: "user-10", ipBucket: "ip2" }))).started.type).toBe("stream");
  });
  it("protects the shared app-wide budget (503), counting only requests that passed the personal limits", async () => {
    const s = setup({ limits: { globalPerMin: 2 } });
    expect((await ask(s, "a", ctx({ userId: "a", ipBucket: "1" }))).started.type).toBe("stream");
    expect((await ask(s, "b", ctx({ userId: "b", ipBucket: "2" }))).started.type).toBe("stream");
    expect(rejected((await ask(s, "c", ctx({ userId: "c", ipBucket: "3" }))).started)).toEqual({ status: 503, error: MSG.busy });
    const abuser = setup();
    for (let i = 0; i < 10; i++) await ask(abuser, `spam ${i}`);
    expect(await abuser.guard.used("ai:global:min")).toBe(4); // only the 4 that got through
  });
  it("allows one answer at a time per person, and frees the lock afterwards", async () => {
    const s = setup();
    const first = await startChat(s.deps, ctx(), q("first"));
    expect(rejected(await startChat(s.deps, ctx(), q("second")))).toEqual({ status: 429, error: MSG.inProgress });
    await drain(first);
    expect((await ask(s, "third")).started.type).toBe("stream");
  });
  it("frees the lock when a limit refuses the request", async () => {
    const s = setup({ limits: { globalPerMin: 1 } });
    await ask(s, "a", ctx({ userId: "a", ipBucket: "1" }));
    expect(rejected((await ask(s, "b", ctx({ userId: "b", ipBucket: "2" }))).started)?.status).toBe(503);
    expect(await s.guard.lock(lockKey("b"), 30)).toBe(true);
  });
  it("stops a person who used up the day's tokens, and the whole app when its budget is gone", async () => {
    const own = setup({ limits: { userTokensPerDay: 1000 } });
    await ask(own, "first");
    expect(rejected((await ask(own, "second")).started)).toEqual({ status: 429, error: MSG.userDaily });
    const all = setup({ limits: { globalTokensPerDay: 1000 } });
    await ask(all, "first", ctx({ userId: "a", ipBucket: "1" }));
    expect(rejected((await ask(all, "second", ctx({ userId: "b", ipBucket: "2" }))).started)).toEqual({ status: 503, error: MSG.busy });
  });
});

describe("provider trouble", () => {
  it("pauses calls after a rate-limit answer, then resumes", async () => {
    const s = setup({ fail: new ProviderError("rate_limited", "x") });
    const { events } = await ask(s, "hello");
    expect(events.at(-1)).toEqual({ t: "error", message: MSG.busy });
    expect(rejected((await ask(s, "again", ctx({ userId: "u2", ipBucket: "2" }))).started)).toEqual({ status: 503, error: MSG.resting });
    expect(s.calls).toHaveLength(1); // no second call to the provider
    s.advance(61_000);
    expect((await ask(s, "later", ctx({ userId: "u3", ipBucket: "3" }))).started.type).toBe("stream");
  });
  it("pauses longer for a bad key or an empty quota", async () => {
    const auth = setup({ fail: new ProviderError("auth", "x") });
    await ask(auth, "hello");
    auth.advance(300_000);
    expect(rejected((await ask(auth, "x", ctx({ userId: "u2", ipBucket: "2" }))).started)?.status).toBe(503);
  });
  it("shows a plain message for other errors and keeps keys out of the logs", async () => {
    const fakeKey = ["sk", "ant", "abcdefghijklmnop1234"].join("-"); // built at runtime so the secret scanner does not flag a fixture
    const s = setup({ fail: new Error(`boom ${fakeKey}`) });
    const { events } = await ask(s, "hello");
    expect(events.at(-1)).toEqual({ t: "error", message: MSG.failed });
    expect(JSON.stringify(events)).not.toContain("sk-ant");
    expect(JSON.stringify(s.logs)).not.toContain("abcdefghijklmnop");
  });
  it("treats an empty answer as a failure and still frees the lock", async () => {
    const s = setup({ reply: ["  "] });
    const { events } = await ask(s, "hello");
    expect(events.at(-1)).toEqual({ t: "error", message: MSG.failed });
    expect(await s.guard.lock(lockKey("u1"), 30)).toBe(true);
  });
  it("stays quiet when the person has left", async () => {
    const s = setup({ fail: new Error("x") });
    const started = await startChat(s.deps, ctx(), q("hello"));
    const ctrl = new AbortController();
    ctrl.abort();
    const events: ChatEvent[] = [];
    if (started.type === "stream") await started.run((e) => events.push(e), ctrl.signal);
    expect(events.some((e) => e.t === "error")).toBe(false);
  });
});
