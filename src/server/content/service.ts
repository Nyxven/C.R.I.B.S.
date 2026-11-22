import { cache } from "react";
import type { ArticleFull, ArticleSummary, FaqItem, ModuleWithArticles, Professional } from "@/lib/domain/content";
import { buildSearchDocs, isSearchable, search, type SearchHit } from "@/lib/domain/search";
import { buildSuggestIndex, type SuggestItem } from "@/lib/domain/suggest";
import { localTitle } from "@/lib/domain/content";
import { localModuleShort } from "@/lib/domain/localize";
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
  return { slug: row.slug, moduleId: row.moduleId, title: row.title, readTime: row.readTime, reviewStatus: row.reviewStatus, html: row.html, moduleName: mod.name, moduleShortName: mod.shortName, titleFil: row.titleFil, htmlFil: row.htmlFil };
}

/** Every guide with its full text (used by search). Small data set, so one query is fine. */
export async function getAllArticles(): Promise<ArticleFull[]> {
  const [mods, rows] = await Promise.all([getModules(), repo.listArticles()]);
  return rows.map((r) => {
    const m = mods.find((x) => x.id === r.moduleId);
    return { slug: r.slug, moduleId: r.moduleId, title: r.title, readTime: r.readTime, reviewStatus: r.reviewStatus, html: r.html, moduleName: m?.name ?? "", moduleShortName: m?.shortName ?? "", titleFil: r.titleFil, htmlFil: r.htmlFil };
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

/** Titles and labels for search suggestions in the browser (no article bodies, nothing personal). */
export async function getSuggestIndex(locale = "en"): Promise<SuggestItem[]> {
  const [mods, faqs, professionals] = await Promise.all([getModules(), getFaqs(), getProfessionals()]);
  const articles = mods.flatMap((m) => m.articles.map((a) => ({ slug: a.slug, moduleId: a.moduleId, title: localTitle(a, locale), moduleShortName: localModuleShort(m.id, m.shortName, locale), englishTitle: a.title })));
  return buildSuggestIndex({ articles, faqs, professionals });
}

/** A guide's title by slug, or null. Used to pre-fill Ask from an article (only real titles, never text from the URL). */
export async function getArticleTitle(slug: string): Promise<string | null> {
  for (const m of await getModules()) { const a = m.articles.find((x) => x.slug === slug); if (a) return a.title; }
  return null;
}
