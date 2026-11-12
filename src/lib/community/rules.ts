// Community rules. Pure: no database, no React.
import { scrubPii } from "@/lib/ai/scrub";
import { containsBlockedWord } from "./blocked";

export const POST_MIN = 3;
export const POST_MAX = 600;
export const REPORT_REASONS = ["unkind", "personal_info", "unsafe_advice", "spam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REASON_LABELS: Record<ReportReason, string> = {
  unkind: "Unkind or hurtful", personal_info: "Shares personal details", unsafe_advice: "Unsafe or medical advice", spam: "Spam", other: "Something else",
};
export const isReason = (v: unknown): v is ReportReason => typeof v === "string" && (REPORT_REASONS as readonly string[]).includes(v);

// Street, building and area words that usually come with a number: "Blk 5 Lot 3", "123 Rizal Street", "Brgy. Ususan".
const ADDRESS = /\b(?:blk|block|lot|unit|bldg|building|room|rm)\.?\s*#?\d|\b\d+\s+[a-z]+(?:\s+[a-z]+)?\s+(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)\b|\b(?:brgy|barangay)\.?\s+[a-z]/i;

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export type PostCheck = { ok: true; text: string } | { ok: false; reason: "empty" | "too_short" | "too_long" | "contact_details" | "address" | "language"; error: string };

export function checkPostText(raw: string): PostCheck {
  const text = raw.replace(CONTROL, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text === "") return { ok: false, reason: "empty", error: "Please write something first." };
  if (text.length < POST_MIN) return { ok: false, reason: "too_short", error: "Please write a little more." };
  if (text.length > POST_MAX) return { ok: false, reason: "too_long", error: `Please keep it under ${POST_MAX} characters.` };
  if (scrubPii(text).redacted) return { ok: false, reason: "contact_details", error: "Please remove phone numbers, emails and links. For everyone's safety, keep contact details private." };
  if (ADDRESS.test(text)) return { ok: false, reason: "address", error: "Please do not share addresses or where you live." };
  if (containsBlockedWord(text)) return { ok: false, reason: "language", error: "Please keep it kind. Remove strong language and try again." };
  return { ok: true, text };
}

/** First name only, or "Anonymous parent". Fixed when the post is written. */
export function displayNameFor(name: string | null | undefined, anonymous: boolean): string {
  if (anonymous) return "Anonymous parent";
  const first = (name ?? "").trim().split(/\s+/)[0]?.replace(/[^\p{L}'’-]/gu, "").slice(0, 20);
  return first ? first : "A parent";
}

/** Moderators are listed by email in MODERATOR_EMAILS (comma separated). The account's email is already verified. */
export function isModerator(email: string | null | undefined, allowlist: string | undefined): boolean {
  if (!email || !allowlist) return false;
  const e = email.trim().toLowerCase();
  return allowlist.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).includes(e);
}

/** Reasons that put a post on hold after a single report (privacy and safety come first). */
const URGENT: readonly ReportReason[] = ["personal_info", "unsafe_advice"];

/** A post is held for review once enough different people reported it, or at once for an urgent reason. */
export function shouldHide(o: { reporters: number; reasons: readonly string[]; hideAt: number }): boolean {
  if (o.reporters >= 1 && o.reasons.some((r) => (URGENT as readonly string[]).includes(r))) return true;
  return o.reporters >= Math.max(1, o.hideAt);
}

export const CURSOR_PAGE = 20;
export const encodeCursor = (createdAt: Date, id: string): string => Buffer.from(`${createdAt.getTime()}|${id}`).toString("base64url");
export function decodeCursor(c: unknown): { createdAt: Date; id: string } | null {
  if (typeof c !== "string" || c.length > 100) return null;
  try {
    const [t, id] = Buffer.from(c, "base64url").toString().split("|");
    const ms = Number(t);
    return Number.isFinite(ms) && ms > 0 && id && /^[0-9a-f-]{36}$/i.test(id) ? { createdAt: new Date(ms), id } : null;
  } catch { return null; }
}
