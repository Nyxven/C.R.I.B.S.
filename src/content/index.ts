import raw from "../../seed/content.json";

export type Article = { slug: string; title: string; readTime: string; html: string; reviewStatus: string };
export type Module = { id: string; name: string; shortName: string; description: string; articles: Article[] };

export const modules = raw.modules as Module[];
export const faqs = raw.faqs as { q: string; a: string }[];
export const directory = raw.directorySample as { name: string; role: string; loc: string; note: string }[];
export const allArticles = modules.flatMap((m) => m.articles.map((a) => ({ ...a, moduleId: m.id, moduleName: m.name })));
