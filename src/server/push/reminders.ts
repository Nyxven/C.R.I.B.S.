import { localTitle } from "@/lib/domain/content";
import { localReadTime } from "@/lib/domain/localize";
import { pickReminder, type ReminderKind } from "@/lib/domain/reminders";
import { translate, type Locale } from "@/lib/i18n/core";
import { getModules } from "@/server/content/service";
import { getChild, getProfile } from "@/server/onboarding/repo";
import { getProgress } from "@/server/progress/service";
import * as repo from "./repo";
import { sendToUser, type PushMessage } from "./service";

const PH_OFFSET_MS = 8 * 3_600_000; // reminders follow Philippine time (UTC+8)
/** Midnight today in the Philippines, as a Date. */
export function startOfDayPH(now: Date): Date {
  const local = new Date(now.getTime() + PH_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - PH_OFFSET_MS);
}

type Guide = { slug: string; moduleId: string; title: string; titleFil?: string | null; readTime: string };
function message(kind: ReminderKind, locale: Locale, guide: Guide | null, childName: string | null): PushMessage {
  const t = (k: Parameters<typeof translate>[1], v?: Record<string, string>) => translate(locale, k, v);
  if (kind === "read" && guide) return { title: t("pushmsg.read.title"), body: t("pushmsg.read.body", { title: localTitle(guide, locale), time: localReadTime(guide.readTime, locale) }), tag: "reminder" };
  if (kind === "log") return { title: t("pushmsg.log.title"), body: childName ? t("pushmsg.log.body", { name: childName }) : t("pushmsg.log.bodyNoName"), tag: "reminder" };
  return { title: t("pushmsg.findmy.title"), body: t("pushmsg.findmy.body"), tag: "findmy" };
}

export type ReminderReport = { checked: number; sent: number; failed: number };

/** The daily reminder run (Vercel Cron). One person's failure never stops the others. */
export async function runReminders(now = new Date()): Promise<ReminderReport> {
  const report: ReminderReport = { checked: 0, sent: 0, failed: 0 };
  const users = await repo.usersWithPush();
  const guides: Guide[] = (await getModules()).flatMap((m) => m.articles);
  const since = startOfDayPH(now);
  for (const userId of users) {
    report.checked++;
    try {
      const [prof, kid, progress, logsToday] = await Promise.all([getProfile(userId), getChild(userId), getProgress(userId), repo.countLogsSince(userId, since)]);
      const read = new Set(progress.filter((p) => p.read).map((p) => p.slug));
      const nextGuide = guides.find((g) => !read.has(g.slug)) ?? null;
      const pick = pickReminder({
        now, remindRead: prof?.remindRead ?? true, remindLog: prof?.remindLog ?? true, lastReminderAt: prof?.lastReminderAt ?? null,
        nextGuide, loggedToday: logsToday > 0, findMyAddedAt: prof?.findMyUrl ? prof.findMyAddedAt ?? null : null,
      });
      if (!pick) continue;
      const sent = await sendToUser(userId, (locale) => ({ ...message(pick.kind, locale, nextGuide, kid?.nickname ?? null), link: pick.link }));
      if (sent > 0) { report.sent++; await repo.setLastReminder(userId, now); }
    } catch (e) {
      report.failed++;
      console.error("[reminders] failed:", e instanceof Error ? e.name : "unknown");
    }
  }
  return report;
}
