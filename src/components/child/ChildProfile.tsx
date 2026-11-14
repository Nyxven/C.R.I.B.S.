"use client";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, Plus, QrCode, ShieldCheck } from "lucide-react";
import { saveProfileStepAction } from "@/features/account/actions";
import { pickStep, reviewSections, type DataStepId, type OnboardingData, type ReviewSection } from "@/lib/domain/onboarding";
import { panelsOf, validatePanel } from "@/lib/domain/panels";
import { PANEL_COPY } from "@/components/onboarding/copy";
import { PanelFields } from "@/components/onboarding/PanelFields";

// Parent-friendly grouping of the quiz steps. Only fields that already exist in the database appear here.
const GROUPS: { id: string; title: string; steps: DataStepId[] }[] = [
  { id: "basic", title: "Basic information", steps: ["child", "journey"] },
  { id: "communication", title: "Communication", steps: ["communication"] },
  { id: "sensory", title: "Sensory preferences", steps: ["sensory"] },
  { id: "care", title: "Care and support", steps: ["calming", "challenges", "daily"] },
  { id: "safety", title: "Safety and emergency", steps: ["safety"] },
];

export function ChildProfile({ initial, tagName }: { initial: OnboardingData; tagName: string }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [editing, setEditing] = useState<DataStepId | null>(null);
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, start] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);

  const sections = reviewSections(data, tagName);
  const byStep = new Map<DataStepId, ReviewSection>(sections.map((s) => [s.step, s]));
  const filled = sections.filter((s) => s.step !== "about" && s.lines.length > 0).length;
  const total = sections.filter((s) => s.step !== "about").length;
  const name = data.nickname || "your child";

  const open = (step: DataStepId) => { setDraft(data); setEditing(step); setError(""); setSaved(""); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setEditing(null); };
  const save = () => {
    if (!editing) return;
    for (const p of panelsOf(editing)) { const problem = validatePanel(p.id, draft); if (problem) return setError(problem); }
    start(async () => {
      const answers = pickStep(draft, editing);
      const r = await saveProfileStepAction({ step: editing, data: answers });
      if (!r.ok) return setError(r.error);
      setData({ ...data, ...answers }); setSaved("Saved."); close(); router.refresh();
    });
  };

  return (
    <div className="space-y-7">
      <header className="rise space-y-2">
        <h1 className="text-3xl font-extrabold">{data.nickname ? `${data.nickname}'s profile` : "Child profile"}</h1>
        <p className="text-ink-soft">Short notes that help us fit your guidance to {name}. Only you can see this, and every answer is optional.</p>
        <p className="text-sm font-bold text-ink-soft" role="status">{filled} of {total} sections filled in{saved ? ` · ${saved}` : ""}</p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`g-${g.id}`} className="rise">
          <h2 id={`g-${g.id}`} className="section-label">{g.title}</h2>
          <div className="list-group">
            {g.steps.map((step) => {
              const s = byStep.get(step)!;
              const empty = s.lines.length === 0;
              return (
                <div key={step} className="list-row items-start">
                  <div className="min-w-0 flex-1">
                    <p className="row-title">{s.title}</p>
                    {empty ? <p className="row-sub">Not added yet</p> : (
                      <dl className="mt-1 space-y-0.5 text-sm">
                        {s.lines.map((l) => <div key={l.label} className="flex flex-wrap gap-x-2"><dt className="font-bold text-ink-soft">{l.label}:</dt><dd className="min-w-0 break-words">{l.value}</dd></div>)}
                      </dl>
                    )}
                  </div>
                  <button type="button" onClick={() => open(step)} className="btn-ghost shrink-0" aria-label={`${empty ? "Add" : "Edit"} ${s.title}`}>
                    {empty ? <Plus size={18} aria-hidden="true" /> : <Pencil size={18} aria-hidden="true" />}{empty ? "Add" : "Edit"}
                  </button>
                </div>
              );
            })}
            {g.id === "safety" && (
              <Link href="/find" className="list-row">
                <span className="row-icon"><QrCode size={20} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="row-title block">If-found page and QR</span><span className="row-sub block">Private by default. Nothing is public until you make a tag.</span></span>
                <ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />
              </Link>
            )}
          </div>
          {g.id === "safety" && (
            <p className="notice notice-info mt-3 text-sm"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              <span>On the public page you choose each detail. The line saying your child has autism is off unless you switch it on.</span></p>
          )}
        </section>
      ))}

      <dialog ref={dialog} className="sheet" aria-labelledby="edit-h" onClose={() => setEditing(null)}>
        {editing && (
          <form className="max-h-[85dvh] space-y-6 overflow-y-auto p-6" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
            <h2 id="edit-h" className="text-xl font-extrabold">{byStep.get(editing)?.title}</h2>
            {panelsOf(editing).map((p) => (
              <div key={p.id} className="space-y-3">
                <p className="font-display text-lg font-bold">{PANEL_COPY[p.id].question}</p>
                {PANEL_COPY[p.id].intro && <p className="-mt-2 text-sm text-ink-soft">{PANEL_COPY[p.id].intro}</p>}
                <PanelFields id={p.id} data={draft} update={(patch) => { setDraft((d) => ({ ...d, ...patch })); setError(""); }} tagName={tagName} />
              </div>
            ))}
            {error && <p role="alert" className="notice notice-error">{error}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary" onClick={close}>Cancel</button>
              <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
