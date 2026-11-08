import { cache } from "react";
import type { ArticleFull, ArticleSummary, FaqItem, ModuleWithArticles, Professional } from "@/lib/domain/content";
import { buildSearchDocs, isSearchable, search, type SearchHit } from "@/lib/domain/search";
import * as repo from "./repo";

// Pages call these. They return plain objects, never database rows.

/** Pure: group article summaries under their modules (modules and articles arrive already ordered). */
export function groupModules(
  modules: { id: string; name: string; shortName: string; description: string }[],
  articles: ArticleSummary[],
): ModuleWithArticles[] {
  return modules.map((m) => ({ ...m, articles: articles.filter((a) => a.moduleId === m.id) }));
}

export const getModules = cache(async (): Promise<ModuleWithArticles[]> => {
  const [modules, articles] = await Promise.all([repo.listModules(), repo.listArticleSummaries()]);
  return groupModules(modules, articles);
});

export const getModule = async (id: string) => (await getModules()).find((m) => m.id === id);

export async function getArticleBySlug(moduleId: string, slug: string): Promise<ArticleFull | null> {
  const [row, mod] = await Promise.all([repo.getArticle(slug), getModule(moduleId)]);
  if (!row || !mod || row.moduleId !== mod.id) return null;
  return { slug: row.slug, moduleId: row.moduleId, title: row.title, readTime: row.readTime, reviewStatus: row.reviewStatus, html: row.html, moduleName: mod.name, moduleShortName: mod.shortName };
}

/** Every guide with its full text (used by search). Small data set, so one query is fine. */
export async function getAllArticles(): Promise<ArticleFull[]> {
  const [mods, rows] = await Promise.all([getModules(), repo.listArticles()]);
  return rows.map((r) => {
    const m = mods.find((x) => x.id === r.moduleId);
    return { slug: r.slug, moduleId: r.moduleId, title: r.title, readTime: r.readTime, reviewStatus: r.reviewStatus, html: r.html, moduleName: m?.name ?? "", moduleShortName: m?.shortName ?? "" };
  });
}

export const getFaqs = cache(async (): Promise<FaqItem[]> =>
  (await repo.listFaqs()).map((f) => ({ id: f.id, question: f.question, answer: f.answer })));

export const getProfessionals = cache(async (): Promise<Professional[]> =>
  (await repo.listProfessionals()).map((p) => ({ id: p.id, name: p.name, role: p.role, location: p.location, note: p.note, verifiedAt: p.verifiedAt, source: p.source })));

/** Search guides, FAQs and listings. Too-short queries return nothing without touching the database. */
export async function searchContent(query: string): Promise<SearchHit[]> {
  if (!isSearchable(query)) return [];
  const [articles, faqs, professionals] = await Promise.all([getAllArticles(), getFaqs(), getProfessionals()]);
  return search(buildSearchDocs({ articles, faqs, professionals }), query);
}
