import { cookies } from "next/headers";
import { LOCALE_COOKIE, makeT, normalizeLocale, type Locale, type T } from "./core";

/** The language chosen on this browser (cookie), English when none. */
export async function getLocale(): Promise<Locale> {
  return normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
export async function getT(): Promise<T> {
  return makeT(await getLocale());
}
