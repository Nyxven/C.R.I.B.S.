import type { AbuseGuard } from "./guard";

/** Same behavior as the database guard, in memory, with a clock you can move. For tests. */
export function memoryGuard(clock: () => number = Date.now): AbuseGuard & { entries: Map<string, { count: number; resetAt: number }> } {
  const entries = new Map<string, { count: number; resetAt: number }>();
  const live = (key: string) => { const e = entries.get(key); return e && e.resetAt > clock() ? e : undefined; };
  return {
    entries,
    async consume(key, amount, limit, windowSec) {
      const e = live(key);
      const next = e ? { count: e.count + amount, resetAt: e.resetAt } : { count: amount, resetAt: clock() + windowSec * 1000 };
      entries.set(key, next);
      return { allowed: next.count <= limit };
    },
    async used(key) { return live(key)?.count ?? 0; },
    async lock(key, ttlSec) {
      if (live(key)) return false;
      entries.set(key, { count: 1, resetAt: clock() + ttlSec * 1000 });
      return true;
    },
    async unlock(key) { entries.delete(key); },
    async flag(key, ttlSec) { entries.set(key, { count: 1, resetAt: clock() + ttlSec * 1000 }); },
    async flagged(key) { return !!live(key); },
  };
}
