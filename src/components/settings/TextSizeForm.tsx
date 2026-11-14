"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettingsAction } from "@/features/account/actions";
import { Feedback } from "@/components/ui/Feedback";
import { TEXT_SIZES, normalizeTextSize, type TextSize } from "@/lib/domain/textSize";

/** Three radio choices. Saves on tap, then refreshes so the whole app resizes; goes back if saving fails. */
export function TextSizeForm({ initial }: { initial: number }) {
  const router = useRouter();
  const [value, setValue] = useState<TextSize>(normalizeTextSize(initial));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const choose = (next: TextSize) => {
    if (next === value) return;
    const before = value;
    setValue(next); setMsg(null);
    start(async () => {
      const r = await updateSettingsAction({ textSize: next });
      if (r.ok) { setMsg({ ok: true, text: "Saved. The app now uses this size." }); router.refresh(); }
      else { setValue(before); setMsg({ ok: false, text: r.error }); }
    });
  };

  return (
    <fieldset className="space-y-3" disabled={pending}>
      <legend className="sr-only">Text size</legend>
      <div className="list-group">
        {TEXT_SIZES.map((s) => (
          <label key={s.value} className="list-row cursor-pointer">
            <input type="radio" name="text-size" className="h-5 w-5 shrink-0 accent-brand" checked={value === s.value} onChange={() => choose(s.value)} />
            <span className="min-w-0 flex-1"><span className="row-title block">{s.label}</span><span className="row-sub block">{s.sub}</span></span>
          </label>
        ))}
      </div>
      <Feedback kind={msg?.ok ? "success" : "error"} message={msg?.text} />
    </fieldset>
  );
}
