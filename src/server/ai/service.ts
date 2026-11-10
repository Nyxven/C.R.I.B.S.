import { splitCitations, type Source } from "@/lib/ai/citations";
import type { ChatEvent } from "@/lib/ai/events";
import { cleanMessages, MAX_INPUT_CHARS, type ChatTurn } from "@/lib/ai/limits";
import { COOLDOWN_KEY, DAY_SEC, globalRules, ipRules, lockKey, tokenKey, userRules, type AiPolicy } from "@/lib/ai/policy";
import { buildChildContext, buildKnowledge, buildSystemPrompt, type ChildContextInput, type KnowledgeEntry } from "@/lib/ai/prompt";
import { cooldownSeconds, ProviderError } from "@/lib/ai/providerError";
import { detectEmergency, emergencyReply } from "@/lib/ai/safety";
import { scrubPii } from "@/lib/ai/scrub";
import { threadTitle, type HistoryStore } from "@/lib/chat/history";
import { firstBroken, type AbuseGuard } from "@/lib/security/guard";
import type { ChatProvider } from "./provider";

// Everything the chat needs from the outside, so the rules below can be tested with fakes.
export type ChatDeps = {
  provider: ChatProvider | null; // null = not configured
  policy: AiPolicy;
  maxOutputTokens: number;
  guard: AbuseGuard;
  history: HistoryStore | null; // null = nothing is ever saved
  loadKnowledge(): Promise<{ entries: KnowledgeEntry[]; sources: Record<string, Source> }>;
  loadChild(userId: string): Promise<ChildContextInput | null>;
  log(message: string, data: Record<string, string | number>): void;
};
export type ChatContext = { userId: string; ipBucket: string; accountAgeHours: number; threadId?: string };

export type StartedChat =
  | { type: "rejected"; status: 400 | 429 | 503; error: string }
  | { type: "stream"; run: (emit: (e: ChatEvent) => void, signal?: AbortSignal) => Promise<void> };

export const MSG = {
  tooLong: `That message is too long. Please keep it under ${MAX_INPUT_CHARS} characters.`,
  empty: "Please type a question.",
  unavailable: "The guide is not available right now. You can search the guides instead.",
  resting: "The guide needs a short rest. Please try again in a minute, or search the guides.",
  user: "You have asked a lot of questions for now. Please try again a little later.",
  userDaily: "You have reached today's limit for questions. It resets tomorrow. You can still search the guides.",
  busy: "The guide is very busy right now. Please try again in a few minutes, or search the guides.",
  inProgress: "Please wait for the current answer to finish.",
  failed: "The guide had trouble answering. Please try again.",
  threadMissing: "We could not find that chat. Please start a new chat.",
  threadFull: "This chat is full. Please start a new chat.",
} as const;

/** Error text for the logs, with anything that looks like an API key removed. */
const safeError = (e: unknown): string =>
  (e instanceof Error ? `${e.name}: ${e.message}` : "unknown").replace(/\b(?:sk|gsk|AIza|or)[-_]?[A-Za-z0-9_-]{12,}/g, "[key]").slice(0, 300);

const LOCK_SEC = 45; // longer than the route's 30 s limit; frees itself if a request dies
const NO_LIMIT = Number.MAX_SAFE_INTEGER;

/**
 * Decides what happens to one message. Order matters (cheapest and most important first):
 * 1. clean input  2. emergency check (no model, no key, no limits)  3. configured?  4. cooldown after a provider error
 * 5. address limits  6. token budgets  7. one answer at a time  8. user limits  9. app-wide limits  10. stream the answer.
 * Address and user limits come before app-wide ones, so one abuser cannot use up the budget everybody shares.
 */
export async function startChat(deps: ChatDeps, ctx: ChatContext, raw: readonly ChatTurn[]): Promise<StartedChat> {
  const cleaned = cleanMessages(raw);
  if (!cleaned.ok) return { type: "rejected", status: 400, error: cleaned.error === "too_long" ? MSG.tooLong : MSG.empty };

  const kind = detectEmergency(cleaned.question);
  if (kind) {
    const text = emergencyReply(kind);
    return { type: "stream", run: async (emit) => { emit({ t: "start", kind: "emergency" }); emit({ t: "text", d: text }); emit({ t: "done", sources: [] }); } };
  }

  const { provider, guard, policy } = deps;
  if (!provider) return { type: "rejected", status: 503, error: MSG.unavailable };
  if (await guard.flagged(COOLDOWN_KEY)) return { type: "rejected", status: 503, error: MSG.resting };
  if (await firstBroken(guard, ipRules(policy, ctx.ipBucket))) { deps.log("[ai] limited", { scope: "ip" }); return { type: "rejected", status: 429, error: MSG.user }; }

  if ((await guard.used(tokenKey.user(ctx.userId))) >= policy.userTokensPerDay) { deps.log("[ai] limited", { scope: "user-tokens" }); return { type: "rejected", status: 429, error: MSG.userDaily }; }
  if ((await guard.used(tokenKey.global)) >= policy.globalTokensPerDay) { deps.log("[ai] limited", { scope: "global-tokens" }); return { type: "rejected", status: 503, error: MSG.busy }; }

  // Saved chats: when a chat id is sent, the server uses ITS OWN copy of the conversation, never what the browser says it was.
  let saved: ChatTurn[] | null = null;
  const saving = !!deps.history && (await deps.history.enabled(ctx.userId));
  if (saving && ctx.threadId) {
    const thread = await deps.history!.loadThread(ctx.userId, ctx.threadId);
    if (!thread) return { type: "rejected", status: 400, error: MSG.threadMissing };
    if (thread.full) return { type: "rejected", status: 400, error: MSG.threadFull };
    saved = thread.turns;
  }

  const lock = lockKey(ctx.userId);
  if (!(await guard.lock(lock, LOCK_SEC))) return { type: "rejected", status: 429, error: MSG.inProgress };

  const broken = (await firstBroken(guard, userRules(policy, ctx.userId, ctx.accountAgeHours))) ?? (await firstBroken(guard, globalRules(policy)));
  if (broken) {
    await guard.unlock(lock);
    deps.log("[ai] limited", { scope: broken.scope });
    if (broken.scope === "global") return { type: "rejected", status: 503, error: MSG.busy };
    return { type: "rejected", status: 429, error: broken.key.includes(":day:") ? MSG.userDaily : MSG.user };
  }

  // Contact details never leave: the provider only sees the cleaned-up text.
  const scrubbedQuestion = scrubPii(cleaned.question).text;
  const base = saved ? cleanMessages([...saved, { role: "user", content: cleaned.question }]) : cleaned;
  const messages: ChatTurn[] = (base.ok ? base.messages : cleaned.messages).map((m) => (m.role === "user" ? { role: m.role, content: scrubPii(m.content).text } : m));

  return {
    type: "stream",
    run: async (emit, signal) => {
      const started = Date.now();
      try {
        const [{ entries, sources }, child] = await Promise.all([deps.loadKnowledge(), deps.loadChild(ctx.userId)]);
        const system = buildSystemPrompt(buildKnowledge(entries), buildChildContext(child ?? { ageYears: null, communicationLevel: null, sensory: {}, challenges: [], school: null }));
        emit({ t: "start", kind: "answer" });
        let full = "";
        const usage = await provider.stream({ system, messages, maxTokens: deps.maxOutputTokens, signal }, (d) => { full += d; emit({ t: "text", d }); });
        const total = usage.inputTokens + usage.outputTokens;
        await Promise.all([guard.consume(tokenKey.user(ctx.userId), total, NO_LIMIT, DAY_SEC), guard.consume(tokenKey.global, total, NO_LIMIT, DAY_SEC)]);
        if (full.trim() === "") { emit({ t: "error", message: MSG.failed }); return; }
        const cited = splitCitations(full, sources);
        let ids: { threadId?: string; messageId?: string } = {};
        if (saving) {
          // A failed save must never break the answer.
          try {
            const threadId = ctx.threadId ?? (await deps.history!.createThread(ctx.userId, threadTitle(scrubbedQuestion)));
            const messageId = await deps.history!.saveTurn(ctx.userId, threadId, { question: scrubbedQuestion, answer: cited.text, sources: cited.sources, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens });
            ids = { threadId, messageId };
          } catch (e) { deps.log("[ai] history-save-failed", { error: safeError(e) }); }
        }
        emit({ t: "done", sources: cited.sources, ...ids });
        // Counts only: never the question, the answer or who asked.
        deps.log("[ai] usage", { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, ms: Date.now() - started });
      } catch (e) {
        if (signal?.aborted) return; // the person left or pressed stop
        if (e instanceof ProviderError) {
          const secs = cooldownSeconds(e);
          if (secs > 0) await guard.flag(COOLDOWN_KEY, secs).catch(() => undefined); // stop calling a provider that just said no
          deps.log("[ai] provider-error", { kind: e.kind, cooldownSec: secs });
          emit({ t: "error", message: e.kind === "rate_limited" || e.kind === "quota" ? MSG.busy : MSG.failed });
        } else {
          deps.log("[ai] error", { error: safeError(e) });
          emit({ t: "error", message: MSG.failed });
        }
      } finally {
        await guard.unlock(lock).catch(() => undefined);
      }
    },
  };
}
