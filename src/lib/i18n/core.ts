// Pure translation rules. No React, no cookies: screens pass in what they know.
// English is the source of truth. A language file may leave keys out; those fall back to English.
import { en, type Key } from "./en";
import { fil } from "./fil";

export const LOCALES = [
  { value: "en", label: "English", native: "English" },
  { value: "fil", label: "Filipino (Tagalog)", native: "Filipino (Tagalog)" },
] as const;
export type Locale = (typeof LOCALES)[number]["value"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "cribs_lang";

const DICTS: Record<Locale, Partial<Record<Key, string>>> = { en, fil };

/** Anything odd (missing, wrong type, unknown language) becomes English. */
export function normalizeLocale(raw: unknown): Locale {
  return LOCALES.some((l) => l.value === raw) ? (raw as Locale) : DEFAULT_LOCALE;
}

export type Vars = Record<string, string | number>;

/** Looks a key up in the language, then in English. `{name}` placeholders are filled from `vars`. */
export function translate(locale: Locale, key: Key, vars?: Vars): string {
  const text = DICTS[locale][key] ?? en[key];
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}

export type T = (key: Key, vars?: Vars) => string;
export const makeT = (locale: Locale): T => (key, vars) => translate(locale, key, vars);

/** Keys a language has not translated yet (for the test and for the handoff). */
export function missingKeys(locale: Locale): Key[] {
  return (Object.keys(en) as Key[]).filter((k) => DICTS[locale][k] === undefined);
}
