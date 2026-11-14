// Remembers, per signed-in person and per browser, that the walkthrough was finished or skipped.
// Stored in localStorage on purpose: it needs no database change. Open question: moving it to the
// profile table would make it follow the account across devices (needs a migration).
const key = (userId: string) => `cribs:tour:v1:${userId}`;
export const TOUR_RESTART_EVENT = "cribs:tour-restart";

export function isTourDone(userId: string): boolean {
  try { return window.localStorage.getItem(key(userId)) === "done"; } catch { return true; } // storage blocked: do not nag
}
export function markTourDone(userId: string): void {
  try { window.localStorage.setItem(key(userId), "done"); } catch { /* storage blocked */ }
}
export function restartTour(userId: string): void {
  try { window.localStorage.removeItem(key(userId)); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(TOUR_RESTART_EVENT));
}
