import { getSecurityConfig } from "@/config/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Reads Cloudflare's answer. Anything that is not an explicit success counts as a failure. */
export const parseSiteverify = (json: unknown): boolean => typeof json === "object" && json !== null && (json as { success?: unknown }).success === true;

/**
 * Cloudflare Turnstile check (free). With no TURNSTILE_SECRET_KEY the check is switched off and everyone passes.
 * With a key set it fails closed: a missing token, a bad token, or Cloudflare being unreachable all mean "not verified".
 */
export async function verifyBot(token: string | undefined, o: { secret?: string; fetchImpl?: typeof fetch } = {}): Promise<{ ok: boolean }> {
  const secret = o.secret ?? getSecurityConfig().turnstileSecret;
  if (!secret) return { ok: true };
  if (!token || token.length > 2048) return { ok: false };
  try {
    const res = await (o.fetchImpl ?? fetch)(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok && parseSiteverify(await res.json()) };
  } catch {
    return { ok: false };
  }
}
