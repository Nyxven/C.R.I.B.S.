import { createHash, timingSafeEqual } from "node:crypto";

/** True only when a secret is configured and the request carries exactly `Bearer <secret>`. Compared in constant time. */
export function isAuthorizedCron(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) return false;
  const a = createHash("sha256").update(authorization).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}
