"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, LOCALES } from "@/lib/i18n/core";
import { getSession } from "@/server/auth/session";
import { setPushLocale } from "@/server/push/service";

/** Remembers the language in this browser for a year. Only known codes are accepted. Phone notifications switch to it too. */
export async function setLanguageAction(code: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!LOCALES.some((l) => l.value === code)) return { ok: false, error: "That language is not available." };
  (await cookies()).set(LOCALE_COOKIE, String(code), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: false });
  const session = await getSession().catch(() => null);
  if (session) await setPushLocale(session.user.id, code).catch(() => undefined); // reminders follow the chosen language
  revalidatePath("/", "layout");
  return { ok: true };
}
