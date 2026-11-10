import { aiReady, getAiConfig, type AiConfig } from "@/config/env";
import type { Source } from "@/lib/ai/citations";
import { pickChildContext } from "@/lib/ai/prompt";
import { buildSearchDocs } from "@/lib/domain/search";
import { buildPolicy } from "@/lib/ai/policy";
import { createHistoryStore } from "@/server/chat/service";
import { dbGuard } from "@/server/security/repo";
import { getAllArticles, getFaqs, getProfessionals } from "@/server/content/service";
import { getChild } from "@/server/onboarding/repo";
import { createOpenAiCompatProvider } from "./openaiCompat";
import { createAnthropicProvider, type ChatProvider } from "./provider";
import type { ChatDeps } from "./service";

/** True when an API key is set. The Ask page uses this to show "not available" instead of a broken chat. */
export const isAiConfigured = (): boolean => aiReady(getAiConfig());

function createProvider(cfg: AiConfig): ChatProvider | null {
  if (!aiReady(cfg)) return null;
  return cfg.provider === "anthropic"
    ? createAnthropicProvider(cfg.apiKey!, cfg.model!)
    : createOpenAiCompatProvider({ apiKey: cfg.apiKey!, baseUrl: cfg.baseUrl!, model: cfg.model! });
}

/** The real dependencies for the chat route. */
export function defaultChatDeps(): ChatDeps {
  const cfg = getAiConfig();
  return {
    provider: createProvider(cfg),
    policy: buildPolicy(cfg.limits),
    maxOutputTokens: cfg.maxOutputTokens,
    guard: dbGuard,
    history: createHistoryStore(),
    // Small data set (about 2,300 tokens), so every request carries all of it.
    async loadKnowledge() {
      const [articles, faqs, professionals] = await Promise.all([getAllArticles(), getFaqs(), getProfessionals()]);
      const docs = buildSearchDocs({ articles, faqs, professionals });
      const sources: Record<string, Source> = {};
      for (const d of docs) sources[d.id] = { id: d.id, title: d.title, href: d.href };
      return { entries: docs.map((d) => ({ id: d.id, kind: d.kind, title: d.title, text: d.text })), sources };
    },
    // Looked up by the signed-in user id, then reduced to the allowed fields (no name, no contact).
    async loadChild(userId) {
      const row = await getChild(userId);
      return row ? pickChildContext(row) : null;
    },
    log: (message, data) => console.info(message, JSON.stringify(data)),
  };
}
