import type { ReactNode } from "react";

/** The one page-title pattern: title, optional short intro, optional action on the right. */
export function PageHeader({ title, intro, action }: { title: string; intro?: ReactNode; action?: ReactNode }) {
  return (
    <header className="rise flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <h1 className="h-page">{title}</h1>
        {intro && <p className="text-ink-soft">{intro}</p>}
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
