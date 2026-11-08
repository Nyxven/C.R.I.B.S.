import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { article, contentModule, faq, professional } from "@/db/schema";

// The only file that reads guides, FAQs and listings from the database.
export type ModuleRow = typeof contentModule.$inferSelect;
export type ArticleRow = typeof article.$inferSelect;
export type FaqRow = typeof faq.$inferSelect;
export type ProfessionalRow = typeof professional.$inferSelect;

export const listModules = (): Promise<ModuleRow[]> => db.select().from(contentModule).orderBy(asc(contentModule.sortOrder));

/** Without the long `html` column. */
export const listArticleSummaries = () =>
  db.select({
    slug: article.slug, moduleId: article.moduleId, title: article.title, readTime: article.readTime,
    reviewStatus: article.reviewStatus, sortOrder: article.sortOrder,
  }).from(article).orderBy(asc(article.moduleId), asc(article.sortOrder));

export const listArticles = (): Promise<ArticleRow[]> => db.select().from(article).orderBy(asc(article.moduleId), asc(article.sortOrder));

export async function getArticle(slug: string): Promise<ArticleRow | undefined> {
  const [row] = await db.select().from(article).where(eq(article.slug, slug)).limit(1);
  return row;
}

export const listFaqs = (): Promise<FaqRow[]> => db.select().from(faq).orderBy(asc(faq.sortOrder));
export const listProfessionals = (): Promise<ProfessionalRow[]> => db.select().from(professional).orderBy(asc(professional.sortOrder));
