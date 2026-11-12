import { safeLink, shouldNotify, type NotificationType } from "@/lib/notifications/rules";
import { isUuid } from "@/lib/chat/history";
import { getProfile } from "@/server/onboarding/repo";
import * as repo from "./repo";

export type { NotificationRow } from "./repo";
export const KEEP_DAYS = 60;

/** Creates a notice for someone, unless they turned notifications off (account and moderation notices always go through). Never throws. */
export async function notify(userId: string, type: NotificationType, body: string, link?: string): Promise<void> {
  try {
    const prof = await getProfile(userId);
    if (!shouldNotify(type, prof?.notifOn ?? true)) return;
    await repo.insert(userId, { type, body: body.slice(0, 300), link: safeLink(link) });
  } catch (e) {
    console.error("[notify] failed:", e instanceof Error ? e.name : "unknown"); // a failed notice must never break what caused it
  }
}

export const listMine = (userId: string) => repo.list(userId, 50);
export const countUnread = (userId: string) => repo.unreadCount(userId);
export async function markOne(userId: string, id: unknown): Promise<{ ok: boolean }> {
  return { ok: isUuid(id) && (await repo.markRead(userId, id)) };
}
export async function markAll(userId: string): Promise<{ ok: true; marked: number }> {
  return { ok: true, marked: await repo.markAllRead(userId) };
}
