"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { Choice } from "@/components/onboarding/controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Feedback } from "@/components/ui/Feedback";
import { addLogAction, deleteLogAction } from "@/features/logs/actions";
import { CONTEXTS, INITIATIONS, MODES, PURPOSES, SETTINGS, summarizeBehavior, summarizeCommunication, toLocalInput, type BehaviorEntry, type CommunicationEntry } from "@/lib/domain/logs";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n/en";

type Kind = "behavior" | "communication";
type Msg = { ok: boolean; text: string };
const k = (s: string) => s as Key;

export function LogsView({ behavior, communication, startWith }: { behavior: BehaviorEntry[]; communication: CommunicationEntry[]; startWith?: Kind }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Kind>(startWith ?? "behavior");
  const [msg, setMsg] = useState<Msg>({ ok: true, text: "" });
  const sheet = useRef<HTMLDialogElement>(null);
  const now = new Date();
  const fmt = (d: Date) => new Date(d).toLocaleString(locale === "fil" ? "fil-PH" : "en-PH", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  // Opened from Home's quick buttons (/logs?add=behavior): go straight to the form.
  useEffect(() => { if (startWith) sheet.current?.showModal(); }, [startWith]);

  const bs = summarizeBehavior(behavior, now);
  const cs = summarizeCommunication(communication, now);
  const facts = tab === "behavior"
    ? [bs.avgIntensity !== null && t("logs.avgIntensity", { n: bs.avgIntensity }), bs.topSetting && t("logs.mostAt", { place: t(k(`logs.set.${bs.topSetting}`)) }), bs.topContext && t("logs.oftenWith", { context: t(k(`logs.ctx.${bs.topContext}`)) }), bs.busiestPart && t("logs.mostIn", { part: t(k(`logs.part.${bs.busiestPart}`)) })]
    : [cs.understoodPct !== null && t("logs.understoodPct", { n: cs.understoodPct }), cs.childLedPct !== null && t("logs.childLedPct", { n: cs.childLedPct }), cs.topMode && t("logs.mostlyBy", { mode: t(k(`logs.mode.${cs.topMode}`)) }), cs.topPurpose && t("logs.mostlyFor", { purpose: t(k(`logs.purp.${cs.topPurpose}`)) })];
  const count = tab === "behavior" ? bs.count : cs.count;

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label={t("logs.title")} className="grid grid-cols-2 gap-2 rounded-full bg-white p-1 shadow-sm">
        {(["behavior", "communication"] as const).map((x) => (
          <button key={x} role="tab" type="button" aria-selected={tab === x} onClick={() => setTab(x)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-full font-bold transition ${tab === x ? "bg-tint-purple text-brand" : "text-ink-soft"}`}>
            {x === "behavior" ? <Activity size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
            {x === "behavior" ? t("logs.tabBehavior") : t("logs.tabComm")}
          </button>
        ))}
      </div>

      <section className="composer-card space-y-2" aria-labelledby="week-h">
        <h2 id="week-h" className="flex items-center justify-between gap-2 font-display text-lg font-bold">{t("logs.week")}<span className="chip">{count === 1 ? t("logs.weekEntriesOne") : t("logs.weekEntries", { n: count })}</span></h2>
        {count > 0 ? <ul className="space-y-1 text-ink">{facts.filter(Boolean).map((f) => <li key={String(f)}>• {f}</li>)}</ul> : null}
        <button type="button" className="btn-primary mt-2 w-full" onClick={() => sheet.current?.showModal()}><Plus size={20} aria-hidden="true" /> {t("logs.add")}</button>
      </section>

      <Feedback kind={msg.ok ? "success" : "error"} message={msg.text} />

      <div role="tabpanel" aria-label={tab === "behavior" ? t("logs.tabBehavior") : t("logs.tabComm")}>
        {tab === "behavior" ? (
          behavior.length === 0 ? <EmptyState icon={Activity} title={t("logs.emptyBehavior")}>{t("logs.emptyBehaviorBody")}</EmptyState> : (
            <ul className="stagger space-y-3">
              {behavior.map((e) => (
                <EntryCard key={e.id} kind="behavior" id={e.id} when={fmt(e.occurredAt)} onChanged={(m) => { setMsg(m); router.refresh(); }}
                  chips={[e.setting && t(k(`logs.set.${e.setting}`)), e.intensity && `${e.intensity}/5`, e.durationMin != null && t("logs.minutes", { n: e.durationMin }), ...e.context.map((c) => t(k(`logs.ctx.${c}`)))]}>
                  <Row label="A" title={t("logs.before")} text={e.antecedent} />
                  <Row label="B" title={t("logs.behavior")} text={e.behavior} />
                  {e.consequence && <Row label="C" title={t("logs.after")} text={e.consequence} />}
                  {e.notes && <p className="text-sm text-ink-soft">{e.notes}</p>}
                </EntryCard>
              ))}
            </ul>
          )
        ) : (
          communication.length === 0 ? <EmptyState icon={MessageCircle} title={t("logs.emptyComm")}>{t("logs.emptyCommBody")}</EmptyState> : (
            <ul className="stagger space-y-3">
              {communication.map((e) => (
                <EntryCard key={e.id} kind="communication" id={e.id} when={fmt(e.occurredAt)} onChanged={(m) => { setMsg(m); router.refresh(); }}
                  chips={[t(k(`logs.mode.${e.mode}`)), t(k(`logs.init.${e.initiation}`)), t(k(`logs.purp.${e.purpose}`)), e.understood ? `✓ ${t("logs.understood")}` : `✗ ${t("logs.understood")}`, e.setting && t(k(`logs.set.${e.setting}`)), ...e.context.map((c) => t(k(`logs.ctx.${c}`)))]}>
                  {e.example && <p className="text-lg leading-relaxed">“{e.example}”</p>}
                  {e.notes && <p className="text-sm text-ink-soft">{e.notes}</p>}
                </EntryCard>
              ))}
            </ul>
          )
        )}
      </div>

      <p className="flex items-start gap-2 text-sm text-ink-soft"><Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{t("logs.private")}</p>

      <dialog ref={sheet} className="sheet" aria-labelledby="log-form-h">
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="log-form-h" className="h-section">{tab === "behavior" ? t("logs.addBehavior") : t("logs.addComm")}</h2>
            <button type="button" onClick={() => sheet.current?.close()} className="btn-ghost h-11 w-11 shrink-0 p-0" aria-label={t("logs.cancel")}><X size={22} aria-hidden="true" /></button>
          </div>
          {tab === "behavior"
            ? <BehaviorForm key={`b-${behavior.length}`} onSaved={() => { sheet.current?.close(); setMsg({ ok: true, text: t("logs.saved") }); router.refresh(); }} />
            : <CommunicationForm key={`c-${communication.length}`} onSaved={() => { sheet.current?.close(); setMsg({ ok: true, text: t("logs.saved") }); router.refresh(); }} />}
        </div>
      </dialog>
    </div>
  );
}

function Row({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint-purple text-sm font-extrabold text-brand">{label}</span>
      <p className="min-w-0"><span className="sr-only">{title}: </span><span className="whitespace-pre-wrap break-words">{text}</span></p>
    </div>
  );
}

function EntryCard({ kind, id, when, chips, children, onChanged }: { kind: Kind; id: string; when: string; chips: (string | false | null | 0 | undefined)[]; children: React.ReactNode; onChanged: (m: Msg) => void }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  return (
    <li className="post-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{when}</p>
        {!confirming && <button type="button" aria-label={t("logs.delete")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-tint-coral hover:text-coral-dark" onClick={() => setConfirming(true)}><Trash2 size={18} aria-hidden="true" /></button>}
      </div>
      {chips.some(Boolean) && <div className="flex flex-wrap gap-1.5">{chips.filter(Boolean).map((c, i) => <span key={i} className="chip bg-cream">{c}</span>)}</div>}
      {children}
      {confirming && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-tint-coral p-3" role="group" aria-label={t("logs.deleteConfirm")}>
          <span className="flex-1 font-bold">{t("logs.deleteConfirm")}</span>
          <button type="button" className="btn-secondary min-h-10 px-4" onClick={() => setConfirming(false)}>{t("logs.keep")}</button>
          <button type="button" className="btn-danger min-h-10 px-4" disabled={pending}
            onClick={() => start(async () => { const r = await deleteLogAction({ kind, id }); onChanged(r.ok ? { ok: true, text: t("logs.deleted") } : { ok: false, text: r.error }); setConfirming(false); })}>{t("logs.yesDelete")}</button>
        </div>
      )}
    </li>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-bold">{label}</label>
      {hint && <p id={`${id}-hint`} className="text-sm text-ink-soft">{hint}</p>}
      {children}
    </div>
  );
}

function Chips<T extends string>({ legend, name, options, label, value, onChange, multi }: { legend: string; name: string; options: readonly T[]; label: (v: T) => string; value: T[] ; onChange: (v: T[]) => void; multi?: boolean }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="font-bold">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <Choice key={o} compact type={multi ? "checkbox" : "radio"} name={name} value={o} label={label(o)} checked={value.includes(o)}
            onChange={() => onChange(multi ? (value.includes(o) ? value.filter((x) => x !== o) : [...value, o]) : [o])}
            onClear={multi ? undefined : () => onChange([])} />
        ))}
      </div>
    </fieldset>
  );
}

function useSave(kind: Kind, onSaved: () => void) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const save = (data: object) => start(async () => { const r = await addLogAction(kind, data); if (r.ok) onSaved(); else setError(r.error); });
  return { pending, error, save };
}

function BehaviorForm({ onSaved }: { onSaved: () => void }) {
  const t = useT();
  const { pending, error, save } = useSave("behavior", onSaved);
  const [when, setWhen] = useState(() => toLocalInput(new Date()));
  const [setting, setSetting] = useState<string[]>([]);
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [c, setC] = useState("");
  const [intensity, setIntensity] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [ctx, setCtx] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); save({ occurredAt: new Date(when).toISOString(), setting: setting[0] ?? null, antecedent: a, behavior: b, consequence: c, intensity: intensity[0] ? Number(intensity[0]) : null, durationMin: duration === "" ? null : Number(duration), context: ctx, notes }); }}>
      <Field id="b-when" label={t("logs.when")}><input id="b-when" type="datetime-local" className="field" value={when} max={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} required /></Field>
      <Chips legend={t("logs.where")} name="b-setting" options={SETTINGS} label={(v) => t(k(`logs.set.${v}`))} value={setting as (typeof SETTINGS)[number][]} onChange={setSetting} />
      <Field id="b-a" label={t("logs.before")} hint={t("logs.beforeHint")}><textarea id="b-a" aria-describedby="b-a-hint" className="field min-h-20 py-3" maxLength={500} value={a} onChange={(e) => setA(e.target.value)} required /></Field>
      <Field id="b-b" label={t("logs.behavior")} hint={t("logs.behaviorHint")}><textarea id="b-b" aria-describedby="b-b-hint" className="field min-h-20 py-3" maxLength={500} value={b} onChange={(e) => setB(e.target.value)} required /></Field>
      <Field id="b-c" label={t("logs.after")} hint={t("logs.afterHint")}><textarea id="b-c" aria-describedby="b-c-hint" className="field min-h-20 py-3" maxLength={500} value={c} onChange={(e) => setC(e.target.value)} /></Field>
      <fieldset className="space-y-1.5">
        <legend className="font-bold">{t("logs.intensity")}</legend>
        <div className="grid grid-cols-5 gap-2">
          {["1", "2", "3", "4", "5"].map((n) => <Choice key={n} compact type="radio" name="b-int" value={n} label={n} checked={intensity.includes(n)} onChange={() => setIntensity([n])} onClear={() => setIntensity([])} />)}
        </div>
        <p className="flex justify-between text-sm text-ink-soft"><span>{t("logs.mild")}</span><span>{t("logs.severe")}</span></p>
      </fieldset>
      <Field id="b-dur" label={t("logs.duration")}><input id="b-dur" type="number" inputMode="numeric" min={0} max={600} className="field" value={duration} onChange={(e) => setDuration(e.target.value)} /></Field>
      <Chips multi legend={t("logs.context")} name="b-ctx" options={CONTEXTS} label={(v) => t(k(`logs.ctx.${v}`))} value={ctx as (typeof CONTEXTS)[number][]} onChange={setCtx} />
      <Field id="b-notes" label={t("logs.notes")}><textarea id="b-notes" className="field min-h-16 py-3" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      {error && <p role="alert" className="notice notice-error">{error}</p>}
      <button className="btn-primary w-full" disabled={pending || a.trim().length < 2 || b.trim().length < 2}>{pending ? t("logs.saving") : t("logs.save")}</button>
    </form>
  );
}

function CommunicationForm({ onSaved }: { onSaved: () => void }) {
  const t = useT();
  const { pending, error, save } = useSave("communication", onSaved);
  const [when, setWhen] = useState(() => toLocalInput(new Date()));
  const [mode, setMode] = useState<string[]>([]);
  const [init, setInit] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<string[]>([]);
  const [understood, setUnderstood] = useState<string[]>([]);
  const [setting, setSetting] = useState<string[]>([]);
  const [example, setExample] = useState("");
  const [ctx, setCtx] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const ready = mode.length && init.length && purpose.length && understood.length;
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); save({ occurredAt: new Date(when).toISOString(), mode: mode[0], initiation: init[0], purpose: purpose[0], understood: understood[0] === "yes", setting: setting[0] ?? null, example, context: ctx, notes }); }}>
      <Field id="c-when" label={t("logs.when")}><input id="c-when" type="datetime-local" className="field" value={when} max={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} required /></Field>
      <Chips legend={t("logs.mode")} name="c-mode" options={MODES} label={(v) => t(k(`logs.mode.${v}`))} value={mode as (typeof MODES)[number][]} onChange={setMode} />
      <Chips legend={t("logs.initiation")} name="c-init" options={INITIATIONS} label={(v) => t(k(`logs.init.${v}`))} value={init as (typeof INITIATIONS)[number][]} onChange={setInit} />
      <Chips legend={t("logs.purpose")} name="c-purp" options={PURPOSES} label={(v) => t(k(`logs.purp.${v}`))} value={purpose as (typeof PURPOSES)[number][]} onChange={setPurpose} />
      <Chips legend={t("logs.understood")} name="c-und" options={["yes", "no"] as const} label={(v) => t(v === "yes" ? "logs.yes" : "logs.no")} value={understood as ("yes" | "no")[]} onChange={setUnderstood} />
      <Field id="c-ex" label={t("logs.example")} hint={t("logs.exampleHint")}><input id="c-ex" aria-describedby="c-ex-hint" className="field" maxLength={200} value={example} onChange={(e) => setExample(e.target.value)} /></Field>
      <Chips legend={t("logs.where")} name="c-setting" options={SETTINGS} label={(v) => t(k(`logs.set.${v}`))} value={setting as (typeof SETTINGS)[number][]} onChange={setSetting} />
      <Chips multi legend={t("logs.context")} name="c-ctx" options={CONTEXTS} label={(v) => t(k(`logs.ctx.${v}`))} value={ctx as (typeof CONTEXTS)[number][]} onChange={setCtx} />
      <Field id="c-notes" label={t("logs.notes")}><textarea id="c-notes" className="field min-h-16 py-3" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      {error && <p role="alert" className="notice notice-error">{error}</p>}
      <button className="btn-primary w-full" disabled={pending || !ready}>{pending ? t("logs.saving") : t("logs.save")}</button>
    </form>
  );
}
