"use client";
import { Bookmark, BookmarkCheck, Check, Circle } from "lucide-react";
import { Feedback } from "@/components/ui/Feedback";
import { useArticleActions } from "@/features/content/useArticleActions";
import { useT } from "@/lib/i18n/client";

export function ArticleActions({ slug, initial }: { slug: string; initial: { saved: boolean; read: boolean } }) {
  const t = useT();
  const a = useArticleActions(slug, initial);
  const base = "flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 font-extrabold transition-[transform,background-color,border-color] duration-150 active:scale-[.98]";
  return (
    <section aria-label={t("article.progress")} className="space-y-2">
      <div className="flex gap-3">
        <button type="button" onClick={a.toggleRead} aria-pressed={a.read}
          className={`${base} ${a.read ? "border-mint-dark bg-tint-mint text-ink" : "border-field bg-white text-ink"}`}>
          {a.read ? <Check size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
          {a.read ? t("article.read") : t("article.markRead")}
        </button>
        <button type="button" onClick={a.toggleSaved} aria-pressed={a.saved}
          className={`${base} ${a.saved ? "border-brand bg-tint-purple text-ink" : "border-field bg-white text-ink"}`}>
          {a.saved ? <BookmarkCheck size={20} aria-hidden="true" /> : <Bookmark size={20} aria-hidden="true" />}
          {a.saved ? t("article.saved") : t("article.save")}
        </button>
      </div>
      <Feedback kind={a.error ? "error" : "success"} message={a.error ?? a.done} />
    </section>
  );
}
