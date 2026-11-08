// Plain types and helpers for guides, FAQs and the directory. No React, no database: safe to import anywhere.

export type ReviewStatus = "prototype-content" | "draft" | "expert-reviewed";

export type ArticleSummary = { slug: string; title: string; readTime: string; reviewStatus: string; moduleId: string };
export type ArticleFull = ArticleSummary & { html: string; moduleName: string; moduleShortName: string };
export type ModuleWithArticles = { id: string; name: string; shortName: string; description: string; articles: ArticleSummary[] };
export type FaqItem = { id: string; question: string; answer: string };
export type Professional = { id: string; name: string; role: string; location: string; note: string; verifiedAt: Date | null; source: string | null };

/** Plain text of an HTML string (for search and snippets). Seed HTML only uses simple tags. */
export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Only "expert-reviewed" earns the badge (BUILD_CRIBS.md D4). */
export const isExpertReviewed = (a: { reviewStatus: string }) => a.reviewStatus === "expert-reviewed";

/** Listings stay labeled "Sample listing" until someone sets verifiedAt (D3). */
export const isSampleListing = (p: { verifiedAt: Date | null }) => p.verifiedAt === null;

/** Lowercase, no accents, letters and digits only, dashes between words. */
export function slugify(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Roles in the order they first appear, no repeats. */
export const rolesOf = (list: readonly { role: string }[]): string[] => [...new Set(list.map((p) => p.role))];

/** Keep one role. An unknown or empty role keeps everyone. */
export function filterByRole<T extends { role: string }>(list: readonly T[], role: string | undefined): T[] {
  return role && rolesOf(list).includes(role) ? list.filter((p) => p.role === role) : [...list];
}
