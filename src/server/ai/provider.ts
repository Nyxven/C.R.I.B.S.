import Anthropic from "@anthropic-ai/sdk";
import type { ChatTurn } from "@/lib/ai/limits";
import { classifyStatus, parseRetryAfter, ProviderError } from "@/lib/ai/providerError";

export type Usage = { inputTokens: number; outputTokens: number };
export type ChatProvider = {
  /** Streams the answer through `onText` and resolves with the token counts. */
  stream(args: { system: string; messages: ChatTurn[]; maxTokens: number; signal?: AbortSignal }, onText: (delta: string) => void): Promise<Usage>;
};

/** The only file that talks to the model provider. */
export function createAnthropicProvider(apiKey: string, model: string): ChatProvider {
  const client = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
  return {
    async stream({ system, messages, maxTokens, signal }, onText) {
      try {
        const stream = client.messages.stream({ model, max_tokens: maxTokens, system, messages }, { signal });
        stream.on("text", (delta) => onText(delta));
        const final = await stream.finalMessage();
        return { inputTokens: final.usage.input_tokens, outputTokens: final.usage.output_tokens };
      } catch (e) {
        if (signal?.aborted) throw e;
        if (e instanceof Anthropic.APIError && typeof e.status === "number") {
          throw new ProviderError(classifyStatus(e.status), `Provider returned HTTP ${e.status}`, parseRetryAfter(e.headers?.get?.("retry-after") ?? null));
        }
        throw e;
      }
    },
  };
}
