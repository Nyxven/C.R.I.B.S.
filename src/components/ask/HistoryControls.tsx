"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAllThreadsAction, deleteThreadAction, setHistoryEnabledAction } from "@/features/ask/historyActions";

export function DeleteThreadButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <button type="button" disabled={pending} aria-label={`Delete chat: ${title}`} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-coral-dark"
        onClick={(e) => {
          // Hides the chat's row at once; shows it again if deleting fails.
          const row = e.currentTarget.closest("li");
          row?.setAttribute("hidden", "");
          start(async () => { const r = await deleteThreadAction(id); if (r.ok) router.refresh(); else { row?.removeAttribute("hidden"); setError(r.error); } });
        }}>
        <Trash2 size={20} aria-hidden="true" />
      </button>
      {error && <span role="status" className="sr-only">{error}</span>}
    </>
  );
}

export function DeleteAllButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sure, setSure] = useState(false);
  const [error, setError] = useState("");
  if (!sure) return <button type="button" disabled={disabled} onClick={() => setSure(true)} className="btn-secondary w-full">Delete all my chats</button>;
  return (
    <div className="space-y-2" role="alertdialog" aria-label="Confirm delete all chats">
      <p className="font-bold">Delete all saved chats? This cannot be undone.</p>
      <div className="flex gap-3">
        <button type="button" disabled={pending} onClick={() => start(async () => { const r = await deleteAllThreadsAction(); if (r.ok) { setSure(false); router.refresh(); } else setError(r.error); })} className="btn-primary flex-1">Yes, delete</button>
        <button type="button" onClick={() => setSure(false)} className="btn-secondary flex-1">Keep them</button>
      </div>
      <p role="status" className="text-sm font-bold text-coral-dark">{error}</p>
    </div>
  );
}

export function HistoryToggle({ enabled: initial }: { enabled: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(initial); // flips at once; goes back if saving fails
  return (
    <div className="space-y-1">
      <button type="button" role="switch" aria-checked={enabled}
        onClick={() => { const next = !enabled; setEnabled(next); setError(""); start(async () => { const r = await setHistoryEnabledAction(next); if (r.ok) router.refresh(); else { setEnabled(!next); setError(r.error); } }); }}
        className="card flex min-h-14 w-full items-center justify-between gap-3 p-4 text-left">
        <span><span className="block font-bold">Save my chats</span><span className="block text-sm text-ink-soft">{enabled ? "On: chats are kept for 30 days." : "Off: nothing is saved."}</span></span>
        <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${enabled ? "bg-tint-mint" : "bg-field"}`}>{enabled ? "On" : "Off"}</span>
      </button>
      <p role="status" className="text-sm font-bold text-coral-dark">{error}</p>
    </div>
  );
}
