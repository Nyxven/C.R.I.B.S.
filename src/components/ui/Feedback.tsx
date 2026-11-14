import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * A short result line under a button or form: what happened, in words, with an icon (never colour alone).
 * The wrapper is always in the page so screen readers announce changes; it keeps one line of height so nothing jumps.
 */
export function Feedback({ kind, message, className = "" }: { kind: "success" | "error"; message?: string | null; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={`min-h-6 text-sm font-bold ${className}`}>
      {message && (
        <span className={`rise inline-flex items-start gap-1.5 ${kind === "success" ? "text-mint-dark" : "text-coral-dark"}`}>
          {kind === "success" ? <CheckCircle2 size={18} className="mt-px shrink-0" aria-hidden="true" /> : <AlertCircle size={18} className="mt-px shrink-0" aria-hidden="true" />}
          <span>{message}</span>
        </span>
      )}
    </p>
  );
}
