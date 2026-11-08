import { describe, expect, it } from "vitest";
import type { ChatEvent } from "@/lib/ai/events";
import { startChat, type ChatDeps } from "./service";

type Call = { system: string; messages: { role: string; content: string }[]; maxTokens: number };

function setup(over: Partial<ChatDeps> & { reply?: string[]; fail?: boolean; allowed?: boolean } = {}) {
  const calls: Call[] = [];
  const hits: [string, number, number][] = [];
  const logs: [string, Record<string, string | number>][] = [];
  const deps: ChatDeps = {
    provider: "provider" in over ? over.provider! : {
      async stream(args, onText) {
        calls.push({ system: args.system, messages: args.messages, maxTokens: args.maxTokens });
        if (over.fail) throw new Error("boom sk-ant-SECRET-123");
        for (const d of over.reply ?? ["Try a visual schedule. ", "[[visual-supports]] ", "[[made-up]]"]) onText(d);
        return { inputTokens: 1200, outputTokens: 80 };
      },
    },
    ratePerHour: 30,
    hitRateLimit: async (k, l, w) => { hits.push([k, l, w]); return { allowed: over.allowed ?? true }; },
    loadKnowledge: async () => ({
      entries: [{ id: "visual-supports", kind: "guide", title: "Visual supports", text: "Pictures help." }],
      sources: { "visual-supports": { id: "visual-supports", title: "Visual supports", href: "/learn/comm/visual-supports" } },
    }),
    loadChild: async () => ({ ageYears: 4, communicationLevel: "few_words", sensory: { sound: "avoids" }, challenges: ["sleep"], school: "none" }),
    log: (m, d) => { logs.push([m, d]); },
    ...(over.loadChild ? { loadChild: over.loadChild } : {}),
  };
  return { deps, calls, hits, logs };
}

async function drain(started: Awaited<ReturnType<typeof startChat>>) {
  const events: ChatEvent[] = [];
  if (started.type === "stream") await started.run((e) => events.push(e));
  return events;
}
const q = (content: string) => [{ role: "user" as const, content }];

describe("startChat: a normal question", () => {
  it("streams the answer and returns only real sources", async () => {
    const { deps, calls, hits, logs } = setup();
    const events = await drain(await startChat(deps, "u1", q("How can I help my child with routines?")));
    expect(events[0]).toEqual({ t: "start", kind: "answer" });
    expect(events.filter((e) => e.t === "text").map((e) => (e as { d: string }).d).join("")).toContain("visual schedule");
    expect(events.at(-1)).toEqual({ t: "done", sources: [{ id: "visual-supports", title: "Visual supports", href: "/learn/comm/visual-supports" }] });
    expect(hits).toEqual([["chat:u1", 30, 3600]]);
    expect(calls[0]!.maxTokens).toBe(700);
    expect(calls[0]!.messages).toEqual(q("How can I help my child with routines?"));
    expect(logs).toEqual([["[ai] usage", expect.objectContaining({ inputTokens: 1200, outputTokens: 80 })]]);
  });
  it("gives the model the knowledge and a non-identifying child context", async () => {
    const { deps, calls } = setup();
    await drain(await startChat(deps, "u1", q("Hello there")));
    expect(calls[0]!.system).toContain('<entry id="visual-supports"');
    expect(calls[0]!.system).toContain("Age band: 3 to 5 years");
    expect(calls[0]!.system).toContain("Cite sources as [[id]]");
  });
  it("never logs the question or the answer", async () => {
    const { deps, logs } = setup();
    await drain(await startChat(deps, "u1", q("My secret question about bedtime")));
    expect(JSON.stringify(logs)).not.toContain("secret");
    expect(JSON.stringify(logs)).not.toContain("visual schedule");
    expect(JSON.stringify(logs)).not.toContain("u1");
  });
});

describe("startChat: emergencies skip the model", () => {
  it("answers with the fixed message, no model call, no rate-limit hit", async () => {
    const { deps, calls, hits } = setup();
    const events = await drain(await startChat(deps, "u1", q("My son is not breathing")));
    expect(events.map((e) => e.t)).toEqual(["start", "text", "done"]);
    expect(events[0]).toEqual({ t: "start", kind: "emergency" });
    expect((events[1] as { d: string }).d).toContain("911");
    expect(calls).toHaveLength(0);
    expect(hits).toHaveLength(0);
  });
  it("still works with no API key and when the person is over the limit", async () => {
    const a = await startChat(setup({ provider: null }).deps, "u1", q("I want to die"));
    expect(a.type).toBe("stream");
    const b = await startChat(setup({ allowed: false }).deps, "u1", q("he is choking"));
    expect(b.type).toBe("stream");
  });
  it("only checks the newest message", async () => {
    const { deps, calls } = setup();
    const events = await drain(await startChat(deps, "u1", [{ role: "user", content: "I want to die" }, { role: "assistant", content: "Please call 911." }, { role: "user", content: "thanks, now what helps with bedtime?" }]));
    expect(events[0]).toEqual({ t: "start", kind: "answer" });
    expect(calls).toHaveLength(1);
  });
});

describe("startChat: refusals", () => {
  it("503 with no API key", async () => {
    expect(await startChat(setup({ provider: null }).deps, "u1", q("hello"))).toMatchObject({ type: "rejected", status: 503 });
  });
  it("429 over the limit, without calling the model", async () => {
    const { deps, calls } = setup({ allowed: false });
    expect(await startChat(deps, "u1", q("hello"))).toMatchObject({ type: "rejected", status: 429 });
    expect(calls).toHaveLength(0);
  });
  it("400 for empty or too-long input, before the rate limit", async () => {
    const { deps, hits } = setup();
    expect(await startChat(deps, "u1", q("   "))).toMatchObject({ type: "rejected", status: 400 });
    expect(await startChat(deps, "u1", q("x".repeat(1001)))).toMatchObject({ type: "rejected", status: 400 });
    expect(hits).toHaveLength(0);
  });
});

describe("startChat: failures", () => {
  it("shows a plain message and keeps the provider's error text away from the person", async () => {
    const { deps, logs } = setup({ fail: true });
    const events = await drain(await startChat(deps, "u1", q("hello")));
    expect(events.at(-1)).toEqual({ t: "error", message: "The guide had trouble answering. Please try again." });
    expect(JSON.stringify(events)).not.toContain("sk-ant");
    expect(logs[0]![0]).toBe("[ai] error");
  });
  it("treats an empty answer as a failure", async () => {
    const events = await drain(await startChat(setup({ reply: ["  "] }).deps, "u1", q("hello")));
    expect(events.at(-1)!.t).toBe("error");
  });
  it("stays quiet when the person has left", async () => {
    const { deps } = setup({ fail: true });
    const started = await startChat(deps, "u1", q("hello"));
    const ctrl = new AbortController();
    ctrl.abort();
    const events: ChatEvent[] = [];
    if (started.type === "stream") await started.run((e) => events.push(e), ctrl.signal);
    expect(events.some((e) => e.t === "error")).toBe(false);
  });
});
