"use server";
import { revalidatePath } from "next/cache";
import { translate } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import { getSession } from "@/server/auth/session";
import { removeFindMy, saveFindMy } from "@/server/findmy/service";
import * as push from "@/server/push/service";
import { dbGuard } from "@/server/security/repo";

// Thin boundary for phone notifications and the Find My link. The person always comes from the session.
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function run<T>(fn: (userId: string) => Promise<R<T>>): Promise<R<T>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Please sign in again." };
  try {
    if (!(await dbGuard.consume(`push:act:${session.user.id}`, 1, 30, 60)).allowed) return { ok: false, error: "Please slow down and try again in a minute." };
    return await fn(session.user.id);
  } catch (e) {
    console.error("[push] unexpected error:", e instanceof Error ? e.name : "unknown");
    return { ok: false, error: translate(await getLocale(), "push.failed") };
  }
}

export const subscribePushAction = async (sub: unknown) => run(async (id) => push.subscribe(id, sub, await getLocale()));
export const unsubscribePushAction = async (endpoint: unknown) => run(async (id) => { await push.unsubscribe(id, endpoint); return { ok: true }; });
export const pushStatusAction = async (endpoint: unknown) => run(async (id) => ({ ok: true, subscribed: await push.isSubscribed(id, endpoint) }));
export const testPushAction = async () => run(async (id) => {
  const sent = await push.sendToUser(id, (l) => ({ title: translate(l, "pushmsg.test.title"), body: translate(l, "pushmsg.test.body"), link: "/settings/notifications", tag: "test" }));
  return sent > 0 ? { ok: true } : { ok: false, error: translate(await getLocale(), "push.failed") };
});

export const saveFindMyAction = async (url: unknown) => run(async (id) => {
  const r = await saveFindMy(id, url);
  if (!r.ok) return { ok: false, error: translate(await getLocale(), "findmy.bad") };
  revalidatePath("/find");
  return { ok: true };
});
export const removeFindMyAction = async () => run(async (id) => { await removeFindMy(id); revalidatePath("/find"); return { ok: true }; });
