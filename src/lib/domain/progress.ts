// Reading progress rules. Pure: no database, no React.

export type ProgressEntry = { slug: string; saved: boolean; read: boolean };
export type ModuleProgress = { read: number; total: number; percent: number; done: boolean };

/** How many of a module's guides were read. Entries for guides outside the module are ignored. */
export function moduleProgress(moduleSlugs: readonly string[], entries: readonly ProgressEntry[]): ModuleProgress {
  const read = new Set(entries.filter((e) => e.read).map((e) => e.slug));
  const count = moduleSlugs.filter((s) => read.has(s)).length;
  const total = moduleSlugs.length;
  return { read: count, total, percent: total === 0 ? 0 : Math.round((count / total) * 100), done: total > 0 && count === total };
}

export const readSlugs = (entries: readonly ProgressEntry[]): Set<string> => new Set(entries.filter((e) => e.read).map((e) => e.slug));
export const savedSlugs = (entries: readonly ProgressEntry[]): Set<string> => new Set(entries.filter((e) => e.saved).map((e) => e.slug));

/** Guide slugs are lowercase words with dashes. Used to reject anything else before it reaches the database. */
export const isValidSlug = (slug: unknown): slug is string => typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 100;

/** "2 of 3 read" */
export const progressLabel = (p: ModuleProgress): string => (p.total === 0 ? "No guides yet" : `${p.read} of ${p.total} read`);
