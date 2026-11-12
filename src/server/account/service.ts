import { buildExport, exportFileName } from "@/lib/account/export";
import { passwordChangedEmail, sendMail } from "@/lib/mail";
import type { AbuseGuard } from "@/lib/security/guard";
import { changePasswordInput, deleteAccountInput, settingsInput } from "@/features/account/schema";
import * as auth from "@/server/auth/repo";
import { hashPassword, verifyPassword } from "@/server/auth/crypto";
import * as chat from "@/server/chat/repo";
import * as community from "@/server/community/repo";
import * as found from "@/server/found/repo";
import { texts } from "@/lib/notifications/rules";
import { notify } from "@/server/notifications/service";
import * as onboarding from "@/server/onboarding/repo";
import * as progress from "@/server/progress/repo";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const TRY_LATER = "Too many tries. Please wait a while and try again.";
const WRONG_PASSWORD = "That password is not right.";
const GENERIC = "Please check what you entered and try again.";

/** Changes the password after checking the current one, signs out every other device, and emails a notice. */
export async function changePassword(userId: string, sessionId: string, input: unknown, guard: AbuseGuard): Promise<Result> {
  const p = changePasswordInput.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? GENERIC };
  if (!(await guard.consume(`acct:pw:${userId}`, 1, 5, 3600)).allowed) return { ok: false, error: TRY_LATER };
  const u = await auth.findUserById(userId);
  if (!u) return { ok: false, error: GENERIC };
  if (!(await verifyPassword(u.passwordHash, p.data.current)).ok) return { ok: false, error: WRONG_PASSWORD };
  if (p.data.next === p.data.current) return { ok: false, error: "Please choose a different password." };
  await auth.setPasswordHash(userId, await hashPassword(p.data.next));
  await auth.deleteOtherSessions(userId, sessionId);
  await sendMail({ to: u.email, ...passwordChangedEmail() }).catch(() => console.error("[account] password notice email failed"));
  await notify(userId, "account", texts.passwordChanged, "/settings"); // always delivered, even with notifications off
  return { ok: true };
}

export async function signOutOtherDevices(userId: string, sessionId: string, guard: AbuseGuard): Promise<Result<{ signedOut: number }>> {
  if (!(await guard.consume(`acct:signout:${userId}`, 1, 10, 3600)).allowed) return { ok: false, error: TRY_LATER };
  return { ok: true, signedOut: await auth.deleteOtherSessions(userId, sessionId) };
}

/** Deletes the account and everything that belongs to it. Needs the password and the word DELETE. */
export async function deleteAccount(userId: string, input: unknown, guard: AbuseGuard): Promise<Result> {
  const p = deleteAccountInput.safeParse(input);
  if (!p.success) return { ok: false, error: "Type DELETE and your password to confirm." };
  if (!(await guard.consume(`acct:delete:${userId}`, 1, 3, 3600)).allowed) return { ok: false, error: TRY_LATER };
  const u = await auth.findUserById(userId);
  if (!u) return { ok: false, error: GENERIC };
  if (!(await verifyPassword(u.passwordHash, p.data.password)).ok) return { ok: false, error: WRONG_PASSWORD };
  await auth.deleteUserCodes(u.email);
  await auth.deleteUser(userId); // profile, child, contact, tags, progress, chats and sessions follow by cascade
  console.info("[account] deleted"); // no id, no email
  return { ok: true };
}

/** Everything the app holds about this person, as one JSON text. */
export async function exportData(userId: string, guard: AbuseGuard): Promise<Result<{ fileName: string; json: string }>> {
  if (!(await guard.consume(`acct:export:${userId}`, 1, 3, 3600)).allowed) return { ok: false, error: TRY_LATER };
  const u = await auth.findUserById(userId);
  if (!u) return { ok: false, error: GENERIC };
  const [prof, kid, entries, threads, posts] = await Promise.all([onboarding.getProfile(userId), onboarding.getChild(userId), progress.listProgress(userId), chat.listThreads(userId, 100), community.listByAuthor(userId, 500)]);
  const [contact, tag] = kid ? await Promise.all([onboarding.getContact(kid.id), found.activeTag(kid.id)]) : [undefined, undefined];
  const chats = await Promise.all(threads.map(async (t) => ({ title: t.title, updatedAt: t.updatedAt, messages: await chat.listMessages(userId, t.id, 200) })));
  const now = new Date();
  const data = buildExport({
    now,
    account: { name: u.name, email: u.email, createdAt: u.createdAt },
    settings: prof ? { displayName: prof.displayName, relationship: prof.relationship, language: prof.language, theme: prof.theme, textSize: prof.textSize, sensoryMode: prof.sensoryMode, notifOn: prof.notifOn, chatHistoryEnabled: prof.chatHistoryEnabled } : null,
    child: kid ? stripIds(kid) : null,
    contact: contact ? { name: contact.name, phone: contact.phone, isPublic: contact.isPublic } : null,
    progress: entries,
    chats: chats.map((c) => ({ title: c.title, updatedAt: c.updatedAt, messages: c.messages.map((m) => ({ role: m.role, content: m.content, feedback: m.feedback, createdAt: m.createdAt })) })),
    tag: tag ? { enabled: tag.enabled, createdAt: tag.createdAt, accessCount: tag.accessCount } : null,
    posts,
  });
  return { ok: true, fileName: exportFileName(now), json: JSON.stringify(data, null, 2) };
}

/** A stored row without its internal ids. */
function stripIds(row: object): Record<string, unknown> {
  const { id: _id, userId: _userId, ...rest } = row as Record<string, unknown>;
  void _id; void _userId;
  return rest;
}

/** Changes appearance, language, name and similar settings. Only the fields given change. */
export async function updateSettings(userId: string, input: unknown): Promise<Result> {
  const p = settingsInput.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? GENERIC };
  await onboarding.updateSettings(userId, p.data);
  return { ok: true };
}
