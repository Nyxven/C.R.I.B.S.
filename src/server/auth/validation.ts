import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(10, "Password must be at least 10 characters.").max(128, "Password is too long.");
export const nameSchema = z.string().trim().min(1).max(60);
export const codeSchema = z.string().trim().regex(/^\d{6}$/);

const botToken = z.string().max(2048).optional(); // Cloudflare Turnstile token (only when the check is switched on)
export const signUpInput = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema, turnstileToken: botToken });
export const signInInput = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const verifyInput = z.object({ email: emailSchema, code: codeSchema });
export const emailOnlyInput = z.object({ email: emailSchema, turnstileToken: botToken });
export const resetInput = z.object({ email: emailSchema, code: codeSchema, password: passwordSchema });
