// Shown while a page in the signed-in app is loading. Shapes only; one status line for screen readers.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-9 w-2/3" aria-hidden="true" />
      <div className="skeleton h-4 w-full" aria-hidden="true" />
      <div className="skeleton h-4 w-5/6" aria-hidden="true" />
      <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
      </div>
    </div>
  );
}
