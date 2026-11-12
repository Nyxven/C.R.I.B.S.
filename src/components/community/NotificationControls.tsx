"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllReadAction } from "@/features/community/actions";

export function MarkAllRead({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div>
      <button type="button" className="btn-secondary" disabled={disabled || pending} onClick={() => start(async () => { const r = await markAllReadAction(); if (r.ok) router.refresh(); else setError(r.error); })}>Mark all as read</button>
      <p role="status" className="text-sm font-bold text-coral-dark">{error}</p>
    </div>
  );
}
