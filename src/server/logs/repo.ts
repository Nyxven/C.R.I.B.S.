import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { behaviorLog, communicationLog } from "@/db/schema";
import type { BehaviorEntry, CommunicationEntry } from "@/lib/domain/logs";
import type { BehaviorInput, CommunicationInput } from "@/features/logs/schema";

// The only file that touches the parent logs. Every query includes the user id (no IDOR).
const behaviorCols = { id: behaviorLog.id, occurredAt: behaviorLog.occurredAt, setting: behaviorLog.setting, antecedent: behaviorLog.antecedent, behavior: behaviorLog.behavior, consequence: behaviorLog.consequence, intensity: behaviorLog.intensity, durationMin: behaviorLog.durationMin, context: behaviorLog.context, notes: behaviorLog.notes };
const commCols = { id: communicationLog.id, occurredAt: communicationLog.occurredAt, mode: communicationLog.mode, initiation: communicationLog.initiation, purpose: communicationLog.purpose, understood: communicationLog.understood, setting: communicationLog.setting, example: communicationLog.example, context: communicationLog.context, notes: communicationLog.notes };

export const listBehavior = (userId: string, limit = 200): Promise<BehaviorEntry[]> =>
  db.select(behaviorCols).from(behaviorLog).where(eq(behaviorLog.userId, userId)).orderBy(desc(behaviorLog.occurredAt)).limit(limit);

export const listCommunication = (userId: string, limit = 200): Promise<CommunicationEntry[]> =>
  db.select(commCols).from(communicationLog).where(eq(communicationLog.userId, userId)).orderBy(desc(communicationLog.occurredAt)).limit(limit);

export async function addBehavior(userId: string, v: BehaviorInput): Promise<string> {
  const id = randomUUID();
  await db.insert(behaviorLog).values({ id, userId, occurredAt: v.occurredAt, setting: v.setting ?? null, antecedent: v.antecedent, behavior: v.behavior, consequence: v.consequence ?? null, intensity: v.intensity ?? null, durationMin: v.durationMin ?? null, context: v.context, notes: v.notes ?? null });
  return id;
}

export async function addCommunication(userId: string, v: CommunicationInput): Promise<string> {
  const id = randomUUID();
  await db.insert(communicationLog).values({ id, userId, occurredAt: v.occurredAt, mode: v.mode, initiation: v.initiation, purpose: v.purpose, understood: v.understood, setting: v.setting ?? null, example: v.example ?? null, context: v.context, notes: v.notes ?? null });
  return id;
}

/** True when a row of this user's was deleted. Someone else's id deletes nothing. */
export const deleteBehavior = async (userId: string, id: string) =>
  (await db.delete(behaviorLog).where(and(eq(behaviorLog.id, id), eq(behaviorLog.userId, userId))).returning({ id: behaviorLog.id })).length > 0;
export const deleteCommunication = async (userId: string, id: string) =>
  (await db.delete(communicationLog).where(and(eq(communicationLog.id, id), eq(communicationLog.userId, userId))).returning({ id: communicationLog.id })).length > 0;
