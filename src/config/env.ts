import { z } from "zod";

// Lazy + memoized: nothing here runs at build time, only when auth is actually used.
const blank = (v: unknown) => (v === "" ? undefined : v);
const secret = z.string().min(32, "must be at least 32 characters");
const authEnv = z.object({
  AUTH_SECRET: secret,
  AUTH_SECRET_PREVIOUS: z.preprocess(blank, secret.optional()),
  PASSWORD_PEPPER: secret,
  PASSWORD_PEPPER_PREVIOUS: z.preprocess(blank, secret.optional()),
});
export type AuthEnv = z.infer<typeof authEnv>;

let cached: AuthEnv | undefined;
export function getAuthEnv(): AuthEnv {
  if (cached) return cached;
  const parsed = authEnv.safeParse(process.env);
  if (!parsed.success) {
    // Names only, never values.
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid auth env: ${names}`);
  }
  return (cached = parsed.data);
}
export const resetAuthEnvCache = () => { cached = undefined; };

/** Reads each variable on its own: one bad value falls back to its default and never breaks the others. */
function lenient<S extends Record<string, z.ZodType>>(shape: S, env: Record<string, string | undefined>): { [K in keyof S]: z.infer<S[K]> } {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(shape)) {
    const schema = shape[key]!;
    const r = schema.safeParse(env[key]);
    out[key] = r.success ? r.data : schema.safeParse(undefined).data;
  }
  return out as { [K in keyof S]: z.infer<S[K]> };
}

// ---------- Security (proxy trust, email cap, bot check, cron) ----------
const securityShape = {
  TRUST_PROXY: z.preprocess(blank, z.enum(["vercel", "cloudflare", "none"]).default("vercel")),
  MAIL_DAILY_CAP: z.preprocess(blank, z.coerce.number().int().min(1).max(10000).default(250)),
  TURNSTILE_SECRET_KEY: z.preprocess(blank, z.string().min(8).optional()),
  CRON_SECRET: z.preprocess(blank, z.string().min(16).optional()),
};
export type SecurityConfig = { trustProxy: "vercel" | "cloudflare" | "none"; mailDailyCap: number; turnstileSecret: string | undefined; cronSecret: string | undefined };

/** Never throws: bad values fall back to the safe default (vercel headers, 250 emails a day, no bot check). */
export function getSecurityConfig(env: Record<string, string | undefined> = process.env): SecurityConfig {
  const d = lenient(securityShape, env);
  return { trustProxy: d.TRUST_PROXY, mailDailyCap: d.MAIL_DAILY_CAP, turnstileSecret: d.TURNSTILE_SECRET_KEY, cronSecret: d.CRON_SECRET };
}

// ---------- AI guide (optional: without a key the chat shows "not available" and search still works) ----------
// Defaults are deliberately small so a free-tier model is never pushed past its quota. Raise them in Vercel when you upgrade.
const int = (min: number, max: number, def: number) => z.preprocess(blank, z.coerce.number().int().min(min).max(max).default(def));
const aiShape = {
  AI_PROVIDER: z.preprocess(blank, z.enum(["openai-compatible", "anthropic"]).default("openai-compatible")),
  AI_API_KEY: z.preprocess(blank, z.string().min(8).optional()),
  AI_BASE_URL: z.preprocess(blank, z.string().url().optional()),
  ANTHROPIC_API_KEY: z.preprocess(blank, z.string().min(20).optional()),
  AI_MODEL: z.preprocess(blank, z.string().min(1).max(100).optional()),
  AI_MAX_OUTPUT_TOKENS: int(50, 2000, 450),
  AI_RATE_LIMIT_PER_HOUR: int(1, 1000, 20), // per person
  AI_USER_PER_DAY: int(1, 5000, 60),
  AI_USER_TOKENS_PER_DAY: int(1000, 5_000_000, 40_000),
  AI_GLOBAL_PER_MIN: int(1, 10_000, 10), // whole app: match your provider's requests-per-minute
  AI_GLOBAL_PER_DAY: int(1, 1_000_000, 400), // whole app: match your provider's requests-per-day
  AI_GLOBAL_TOKENS_PER_DAY: int(1000, 100_000_000, 400_000),
};
export type AiLimits = { perHour: number; perDay: number; userTokensPerDay: number; globalPerMin: number; globalPerDay: number; globalTokensPerDay: number };
export type AiConfig = {
  provider: "openai-compatible" | "anthropic";
  apiKey: string | undefined;
  baseUrl: string | undefined;
  model: string | undefined;
  maxOutputTokens: number;
  limits: AiLimits;
};

const https = (u: string | undefined) => (u && (u.startsWith("https://") || u.startsWith("http://localhost") || u.startsWith("http://127.0.0.1")) ? u.replace(/\/+$/, "") : undefined);

/** Never throws: a bad value falls back to the safe default, and a missing or bad key means "not configured". */
export function getAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const d = lenient(aiShape, env);
  const anthropic = d.AI_PROVIDER === "anthropic";
  return {
    provider: d.AI_PROVIDER,
    apiKey: anthropic ? d.ANTHROPIC_API_KEY : d.AI_API_KEY,
    baseUrl: anthropic ? undefined : https(d.AI_BASE_URL),
    model: d.AI_MODEL ?? (anthropic ? "claude-haiku-5-5" : undefined),
    maxOutputTokens: d.AI_MAX_OUTPUT_TOKENS,
    limits: { perHour: d.AI_RATE_LIMIT_PER_HOUR, perDay: d.AI_USER_PER_DAY, userTokensPerDay: d.AI_USER_TOKENS_PER_DAY, globalPerMin: d.AI_GLOBAL_PER_MIN, globalPerDay: d.AI_GLOBAL_PER_DAY, globalTokensPerDay: d.AI_GLOBAL_TOKENS_PER_DAY },
  };
}

/** True when the chosen provider has everything it needs. */
export const aiReady = (c: AiConfig): boolean => !!c.apiKey && !!c.model && (c.provider === "anthropic" || !!c.baseUrl);
