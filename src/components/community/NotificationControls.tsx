"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { markAllReadAction } from "@/features/community/actions";
import { Feedback } from "@/components/ui/Feedback";

export function MarkAllRead({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState(false); // dims the unread rows at once, before the server answers
  return (
    <div className="flex flex-wrap items-center gap-3">
      {done && <style>{".unread-dot{display:none}"}</style>}
      <button type="button" className="btn-secondary min-h-12" disabled={disabled || done}
        onClick={() => { setDone(true); setResult({ ok: true, text: "All marked as read." }); start(async () => { const r = await markAllReadAction(); if (r.ok) router.refresh(); else { setDone(false); setResult({ ok: false, text: r.error }); } }); }}>
        <CheckCheck size={18} aria-hidden="true" /> Mark all as read
      </button>
      <Feedback kind={result?.ok ? "success" : "error"} message={result?.text} />
    </div>
  );
}
