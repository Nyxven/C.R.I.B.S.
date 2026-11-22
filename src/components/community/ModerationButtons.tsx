"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateAction } from "@/features/community/actions";

export function ModerationButtons({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [doneAs, setDoneAs] = useState<"" | "restore" | "remove">("");
  // Shows the decision at once; the list refreshes when the server confirms, or the buttons come back if it fails.
  const go = (action: "restore" | "remove") => { setDoneAs(action); setError(""); start(async () => { const r = await moderateAction({ postId, action }); if (r.ok) router.refresh(); else { setDoneAs(""); setError(r.error); } }); };
  if (doneAs) return <p role="status" className="font-bold text-ink-soft">{doneAs === "restore" ? "Put back." : "Removed."}</p>;
  return (
    <div className="space-y-1">
      <div className="flex gap-3">
        <button type="button" className="btn-primary flex-1" disabled={pending} onClick={() => go("restore")}>Put back</button>
        <button type="button" className="btn-secondary flex-1" disabled={pending} onClick={() => go("remove")}>Remove</button>
      </div>
      <p role="status" className="text-sm font-bold text-coral-dark">{error}</p>
    </div>
  );
}
