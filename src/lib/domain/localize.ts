// Filipino for the fixed English bits that come from content and logic (module names, reason lines, read time, progress).
// Pure. Anything without a translation stays in English, so nothing breaks when content is added.

type ModuleText = { name: string; shortName: string; description: string };
const MODULE_FIL: Record<string, ModuleText> = {
  info: { name: "Impormasyon Tungkol sa Autism", shortName: "Tungkol sa Autism", description: "Ang mga dapat malaman: ano ang ASD, bakit iba-iba ito sa bawat bata, at ano ang maagang senyales." },
  comm: { name: "Tulong sa Pakikipag-usap at Sensory", shortName: "Pakikipag-usap at Sensory", description: "Pag-intindi sa salita at senyas ng anak mo, at sa reaksyon niya sa tunog, ilaw at hawak araw-araw." },
  behave: { name: "Gabay sa Ugali at Pagpapalaki", shortName: "Ugali at Pagpapalaki", description: "Mga praktikal na paraan para sa routine, paglipat ng gawain, at kalmadong pagharap sa malalaking emosyon." },
  learn: { name: "Tulong sa Pag-aaral at School", shortName: "Pag-aaral at School", description: "Pakikipagtulungan sa school, pag-intindi sa IEP, at pagbawas ng stress sa homework." },
};

const REASON_FIL: Record<string, string> = {
  "Because meltdowns are hard right now": "Dahil mahirap ang meltdowns ngayon",
  "To make transitions easier": "Para gumaan ang paglipat ng gawain",
  "Routines can help with bedtime": "Nakakatulong ang routine sa pagtulog",
  "Tastes and textures can be sensory": "Puwedeng sensory ang lasa at texture ng pagkain",
  "To support communication": "Para sa pakikipag-usap",
  "For school adjustment": "Para sa pag-adjust sa school",
  "Matches your sensory answers": "Tugma sa sagot mo tungkol sa sensory",
  "Helpful when words are few": "Nakakatulong kapag kaunti pa ang salita",
  "A good place to start": "Magandang simula",
};

const fil = (locale: string) => locale === "fil";

/** A module's name, short name and description in the chosen language. */
export function localModule<T extends { id: string; name: string; shortName: string; description?: string }>(m: T, locale: string): T {
  const f = fil(locale) ? MODULE_FIL[m.id] : undefined;
  return f ? { ...m, name: f.name, shortName: f.shortName, ...(m.description !== undefined ? { description: f.description } : {}) } : m;
}

/** Short module name by id (for places that only have the id and the English short name). */
export const localModuleShort = (id: string, english: string, locale: string): string => (fil(locale) && MODULE_FIL[id] ? MODULE_FIL[id].shortName : english);

/** "4 min read" -> "4 minutong basa" in Filipino. */
export const localReadTime = (readTime: string, locale: string): string => {
  if (!fil(locale)) return readTime;
  const n = /^(\d+)\s*min/i.exec(readTime)?.[1];
  return n ? `${n} minutong basa` : readTime;
};

/** The reason line under a recommended guide. */
export const localReason = (reason: string, locale: string): string => (fil(locale) ? REASON_FIL[reason] ?? reason : reason);

/** "2 of 6 read" / "2 sa 6 nabasa". */
export function localProgress(p: { read: number; total: number }, locale: string): string {
  if (p.total === 0) return fil(locale) ? "Wala pang gabay" : "No guides yet";
  return fil(locale) ? `${p.read} sa ${p.total} nabasa` : `${p.read} of ${p.total} read`;
}

export const REASONS_WITH_FILIPINO = Object.keys(REASON_FIL);
export const MODULES_WITH_FILIPINO = Object.keys(MODULE_FIL);
