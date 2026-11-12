// Notification rules and wording. Pure. Bodies are plain text (never HTML) and never contain someone else's post text.
export const NOTIFICATION_TYPES = ["reply", "helpful", "moderation", "account", "article"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Safety and account notices are always delivered, even if the person turned notifications off. */
export const isImportant = (t: NotificationType): boolean => t === "account" || t === "moderation";
export const shouldNotify = (t: NotificationType, notifOn: boolean): boolean => notifOn || isImportant(t);

export const HELPFUL_MILESTONES = [1, 5, 10, 25, 50, 100] as const;
export const isHelpfulMilestone = (count: number): boolean => (HELPFUL_MILESTONES as readonly number[]).includes(count);

export const texts = {
  reply: (name: string) => `${name} replied to your post.`,
  helpful: (count: number) => (count === 1 ? "Someone found your post helpful." : `${count} parents found your post helpful.`),
  held: "One of your posts was held for review. A moderator will take a look.",
  removed: "A moderator removed one of your posts because it did not follow the community guidelines.",
  restored: "A moderator reviewed your post and put it back.",
  passwordChanged: "Your password was changed and your other devices were signed out. If this was not you, reset your password now.",
} as const;

/** "just now", "5m ago", "3h ago", "Yesterday", "4d ago", then a date. */
export function timeAgo(then: Date, now: Date): string {
  const s = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return then.toISOString().slice(0, 10);
}

/** Only same-site paths are allowed as a notification link. */
export const safeLink = (l: unknown): string | null => (typeof l === "string" && /^\/[A-Za-z0-9/_#?=&.-]{0,200}$/.test(l) && !l.startsWith("//") ? l : null);
