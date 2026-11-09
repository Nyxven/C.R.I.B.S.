import { describe, expect, it } from "vitest";
import { ProviderError } from "@/lib/ai/providerError";
import { createOpenAiCompatProvider } from "./openaiCompat";

const sse = (chunks: string[], status = 200, headers: Record<string, string> = {}) => {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({ start(c) { for (const ch of chunks) c.enqueue(enc.encode(ch)); c.close(); } });
  return new Response(status === 200 ? body : "secret prompt echoed here", { status, headers });
};
const ev = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
const args = { system: "SYS", messages: [{ role: "user" as const, content: "hi" }], maxTokens: 300 };
const make = (fetchImpl: typeof fetch) => createOpenAiCompatProvider({ apiKey: "k-test-12345", baseUrl: "https://example.test/v1", model: "free-model", fetchImpl });

describe("openai-compatible provider", () => {
  it("sends the right request and streams text, even when events are split mid-line", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const full = ev({ choices: [{ delta: { content: "Use a " } }] }) + ev({ choices: [{ delta: { content: "visual schedule." } }] }) + ev({ choices: [], usage: { prompt_tokens: 900, completion_tokens: 30 } }) + "data: [DONE]\n\n";
    const cut = 25;
    const p = make(async (url, init) => { seen = { url: String(url), init: init! }; return sse([full.slice(0, cut), full.slice(cut)]); });
    let text = "";
    const usage = await p.stream(args, (d) => (text += d));
    expect(text).toBe("Use a visual schedule.");
    expect(usage).toEqual({ inputTokens: 900, outputTokens: 30 });
    expect(seen!.url).toBe("https://example.test/v1/chat/completions");
    const body = JSON.parse(String(seen!.init.body));
    expect(body).toMatchObject({ model: "free-model", stream: true, max_tokens: 300 });
    expect(body.messages).toEqual([{ role: "system", content: "SYS" }, { role: "user", content: "hi" }]);
    expect((seen!.init.headers as Record<string, string>).Authorization).toBe("Bearer k-test-12345");
  });
  it("estimates usage when the provider does not report it", async () => {
    const p = make(async () => sse([ev({ choices: [{ delta: { content: "x".repeat(40) } }] }), "data: [DONE]\n\n"]));
    const usage = await p.stream(args, () => {});
    expect(usage.outputTokens).toBe(10);
    expect(usage.inputTokens).toBeGreaterThan(0);
  });
  it("turns HTTP errors into typed errors without leaking the body", async () => {
    const rate = make(async () => sse([], 429, { "retry-after": "45" }));
    await expect(rate.stream(args, () => {})).rejects.toMatchObject({ kind: "rate_limited", retryAfterSec: 45 });
    const auth = make(async () => sse([], 401));
    const err = await auth.stream(args, () => {}).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.kind).toBe("auth");
    expect(String(err.message)).not.toContain("secret prompt");
    expect(await make(async () => sse([], 402)).stream(args, () => {}).catch((e) => e.kind)).toBe("quota");
    expect(await make(async () => sse([], 503)).stream(args, () => {}).catch((e) => e.kind)).toBe("unavailable");
  });
  it("reports a network failure as unavailable", async () => {
    const p = make(async () => { throw new TypeError("fetch failed"); });
    await expect(p.stream(args, () => {})).rejects.toMatchObject({ kind: "unavailable" });
  });
  it("reports an error object in the stream", async () => {
    const p = make(async () => sse([ev({ error: { message: "quota exceeded" } })]));
    await expect(p.stream(args, () => {})).rejects.toMatchObject({ kind: "other" });
  });
  it("skips broken lines", async () => {
    const p = make(async () => sse(["data: {nope\n\n", ev({ choices: [{ delta: { content: "ok" } }] }), "data: [DONE]\n\n"]));
    let text = "";
    await p.stream(args, (d) => (text += d));
    expect(text).toBe("ok");
  });
});
