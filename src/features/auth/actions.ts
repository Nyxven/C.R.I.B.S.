"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as auth from "@/server/auth/service";
import { requestIpBucket } from "@/server/security/request";
import type { AuthResult } from "@/server/auth/service";

// Thin boundary between UI and server logic: components import only this file.
// A private bucket key, never the raw address. Only the platform's own headers are trusted (TRUST_PROXY).
async function ip() {
  return requestIpBucket(await headers());
}
async function safe(fn: () => Promise<AuthResult>): Promise<AuthResult> {
  try { return await fn(); }
  catch (e) { // Name + message only (never the stack or inputs). Env errors list variable NAMES, never values.
    const detail = e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : "unknown";
    console.error("[auth] unexpected error:", detail); return { ok: false, error: "Something went wrong. Please try again." }; }
}

export const signUpAction = async (input: unknown) => safe(async () => auth.signUp(input, await ip()));
export const verifyEmailAction = async (input: unknown) => safe(async () => auth.verifyEmail(input, await ip()));
export const resendCodeAction = async (input: unknown) => safe(() => auth.resendVerification(input));
export const signInAction = async (input: unknown) => safe(async () => auth.signIn(input, await ip()));
export const resendResetAction = async (input: unknown) => safe(async () => auth.requestPasswordReset(input, await ip(), { bot: false }));
export const requestResetAction = async (input: unknown) => safe(async () => auth.requestPasswordReset(input, await ip()));
export const resetPasswordAction = async (input: unknown) => safe(async () => auth.resetPassword(input, await ip()));
export async function signOutAction() { await auth.signOut(); redirect("/sign-in"); }
