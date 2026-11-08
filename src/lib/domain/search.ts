// Search over guides, FAQs and listings. Pure: give it documents and a query, get ranked hits.
import { stripHtml, type ArticleFull, type FaqItem, type Professional } from "./content";

export type SearchKind = "guide" | "faq" | "specialist";
export type SearchDoc = { kind: SearchKind; id: string; title: string; meta: string; text: string; href: string };
export type SearchHit = SearchDoc & { snippet: string; score: number };

export const MIN_QUERY = 2;
export const MAX_QUERY = 80;
const MAX_TOKENS = 6;

/** Lowercase and drop accents, so "Maria" finds "María". */
export const normalize = (s: string): string => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Words of the query: letters and digits only, no repeats, at most 6. */
export function tokenize(query: string): string[] {
  const words = normalize(query.slice(0, MAX_QUERY)).split(/[^a-z0-9]+/).filter((w) => w.length > 0);
  return [...new Set(words)].slice(0, MAX_TOKENS);
}

/** True when the query is long enough to search (after trimming). */
export const isSearchable = (query: string): boolean => tokenize(query).join("").length >= MIN_QUERY;

const startsWord = (haystack: string, token: string): boolean => {
  let i = haystack.indexOf(token);
  while (i !== -1) {
    if (i === 0 || !/[a-z0-9]/.test(haystack[i - 1]!)) return true;
    i = haystack.indexOf(token, i + 1);
  }
  return false;
};

function snippetOf(text: string, tokens: string[]): string {
  const flat = normalize(text);
  let at = -1;
  for (const t of tokens) {
    const i = flat.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return text.slice(0, 140).trim() + (text.length > 140 ? "…" : "");
  let start = Math.max(0, at - 50);
  let end = Math.min(text.length, at + 100);
  if (start > 0) { const sp = text.indexOf(" ", start); if (sp !== -1 && sp < at) start = sp + 1; }
  if (end < text.length) { const sp = text.lastIndexOf(" ", end); if (sp > at) end = sp; }
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

/** Every word must match (word start). Title matches count most, then the label, then the body. */
export function search(docs: readonly SearchDoc[], query: string, limit = 20): SearchHit[] {
  const tokens = tokenize(query);
  if (!isSearchable(query)) return [];
  const hits: SearchHit[] = [];
  for (const d of docs) {
    const title = normalize(d.title), meta = normalize(d.meta), text = normalize(d.text);
    let score = 0;
    let all = true;
    for (const t of tokens) {
      const inTitle = startsWord(title, t), inMeta = startsWord(meta, t), inText = startsWord(text, t);
      if (!inTitle && !inMeta && !inText) { all = false; break; }
      score += (inTitle ? 10 : 0) + (inMeta ? 4 : 0) + (inText ? 2 : 0);
    }
    if (!all) continue;
    if (title === tokens.join(" ")) score += 20;
    hits.push({ ...d, snippet: snippetOf(d.text, tokens), score });
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

export function buildSearchDocs(input: { articles: ArticleFull[]; faqs: FaqItem[]; professionals: Professional[] }): SearchDoc[] {
  return [
    ...input.articles.map((a): SearchDoc => ({ kind: "guide", id: a.slug, title: a.title, meta: a.moduleName, text: stripHtml(a.html), href: `/learn/${a.moduleId}/${a.slug}` })),
    ...input.faqs.map((f): SearchDoc => ({ kind: "faq", id: f.id, title: f.question, meta: "FAQ", text: f.answer, href: "/faq" })),
    ...input.professionals.map((p): SearchDoc => ({ kind: "specialist", id: p.id, title: p.name, meta: p.role, text: `${p.role}. ${p.location}. ${p.note}`, href: "/directory" })),
  ];
}
