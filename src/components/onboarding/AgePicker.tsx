import { ageText } from "@/lib/domain/onboarding";

const AGES = Array.from({ length: 19 }, (_, i) => i); // 0 (under 1) to 18, the range the server accepts

/**
 * Age as big tap targets instead of a typed number: no keyboard, no tiny steppers, no dropdown.
 * Real radio inputs underneath, so arrow keys and screen readers work. Tapping the chosen age again clears it.
 */
export function AgePicker({ value, onChange }: { value: number | null; onChange: (age: number | null) => void }) {
  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Your child&apos;s age in years</legend>
      <p aria-live="polite" className="flex min-h-14 items-center justify-center rounded-2xl bg-tint-purple px-4 text-center font-display text-2xl font-extrabold text-brand">
        {value === null ? "Pick an age below" : ageText(value)}
      </p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
        {AGES.map((age) => {
          const on = value === age;
          return (
            <label key={age} className="relative block cursor-pointer">
              <input type="radio" name="age" value={age} checked={on} className="peer sr-only"
                aria-label={age === 0 ? "Under 1 year" : age === 1 ? "1 year" : `${age} years`}
                onChange={() => onChange(age)}
                onClick={() => { if (on) onChange(null); }} />
              <span className="flex h-14 items-center justify-center rounded-2xl border-2 border-field bg-white text-lg font-extrabold text-ink transition-[background-color,border-color,transform] duration-150 active:scale-95 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                {age === 0 ? "<1" : age}
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-sm text-ink-soft">Tap your child&apos;s age in years. This is optional, and tapping it again clears it.</p>
    </fieldset>
  );
}
