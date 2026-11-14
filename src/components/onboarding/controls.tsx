import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Big tap target. Real radio/checkbox underneath, so keyboards and screen readers work. A check mark shows the choice (not color alone). */
export function Choice({
  type, name, value, label, checked, disabled, compact, onChange, onClear,
}: {
  type: "radio" | "checkbox"; name: string; value: string; label: string; checked: boolean; disabled?: boolean; compact?: boolean;
  onChange: () => void; onClear?: () => void;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input
        type={type} name={name} value={value} checked={checked} disabled={disabled} className="peer sr-only"
        onChange={onChange}
        // A radio cannot be unticked by the browser; tapping the chosen one again clears an optional answer.
        onClick={() => { if (type === "radio" && checked && onClear) onClear(); }}
      />
      <span className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-field bg-white py-3 text-center font-bold ${compact ? "px-2 text-sm" : "px-4 text-base"} text-ink transition active:scale-[.98] peer-checked:border-brand peer-checked:bg-tint-purple peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-disabled:cursor-not-allowed peer-disabled:opacity-50`}>
        {checked && <Check size={18} className="shrink-0 text-brand" aria-hidden="true" />}
        {label}
      </span>
    </label>
  );
}

export function Group({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-lg font-bold">{legend}</legend>
      {hint && <p className="-mt-1 text-sm text-ink-soft">{hint}</p>}
      {children}
    </fieldset>
  );
}

export function TextField({
  id, label, hint, value, onChange, maxLength, type = "text", inputMode, autoComplete, multiline, hideLabel,
}: {
  id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; maxLength?: number;
  type?: "text" | "tel"; inputMode?: "numeric" | "tel" | "text"; autoComplete?: string; multiline?: boolean; hideLabel?: boolean;
}) {
  const common = { id, value, maxLength, autoComplete, "aria-describedby": hint ? `${id}-hint` : undefined };
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "block font-display text-lg font-bold"}>{label}</label>
      {hint && <p id={`${id}-hint`} className="-mt-1 text-sm text-ink-soft">{hint}</p>}
      {multiline ? (
        <textarea {...common} rows={3} className="field min-h-24 py-3" onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} inputMode={inputMode} className="field" onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
