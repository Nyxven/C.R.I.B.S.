// Search suggestions while the person types. Pure and small enough to run in the browser on every key press.
// Parents describe problems in their own words (the research papers: tantrums, wandering, sudden silence, "where do I start"),
// often in Filipino or Taglish. TOPICS maps those words to the words our guides actually use.
import { normalize, tokenize } from "./search";

export type SuggestKind = "guide" | "faq" | "specialist" | "page" | "topic";
export type SuggestItem = { kind: SuggestKind; title: string; meta: string; href: string; keywords?: string };
export type Suggestion = SuggestItem & { id: string };

/** A topic: the word our content uses, and everyday words (English, Filipino, Taglish) that mean the same thing. */
export type Topic = { term: string; words: readonly string[] };

export const TOPICS: readonly Topic[] = [
  { term: "meltdown", words: ["meltdown", "tantrum", "tantrums", "outburst", "nagwawala", "wala", "iyak", "umiiyak", "galit", "sigaw", "nagagalit", "aggression", "hitting", "nananakit"] },
  { term: "routine", words: ["routine", "schedule", "bedtime", "sleep", "tulog", "matulog", "gabi", "morning", "umaga", "transition", "change", "pagbabago"] },
  { term: "communication", words: ["communication", "talk", "talking", "speech", "speak", "words", "silent", "silence", "nonverbal", "non-speaking", "salita", "nagsasalita", "usap", "tahimik", "pipi"] },
  { term: "visual", words: ["visual", "picture", "pictures", "cards", "pecs", "aac", "larawan", "litrato"] },
  { term: "sensory", words: ["sensory", "noise", "loud", "sound", "ingay", "maingay", "light", "ilaw", "touch", "clothes", "damit", "texture", "food", "pagkain", "crowd", "tao"] },
  { term: "reinforcement", words: ["reinforcement", "reward", "praise", "behavior", "behaviour", "discipline", "ugali", "disiplina", "puri"] },
  { term: "school", words: ["school", "teacher", "classroom", "class", "paaralan", "eskwela", "eskwelahan", "guro", "sped"] },
  { term: "homework", words: ["homework", "assignment", "study", "takdang", "aralin", "aral", "pag-aaral"] },
  { term: "education plan", words: ["iep", "plan", "individualized", "education"] },
  { term: "signs", words: ["signs", "symptoms", "early", "sintomas", "palatandaan", "toddler", "baby"] },
  { term: "autism", words: ["autism", "asd", "autistic", "diagnosis", "diagnosed", "start", "simula", "new", "bago", "what"] },
  { term: "pediatrician", words: ["pediatrician", "pedia", "doctor", "doktor", "developmental"] },
  { term: "therapist", words: ["therapist", "therapy", "ot", "occupational", "slp", "speech therapist", "psychologist", "terapist"] },
];

/** App pages that a search can open directly, with the words people may type for them. */
export const PLACES: readonly SuggestItem[] = [
  { kind: "page", title: "Find CRIBS and the if-found page", meta: "Safety", href: "/find", keywords: "wandering wander lost missing running off run away nawawala nawala tumakbo tag qr tracker safety find" },
  { kind: "page", title: "Child profile", meta: "Your child", href: "/child", keywords: "child profile calm avoid emergency contact anak" },
  { kind: "page", title: "Parent community", meta: "Other parents", href: "/community", keywords: "community parents support group magulang kapwa tips stress tired pagod" },
  { kind: "page", title: "Specialists near Taguig", meta: "Directory", href: "/directory", keywords: "directory specialist doctor therapist clinic taguig pateros near malapit" },
  { kind: "page", title: "Text size", meta: "Settings", href: "/settings/appearance", keywords: "text size bigger larger font laki letra" },
];

/** Shown when the box is focused but empty: the worries the research found parents have most. */
export const POPULAR: readonly string[] = ["Meltdowns", "Routines", "Communication", "Sensory", "School"];

const MAX = 7;

const startsWord = (hay: string, needle: string): boolean => {
  let i = hay.indexOf(needle);
  while (i !== -1) {
    if (i === 0 || !/[a-z0-9]/.test(hay[i - 1]!)) return true;
    i = hay.indexOf(needle, i + 1);
  }
  return false;
};

/** The topic a query is about, if any of its words is (or starts) one of the topic's words. Needs 3+ letters to avoid noise. */
export function topicFor(query: string): Topic | null {
  const tokens = tokenize(query).filter((t) => t.length >= 3);
  for (const t of tokens) {
    const exact = TOPICS.find((tp) => tp.words.some((w) => normalize(w) === t));
    if (exact) return exact;
  }
  for (const t of tokens) {
    const prefix = TOPICS.find((tp) => tp.words.some((w) => normalize(w).startsWith(t)));
    if (prefix) return prefix;
  }
  return null;
}

/** Every word of the query must start a word of the title, label or keywords; or the query's topic term must. */
function matches(item: SuggestItem, tokens: string[], topic: Topic | null): number {
  const title = normalize(item.title), meta = normalize(item.meta), kw = normalize(item.keywords ?? "");
  let score = 0;
  let all = true;
  for (const t of tokens) {
    const inTitle = startsWord(title, t), inMeta = startsWord(meta, t), inKw = startsWord(kw, t);
    if (!inTitle && !inMeta && !inKw) { all = false; break; }
    score += inTitle ? 10 : inKw ? 6 : 3;
  }
  if (all) return score;
  if (topic) {
    const term = normalize(topic.term);
    if (startsWord(title, term) || startsWord(kw, term) || startsWord(meta, term)) return 5;
  }
  return 0;
}

/** Ranked suggestions for what has been typed so far (at most 7). Empty query gives nothing; the UI shows POPULAR instead. */
export function suggest(index: readonly SuggestItem[], query: string, limit = MAX): Suggestion[] {
  const tokens = tokenize(query);
  if (tokens.join("").length < 2) return [];
  const topic = topicFor(query);
  const scored = [...index, ...PLACES]
    .map((item) => ({ item, score: matches(item, tokens, topic) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  const out: Suggestion[] = scored.slice(0, limit).map(({ item }, i) => ({ ...item, id: `s${i}` }));
  // When the words map to a topic the person did not type, offer a search for that topic too.
  if (topic && !tokens.includes(normalize(topic.term)) && out.length < limit) {
    out.push({ kind: "topic", title: topic.term, meta: "Related topic", href: `/search?q=${encodeURIComponent(topic.term)}`, id: `s${out.length}` });
  }
  return out;
}

/** The small list the browser searches: titles and labels only (no article bodies). */
export function buildSuggestIndex(input: {
  articles: readonly { slug: string; moduleId: string; title: string; moduleShortName: string }[];
  faqs: readonly { id: string; question: string }[];
  professionals: readonly { id: string; name: string; role: string; location: string }[];
}): SuggestItem[] {
  return [
    ...input.articles.map((a): SuggestItem => ({ kind: "guide", title: a.title, meta: a.moduleShortName, href: `/learn/${a.moduleId}/${a.slug}` })),
    ...input.faqs.map((f): SuggestItem => ({ kind: "faq", title: f.question, meta: "FAQ", href: `/faq?open=${f.id}#${f.id}` })),
    ...input.professionals.map((p): SuggestItem => ({ kind: "specialist", title: p.name, meta: p.role, href: "/directory", keywords: p.location })),
  ];
}
