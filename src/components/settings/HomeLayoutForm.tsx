"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { updateSettingsAction } from "@/features/account/actions";
import { Feedback } from "@/components/ui/Feedback";
import { DEFAULT_LAYOUT, moveSection, toggleSection, type HomeLayout, type HomeSection } from "@/lib/domain/homeLayout";
import { useT } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n/en";

/** Show/hide switch and up/down buttons per Home section. Saves on every change; goes back if saving fails. */
export function HomeLayoutForm({ initial }: { initial: HomeLayout }) {
  const t = useT();
  const router = useRouter();
  const [layout, setLayout] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const name = (id: HomeSection) => t(`layout.${id}` as Key);

  const apply = (next: HomeLayout) => {
    if (next === layout) return;
    const before = layout;
    setLayout(next);
    start(async () => {
      const r = await updateSettingsAction({ homeLayout: next });
      if (r.ok) { setMsg({ ok: true, text: t("layout.saved") }); router.refresh(); }
      else { setLayout(before); setMsg({ ok: false, text: r.error }); }
    });
  };

  return (
    <div className="space-y-4">
      <ul className="list-group">
        {layout.map((s, i) => (
          <li key={s.id} className="list-row gap-2">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-6 w-6 shrink-0 accent-brand" checked={s.visible} disabled={pending} onChange={() => apply(toggleSection(layout, s.id))} aria-label={t("layout.show", { name: name(s.id) })} />
              <span className={`font-bold ${s.visible ? "" : "text-ink-soft line-through"}`}>{name(s.id)}</span>
            </label>
            <button type="button" className="btn-ghost h-11 w-11 p-0" disabled={pending || i === 0} aria-label={t("layout.up", { name: name(s.id) })} onClick={() => apply(moveSection(layout, s.id, -1))}><ArrowUp size={20} aria-hidden="true" /></button>
            <button type="button" className="btn-ghost h-11 w-11 p-0" disabled={pending || i === layout.length - 1} aria-label={t("layout.down", { name: name(s.id) })} onClick={() => apply(moveSection(layout, s.id, 1))}><ArrowDown size={20} aria-hidden="true" /></button>
          </li>
        ))}
      </ul>
      <Feedback kind={msg.ok ? "success" : "error"} message={msg.text} />
      <button type="button" className="btn-secondary w-full" disabled={pending} onClick={() => apply(DEFAULT_LAYOUT)}><RotateCcw size={18} aria-hidden="true" /> {t("layout.reset")}</button>
    </div>
  );
}
