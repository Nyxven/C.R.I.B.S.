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
