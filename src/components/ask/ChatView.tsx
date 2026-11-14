"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { History, MessageCircle, RotateCcw, WifiOff } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ChatMessage } from "@/features/ask/chatState";
import { useChat } from "@/features/ask/useChat";
import { Composer } from "./Composer";
import { Message } from "./Message";

export function ChatView({ starters, available, initial }: { starters: string[]; available: boolean; initial?: { threadId: string; messages: ChatMessage[] } }) {
  const chat = useChat(initial);
  const endRef = useRef<HTMLDivElement>(null);
  const last = chat.messages.at(-1);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [chat.messages.length, last?.text]);

  return (
    <div className="space-y-5">
      <PageHeader title="Ask CRIBS" intro="Answers from the guides in this app."
        action={
          <div className="-mr-2 flex items-center">
            {chat.messages.length > 0 && (
              <button type="button" onClick={chat.newChat} className="btn-ghost"><RotateCcw size={18} aria-hidden="true" /> New chat</button>
            )}
            <Link href="/ask/history" className="btn-ghost"><History size={18} aria-hidden="true" /> History</Link>
          </div>
        } />

      {!available ? (
        <EmptyState icon={WifiOff} title="The guide is not available right now" actionHref="/search" actionLabel="Search guides" secondaryHref="/faq" secondaryLabel="Read the FAQ">
          You can still search the guides and read the questions parents ask most.
        </EmptyState>
      ) : (
        <>
          {chat.messages.length === 0 ? (
            <section className="space-y-4" aria-labelledby="ask-intro">
              <div className="card flex items-start gap-3 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tint-purple"><MessageCircle size={22} aria-hidden="true" /></span>
                <div>
                  <p id="ask-intro" className="font-display text-lg font-bold">Ask me about the guides</p>
                  <p className="text-ink-soft">I answer from the guides in this app. I can’t give medical advice.</p>
                </div>
              </div>
              <div role="group" aria-label="Question ideas" className="flex flex-col gap-2">
                {starters.map((s) => (
                  <button key={s} type="button" onClick={() => void chat.send(s)} className="card min-h-14 px-4 py-3 text-left font-bold text-ink active:scale-[.99]">{s}</button>
                ))}
              </div>
            </section>
          ) : (
            <div role="log" aria-label="Conversation" aria-busy={chat.busy} className="space-y-4">
              {chat.messages.map((m) => <Message key={m.id} message={m} onRetry={chat.retry} onRate={m.role === "assistant" ? (v) => void chat.rate(m.id, v) : undefined} />)}
              <div ref={endRef} />
            </div>
          )}

          <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] -mx-5 space-y-2 border-t border-line bg-cream px-5 pb-2 pt-3 lg:bottom-0 lg:mx-0 lg:px-0">
            <Composer busy={chat.busy} onSend={(t) => void chat.send(t)} />
            <p className="text-center text-xs font-semibold text-ink-soft">Guidance only, not medical advice. In an emergency call 911.</p>
          </div>
        </>
      )}
    </div>
  );
}
