// Apple Find My "Share Item Location" links. Pure. CRIBS never reads the location itself: it only keeps the
// link the parent made in Find My and opens it on Apple's own page.
export const FIND_MY_DAYS = 7; // Apple ends a shared item link after about 7 days
const DAY = 86_400_000;
const ALLOWED = ["apple.com", "icloud.com"];

/** A clean https link on Apple's own sites, or null. Rejects other sites, logins in the URL and odd lengths. */
export function parseFindMyUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (text.length < 12 || text.length > 600) return null;
  let u: URL;
  try { u = new URL(text); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  const host = u.hostname.toLowerCase();
  if (!ALLOWED.some((d) => host === d || host.endsWith(`.${d}`))) return null;
  return u.toString();
}

export type FindMyState = "active" | "expiring" | "expired";
/** "expiring" means less than a day left, so the parent can make a new link in time. */
export function findMyStatus(addedAt: Date, now: Date): { state: FindMyState; expiresAt: Date; daysLeft: number } {
  const expiresAt = new Date(addedAt.getTime() + FIND_MY_DAYS * DAY);
  const left = expiresAt.getTime() - now.getTime();
  const state: FindMyState = left <= 0 ? "expired" : left < DAY ? "expiring" : "active";
  return { state, expiresAt, daysLeft: Math.max(0, Math.ceil(left / DAY)) };
}
