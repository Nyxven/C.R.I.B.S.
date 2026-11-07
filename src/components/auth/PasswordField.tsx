"use client";
import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { PASSWORD_MIN } from "@/lib/formChecks";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "new-password" | "current-password";
  error?: string;
  /** Show the "At least 10 characters" rule up front (sign-up and reset only). */
  showRule?: boolean;
};

/** Password input with a 44px+ show/hide button and the rule shown before the person types. UI only. */
export function PasswordField({ id, label, value, onChange, autoComplete, error, showRule }: Props) {
  const [show, setShow] = useState(false);
  const ruleId = `${id}-rule`;
  const errId = `${id}-error`;
  const describedBy = [showRule ? ruleId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined;
  const ok = value.length >= PASSWORD_MIN;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold">{label}</label>
      <div className="relative mt-1">
        <input id={id} className="field pr-14" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete} aria-invalid={error ? true : undefined} aria-describedby={describedBy} />
        <button type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-label="Show password"
          className="absolute right-1 top-1 flex h-12 w-12 items-center justify-center rounded-full text-ink-soft">
          {show ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}
        </button>
      </div>
      {showRule && (
        <p id={ruleId} className={`mt-1 flex items-center gap-1 text-sm ${ok ? "font-bold text-sage-dark" : "text-ink-soft"}`}>
          {ok && <Check size={16} aria-hidden="true" />}At least {PASSWORD_MIN} characters{ok ? ". Good." : ""}
        </p>
      )}
      {error && <p id={errId} role="alert" className="mt-1 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
