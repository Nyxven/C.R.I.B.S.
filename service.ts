import { randomUUID } from "node:crypto";
import { sendMail, codeEmail, existingAccountEmail } from "@/lib/mail";
import { fakeVerify, generateCode, hashCode, codeMatches, hashPassword, verifyPassword } from "./crypto";
import * as repo from "./repo";
import { startSession, endSession } from "./session";
import { signUpInput, signInInput, verifyInput, emailOnlyInput, resetInput } from "./validation";

export type AuthResult = { ok: true; needsVerify?: boolean } | { ok: false; error: string };

const CODE_TTL_MS = 10 * 60_000;
const MAX_CODE_ATTEMPTS = 5;
const ok = (extra: { needsVerify?: boolean } = {}): AuthResult => ({ ok: true, ...extra });
const fail = (error: string): AuthResult => ({ ok: false, error });
const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
const BAD_CODE = "That code didn't work. Check it and try again, or request a new one.";
const BAD_LOGIN = "Email or password is incorrect.";

const logMail = (e: unknown) =>
  console.error("[mail] send failed:", e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : "unknown");

const tooMany = async (key: string, limit: number, sec: number) => !(await repo.hitRateLimit(key, limit, sec)).allowed;

async function issueCode(email: string, purpose: repo.Purpose) {
  const code = generateCode();
  await repo.upsertLoginCode({ id: randomUUID(), email, purpose, codeHash: hashCode(email, purpose, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) });
  await sendMail({ to: email, ...codeEmail(purpose, code) });
}

/** Counts the attempt first, so parallel guessing can't beat the limit. */
async function consumeCode(email: string, purpose: repo.Purpose, code: string) {
  const row = await repo.getLoginCode(email, purpose);
  if (!row || row.expiresAt.getTime() < Date.now() || row.attempts >= MAX_CODE_ATTEMPTS) return false;
  await repo.bumpCodeAttempts(row.id);
  if (!codeMatches(row.codeHash, email, purpose, code)) return false;
  await repo.deleteLoginCode(email, purpose);
  return true;
}

export async function signUp(input: unknown, ip: string): Promise<AuthResult> {
  const p = signUpInput.safeParse(input);
  if (!p.success) return fail(p.error.issues.find((i) => i.path[0] === "password")?.message ?? "Please check your details and try again.");
  const { name, email, password } = p.data;
  if ((await tooMany(`signup:ip:${ip}`, 10, 3600)) || (await tooMany(`code:${email}`, 3, 600))) return fail(TOO_MANY);

  const existing = await repo.findUserByEmail(email);
  if (existing?.emailVerifiedAt) {
    // Same response as a new sign-up, so the form can't be used to discover who has an account.
    await sendMail({ to: email, ...existingAccountEmail() }).catch(logMail);
    return ok();
  }
  const passwordHash = await hashPassword(password);
  if (existing) await repo.resetUnverifiedUser(existing.id, { name, passwordHash });
  else await repo.insertUser({ id: randomUUID(), name, email, passwordHash });
  try { await issueCode(email, "verify"); } catch (e) { logMail(e); return fail("We couldn't send the email. Please try again in a moment."); }
  return ok();
}

export async function resendVerification(input: unknown): Promise<AuthResult> {
  const p = emailOnlyInput.safeParse(input);
  if (!p.success) return ok();
  const { email } = p.data;
  if (await tooMany(`code:${email}`, 3, 600)) return fail(TOO_MANY);
  const u = await repo.findUserByEmail(email);
  if (u && !u.emailVerifiedAt) await issueCode(email, "verify").catch(logMail);
  return ok();
}

export async function verifyEmail(input: unknown, ip: string): Promise<AuthResult> {
  const p = verifyInput.safeParse(input);
  if (!p.success) return fail(BAD_CODE);
  const { email, code } = p.data;
  if (await tooMany(`verify:ip:${ip}`, 20, 600)) return fail(TOO_MANY);
  const u = await repo.findUserByEmail(email);
  if (!u || u.emailVerifiedAt || !(await consumeCode(email, "verify", code))) return fail(BAD_CODE);
  await repo.markEmailVerified(u.id);
  await startSession(u.id);
  return ok();
}

export async function signIn(input: unknown, ip: string): Promise<AuthResult> {
  const p = signInInput.safeParse(input);
  if (!p.success) return fail(BAD_LOGIN);
  const { email, password } = p.data;
  if ((await tooMany(`signin:ip:${ip}`, 20, 900)) || (await tooMany(`signin:email:${email}`, 8, 900))) return fail(TOO_MANY);

  const u = await repo.findUserByEmail(email);
  if (!u) { await fakeVerify(password); return fail(BAD_LOGIN); }
  const v = await verifyPassword(u.passwordHash, password);
  if (!v.ok) return fail(BAD_LOGIN);

  if (!u.emailVerifiedAt) {
    if (!(await tooMany(`code:${email}`, 3, 600))) await issueCode(email, "verify").catch(logMail);
    return ok({ needsVerify: true });
  }
  if (v.needsRehash) await repo.setPasswordHash(u.id, await hashPassword(password)); // silent upgrade after pepper/param rotation
  await startSession(u.id);
  return ok();
}

export async function requestPasswordReset(input: unknown, ip: string): Promise<AuthResult> {
  const p = emailOnlyInput.safeParse(input);
  if (!p.success) return ok(); // never reveal anything
  const { email } = p.data;
  if ((await tooMany(`reset:ip:${ip}`, 10, 3600)) || (await tooMany(`code:${email}`, 3, 600))) return fail(TOO_MANY);
  if (await repo.findUserByEmail(email)) await issueCode(email, "reset").catch(logMail);
  return ok();
}

export async function resetPassword(input: unknown, ip: string): Promise<AuthResult> {
  const p = resetInput.safeParse(input);
  if (!p.success) return fail(p.error.issues.find((i) => i.path[0] === "password")?.message ?? BAD_CODE);
  const { email, code, password } = p.data;
  if (await tooMany(`verify:ip:${ip}`, 20, 600)) return fail(TOO_MANY);
  const u = await repo.findUserByEmail(email);
  if (!u || !(await consumeCode(email, "reset", code))) return fail(BAD_CODE);
  await repo.setPasswordHash(u.id, await hashPassword(password));
  await repo.markEmailVerified(u.id); // they proved they own the inbox
  await repo.deleteUserSessions(u.id); // a new password signs out every device
  return ok();
}

export const signOut = endSession;
