"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Copy, PhoneCall, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useT } from "@/lib/i18n/client";
import { visibleText, type ChatMessage } from "@/features/ask/chatState";

export function Message({ message, onRetry, onRate }: { message: ChatMessage; onRetry: () => void; onRate?: (value: "up" | "down") => void }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const text = visibleText(message);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg px-4 py-3 font-semibold text-white shadow-sm" style={{ background: "var(--grad-brand)" }}>{text}</p>
      </div>
    );
  }

  const emergency = message.kind === "emergency";
  const streaming = message.status === "streaming";
  const failed = message.status === "error";

  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard not allowed: do nothing */ }
  }

  return (
    <div className="flex items-start justify-start gap-2">
      <span aria-hidden="true" className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-line"><Logo size={22} alt="" /></span>
      <div className={`card max-w-[calc(100%-2.75rem)] space-y-3 rounded-tl-lg p-4 ${emergency ? "border-2 border-coral bg-tint-coral" : ""}`}>
        {emergency && <p className="flex items-center gap-2 font-extrabold text-coral-dark"><PhoneCall size={20} aria-hidden="true" /> {t("ask.emergency")}</p>}
        {text === "" && streaming ? (
          <p className="text-ink-soft" aria-label={t("ask.typing")}>{t("ask.thinking")}</p>
        ) : (
          <p className={`whitespace-pre-wrap break-words ${failed ? "font-bold text-coral-dark" : "text-ink"}`}>{text}</p>
        )}
        {failed && <button type="button" onClick={onRetry} className="btn-secondary min-h-11 px-4 text-base"><RotateCcw size={16} aria-hidden="true" /> {t("ask.tryAgain")}</button>}
        {message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label={t("ask.sources")}>
            {message.sources.map((s) => (
              <Link key={s.id} href={s.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-tint-purple px-3 text-sm font-bold text-brand hover:bg-white hover:ring-2 hover:ring-brand">
                <BookOpen size={16} aria-hidden="true" /> {s.title}
              </Link>
            ))}
          </div>
        )}
        {message.status === "done" && !emergency && text !== "" && (
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-ink-soft hover:bg-cream">
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? t("ask.copied") : t("ask.copy")}
            </button>
            {onRate && message.serverId && (
              <>
                <button type="button" onClick={() => onRate("up")} aria-pressed={message.feedback === "up"} aria-label={t("ask.helpful")}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${message.feedback === "up" ? "bg-tint-mint text-ink" : "text-ink-soft hover:bg-cream"}`}>
                  <ThumbsUp size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onRate("down")} aria-pressed={message.feedback === "down"} aria-label={t("ask.notHelpful")}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${message.feedback === "down" ? "bg-tint-pink text-ink" : "text-ink-soft hover:bg-cream"}`}>
                  <ThumbsDown size={18} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
