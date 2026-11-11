"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { pickAppUrl } from "@/lib/found/token";
import { getSession } from "@/server/auth/session";
import * as found from "@/server/found/service";
import { dbGuard } from "@/server/security/repo";

// Thin boundary for the Find CRIBS screen. The person always comes from the session; every call is rate-limited.
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function run<T>(fn: (userId: string) => Promise<R<T>>): Promise<R<T>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Please sign in again." };
  try {
    if (!(await dbGuard.consume(`found:act:${session.user.id}`, 1, 30, 60)).allowed) return { ok: false, error: "Please slow down and try again in a minute." };
    return await fn(session.user.id);
  } catch (e) {
    console.error("[found] unexpected error:", e instanceof Error ? e.name : "unknown");
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Makes a new tag. The link and its QR are returned ONCE: only a hash is kept, so they can never be shown again. */
export const createTagAction = async () => run<{ url: string; qr: string }>(async (userId) => {
  const appUrl = pickAppUrl(process.env.NEXT_PUBLIC_APP_URL, (await headers()).get("host"));
  if (!appUrl) return { ok: false, error: "The site address is not set up. Please tell the team." };
  const r = await found.createTag(userId, appUrl, dbGuard);
  if (!r.ok) return r;
  const qr = await QRCode.toString(r.url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  revalidatePath("/find");
  return { ok: true, url: r.url, qr };
});
export const saveFieldsAction = async (fields: unknown) => run(async (id) => { const r = await found.saveFields(id, fields); revalidatePath("/find"); return r; });
export const switchTagAction = async (enabled: boolean) => run(async (id) => { const r = await found.switchTag(id, enabled); revalidatePath("/find"); return r; });
export const revokeTagAction = async () => run(async (id) => { const r = await found.revokeTag(id); revalidatePath("/find"); return r; });
