"use client";
import { useEffect, useRef, useState } from "react";
import { OTP_LENGTH, applyBackspace, applyDelete, applyInput, applyPaste, emptyOtp, isComplete, moveFocus, otpValue, type OtpState } from "@/lib/otp";

type Props = {
  /** Spoken name of the whole group, e.g. "6-digit code". */
  label: string;
  /** Called once when the 6th digit is in. Use it to auto-submit. */
  onComplete: (code: string) => void;
  onChange?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** id of the element that explains an error. */
  describedBy?: string;
  autoFocus?: boolean;
};

/**
 * Six digit boxes. UI only: all the typing rules live in `@/lib/otp`.
 * To clear it after a wrong code, change its `key` (it starts empty and focuses the first box).
 */
export function OtpInput({ label, onComplete, onChange, disabled, invalid, describedBy, autoFocus = true }: Props) {
  const [s, setS] = useState<OtpState>(() => emptyOtp());
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function go(next: OtpState) {
    const before = otpValue(s);
    const after = otpValue(next);
    setS(next);
    refs.current[next.focus]?.focus();
    if (after !== before) {
      onChange?.(after);
      if (isComplete(next)) onComplete(after);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.metaKey || e.ctrlKey || e.altKey) return; // keep copy/paste shortcuts working
    switch (e.key) {
      case "Backspace": e.preventDefault(); go(applyBackspace(s, i)); break;
      case "Delete": e.preventDefault(); go(applyDelete(s, i)); break;
      case "ArrowLeft": e.preventDefault(); go(moveFocus(s, i, "left")); break;
      case "ArrowRight": e.preventDefault(); go(moveFocus(s, i, "right")); break;
      case "Home": e.preventDefault(); go(moveFocus(s, i, "first")); break;
      case "End": e.preventDefault(); go(moveFocus(s, i, "last")); break;
    }
  }

  return (
    <div role="group" aria-label={label} aria-describedby={describedBy} className={`flex justify-center gap-2 sm:gap-3 ${invalid ? "otp-shake" : ""}`}>
      {s.digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          disabled={disabled}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? OTP_LENGTH : 2}
          aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => go(applyInput(s, i, e.target.value))}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={(e) => { e.preventDefault(); go(applyPaste(s, i, e.clipboardData.getData("text"))); }}
          onFocus={(e) => e.currentTarget.select()}
          className={`h-14 w-11 rounded-2xl border-2 bg-white text-center font-display text-2xl font-bold text-ink outline-none transition focus:ring-4 disabled:opacity-60 sm:h-16 sm:w-14 ${
            invalid ? "border-red-700 bg-red-50 focus:ring-red-700/30" : "border-field focus:border-brand focus:ring-brand/30"
          }`}
        />
      ))}
    </div>
  );
}
