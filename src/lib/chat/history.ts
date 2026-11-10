// Rules for saved Ask conversations. Pure: no database, no React.
import type { ChatTurn } from "@/lib/ai/limits";
import type { Source } from "@/lib/ai/citations";
import { scrubPii } from "@/lib/ai/scrub";

export const HISTORY_DAYS = 30; // counted from the last message in a chat
export const MAX_THREADS_PER_USER = 40;
export const MAX_MESSAGES_PER_THREAD = 60;
export const TITLE_MAX = 60;

export type Feedback = "up" | "down";
export type SavedTurn = { question: string; answer: string; sources: Source[]; inputTokens: number; outputTokens: number };

/** What the chat service needs from storage. The database version lives in src/server/chat. */
export type HistoryStore = {
  enabled(userId: string): Promise<boolean>;
  /** null when the chat does not exist or belongs to someone else. */
  loadThread(userId: string, threadId: string): Promise<{ turns: ChatTurn[]; full: boolean } | null>;
  createThread(userId: string, title: string): Promise<string>;
  /** Saves the question and its answer; returns the answer's message id. */
  saveTurn(userId: string, threadId: string, turn: SavedTurn): Promise<string>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
export const isFeedback = (v: unknown): v is Feedback => v === "up" || v === "down";

/** A short title from the first question, with contact details removed. */
export function threadTitle(question: string): string {
  const flat = scrubPii(question).text.replace(/\s+/g, " ").trim();
  if (!flat) return "New chat";
  return flat.length <= TITLE_MAX ? flat : `${flat.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

export const expiryFrom = (now: Date): Date => new Date(now.getTime() + HISTORY_DAYS * 86_400_000);

/** Tapping the same thumb again clears it; tapping the other one switches. */
export const nextFeedback = (current: Feedback | null, tapped: Feedback): Feedback | null => (current === tapped ? null : tapped);

/** Room for one more question and answer. */
export const hasRoomForTurn = (messageCount: number): boolean => messageCount + 2 <= MAX_MESSAGES_PER_THREAD;

/** Emergency conversations are never saved, and nothing is saved when the person turned history off. */
export const shouldSave = (o: { enabled: boolean; emergency: boolean }): boolean => o.enabled && !o.emergency;
