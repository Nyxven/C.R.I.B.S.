import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { AbuseGuard } from "@/lib/security/guard";

// The database side of the abuse guard. One table (`rate_limit`), one atomic statement per operation.
// Keys never contain raw IPs or emails of other people's choosing beyond what the callers already hash.
const num = (v: unknown) => Number((v as { count?: number | string } | undefined)?.count ?? 0);

export const dbGuard: AbuseGuard = {
  async consume(key, amount, limit, windowSec) {
    const res = await db.execute(sql`
      insert into rate_limit (key, count, reset_at)
      values (${key}, ${amount}::int, now() + make_interval(secs => ${windowSec}::int))
      on conflict (key) do update set
        count = case when rate_limit.reset_at < now() then ${amount}::int else rate_limit.count + ${amount}::int end,
        reset_at = case when rate_limit.reset_at < now() then now() + make_interval(secs => ${windowSec}::int) else rate_limit.reset_at end
      returning count`);
    return { allowed: num(res.rows[0]) <= limit };
  },
  async used(key) {
    const res = await db.execute(sql`select count from rate_limit where key = ${key} and reset_at > now()`);
    return num(res.rows[0]);
  },
  async lock(key, ttlSec) {
    const res = await db.execute(sql`
      insert into rate_limit (key, count, reset_at) values (${key}, 1, now() + make_interval(secs => ${ttlSec}::int))
      on conflict (key) do update set count = 1, reset_at = now() + make_interval(secs => ${ttlSec}::int)
        where rate_limit.reset_at <= now()
      returning key`);
    return res.rows.length > 0;
  },
  async unlock(key) {
    await db.execute(sql`delete from rate_limit where key = ${key}`);
  },
  async flag(key, ttlSec) {
    await db.execute(sql`
      insert into rate_limit (key, count, reset_at) values (${key}, 1, now() + make_interval(secs => ${ttlSec}::int))
      on conflict (key) do update set count = 1, reset_at = now() + make_interval(secs => ${ttlSec}::int)`);
  },
  async flagged(key) {
    const res = await db.execute(sql`select 1 as hit from rate_limit where key = ${key} and reset_at > now()`);
    return res.rows.length > 0;
  },
};

/** Removes counters that expired more than an hour ago. Returns how many rows went. */
export async function deleteExpiredLimits(): Promise<number> {
  const res = await db.execute(sql`delete from rate_limit where reset_at < now() - interval '1 hour' returning key`);
  return res.rows.length;
}
