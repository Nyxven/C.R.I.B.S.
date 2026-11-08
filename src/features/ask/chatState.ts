// Chat screen state as plain rules. No React, no network: easy to test.
import { stripMarkers, type Source } from "@/lib/ai/citations";
import type { ChatTurn } from "@/lib/ai/limits";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string; // raw text (an answer may still contain [[id]] markers; show it with visibleText)
  status: "streaming" | "done" | "error";
  kind: "answer" | "emergency";
  sources: Source[];
};
export type ChatState = { messages: ChatMessage[]; busy: boolean };
export const initialChat: ChatState = { messages: [], busy: false };

export type ChatAction =
  | { type: "send"; userId: string; assistantId: string; text: string }
  | { type: "start"; kind: "answer" | "emergency" }
  | { type: "delta"; d: string }
  | { type: "done"; sources: Source[] }
  | { type: "fail"; message: string }
  | { type: "end" } // the stream closed: if it never finished, that is an error
  | { type: "drop_last_turn" }
  | { type: "reset" };

const patchLast = (s: ChatState, f: (m: ChatMessage) => ChatMessage): ChatState => {
  const last = s.messages.at(-1);
  return last && last.role === "assistant" ? { ...s, messages: [...s.messages.slice(0, -1), f(last)] } : s;
};

export function chatReducer(s: ChatState, a: ChatAction): ChatState {
  switch (a.type) {
    case "send":
      return {
        busy: true,
        messages: [
          ...s.messages,
          { id: a.userId, role: "user", text: a.text, status: "done", kind: "answer", sources: [] },
          { id: a.assistantId, role: "assistant", text: "", status: "streaming", kind: "answer", sources: [] },
        ],
      };
    case "start": return patchLast(s, (m) => ({ ...m, kind: a.kind }));
    case "delta": return patchLast(s, (m) => (m.status === "streaming" ? { ...m, text: m.text + a.d } : m));
    case "done": return { ...patchLast(s, (m) => (m.status === "streaming" ? { ...m, status: "done", sources: a.sources } : m)), busy: false };
    case "fail": return { ...patchLast(s, (m) => ({ ...m, status: "error", kind: "answer", text: a.message, sources: [] })), busy: false };
    case "end": {
      const last = s.messages.at(-1);
      if (!last || last.role !== "assistant" || last.status !== "streaming") return { ...s, busy: false };
      return last.text.trim() === ""
        ? { ...patchLast(s, (m) => ({ ...m, status: "error", text: "Connection lost. Please try again." })), busy: false }
        : { ...patchLast(s, (m) => ({ ...m, status: "done" })), busy: false };
    }
    case "drop_last_turn": return { busy: false, messages: s.messages.slice(0, -2) };
    case "reset": return initialChat;
  }
}

/** What to show for a message: answers lose their [[id]] markers (sources appear as chips instead). */
export const visibleText = (m: ChatMessage): string => (m.role === "assistant" && m.status !== "error" ? stripMarkers(m.text) : m.text);

/** What to send to the server: finished turns plus the new question. Failed answers are left out. */
export function historyFor(s: ChatState, nextQuestion: string): ChatTurn[] {
  const past = s.messages
    .filter((m) => m.status === "done" && visibleText(m).trim() !== "")
    .map((m): ChatTurn => ({ role: m.role, content: visibleText(m) }));
  return [...past, { role: "user", content: nextQuestion }];
}
