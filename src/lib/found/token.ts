// The secret in the QR link. Pure (Node crypto only). Only the hash is ever stored, so a leaked database gives no working links.
import { createHash, randomBytes } from "node:crypto";

/** 256 random bits as 43 URL-safe characters. Shown to the parent once, at creation. */
export const generateToken = (rand: (n: number) => Buffer = randomBytes): string => rand(32).toString("base64url");

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

/** Checked before any database lookup, so junk addresses cost nothing. */
export const isTokenShape = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{43}$/.test(t);

export const foundUrl = (appUrl: string, token: string): string => `${appUrl.replace(/\/+$/, "")}/f/${token}`;
