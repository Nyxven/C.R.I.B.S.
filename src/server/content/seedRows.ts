// Turns seed/content.json into table rows. Pure: no database, so it is easy to test.
import { slugify } from "@/lib/domain/content";

export type SeedFile = {
  modules: { id: string; name: string; shortName: string; description: string;
    articles: { slug: string; title: string; readTime: string; html: string; reviewStatus: string }[] }[];
  faqs: { q: string; a: string }[];
  directorySample: { name: string; role: string; loc: string; note: string }[];
};

export type SeedRows = {
  modules: { id: string; name: string; shortName: string; description: string; sortOrder: number }[];
  articles: { slug: string; moduleId: string; title: string; readTime: string; html: string; reviewStatus: string; sortOrder: number }[];
  faqs: { id: string; question: string; answer: string; sortOrder: number }[];
  professionals: { id: string; name: string; role: string; location: string; note: string; sortOrder: number }[];
};

export function buildSeedRows(seed: SeedFile): SeedRows {
  return {
    modules: seed.modules.map((m, i) => ({ id: m.id, name: m.name, shortName: m.shortName, description: m.description, sortOrder: i })),
    articles: seed.modules.flatMap((m) =>
      m.articles.map((a, i) => ({ slug: a.slug, moduleId: m.id, title: a.title, readTime: a.readTime, html: a.html, reviewStatus: a.reviewStatus, sortOrder: i }))),
    // Ids follow the position in the file, so keep new questions at the end.
    faqs: seed.faqs.map((f, i) => ({ id: `faq-${String(i + 1).padStart(2, "0")}`, question: f.q, answer: f.a, sortOrder: i })),
    professionals: seed.directorySample.map((p, i) => ({ id: slugify(p.name), name: p.name, role: p.role, location: p.loc, note: p.note, sortOrder: i })),
  };
}
