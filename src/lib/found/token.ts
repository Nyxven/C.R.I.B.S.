// The secret in the QR link. Pure (Node crypto only). Only the hash is ever stored, so a leaked database gives no working links.
import { createHash, randomBytes } from "node:crypto";

/** 256 random bits as 43 URL-safe characters. Shown to the parent once, at creation. */
export const generateToken = (rand: (n: number) => Buffer = randomBytes): string => rand(32).toString("base64url");

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

/** Checked before any database lookup, so junk addresses cost nothing. */
export const isTokenShape = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{43}$/.test(t);

export const foundUrl = (appUrl: string, token: string): string => `${appUrl.replace(/\/+$/, "")}/f/${token}`;

/** The site address printed into the QR. Prefer the configured one; otherwise use the host that served the request (https), never a request-supplied scheme. */
export function pickAppUrl(configured: string | undefined, host: string | null): string | null {
  const ok = (u: string) => /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(u);
  const c = configured?.trim().replace(/\/+$/, "");
  if (c && ok(c)) return c;
  const h = host?.trim();
  if (h && /^[a-z0-9.-]+(:\d+)?$/i.test(h)) return /^(localhost|127\.0\.0\.1)/i.test(h) ? `http://${h}` : `https://${h}`;
  return null;
}
