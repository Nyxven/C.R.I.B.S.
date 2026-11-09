import { aiReady, getAiConfig } from "@/config/env";
import type { Source } from "@/lib/ai/citations";
import { pickChildContext } from "@/lib/ai/prompt";
import { buildSearchDocs } from "@/lib/domain/search";
import { hitRateLimit } from "@/server/auth/repo";
import { getAllArticles, getFaqs, getProfessionals } from "@/server/content/service";
import { getChild } from "@/server/onboarding/repo";
import { createAnthropicProvider } from "./provider";
import type { ChatDeps } from "./service";

/** True when an API key is set. The Ask page uses this to show "not available" instead of a broken chat. */
export const isAiConfigured = (): boolean => aiReady(getAiConfig());

/** The real dependencies for the chat route. Reuses the DB-backed rate limiter from auth. */
export function defaultChatDeps(): ChatDeps {
  const cfg = getAiConfig();
  return {
    provider: aiReady(cfg) && cfg.provider === "anthropic" ? createAnthropicProvider(cfg.apiKey!, cfg.model!) : null,
    ratePerHour: cfg.limits.perHour,
    hitRateLimit,
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
