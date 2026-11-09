import { getSecurityConfig } from "@/config/env";
import { clientIp, ipBucketKey } from "@/lib/net/clientIp";

/** The private bucket key for whoever sent this request. Only the headers the platform sets are trusted (TRUST_PROXY). */
export function requestIpBucket(headers: { get(name: string): string | null }): string {
  const ip = clientIp((n) => headers.get(n), getSecurityConfig().trustProxy);
  return ipBucketKey(ip, process.env.AUTH_SECRET ?? "dev-only-ip-secret");
}
