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

// ---------- AI guide (optional: without a key the chat shows "not available" and search still works) ----------
const aiEnv = z.object({
  ANTHROPIC_API_KEY: z.preprocess(blank, z.string().min(20).optional()),
  AI_MODEL: z.preprocess(blank, z.string().min(1).default("claude-haiku-5-5")),
  AI_RATE_LIMIT_PER_HOUR: z.preprocess(blank, z.coerce.number().int().min(1).max(1000).default(30)),
});
export type AiConfig = { apiKey: string | undefined; model: string; ratePerHour: number };

/** Never throws: a bad value falls back to the safe default and the key is simply treated as missing. */
export function getAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const parsed = aiEnv.safeParse(env);
  if (parsed.success) return { apiKey: parsed.data.ANTHROPIC_API_KEY, model: parsed.data.AI_MODEL, ratePerHour: parsed.data.AI_RATE_LIMIT_PER_HOUR };
  return { apiKey: undefined, model: "claude-haiku-5-5", ratePerHour: 30 };
}
