"use client";
import { Bookmark, BookmarkCheck, Check, Circle } from "lucide-react";
import { useArticleActions } from "@/features/content/useArticleActions";

export function ArticleActions({ slug, initial }: { slug: string; initial: { saved: boolean; read: boolean } }) {
  const a = useArticleActions(slug, initial);
  const base = "flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 font-extrabold active:scale-[.98]";
  return (
    <section aria-label="Your progress" className="space-y-2">
      <div className="flex gap-3">
        <button type="button" onClick={a.toggleRead} aria-pressed={a.read}
          className={`${base} ${a.read ? "border-mint-dark bg-tint-mint text-ink" : "border-field bg-white text-ink"}`}>
          {a.read ? <Check size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
          {a.read ? "Read" : "Mark as read"}
        </button>
        <button type="button" onClick={a.toggleSaved} aria-pressed={a.saved}
          className={`${base} ${a.saved ? "border-brand bg-tint-purple text-ink" : "border-field bg-white text-ink"}`}>
          {a.saved ? <BookmarkCheck size={20} aria-hidden="true" /> : <Bookmark size={20} aria-hidden="true" />}
          {a.saved ? "Saved" : "Save for later"}
        </button>
      </div>
      <p role="status" className="min-h-5 text-sm font-bold text-coral-dark">{a.error ?? ""}</p>
    </section>
  );
}
