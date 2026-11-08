import { splitCitations, type Source } from "@/lib/ai/citations";
import type { ChatEvent } from "@/lib/ai/events";
import { cleanMessages, MAX_OUTPUT_TOKENS, type ChatTurn } from "@/lib/ai/limits";
import { buildChildContext, buildKnowledge, buildSystemPrompt, type ChildContextInput, type KnowledgeEntry } from "@/lib/ai/prompt";
import { detectEmergency, emergencyReply } from "@/lib/ai/safety";
import type { ChatProvider } from "./provider";

// Everything the chat needs from the outside, so the rules below can be tested with fakes.
export type ChatDeps = {
  provider: ChatProvider | null; // null = no API key set
  ratePerHour: number;
  hitRateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean }>;
  loadKnowledge(): Promise<{ entries: KnowledgeEntry[]; sources: Record<string, Source> }>;
  loadChild(userId: string): Promise<ChildContextInput | null>;
  log(message: string, data: Record<string, string | number>): void;
};

export type StartedChat =
  | { type: "rejected"; status: 400 | 429 | 503; error: string }
  | { type: "stream"; run: (emit: (e: ChatEvent) => void, signal?: AbortSignal) => Promise<void> };

const GENERIC_FAILURE = "The guide had trouble answering. Please try again.";

/**
 * Decides what happens to one message. Order matters:
 * 1. clean the input  2. emergency check (needs no model, no key, no rate limit)  3. key present  4. rate limit  5. stream the answer.
 */
export async function startChat(deps: ChatDeps, userId: string, raw: readonly ChatTurn[]): Promise<StartedChat> {
  const cleaned = cleanMessages(raw);
  if (!cleaned.ok) {
    return { type: "rejected", status: 400, error: cleaned.error === "too_long" ? "That message is too long. Please keep it under 1,000 characters." : "Please type a question." };
  }

  const kind = detectEmergency(cleaned.question);
  if (kind) {
    const text = emergencyReply(kind);
    return { type: "stream", run: async (emit) => { emit({ t: "start", kind: "emergency" }); emit({ t: "text", d: text }); emit({ t: "done", sources: [] }); } };
  }

  const provider = deps.provider;
  if (!provider) return { type: "rejected", status: 503, error: "The guide is not available right now. You can search the guides instead." };

  const { allowed } = await deps.hitRateLimit(`chat:${userId}`, deps.ratePerHour, 3600);
  if (!allowed) return { type: "rejected", status: 429, error: "You have asked a lot of questions this hour. Please try again a little later." };

  return {
    type: "stream",
    run: async (emit, signal) => {
      const started = Date.now();
      try {
        const [{ entries, sources }, child] = await Promise.all([deps.loadKnowledge(), deps.loadChild(userId)]);
        const system = buildSystemPrompt(buildKnowledge(entries), buildChildContext(child ?? { ageYears: null, communicationLevel: null, sensory: {}, challenges: [], school: null }));
        emit({ t: "start", kind: "answer" });
        let full = "";
        const usage = await provider.stream({ system, messages: cleaned.messages, maxTokens: MAX_OUTPUT_TOKENS, signal }, (d) => { full += d; emit({ t: "text", d }); });
        if (full.trim() === "") { emit({ t: "error", message: GENERIC_FAILURE }); return; }
        emit({ t: "done", sources: splitCitations(full, sources).sources });
        // Counts only: never the question, the answer or who asked.
        deps.log("[ai] usage", { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, ms: Date.now() - started });
      } catch (e) {
        if (signal?.aborted) return; // the person left or pressed stop
        deps.log("[ai] error", { error: e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : "unknown" });
        emit({ t: "error", message: GENERIC_FAILURE });
      }
    },
  };
}
