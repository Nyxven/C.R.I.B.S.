import type { ReactNode } from "react";

/** The one page-title pattern: title, optional short intro, optional action on the right. */
export function PageHeader({ title, intro, action }: { title: string; intro?: ReactNode; action?: ReactNode }) {
  return (
    // On a narrow phone the action wraps under the title instead of squeezing it into a thin column.
    <header className="rise flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-[min(100%,14rem)] flex-1 space-y-2">
        <h1 className="h-page">{title}</h1>
        {intro && <p className="text-ink-soft">{intro}</p>}
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
