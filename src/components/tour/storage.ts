// Remembers, per signed-in person and per browser, which walkthrough steps were seen or skipped.
// Stored in localStorage on purpose: it needs no database change. Open question: moving it to the
// profile table would make it follow the account across devices (needs a migration).
// v1 held a single "done" flag. It still counts: someone who finished the old tour is not shown it again.
const keyV1 = (userId: string) => `cribs:tour:v1:${userId}`;
const keyV2 = (userId: string) => `cribs:tour:v2:${userId}`;
export const TOUR_RESTART_EVENT = "cribs:tour-restart";

/** Ids of steps already seen. `null` means storage is blocked or the old tour was finished: do not show anything. */
export function readSeen(userId: string): string[] | null {
  try {
    if (window.localStorage.getItem(keyV1(userId)) === "done") return null;
    const raw = window.localStorage.getItem(keyV2(userId));
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch { return null; } // storage blocked: do not nag
}
export function writeSeen(userId: string, seen: readonly string[]): void {
  try { window.localStorage.setItem(keyV2(userId), JSON.stringify(seen)); } catch { /* storage blocked */ }
}
export function restartTour(userId: string): void {
  try { window.localStorage.removeItem(keyV1(userId)); window.localStorage.removeItem(keyV2(userId)); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(TOUR_RESTART_EVENT));
}
