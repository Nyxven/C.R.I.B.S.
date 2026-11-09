import { hash, verify } from "@node-rs/argon2";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getAuthEnv } from "@/config/env";

// OWASP minimum for argon2id: m=19 MiB, t=2, p=1.
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const ARGON_TAG = `m=${ARGON.memoryCost},t=${ARGON.timeCost},p=${ARGON.parallelism}`;

const hmac = (key: string, data: string) => createHmac("sha256", key).update(data).digest("base64");
const hmacHex = (key: string, data: string) => createHmac("sha256", key).update(data).digest("hex");

/** Secrets to try, newest first. Rotation = move the old value to *_PREVIOUS and set a new one. */
const secrets = () => { const e = getAuthEnv(); return [e.AUTH_SECRET, e.AUTH_SECRET_PREVIOUS].filter((s): s is string => !!s); };
const peppers = () => { const e = getAuthEnv(); return [e.PASSWORD_PEPPER, e.PASSWORD_PEPPER_PREVIOUS].filter((s): s is string => !!s); };

// ---------- rate-limit keys ----------
/** Opaque key for a rate-limit counter. Emails and address buckets never sit in the database in readable form. */
export const limiterKey = (key: string): string => hmacHex(secrets()[0], `limiter-v1:${key}`).slice(0, 32);

// ---------- passwords ----------
export async function hashPassword(password: string): Promise<string> {
  return hash(hmac(peppers()[0], password), ARGON);
}

export async function verifyPassword(stored: string, password: string): Promise<{ ok: boolean; needsRehash: boolean }> {
  const list = peppers();
  for (let i = 0; i < list.length; i++) {
    let ok = false;
    try { ok = await verify(stored, hmac(list[i], password)); } catch { ok = false; }
    if (ok) return { ok: true, needsRehash: i > 0 || !stored.includes(ARGON_TAG) };
  }
  return { ok: false, needsRehash: false };
}

let dummy: Promise<string> | undefined;
/** Burn the same CPU as a real check when the user doesn't exist (blocks timing-based user enumeration). */
export async function fakeVerify(password: string) {
  dummy ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(await dummy, password);
}

// ---------- one-time codes ----------
export const generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
const codeData = (email: string, purpose: string, code: string) => `${email}|${purpose}|${code}`;
export const hashCode = (email: string, purpose: string, code: string) => hmacHex(secrets()[0], codeData(email, purpose, code));

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function codeMatches(stored: string, email: string, purpose: string, code: string) {
  return secrets().some((s) => safeEqual(stored, hmacHex(s, codeData(email, purpose, code))));
}

// ---------- session tokens ----------
export const newSessionToken = () => randomBytes(32).toString("base64url");
/** What we store / look up. Several digests = current + previous secret. */
export const tokenDigests = (token: string) => secrets().map((s) => hmacHex(s, `session|${token}`));
