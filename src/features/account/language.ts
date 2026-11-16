"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, LOCALES } from "@/lib/i18n/core";

/** Remembers the language in this browser for a year. Only known codes are accepted. No account data is touched. */
export async function setLanguageAction(code: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!LOCALES.some((l) => l.value === code)) return { ok: false, error: "That language is not available." };
  (await cookies()).set(LOCALE_COOKIE, String(code), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: false });
  revalidatePath("/", "layout");
  return { ok: true };
}
