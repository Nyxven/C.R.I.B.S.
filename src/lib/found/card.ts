// What a finder sees on the public "if found" page, and which parts the parent chose to show. Pure.
import { COMM_LEVELS, normalizePhone } from "@/lib/domain/onboarding";

export type FoundFields = { nickname: boolean; autism: boolean; communication: boolean; calming: boolean; avoid: boolean; contact: boolean };

/** The least that helps: first name or nickname, how to communicate, what calms, what to avoid, one number (BUILD_CRIBS 6.10). */
export const DEFAULT_FIELDS: FoundFields = { nickname: true, autism: false, communication: true, calming: true, avoid: true, contact: true };

export const FIELD_LABELS: Record<keyof FoundFields, { label: string; help: string }> = {
  nickname: { label: "Nickname", help: "Shown as the heading." },
  autism: { label: "Says my child has autism", help: "Helps people understand why they may not answer." },
  communication: { label: "How they communicate", help: "For example non-speaking or a few words." },
  calming: { label: "What helps them calm down", help: "From your quiz answer." },
  avoid: { label: "What to avoid", help: "From your quiz answer." },
  contact: { label: "A phone number to call", help: "Your emergency contact, with a Call button." },
};

/** Reads stored settings safely: anything missing or odd falls back to the default. */
export function parseFields(raw: unknown): FoundFields {
  const o = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_FIELDS };
  for (const k of Object.keys(DEFAULT_FIELDS) as (keyof FoundFields)[]) if (typeof o[k] === "boolean") out[k] = o[k];
  return out;
}

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
export const cleanText = (t: string | null | undefined, max: number): string => (t ?? "").replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, max);

export type FinderChild = { nickname: string; communicationLevel: string | null; calming: string | null; avoid: string | null };
export type FinderContact = { name: string; phone: string; isPublic: boolean } | null;
export type FoundCard = {
  heading: string;
  facts: { label: string; text: string }[];
  call: { name: string; display: string; href: string } | null;
  tips: readonly string[];
};

export const FINDER_TIPS = [
  "Stay calm and speak softly. Give the child space.",
  "Do not grab, chase or restrain the child.",
  "Stay nearby and call the number here, or the police.",
  "If the child is hurt or in danger, call 911.",
] as const;

export function buildFoundCard(child: FinderChild, contact: FinderContact, fields: FoundFields): FoundCard {
  const name = cleanText(child.nickname, 40);
  const facts: FoundCard["facts"] = [];
  if (fields.autism) facts.push({ label: "Good to know", text: `${fields.nickname && name ? name : "This child"} has autism and may not answer, make eye contact or respond the way you expect.` });
  const comm = COMM_LEVELS.find((c) => c.value === child.communicationLevel);
  if (fields.communication && comm) facts.push({ label: "How they communicate", text: comm.label });
  const calming = cleanText(child.calming, 300);
  if (fields.calming && calming) facts.push({ label: "What helps them calm down", text: calming });
  const avoid = cleanText(child.avoid, 300);
  if (fields.avoid && avoid) facts.push({ label: "Please avoid", text: avoid });

  let call: FoundCard["call"] = null;
  if (fields.contact && contact?.isPublic) {
    const phone = normalizePhone(contact.phone);
    if (phone) call = { name: cleanText(contact.name, 60) || "Parent", display: phone, href: `tel:${phone}` };
  }
  return { heading: fields.nickname && name ? name : "A child who may be lost", facts, call, tips: FINDER_TIPS };
}
