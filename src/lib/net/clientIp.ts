// Finding the real client address and turning it into a private bucket key. Pure (Node's net and crypto only).
// Only headers the hosting platform sets are trusted, chosen by TRUST_PROXY. A header the platform does not
// overwrite can be forged by anyone, so with TRUST_PROXY=none every request falls into one shared strict bucket.
import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export type ProxyMode = "vercel" | "cloudflare" | "none";

const first = (v: string | null): string | null => v?.split(",")[0]?.trim() || null;

/** The client IP from the platform's headers, or null when there is none we trust. */
export function clientIp(get: (name: string) => string | null, mode: ProxyMode): string | null {
  if (mode === "none") return null;
  // cloudflare: only valid if the site can be reached through Cloudflare alone (otherwise the header can be forged).
  const names = mode === "cloudflare" ? ["cf-connecting-ip"] : ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"];
  for (const n of names) {
    const ip = first(get(n));
    if (ip && isIP(ip.replace(/%.+$/, ""))) return ip;
  }
  return null;
}

function expandV6(ip: string): number[] | null {
  let s = ip.replace(/%.+$/, "").toLowerCase();
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const p = v4[1]!.split(".").map(Number);
    if (p.some((n) => n > 255)) return null;
    s = s.slice(0, -v4[1]!.length) + ((p[0]! << 8) | p[1]!).toString(16) + ":" + ((p[2]! << 8) | p[3]!).toString(16);
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null;
  const all = [...head, ...Array<string>(fill).fill("0"), ...tail].map((h) => parseInt(h || "0", 16));
  return all.length === 8 && all.every((n) => Number.isInteger(n) && n >= 0 && n <= 0xffff) ? all : null;
}

/** IPv4 as is. IPv6 shrinks to its /64 (one household can rotate through the whole range, so count it as one). */
export function normalizeIp(ip: string): string | null {
  const clean = ip.trim().replace(/^\[|\]$/g, "");
  const kind = isIP(clean.replace(/%.+$/, ""));
  if (kind === 4) return clean;
  if (kind !== 6) return null;
  const mapped = clean.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1]!;
  const parts = expandV6(clean);
  return parts ? `${parts.slice(0, 4).map((n) => n.toString(16)).join(":")}::/64` : null;
}

/** A keyed hash of the normalized address: enough to count requests, useless as a record of who visited. */
export function ipBucketKey(ip: string | null, secret: string): string {
  const norm = ip ? normalizeIp(ip) : null;
  if (!norm) return "unknown";
  return createHmac("sha256", secret).update(`ip-bucket-v1:${norm}`).digest("hex").slice(0, 24);
}
