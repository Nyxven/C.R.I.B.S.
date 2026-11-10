import { buildFoundCard, DEFAULT_FIELDS, parseFields, type FoundCard, type FoundFields } from "@/lib/found/card";
import { foundUrl, generateToken, hashToken, isTokenShape } from "@/lib/found/token";
import { firstBroken, type AbuseGuard, type Rule } from "@/lib/security/guard";
import { fieldsSchema } from "@/features/found/schema";
import { getChild, getContact } from "@/server/onboarding/repo";
import * as repo from "./repo";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
export type TagStatus = { hasChild: boolean; hasContact: boolean; tag: { enabled: boolean; createdAt: Date; accessCount: number; lastAccessedAt: Date | null; fields: FoundFields } | null };

const NO_CHILD = "Please finish setting up your child's profile first.";

export async function getStatus(userId: string): Promise<TagStatus> {
  const c = await getChild(userId);
  if (!c) return { hasChild: false, hasContact: false, tag: null };
  const [contact, tag] = await Promise.all([getContact(c.id), repo.activeTag(c.id)]);
  return { hasChild: true, hasContact: !!contact, tag: tag ? { enabled: tag.enabled, createdAt: tag.createdAt, accessCount: tag.accessCount, lastAccessedAt: tag.lastAccessedAt, fields: parseFields(tag.publicFields) } : null };
}

/** Makes a brand-new link and switches every older one off. The token is returned once and never stored. */
export async function createTag(userId: string, appUrl: string, guard: AbuseGuard): Promise<Result<{ token: string; url: string }>> {
  if (!(await guard.consume(`found:create:${userId}`, 1, 5, 3600)).allowed) return { ok: false, error: "You have made several tags in the last hour. Please try again later." };
  const c = await getChild(userId);
  if (!c) return { ok: false, error: NO_CHILD };
  const keep = (await repo.activeTag(c.id))?.publicFields;
  const token = generateToken();
  await repo.revokeAll(c.id); // the old QR stops working the moment a new one exists
  await repo.insertTag(c.id, hashToken(token), keep ? parseFields(keep) : DEFAULT_FIELDS);
  return { ok: true, token, url: foundUrl(appUrl, token) };
}

export async function saveFields(userId: string, input: unknown): Promise<Result> {
  const p = fieldsSchema.safeParse(input);
  const c = await getChild(userId);
  if (!p.success || !c) return { ok: false, error: "Please try again." };
  return (await repo.updateFields(c.id, p.data)) ? { ok: true } : { ok: false, error: "Make a tag first." };
}
export async function switchTag(userId: string, enabled: unknown): Promise<Result> {
  const c = await getChild(userId);
  if (typeof enabled !== "boolean" || !c) return { ok: false, error: "Please try again." };
  return (await repo.setEnabled(c.id, enabled)) ? { ok: true } : { ok: false, error: "Make a tag first." };
}
export async function revokeTag(userId: string): Promise<Result> {
  const c = await getChild(userId);
  if (!c) return { ok: false, error: NO_CHILD };
  await repo.revokeAll(c.id);
  return { ok: true };
}

export type PublicResult = { type: "card"; card: FoundCard } | { type: "notfound" } | { type: "limited" };

// Generous on purpose: a finder with a worried child must not be locked out. Still enough to stop token guessing and scraping.
const ipRules = (bucket: string): Rule[] => [
  { key: `found:ip:min:${bucket}`, limit: 30, windowSec: 60, scope: "ip" },
  { key: `found:ip:hr:${bucket}`, limit: 200, windowSec: 3600, scope: "ip" },
];

/** The public page. Every failure looks the same (not found), so nobody can tell a revoked link from a made-up one. */
export async function lookupPublic(rawToken: unknown, ipBucket: string, guard: AbuseGuard): Promise<PublicResult> {
  if (await firstBroken(guard, ipRules(ipBucket))) return { type: "limited" };
  if (!isTokenShape(rawToken)) return { type: "notfound" };
  const hash = hashToken(rawToken);
  const row = await repo.findByHash(hash);
  if (!row || !row.enabled || row.revokedAt) return { type: "notfound" };
  if (!(await guard.consume(`found:tok:${hash.slice(0, 16)}`, 1, 120, 600)).allowed) return { type: "limited" };
  await repo.bumpAccess(row.id).catch(() => undefined); // counting must never block the page
  const contact = row.contactName && row.contactPhone ? { name: row.contactName, phone: row.contactPhone, isPublic: row.contactPublic ?? false } : null;
  return { type: "card", card: buildFoundCard({ nickname: row.nickname, communicationLevel: row.communicationLevel, calming: row.calming, avoid: row.avoid }, contact, parseFields(row.publicFields)) };
}
