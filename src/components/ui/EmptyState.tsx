import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/** For any list that can start empty: say what the feature is for, then give one next step. */
export function EmptyState({ icon: Icon, title, children, actionHref, actionLabel, secondaryHref, secondaryLabel }: {
  icon: LucideIcon; title: string; children: React.ReactNode; actionHref?: string; actionLabel?: string; secondaryHref?: string; secondaryLabel?: string;
}) {
  return (
    <div className="rise flex flex-col items-center gap-3 rounded-3xl border border-dashed border-field bg-white px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tint-purple text-brand"><Icon size={28} aria-hidden="true" /></span>
      <h2 className="h-section">{title}</h2>
      <p className="max-w-sm text-ink-soft">{children}</p>
      {(actionHref && actionLabel) || (secondaryHref && secondaryLabel) ? (
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          {actionHref && actionLabel && <Link href={actionHref} className="btn-primary">{actionLabel}</Link>}
          {secondaryHref && secondaryLabel && <Link href={secondaryHref} className="btn-secondary">{secondaryLabel}</Link>}
        </div>
      ) : null}
    </div>
  );
}
