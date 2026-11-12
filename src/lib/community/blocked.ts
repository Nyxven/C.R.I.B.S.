// A short list of strong language and slurs that are not welcome in a parents' community (English and Filipino).
// Matched after normalizing tricks (leetspeak, repeated or spaced letters). Short words match whole words only,
// so ordinary words that merely contain them are not blocked.
export const BLOCKED_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "retard", "retarded", "spastic", "mongoloid",
  "putangina", "tangina", "puta", "gago", "tarantado", "ulol", "bobo", "tanga",
] as const;

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

/** Lowercase, no accents, leetspeak undone, "f u c k" joined, repeated letters squeezed. */
export function normalizeForFilter(text: string): string {
  let t = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  t = t.replace(/[0134578@$!]/g, (c) => LEET[c] ?? c);
  t = t.replace(/[^a-z\s]/g, "");
  // "f u c k" -> "fuck". A leading "a" or "i" may be a real word ("a f u c k"), so it stays apart.
  t = t.replace(/\b(?:[a-z]\s+){2,}[a-z]\b/g, (m) => {
    const letters = m.replace(/\s+/g, "");
    return /^[ai]\s/.test(m) && letters.length >= 4 ? `${letters[0]} ${letters.slice(1)}` : letters;
  });
  return t.replace(/(.)\1+/g, "$1").replace(/\s+/g, " ").trim();
}

const squeeze = (w: string) => w.replace(/(.)\1+/g, "$1");
const SHORT = new Set(BLOCKED_WORDS.filter((w) => w.length < 6).map(squeeze));
const LONG = BLOCKED_WORDS.filter((w) => w.length >= 6).map(squeeze);

export function containsBlockedWord(text: string): boolean {
  const norm = normalizeForFilter(text);
  return norm.split(" ").some((tok) => SHORT.has(tok) || LONG.some((w) => tok.includes(w)));
}
