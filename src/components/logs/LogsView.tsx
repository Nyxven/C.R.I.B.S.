"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { Choice } from "@/components/onboarding/controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Feedback } from "@/components/ui/Feedback";
import { addLogAction, deleteLogAction } from "@/features/logs/actions";
import { CONTEXTS, INITIATIONS, isOption, MODES, PURPOSES, SETTINGS, summarizeBehavior, summarizeCommunication, toLocalInput, withOther, type BehaviorEntry, type CommunicationEntry } from "@/lib/domain/logs";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n/en";

type Kind = "behavior" | "communication";
type Msg = { ok: boolean; text: string };
const k = (s: string) => s as Key;

/** Translated label for a known option; the parent's own "Other" text is shown as they typed it. */
function useLabel() {
  const t = useT();
  return (prefix: string, list: readonly string[], v: string | null | undefined) => (!v ? "" : isOption(list, v) ? t(k(`${prefix}.${v}`)) : v);
}

export function LogsView({ behavior, communication, startWith }: { behavior: BehaviorEntry[]; communication: CommunicationEntry[]; startWith?: Kind }) {
  const t = useT();
  const lab = useLabel();
  const locale = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Kind>(startWith ?? "behavior");
  const [msg, setMsg] = useState<Msg>({ ok: true, text: "" });
  // Optimistic copies: new entries show at once, deleted ones vanish at once; the server catches up behind.
  const [bList, setBList] = useState(behavior);
  const [cList, setCList] = useState(communication);
  useEffect(() => setBList(behavior), [behavior]);
  useEffect(() => setCList(communication), [communication]);
  const sheet = useRef<HTMLDialogElement>(null);
  const now = new Date();
  const fmt = (d: Date) => new Date(d).toLocaleString(locale === "fil" ? "fil-PH" : "en-PH", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  // Opened from Home's quick buttons (/logs?add=behavior): go straight to the form.
  useEffect(() => { if (startWith) sheet.current?.showModal(); }, [startWith]);

  const bs = summarizeBehavior(bList, now);
  const cs = summarizeCommunication(cList, now);
  const facts = tab === "behavior"
    ? [bs.avgIntensity !== null && t("logs.avgIntensity", { n: bs.avgIntensity }), bs.topSetting && t("logs.mostAt", { place: lab("logs.set", SETTINGS, bs.topSetting) }), bs.topContext && t("logs.oftenWith", { context: lab("logs.ctx", CONTEXTS, bs.topContext) }), bs.busiestPart && t("logs.mostIn", { part: t(k(`logs.part.${bs.busiestPart}`)) })]
    : [cs.understoodPct !== null && t("logs.understoodPct", { n: cs.understoodPct }), cs.childLedPct !== null && t("logs.childLedPct", { n: cs.childLedPct }), cs.topMode && t("logs.mostlyBy", { mode: lab("logs.mode", MODES, cs.topMode) }), cs.topPurpose && t("logs.mostlyFor", { purpose: lab("logs.purp", PURPOSES, cs.topPurpose) })];
  const count = tab === "behavior" ? bs.count : cs.count;

  // Add: show the entry and close the form at once; if the server says no, take it back and reopen the form with the reason.
  const add = (kind: Kind, data: Record<string, unknown>, entry: BehaviorEntry | CommunicationEntry, fail: (e: string) => void) => {
    const tempId = entry.id;
    if (kind === "behavior") setBList((l) => [entry as BehaviorEntry, ...l]); else setCList((l) => [entry as CommunicationEntry, ...l]);
    sheet.current?.close();
    setMsg({ ok: true, text: t("logs.saved") });
    void addLogAction(kind, data).then((r) => {
      if (r.ok) { router.refresh(); return; }
      if (kind === "behavior") setBList((l) => l.filter((e) => e.id !== tempId)); else setCList((l) => l.filter((e) => e.id !== tempId));
      setMsg({ ok: false, text: r.error });
      fail(r.error);
      sheet.current?.showModal();
    });
  };

  // Delete: remove at once; put it back if the server says no.
  const remove = (kind: Kind, id: string) => {
    const list = kind === "behavior" ? bList : cList;
    const gone = list.find((e) => e.id === id);
    if (kind === "behavior") setBList((l) => l.filter((e) => e.id !== id)); else setCList((l) => l.filter((e) => e.id !== id));
    setMsg({ ok: true, text: t("logs.deleted") });
    if (id.startsWith("tmp-")) return; // never reached the server
    void deleteLogAction({ kind, id }).then((r) => {
      if (r.ok || !gone) { router.refresh(); return; }
      if (kind === "behavior") setBList((l) => [gone as BehaviorEntry, ...l]); else setCList((l) => [gone as CommunicationEntry, ...l]);
      setMsg({ ok: false, text: r.error });
    });
  };

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
          bList.length === 0 ? <EmptyState icon={Activity} title={t("logs.emptyBehavior")}>{t("logs.emptyBehaviorBody")}</EmptyState> : (
            <ul className="space-y-3">
              {bList.map((e) => (
                <EntryCard key={e.id} when={fmt(e.occurredAt)} onDelete={() => remove("behavior", e.id)}
                  chips={[lab("logs.set", SETTINGS, e.setting), e.intensity && `${e.intensity}/5`, e.durationMin != null && t("logs.minutes", { n: e.durationMin }), ...e.context.map((c) => lab("logs.ctx", CONTEXTS, c))]}>
                  <Row label="A" title={t("logs.before")} text={e.antecedent} />
                  <Row label="B" title={t("logs.behavior")} text={e.behavior} />
                  {e.consequence && <Row label="C" title={t("logs.after")} text={e.consequence} />}
                  {e.notes && <p className="text-sm text-ink-soft">{e.notes}</p>}
                </EntryCard>
              ))}
            </ul>
          )
        ) : (
          cList.length === 0 ? <EmptyState icon={MessageCircle} title={t("logs.emptyComm")}>{t("logs.emptyCommBody")}</EmptyState> : (
            <ul className="space-y-3">
              {cList.map((e) => (
                <EntryCard key={e.id} when={fmt(e.occurredAt)} onDelete={() => remove("communication", e.id)}
                  chips={[lab("logs.mode", MODES, e.mode), t(k(`logs.init.${e.initiation}`)), lab("logs.purp", PURPOSES, e.purpose), e.understood ? `✓ ${t("logs.understoodYes")}` : `✗ ${t("logs.understoodNo")}`, lab("logs.set", SETTINGS, e.setting), ...e.context.map((c) => lab("logs.ctx", CONTEXTS, c))]}>
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
          {tab === "behavior" ? <BehaviorForm onAdd={(d, e, fail) => add("behavior", d, e, fail)} /> : <CommunicationForm onAdd={(d, e, fail) => add("communication", d, e, fail)} />}
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

function EntryCard({ when, chips, children, onDelete }: { when: string; chips: (string | false | null | 0 | undefined)[]; children: React.ReactNode; onDelete: () => void }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
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
          <button type="button" className="btn-danger min-h-10 px-4" onClick={onDelete}>{t("logs.yesDelete")}</button>
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

/** Chip choices. When "other" is picked, a short text box appears so the parent can say what it is. */
function Chips<T extends string>({ legend, name, options, label, value, onChange, multi, other, onOther }: {
  legend: string; name: string; options: readonly T[]; label: (v: T) => string; value: T[]; onChange: (v: T[]) => void; multi?: boolean;
  other?: string; onOther?: (v: string) => void;
}) {
  const t = useT();
  const showOther = onOther && value.includes("other" as T);
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
      {showOther && (
        <input aria-label={`${legend}: ${t("logs.otherType")}`} placeholder={t("logs.otherType")} className="field" maxLength={40} value={other ?? ""} onChange={(e) => onOther(e.target.value)} autoFocus />
      )}
    </fieldset>
  );
}

const tmpId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
type OnAdd<E> = (data: Record<string, unknown>, entry: E, fail: (error: string) => void) => void;

function BehaviorForm({ onAdd }: { onAdd: OnAdd<BehaviorEntry> }) {
  const t = useT();
  const blank = () => ({ when: toLocalInput(new Date()), setting: [] as string[], settingOther: "", a: "", b: "", c: "", intensity: [] as string[], duration: "", ctx: [] as string[], ctxOther: "", notes: "" });
  const [f, setF] = useState(blank);
  const [error, setError] = useState("");
  const set = (p: Partial<ReturnType<typeof blank>>) => setF((x) => ({ ...x, ...p }));
  const submit = () => {
    setError("");
    const context = f.ctx.map((c) => withOther(c, f.ctxOther)!);
    const data = { occurredAt: new Date(f.when).toISOString(), setting: withOther(f.setting[0], f.settingOther) ?? null, antecedent: f.a.trim(), behavior: f.b.trim(), consequence: f.c, intensity: f.intensity[0] ? Number(f.intensity[0]) : null, durationMin: f.duration === "" ? null : Number(f.duration), context, notes: f.notes };
    const entry: BehaviorEntry = { id: tmpId(), occurredAt: new Date(f.when), setting: data.setting, antecedent: data.antecedent, behavior: data.behavior, consequence: f.c.trim() || null, intensity: data.intensity, durationMin: data.durationMin, context, notes: f.notes.trim() || null };
    const kept = f;
    setF(blank());
    onAdd(data, entry, (e) => { setF(kept); setError(e); }); // on failure the form comes back filled in
  };
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <Field id="b-when" label={t("logs.when")}><input id="b-when" type="datetime-local" className="field" value={f.when} max={toLocalInput(new Date())} onChange={(e) => set({ when: e.target.value })} required /></Field>
      <Chips legend={t("logs.where")} name="b-setting" options={SETTINGS} label={(v) => t(k(`logs.set.${v}`))} value={f.setting as (typeof SETTINGS)[number][]} onChange={(v) => set({ setting: v })} other={f.settingOther} onOther={(v) => set({ settingOther: v })} />
      <Field id="b-a" label={t("logs.before")} hint={t("logs.beforeHint")}><textarea id="b-a" aria-describedby="b-a-hint" className="field min-h-20 py-3" maxLength={500} value={f.a} onChange={(e) => set({ a: e.target.value })} required /></Field>
      <Field id="b-b" label={t("logs.behavior")} hint={t("logs.behaviorHint")}><textarea id="b-b" aria-describedby="b-b-hint" className="field min-h-20 py-3" maxLength={500} value={f.b} onChange={(e) => set({ b: e.target.value })} required /></Field>
      <Field id="b-c" label={t("logs.after")} hint={t("logs.afterHint")}><textarea id="b-c" aria-describedby="b-c-hint" className="field min-h-20 py-3" maxLength={500} value={f.c} onChange={(e) => set({ c: e.target.value })} /></Field>
      <fieldset className="space-y-1.5">
        <legend className="font-bold">{t("logs.intensity")}</legend>
        <div className="grid grid-cols-5 gap-2">
          {["1", "2", "3", "4", "5"].map((n) => <Choice key={n} compact type="radio" name="b-int" value={n} label={n} checked={f.intensity.includes(n)} onChange={() => set({ intensity: [n] })} onClear={() => set({ intensity: [] })} />)}
        </div>
        <p className="flex justify-between text-sm text-ink-soft"><span>{t("logs.mild")}</span><span>{t("logs.severe")}</span></p>
      </fieldset>
      <Field id="b-dur" label={t("logs.duration")}><input id="b-dur" type="number" inputMode="numeric" min={0} max={600} className="field" value={f.duration} onChange={(e) => set({ duration: e.target.value })} /></Field>
      <Chips multi legend={t("logs.context")} name="b-ctx" options={CONTEXTS} label={(v) => t(k(`logs.ctx.${v}`))} value={f.ctx as (typeof CONTEXTS)[number][]} onChange={(v) => set({ ctx: v })} other={f.ctxOther} onOther={(v) => set({ ctxOther: v })} />
      <Field id="b-notes" label={t("logs.notes")}><textarea id="b-notes" className="field min-h-16 py-3" maxLength={500} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
      {error && <p role="alert" className="notice notice-error">{error}</p>}
      <button className="btn-primary w-full" disabled={f.a.trim().length < 2 || f.b.trim().length < 2}>{t("logs.save")}</button>
    </form>
  );
}

function CommunicationForm({ onAdd }: { onAdd: OnAdd<CommunicationEntry> }) {
  const t = useT();
  const blank = () => ({ when: toLocalInput(new Date()), mode: [] as string[], modeOther: "", init: [] as string[], purpose: [] as string[], purposeOther: "", understood: [] as string[], setting: [] as string[], settingOther: "", example: "", ctx: [] as string[], ctxOther: "", notes: "" });
  const [f, setF] = useState(blank);
  const [error, setError] = useState("");
  const set = (p: Partial<ReturnType<typeof blank>>) => setF((x) => ({ ...x, ...p }));
  const ready = f.mode.length && f.init.length && f.purpose.length && f.understood.length;
  const submit = () => {
    setError("");
    const context = f.ctx.map((c) => withOther(c, f.ctxOther)!);
    const data = { occurredAt: new Date(f.when).toISOString(), mode: withOther(f.mode[0], f.modeOther), initiation: f.init[0], purpose: withOther(f.purpose[0], f.purposeOther), understood: f.understood[0] === "yes", setting: withOther(f.setting[0], f.settingOther) ?? null, example: f.example, context, notes: f.notes };
    const entry: CommunicationEntry = { id: tmpId(), occurredAt: new Date(f.when), mode: data.mode!, initiation: data.initiation!, purpose: data.purpose!, understood: data.understood, setting: data.setting, example: f.example.trim() || null, context, notes: f.notes.trim() || null };
    const kept = f;
    setF(blank());
    onAdd(data, entry, (e) => { setF(kept); setError(e); });
  };
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <Field id="c-when" label={t("logs.when")}><input id="c-when" type="datetime-local" className="field" value={f.when} max={toLocalInput(new Date())} onChange={(e) => set({ when: e.target.value })} required /></Field>
      <Chips legend={t("logs.mode")} name="c-mode" options={MODES} label={(v) => t(k(`logs.mode.${v}`))} value={f.mode as (typeof MODES)[number][]} onChange={(v) => set({ mode: v })} other={f.modeOther} onOther={(v) => set({ modeOther: v })} />
      <Chips legend={t("logs.initiation")} name="c-init" options={INITIATIONS} label={(v) => t(k(`logs.init.${v}`))} value={f.init as (typeof INITIATIONS)[number][]} onChange={(v) => set({ init: v })} />
      <Chips legend={t("logs.purpose")} name="c-purp" options={PURPOSES} label={(v) => t(k(`logs.purp.${v}`))} value={f.purpose as (typeof PURPOSES)[number][]} onChange={(v) => set({ purpose: v })} other={f.purposeOther} onOther={(v) => set({ purposeOther: v })} />
      <Chips legend={t("logs.understood")} name="c-und" options={["yes", "no"] as const} label={(v) => t(v === "yes" ? "logs.yes" : "logs.no")} value={f.understood as ("yes" | "no")[]} onChange={(v) => set({ understood: v })} />
      <Field id="c-ex" label={t("logs.example")} hint={t("logs.exampleHint")}><input id="c-ex" aria-describedby="c-ex-hint" className="field" maxLength={200} value={f.example} onChange={(e) => set({ example: e.target.value })} /></Field>
      <Chips legend={t("logs.where")} name="c-setting" options={SETTINGS} label={(v) => t(k(`logs.set.${v}`))} value={f.setting as (typeof SETTINGS)[number][]} onChange={(v) => set({ setting: v })} other={f.settingOther} onOther={(v) => set({ settingOther: v })} />
      <Chips multi legend={t("logs.context")} name="c-ctx" options={CONTEXTS} label={(v) => t(k(`logs.ctx.${v}`))} value={f.ctx as (typeof CONTEXTS)[number][]} onChange={(v) => set({ ctx: v })} other={f.ctxOther} onOther={(v) => set({ ctxOther: v })} />
      <Field id="c-notes" label={t("logs.notes")}><textarea id="c-notes" className="field min-h-16 py-3" maxLength={500} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
      {error && <p role="alert" className="notice notice-error">{error}</p>}
      <button className="btn-primary w-full" disabled={!ready}>{t("logs.save")}</button>
    </form>
  );
}
