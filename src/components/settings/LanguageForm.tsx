"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguageAction } from "@/features/account/language";
import { Feedback } from "@/components/ui/Feedback";
import { LOCALES, type Locale } from "@/lib/i18n/core";
import { useT } from "@/lib/i18n/client";

/** One radio row per language. Saves on tap, then refreshes so the whole app switches; goes back if saving fails. */
export function LanguageForm({ initial }: { initial: Locale }) {
  const router = useRouter();
  const t = useT();
  const [value, setValue] = useState<Locale>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const choose = (next: Locale) => {
    if (next === value) return;
    const before = value;
    setValue(next); setMsg(null);
    start(async () => {
      const r = await setLanguageAction(next);
      if (r.ok) { setMsg({ ok: true, text: "" }); router.refresh(); }
      else { setValue(before); setMsg({ ok: false, text: r.error }); }
    });
  };

  return (
    <fieldset className="space-y-3" disabled={pending}>
      <legend className="sr-only">{t("lang.title")}</legend>
      <div className="list-group">
        {LOCALES.map((l) => (
          <label key={l.value} className="list-row cursor-pointer">
            <input type="radio" name="language" lang={l.value} className="h-5 w-5 shrink-0 accent-brand" checked={value === l.value} onChange={() => choose(l.value)} />
            <span className="min-w-0 flex-1"><span className="row-title block" lang={l.value}>{l.native}</span></span>
          </label>
        ))}
      </div>
      <Feedback kind={msg?.ok === false ? "error" : "success"} message={msg?.ok === false ? msg.text : msg?.ok ? t("lang.saved") : undefined} />
    </fieldset>
  );
}
