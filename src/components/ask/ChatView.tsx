"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { History, RotateCcw, WifiOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ChatMessage } from "@/features/ask/chatState";
import { useChat } from "@/features/ask/useChat";
import { useT } from "@/lib/i18n/client";
import { Composer } from "./Composer";
import { Message } from "./Message";

export function ChatView({ starters, available, initial, prefill }: { starters: string[]; available: boolean; initial?: { threadId: string; messages: ChatMessage[] }; prefill?: string }) {
  const t = useT();
  const chat = useChat(initial);
  const endRef = useRef<HTMLDivElement>(null);
  const last = chat.messages.at(-1);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [chat.messages.length, last?.text]);

  return (
    // Fills the screen so the composer rests just above the bottom nav (main's pb-40 is trimmed to the nav's height here).
    <div className="-mb-16 flex min-h-[calc(100dvh-10.75rem)] flex-col gap-5 lg:mb-0 lg:min-h-[calc(100dvh-5.5rem)]">
      <PageHeader title="Ask CRIBS" intro={t("ask.intro")}
        action={
          <div className="-mr-2 flex items-center">
            {chat.messages.length > 0 && (
              <button type="button" onClick={chat.newChat} className="btn-ghost"><RotateCcw size={18} aria-hidden="true" /> {t("ask.newChat")}</button>
            )}
            <Link href="/ask/history" className="btn-ghost"><History size={18} aria-hidden="true" /> {t("ask.history")}</Link>
          </div>
        } />

      {!available ? (
        <EmptyState icon={WifiOff} title={t("ask.unavailable")} actionHref="/search" actionLabel={t("ask.searchGuides")} secondaryHref="/faq" secondaryLabel={t("ask.readFaq")}>
          {t("ask.unavailableBody")}
        </EmptyState>
      ) : (
        <>
          {chat.messages.length === 0 ? (
            <section className="space-y-4" aria-labelledby="ask-intro">
              <div className="card flex items-start gap-3 p-5">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint-purple"><Logo size={30} alt="" /></span>
                <div>
                  <p id="ask-intro" className="h-section">{t("ask.hi")}</p>
                  <p className="text-ink-soft">{t("ask.introBody")}</p>
                </div>
              </div>
              <div role="group" aria-label={t("ask.ideas")} className="flex flex-col gap-2">
                {starters.map((s) => (
                  <button key={s} type="button" onClick={() => void chat.send(s)} className="min-h-14 rounded-full border-2 border-tint-purple bg-white px-5 py-3 text-left font-bold text-brand transition hover:border-brand active:scale-[.99]">{s}</button>
                ))}
              </div>
            </section>
          ) : (
            <div role="log" aria-label={t("ask.conversation")} aria-busy={chat.busy} className="space-y-4">
              {chat.messages.map((m) => <Message key={m.id} message={m} onRetry={chat.retry} onRate={m.role === "assistant" ? (v) => void chat.rate(m.id, v) : undefined} />)}
              {/* Lands above the sticky composer and the bottom nav, not behind them. */}
              <div ref={endRef} className="scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] lg:scroll-mb-36" />
            </div>
          )}

          <div data-tour="composer" className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] -mx-5 mt-auto space-y-2 border-t border-line bg-cream/90 px-5 pb-2 pt-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:px-0 lg:pb-4">
            <Composer initial={prefill} busy={chat.busy} onSend={(t) => void chat.send(t)} />
            <p className="text-center text-xs font-semibold text-ink-soft">{t("ask.disclaimer")}</p>
          </div>
        </>
      )}
    </div>
  );
}
