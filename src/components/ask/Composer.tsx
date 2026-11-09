"use client";
import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { MAX_INPUT_CHARS } from "@/lib/ai/limits";

export function Composer({ busy, onSend }: { busy: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const empty = text.trim() === "";

  function submit() {
    if (empty || busy) return;
    onSend(text);
    setText("");
    if (ref.current) ref.current.style.height = "";
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-1">
      <div className="flex items-end gap-2">
        <label htmlFor="ask-input" className="sr-only">Your question</label>
        <textarea
          id="ask-input" ref={ref} value={text} rows={1} maxLength={MAX_INPUT_CHARS} placeholder="Type your question"
          onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`; }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
          className="field min-h-14 flex-1 resize-none py-3.5 leading-snug"
        />
        <button type="submit" disabled={empty || busy} aria-label="Send" className="btn-primary h-14 w-14 shrink-0 p-0">
          <SendHorizontal size={22} aria-hidden="true" />
        </button>
      </div>
      {text.length >= MAX_INPUT_CHARS - 150 && <p className="text-right text-sm font-bold text-ink-soft" aria-live="polite">{text.length} / {MAX_INPUT_CHARS}</p>}
    </form>
  );
}
