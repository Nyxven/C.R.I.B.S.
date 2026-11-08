"use client";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { parseEvents } from "@/lib/ai/events";
import { MAX_INPUT_CHARS } from "@/lib/ai/limits";
import { chatReducer, historyFor, initialChat, type ChatState } from "./chatState";

const GENERIC = "Something went wrong. Please try again.";

/** Sends a question to /api/chat and feeds the streamed answer into the chat state. */
export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialChat);
  const abortRef = useRef<AbortController | null>(null);
  const counter = useRef(0);

  useEffect(() => () => abortRef.current?.abort(), []);

  // `base` is the chat as it stands before this question (a retry passes it without the failed turn).
  const submit = useCallback(async (raw: string, base: ChatState) => {
    const text = raw.trim();
    if (!text || text.length > MAX_INPUT_CHARS || base.busy) return;
    const messages = historyFor(base, text);
    const n = ++counter.current;
    dispatch({ type: "send", userId: `u${n}`, assistantId: `a${n}`, text });
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }), signal: ctrl.signal });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
        dispatch({ type: "fail", message: typeof data?.error === "string" ? data.error : GENERIC });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseEvents(buffer);
        buffer = parsed.rest;
        for (const e of parsed.events) {
          if (e.t === "start") dispatch({ type: "start", kind: e.kind });
          else if (e.t === "text") dispatch({ type: "delta", d: e.d });
          else if (e.t === "done") dispatch({ type: "done", sources: e.sources });
          else dispatch({ type: "fail", message: e.message });
        }
      }
      dispatch({ type: "end" });
    } catch (e) {
      if (!ctrl.signal.aborted) dispatch({ type: "fail", message: e instanceof TypeError ? "No connection. Please check your internet and try again." : GENERIC });
    }
  }, []);

  const send = useCallback((raw: string) => submit(raw, state), [state, submit]);

  const retry = useCallback(() => {
    const lastUser = [...state.messages].reverse().find((m) => m.role === "user");
    if (!lastUser || state.busy) return;
    dispatch({ type: "drop_last_turn" });
    void submit(lastUser.text, { ...state, messages: state.messages.slice(0, -2) });
  }, [state, submit]);

  const newChat = useCallback(() => { abortRef.current?.abort(); dispatch({ type: "reset" }); }, []);

  return { messages: state.messages, busy: state.busy, send, retry, newChat };
}
