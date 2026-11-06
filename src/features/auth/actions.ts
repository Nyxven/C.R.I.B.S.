"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as auth from "@/server/auth/service";
import type { AuthResult } from "@/server/auth/service";

// Thin boundary between UI and server logic: components import only this file.
async function ip() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
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
export const requestResetAction = async (input: unknown) => safe(async () => auth.requestPasswordReset(input, await ip()));
export const resetPasswordAction = async (input: unknown) => safe(async () => auth.resetPassword(input, await ip()));
export async function signOutAction() { await auth.signOut(); redirect("/sign-in"); }
