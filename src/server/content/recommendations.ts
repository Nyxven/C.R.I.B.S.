import type { ArticleSummary } from "@/lib/domain/content";
import { readSlugs } from "@/lib/domain/progress";
import { recommend } from "@/lib/domain/recommend";
import { getChild } from "@/server/onboarding/repo";
import { getProgress } from "@/server/progress/service";
import { getModules } from "./service";

export type RecommendedGuide = ArticleSummary & { reason: string; moduleShortName: string };

/** Up to 3 unread guides for this person's child. The child is looked up by user id, never by a request value. */
export async function getRecommendations(userId: string): Promise<{ child: string; guides: RecommendedGuide[] }> {
  const [child, entries, modules] = await Promise.all([getChild(userId), getProgress(userId), getModules()]);
  const all = modules.flatMap((m) => m.articles.map((a) => ({ ...a, moduleShortName: m.shortName })));
  const picks = recommend(
    child ? { challenges: child.challenges ?? [], communicationLevel: child.communicationLevel, journeyStage: child.journeyStage, sensory: child.sensory ?? {} } : null,
    all.map((a) => a.slug),
    readSlugs(entries),
  );
  const guides = picks.flatMap((p) => { const a = all.find((x) => x.slug === p.slug); return a ? [{ ...a, reason: p.reason }] : []; });
  return { child: child?.nickname ?? "", guides };
}
