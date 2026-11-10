import { hasRoomForTurn, expiryFrom, isFeedback, isUuid, MAX_MESSAGES_PER_THREAD, MAX_THREADS_PER_USER, nextFeedback, type Feedback, type HistoryStore } from "@/lib/chat/history";
import * as repo from "./repo";

export type { MessageRow, ThreadRow } from "./repo";
export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const NOT_FOUND = "We could not find that chat.";

/** The storage the AI chat uses. Everything is scoped to the signed-in user. */
export function createHistoryStore(): HistoryStore {
  return {
    enabled: (userId) => repo.isHistoryEnabled(userId),
    async loadThread(userId, threadId) {
      if (!isUuid(threadId) || !(await repo.getThread(userId, threadId))) return null;
      const messages = await repo.listMessages(userId, threadId, MAX_MESSAGES_PER_THREAD);
      return { turns: messages.map((m) => ({ role: m.role, content: m.content })), full: !hasRoomForTurn(messages.length) };
    },
    async createThread(userId, title) {
      const surplus = await repo.oldestThreadIds(userId, MAX_THREADS_PER_USER - 1); // make room: the oldest chats go first
      await repo.deleteThreads(userId, surplus);
      return repo.createThread(userId, title, expiryFrom(new Date()));
    },
    saveTurn(userId, threadId, turn) {
      const now = new Date();
      return repo.addTurn(threadId, turn, now, expiryFrom(now));
    },
  };
}

export const listMyThreads = (userId: string) => repo.listThreads(userId, MAX_THREADS_PER_USER);

export async function getMyThread(userId: string, threadId: string) {
  if (!isUuid(threadId)) return null;
  const thread = await repo.getThread(userId, threadId);
  return thread ? { ...thread, messages: await repo.listMessages(userId, threadId, MAX_MESSAGES_PER_THREAD) } : null;
}

export async function deleteMyThread(userId: string, threadId: unknown): Promise<Result> {
  return isUuid(threadId) && (await repo.deleteThread(userId, threadId)) ? { ok: true } : { ok: false, error: NOT_FOUND };
}
export async function deleteAllMyThreads(userId: string): Promise<Result<{ deleted: number }>> {
  return { ok: true, deleted: await repo.deleteAllThreads(userId) };
}

/** Taps a thumb on an answer. Tapping the same thumb again clears it. Returns the new value. */
export async function tapFeedback(userId: string, input: { messageId?: unknown; value?: unknown }): Promise<Result<{ feedback: Feedback | null }>> {
  if (!isUuid(input.messageId) || !isFeedback(input.value)) return { ok: false, error: NOT_FOUND };
  const current = await repo.getFeedback(userId, input.messageId);
  if (current === undefined) return { ok: false, error: NOT_FOUND };
  const next = nextFeedback(current, input.value);
  return (await repo.setFeedback(userId, input.messageId, next)) ? { ok: true, feedback: next } : { ok: false, error: NOT_FOUND };
}

export const getHistorySetting = (userId: string) => repo.isHistoryEnabled(userId);

/** Turning history off also removes what was saved: the person asked not to keep these chats. */
export async function setHistorySetting(userId: string, enabled: unknown): Promise<Result<{ enabled: boolean }>> {
  if (typeof enabled !== "boolean") return { ok: false, error: "Please try again." };
  await repo.setHistoryEnabled(userId, enabled);
  if (!enabled) await repo.deleteAllThreads(userId);
  return { ok: true, enabled };
}
