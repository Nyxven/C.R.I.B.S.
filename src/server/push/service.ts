import webpush from "web-push";
import { z } from "zod";
import { getPushConfig } from "@/config/env";
import { normalizeLocale, type Locale } from "@/lib/i18n/core";
import { safeLink } from "@/lib/notifications/rules";
import * as repo from "./repo";

// Phone notifications through the browser's own push service (Web Push). Each message is encrypted for its device.
// CRIBS sends only short plain text and a same-site link: never post text or anything about the child's health.
export const MAX_DEVICES = 10;
export type PushMessage = { title: string; body: string; link?: string; tag?: string };
type Result = { ok: true } | { ok: false; error: string };

export const pushPublicKey = (): string | null => getPushConfig()?.publicKey ?? null;

const b64 = (min: number, max: number) => z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/).min(min).max(max);
const subscriptionInput = z.object({
  endpoint: z.string().url().max(1000).refine((u) => u.startsWith("https://"), "https only"),
  keys: z.object({ p256dh: b64(80, 100), auth: b64(16, 30) }),
});

export async function subscribe(userId: string, input: unknown, locale: unknown): Promise<Result> {
  if (!getPushConfig()) return { ok: false, error: "Phone notifications are not set up yet." };
  const parsed = subscriptionInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "This browser sent something we could not use. Please try again." };
  const { endpoint, keys } = parsed.data;
  await repo.upsert(userId, { endpoint, p256dh: keys.p256dh, auth: keys.auth, locale: normalizeLocale(locale) });
  const rows = await repo.listForUser(userId);
  if (rows.length > MAX_DEVICES) await repo.removeIds(rows.slice(0, rows.length - MAX_DEVICES).map((r) => r.id)); // oldest go first
  return { ok: true };
}

export async function unsubscribe(userId: string, endpoint: unknown): Promise<{ ok: boolean }> {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return { ok: false };
  return { ok: await repo.removeEndpoint(userId, endpoint) };
}

export const isSubscribed = (userId: string, endpoint: unknown): Promise<boolean> =>
  typeof endpoint === "string" && endpoint.length <= 1000 ? repo.hasEndpoint(userId, endpoint) : Promise.resolve(false);

export const setPushLocale = (userId: string, locale: unknown) => repo.setLocale(userId, normalizeLocale(locale));

/** Sends to every device of this person, in each device's language. Never throws; returns how many devices got it. */
export async function sendToUser(userId: string, message: PushMessage | ((locale: Locale) => PushMessage)): Promise<number> {
  const cfg = getPushConfig();
  if (!cfg) return 0;
  try {
    const rows = await repo.listForUser(userId);
    const gone: string[] = [];
    let sent = 0;
    await Promise.all(rows.map(async (r) => {
      const m = typeof message === "function" ? message(normalizeLocale(r.locale)) : message;
      const payload = JSON.stringify({ title: m.title.slice(0, 80), body: m.body.slice(0, 240), link: safeLink(m.link) ?? "/home", tag: m.tag });
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, payload,
          { TTL: 60 * 60 * 12, urgency: "normal", vapidDetails: { subject: cfg.subject, publicKey: cfg.publicKey, privateKey: cfg.privateKey } });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(r.id); // the device unsubscribed or the app was removed
        else console.error("[push] send failed:", code ?? (e instanceof Error ? e.name : "unknown"));
      }
    }));
    await repo.removeIds(gone);
    return sent;
  } catch (e) {
    console.error("[push] failed:", e instanceof Error ? e.name : "unknown");
    return 0;
  }
}
