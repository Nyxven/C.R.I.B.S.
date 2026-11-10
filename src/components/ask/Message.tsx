"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Copy, PhoneCall, ThumbsDown, ThumbsUp } from "lucide-react";
import { visibleText, type ChatMessage } from "@/features/ask/chatState";

export function Message({ message, onRetry, onRate }: { message: ChatMessage; onRetry: () => void; onRate?: (value: "up" | "down") => void }) {
  const [copied, setCopied] = useState(false);
  const text = visibleText(message);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-tint-purple px-4 py-3 text-ink">{text}</p>
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
    <div className="flex justify-start">
      <div className={`card max-w-[92%] space-y-3 p-4 ${emergency ? "border-2 border-coral" : ""}`}>
        {emergency && <p className="flex items-center gap-2 font-extrabold text-coral-dark"><PhoneCall size={20} aria-hidden="true" /> In an emergency</p>}
        {text === "" && streaming ? (
          <p className="text-ink-soft" aria-label="The guide is typing">Thinking…</p>
        ) : (
          <p className={`whitespace-pre-wrap break-words ${failed ? "font-bold text-coral-dark" : "text-ink"}`}>{text}</p>
        )}
        {failed && <button type="button" onClick={onRetry} className="btn-secondary min-h-11 px-4 text-base">Try again</button>}
        {message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Sources">
            {message.sources.map((s) => (
              <Link key={s.id} href={s.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-field bg-white px-3 text-sm font-bold text-brand">
                <BookOpen size={16} aria-hidden="true" /> {s.title}
              </Link>
            ))}
          </div>
        )}
        {message.status === "done" && !emergency && text !== "" && (
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-ink-soft">
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? "Copied" : "Copy"}
            </button>
            {onRate && message.serverId && (
              <>
                <button type="button" onClick={() => onRate("up")} aria-pressed={message.feedback === "up"} aria-label="Helpful"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${message.feedback === "up" ? "bg-tint-mint text-ink" : "text-ink-soft"}`}>
                  <ThumbsUp size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onRate("down")} aria-pressed={message.feedback === "down"} aria-label="Not helpful"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${message.feedback === "down" ? "bg-tint-pink text-ink" : "text-ink-soft"}`}>
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
