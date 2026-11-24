// Which phone reminder (if any) a parent gets today. Pure. At most one a day, so reminders stay gentle.
import { findMyStatus } from "./findmy";

export type ReminderKind = "findmy" | "read" | "log";
export type ReminderInput = {
  now: Date;
  remindRead: boolean;
  remindLog: boolean;
  lastReminderAt: Date | null;
  nextGuide: { slug: string; moduleId: string } | null; // the next guide they have not read
  loggedToday: boolean;
  findMyAddedAt: Date | null;
};
export const MIN_GAP_HOURS = 20;

/** A safety reminder (the Find My link is about to stop working) comes first; otherwise reading and logging take turns by day. */
export function pickReminder(i: ReminderInput): { kind: ReminderKind; link: string } | null {
  if (i.lastReminderAt && i.now.getTime() - i.lastReminderAt.getTime() < MIN_GAP_HOURS * 3_600_000) return null;
  if (i.findMyAddedAt && findMyStatus(i.findMyAddedAt, i.now).state === "expiring") return { kind: "findmy", link: "/find" };
  const options: { kind: ReminderKind; link: string }[] = [];
  if (i.remindRead && i.nextGuide) options.push({ kind: "read", link: `/learn/${i.nextGuide.moduleId}/${i.nextGuide.slug}` });
  if (i.remindLog && !i.loggedToday) options.push({ kind: "log", link: "/logs" });
  if (options.length === 0) return null;
  const day = Math.floor(i.now.getTime() / 86_400_000);
  return options[day % options.length]!;
}
