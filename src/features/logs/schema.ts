import { z } from "zod";
import { CONTEXTS, INITIATIONS, MODES, PURPOSES, SETTINGS } from "@/lib/domain/logs";

// Shared by the form and the server. Free text is trimmed and capped; empty optional text becomes null.
const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => text(max).transform((s) => (s === "" ? null : s)).nullable().optional();
// The time of the event: no further than a year back, and not in the future (a minute of clock drift allowed).
const when = z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), "Please pick a date and time.")
  .refine((d) => d.getTime() <= Date.now() + 60_000, "That time is in the future.")
  .refine((d) => d.getTime() >= Date.now() - 366 * 86_400_000, "Please pick a time within the last year.");
// "Other" lets the parent type their own short word (2-40 characters), stored in place of the option.
const custom = z.string().trim().min(2).max(40);
const opt = <T extends readonly [string, ...string[]]>(list: T) => z.union([z.enum(list), custom]);
const contexts = z.array(opt(CONTEXTS)).max(CONTEXTS.length + 1).default([]);

export const behaviorInput = z.object({
  occurredAt: when,
  setting: opt(SETTINGS).nullable().optional(),
  antecedent: text(500).min(2, "Please write what happened before."),
  behavior: text(500).min(2, "Please describe what your child did."),
  consequence: optText(500),
  intensity: z.number().int().min(1).max(5).nullable().optional(),
  durationMin: z.number().int().min(0).max(600).nullable().optional(),
  context: contexts,
  notes: optText(500),
}).strict();

export const communicationInput = z.object({
  occurredAt: when,
  mode: opt(MODES),
  initiation: z.enum(INITIATIONS),
  purpose: opt(PURPOSES),
  understood: z.boolean(),
  setting: opt(SETTINGS).nullable().optional(),
  example: optText(200),
  context: contexts,
  notes: optText(500),
}).strict();

export type BehaviorInput = z.infer<typeof behaviorInput>;
export type CommunicationInput = z.infer<typeof communicationInput>;
