"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateAction } from "@/features/community/actions";

export function ModerationButtons({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const go = (action: "restore" | "remove") => start(async () => { const r = await moderateAction({ postId, action }); if (r.ok) router.refresh(); else setError(r.error); });
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
