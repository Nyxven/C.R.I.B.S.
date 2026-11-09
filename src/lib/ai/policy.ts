// Who may ask how much, and how the limits are checked. Pure: numbers in, rules out.
// Order of use: IP rules (before sign-in is even looked up) -> user rules -> global rules, so a single abuser
// is stopped by their own limits before they can use up the budget everyone shares.
import type { AiLimits } from "@/config/env";
import type { Rule } from "@/lib/security/guard";

export type AiPolicy = {
  ip: { perMin: number; perHour: number };
  user: { perMin: number; perHour: number; perDay: number; newPerDay: number };
  userTokensPerDay: number;
  global: { perMin: number; perDay: number };
  globalTokensPerDay: number;
};

export const NEW_ACCOUNT_HOURS = 24;
export const DAY_SEC = 86_400;
export const COOLDOWN_KEY = "ai:cooldown";
export const lockKey = (userId: string) => `ai:lock:${userId}`;
export const tokenKey = { user: (userId: string) => `ai:tok:user:${userId}`, global: "ai:tok:global" } as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function buildPolicy(l: AiLimits): AiPolicy {
  const userPerMin = clamp(Math.ceil(l.perHour / 5), 2, 6);
  return {
    ip: { perMin: userPerMin * 2, perHour: l.perHour * 2 }, // a household can have two or three phones
    user: { perMin: userPerMin, perHour: l.perHour, perDay: l.perDay, newPerDay: Math.min(l.perDay, 15) },
    userTokensPerDay: l.userTokensPerDay,
    global: { perMin: l.globalPerMin, perDay: l.globalPerDay },
    globalTokensPerDay: l.globalTokensPerDay,
  };
}

export const isNewAccount = (ageHours: number): boolean => ageHours < NEW_ACCOUNT_HOURS;

export const ipRules = (p: AiPolicy, ipBucket: string): Rule[] => [
  { key: `ai:ip:min:${ipBucket}`, limit: p.ip.perMin, windowSec: 60, scope: "ip" },
  { key: `ai:ip:hr:${ipBucket}`, limit: p.ip.perHour, windowSec: 3600, scope: "ip" },
];

export const userRules = (p: AiPolicy, userId: string, accountAgeHours: number): Rule[] => [
  { key: `ai:user:min:${userId}`, limit: p.user.perMin, windowSec: 60, scope: "user" },
  { key: `ai:user:hr:${userId}`, limit: p.user.perHour, windowSec: 3600, scope: "user" },
  { key: `ai:user:day:${userId}`, limit: isNewAccount(accountAgeHours) ? p.user.newPerDay : p.user.perDay, windowSec: DAY_SEC, scope: "user" },
];

export const globalRules = (p: AiPolicy): Rule[] => [
  { key: "ai:global:min", limit: p.global.perMin, windowSec: 60, scope: "global" },
  { key: "ai:global:day", limit: p.global.perDay, windowSec: DAY_SEC, scope: "global" },
];

/** Rough size of a text in tokens (about 4 characters each). Used only when the provider does not report usage. */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
