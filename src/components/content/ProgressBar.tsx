import { progressLabel, type ModuleProgress } from "@/lib/domain/progress";

/** A small bar plus words ("2 of 3 read"). The words carry the meaning, the bar is only decoration. */
export function ProgressBar({ progress }: { progress: ModuleProgress }) {
  return (
    <div>
      <p className="text-sm font-bold">{progressLabel(progress)}</p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/70" aria-hidden="true">
        <div className="h-full rounded-full bg-brand" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}
