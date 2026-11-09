// What went wrong at the model provider, in terms the chat service can act on. Pure.
export type ProviderErrorKind = "rate_limited" | "quota" | "auth" | "unavailable" | "other";

export class ProviderError extends Error {
  constructor(readonly kind: ProviderErrorKind, message: string, readonly retryAfterSec?: number) {
    super(message);
    this.name = "ProviderError";
  }
}

export function classifyStatus(status: number): ProviderErrorKind {
  if (status === 429) return "rate_limited";
  if (status === 402) return "quota";
  if (status === 401 || status === 403) return "auth";
  if (status === 408 || status >= 500) return "unavailable";
  return "other";
}

/** Seconds from a Retry-After header (numbers only, at most an hour). */
export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.ceil(n), 3600) : undefined;
}

/** How long to stop calling the provider after an error. Keeps a quota problem from turning into hundreds of failed calls. */
export function cooldownSeconds(e: ProviderError): number {
  switch (e.kind) {
    case "rate_limited": return Math.min(Math.max(e.retryAfterSec ?? 60, 30), 300);
    case "quota": return 900;
    case "auth": return 600;
    case "unavailable": return 30;
    default: return 0;
  }
}
