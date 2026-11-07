import type { DataStepId, ReviewSection } from "@/lib/domain/onboarding";

export function ReviewCard({ sections, onEdit }: { sections: ReviewSection[]; onEdit: (step: DataStepId) => void }) {
  return (
    <ul className="space-y-3">
      {sections.map((s) => (
        <li key={s.step} className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">{s.title}</h2>
            <button type="button" onClick={() => onEdit(s.step)} aria-label={`Edit ${s.title}`}
              className="min-h-11 rounded-xl px-3 font-extrabold text-brand underline">
              Edit
            </button>
          </div>
          {s.lines.length > 0 ? (
            <dl className="mt-1 space-y-1">
              {s.lines.map((l) => (
                <div key={l.label} className="flex flex-wrap gap-x-2">
                  <dt className="font-bold text-ink-soft">{l.label}:</dt>
                  <dd className="min-w-0 break-words">{l.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-1 text-ink-soft">Skipped for now</p>
          )}
        </li>
      ))}
    </ul>
  );
}
