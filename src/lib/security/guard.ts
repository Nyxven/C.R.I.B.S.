// The small set of abuse-control operations the rest of the code needs. The real one lives in the database
// (src/server/security/repo.ts); tests use the in-memory one. Both must behave the same.
export type AbuseGuard = {
  /** Adds `amount` to a counter in a fixed window and says whether it is still within `limit`. */
  consume(key: string, amount: number, limit: number, windowSec: number): Promise<{ allowed: boolean }>;
  /** Current count in the live window (0 when none). */
  used(key: string): Promise<number>;
  /** Takes a lock for `ttlSec`. False when someone else holds it. Expires on its own if never released. */
  lock(key: string, ttlSec: number): Promise<boolean>;
  unlock(key: string): Promise<void>;
  /** A flag that switches itself off after `ttlSec` (used as a cooldown). */
  flag(key: string, ttlSec: number): Promise<void>;
  flagged(key: string): Promise<boolean>;
};

export type Scope = "ip" | "user" | "global";
export type Rule = { key: string; limit: number; windowSec: number; scope: Scope };

/** Checks rules in order and stops at the first one that is over its limit. */
export async function firstBroken(guard: AbuseGuard, rules: readonly Rule[]): Promise<Rule | null> {
  for (const r of rules) {
    if (!(await guard.consume(r.key, 1, r.limit, r.windowSec)).allowed) return r;
  }
  return null;
}
