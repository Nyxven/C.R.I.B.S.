import { z } from "zod";
import { RELATIONSHIPS } from "@/lib/domain/onboarding";
import { passwordSchema } from "@/server/auth/validation";

export const THEMES = ["sunrise", "ocean", "meadow", "berry"] as const;
export const LANGUAGES = ["en", "fil"] as const;

// Only the fields given change. Strict: unknown keys are rejected, and at least one field is required.
export const settingsInput = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  relationship: z.string().refine((v) => RELATIONSHIPS.some((r) => r.value === v), "Please choose from the list.").optional(),
  language: z.enum(LANGUAGES).optional(),
  theme: z.enum(THEMES).optional(),
  textSize: z.number().int().min(85).max(140).optional(),
  sensoryMode: z.boolean().optional(),
  notifOn: z.boolean().optional(),
}).strict().refine((o) => Object.keys(o).length > 0, "Nothing to change.");

export const changePasswordInput = z.object({ current: z.string().min(1).max(128), next: passwordSchema }).strict();
export const deleteAccountInput = z.object({ password: z.string().min(1).max(128), confirm: z.literal("DELETE") }).strict();
