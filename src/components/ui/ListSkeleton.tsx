/** Loading shape for a screen that is a title plus a list. Screen readers get one status line; the shapes are hidden. */
export function ListSkeleton({ rows = 5, intro = false }: { rows?: number; intro?: boolean }) {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="space-y-5">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-9 w-2/3" />
        {intro && <div className="skeleton h-4 w-5/6" />}
        <div className="list-group">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex min-h-16 items-center gap-3.5 px-4 py-3">
              <div className="skeleton h-10 w-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/3" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Loading shape for a reading page. */
export function ArticleSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="space-y-4">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton h-9 w-4/5" />
        <div className="skeleton h-7 w-28 rounded-full" />
        {[100, 96, 92, 100, 70].map((w, i) => <div key={i} className="skeleton h-4" style={{ width: `${w}%` }} />)}
      </div>
    </div>
  );
}
