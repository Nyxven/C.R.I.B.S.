import { z } from "zod";
import type { AbuseGuard } from "@/lib/security/guard";
import { behaviorInput, communicationInput } from "@/features/logs/schema";
import * as repo from "./repo";

export type LogResult = { ok: true } | { ok: false; error: string };
export type LogKind = "behavior" | "communication";
const idInput = z.object({ kind: z.enum(["behavior", "communication"]), id: z.string().uuid() }).strict();
const TOO_MANY = "You have added a lot of entries in a short time. Please wait a few minutes.";

/** Saves one log entry for this person. Validated here even though the form validates too. */
export async function addEntry(userId: string, kind: LogKind, input: unknown, guard: AbuseGuard): Promise<LogResult> {
  const p = (kind === "behavior" ? behaviorInput : communicationInput).safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Please check the entry and try again." };
  if (!(await guard.consume(`log:add:${userId}`, 1, 120, 3600)).allowed) return { ok: false, error: TOO_MANY };
  if (kind === "behavior") await repo.addBehavior(userId, p.data as z.infer<typeof behaviorInput>);
  else await repo.addCommunication(userId, p.data as z.infer<typeof communicationInput>);
  return { ok: true };
}

/** Deletes one of this person's entries. */
export async function deleteEntry(userId: string, input: unknown): Promise<LogResult> {
  const p = idInput.safeParse(input);
  if (!p.success) return { ok: false, error: "That entry was not found." };
  const done = p.data.kind === "behavior" ? await repo.deleteBehavior(userId, p.data.id) : await repo.deleteCommunication(userId, p.data.id);
  return done ? { ok: true } : { ok: false, error: "That entry was not found." };
}

export const getLogs = async (userId: string) => {
  const [behavior, communication] = await Promise.all([repo.listBehavior(userId), repo.listCommunication(userId)]);
  return { behavior, communication };
};
