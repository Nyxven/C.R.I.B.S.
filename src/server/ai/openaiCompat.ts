import { estimateTokens } from "@/lib/ai/policy";
import { classifyStatus, parseRetryAfter, ProviderError } from "@/lib/ai/providerError";
import { extractDelta, parseSse } from "@/lib/ai/sse";
import type { ChatProvider } from "./provider";

type Options = { apiKey: string; baseUrl: string; model: string; timeoutMs?: number; fetchImpl?: typeof fetch };

/**
 * Talks to any "OpenAI-compatible" chat API (Gemini's compatibility endpoint, OpenRouter, Groq, and others).
 * Error messages never include the response body, because some providers echo the prompt back.
 */
export function createOpenAiCompatProvider({ apiKey, baseUrl, model, timeoutMs = 30_000, fetchImpl = fetch }: Options): ChatProvider {
  return {
    async stream({ system, messages, maxTokens, signal }, onText) {
      const limit = AbortSignal.timeout(timeoutMs);
      const both = signal ? AbortSignal.any([signal, limit]) : limit;
      let res: Response;
      try {
        res = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, stream: true, max_tokens: maxTokens, messages: [{ role: "system", content: system }, ...messages] }),
          signal: both,
        });
      } catch (e) {
        if (signal?.aborted) throw e;
        throw new ProviderError("unavailable", e instanceof Error && e.name === "TimeoutError" ? "Provider timed out" : "Provider unreachable");
      }
      if (!res.ok) throw new ProviderError(classifyStatus(res.status), `Provider returned HTTP ${res.status}`, parseRetryAfter(res.headers.get("retry-after")));
      if (!res.body) throw new ProviderError("unavailable", "Provider sent no stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      let usage: { inputTokens: number; outputTokens: number } | undefined;
      let finished = false;
      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSse(buffer);
        buffer = parsed.rest;
        for (const data of parsed.data) {
          if (data.trim() === "[DONE]") { finished = true; break; }
          let json: unknown;
          try { json = JSON.parse(data); } catch { continue; }
          const d = extractDelta(json);
          if (d.error) throw new ProviderError("other", "Provider reported an error");
          if (d.usage) usage = d.usage;
          if (d.text) { answer += d.text; onText(d.text); }
        }
      }
      await reader.cancel().catch(() => undefined);
      return usage ?? { inputTokens: estimateTokens(system) + messages.reduce((n, m) => n + estimateTokens(m.content), 0), outputTokens: estimateTokens(answer) };
    },
  };
}
