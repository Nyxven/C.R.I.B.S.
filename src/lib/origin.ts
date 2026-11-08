/** True when the request came from our own pages: the Origin header's host equals the Host header. A missing Origin is refused. */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
