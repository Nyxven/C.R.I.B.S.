import type { ArticleSummary } from "@/lib/domain/content";
import { savedSlugs, type ProgressEntry } from "@/lib/domain/progress";
import { toggleSchema } from "@/features/content/schema";
import * as content from "@/server/content/repo";
import { getModules } from "@/server/content/service";
import * as repo from "./repo";

export type ProgressResult = { ok: true } | { ok: false; error: string };

async function toggle(userId: string, input: unknown, write: (userId: string, slug: string, value: boolean) => Promise<void>): Promise<ProgressResult> {
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "We could not find that guide." };
  const { slug, value } = parsed.data;
  if (!(await content.getArticle(slug))) return { ok: false, error: "We could not find that guide." };
  await write(userId, slug, value);
  return { ok: true };
}

export const saveGuide = (userId: string, input: unknown) => toggle(userId, input, repo.setSaved);
export const markRead = (userId: string, input: unknown) => toggle(userId, input, repo.setRead);

export const getProgress = (userId: string): Promise<ProgressEntry[]> => repo.listProgress(userId);

export const getEntryFor = async (userId: string, slug: string): Promise<{ saved: boolean; read: boolean }> => {
  const e = await repo.getEntry(userId, slug);
  return { saved: e?.saved ?? false, read: e?.read ?? false };
};

/** The guides this person saved, in module order. */
export async function getSavedGuides(userId: string): Promise<(ArticleSummary & { moduleShortName: string })[]> {
  const [entries, modules] = await Promise.all([repo.listProgress(userId), getModules()]);
  const saved = savedSlugs(entries);
  return modules.flatMap((m) => m.articles.filter((a) => saved.has(a.slug)).map((a) => ({ ...a, moduleShortName: m.shortName })));
}
