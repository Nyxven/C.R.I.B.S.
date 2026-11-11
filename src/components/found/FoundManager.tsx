"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTagAction, revokeTagAction, saveFieldsAction, switchTagAction } from "@/features/found/actions";
import { FIELD_LABELS, type FoundFields } from "@/lib/found/card";

type Tag = { enabled: boolean; createdAt: string; accessCount: number; fields: FoundFields };
type Props = { hasChild: boolean; hasContact: boolean; tag: Tag | null };

export function FoundManager({ hasChild, hasContact, tag }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState<{ url: string; qr: string } | null>(null); // shown once, then gone
  const [fields, setFields] = useState<FoundFields | null>(tag?.fields ?? null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => { setError(""); const r = await fn(); if (r.ok) { after?.(); router.refresh(); } else setError(r.error ?? "Please try again."); });

  if (!hasChild) return <p className="card p-5">Finish your child's profile first. Then you can make an "if found" tag here.</p>;

  function make() {
    start(async () => {
      setError("");
      const r = await createTagAction();
      if (r.ok) { setFresh({ url: r.url, qr: r.qr }); setFields(null); router.refresh(); } else setError(r.error);
    });
  }
  const download = () => {
    if (!fresh) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([fresh.qr], { type: "image/svg+xml" }));
    a.download = "if-found-qr.svg"; a.click(); URL.revokeObjectURL(a.href);
  };
  const shown = fields ?? tag?.fields;

  return (
    <div className="space-y-5">
      {fresh && (
        <section className="card space-y-3 p-5" aria-labelledby="qr-title">
          <h2 id="qr-title" className="font-display text-xl font-bold">Your new QR</h2>
          <p className="font-bold text-coral-dark">This is the only time you will see it. Print or save it now. If you lose it, make a new one.</p>
          <div className="print-area mx-auto w-full max-w-[260px] bg-white p-3" role="img" aria-label="QR code for your if-found page" dangerouslySetInnerHTML={{ __html: fresh.qr }} />
          <p className="break-all text-sm text-ink-soft">{fresh.url}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => window.print()} className="btn-primary">Print</button>
            <button type="button" onClick={download} className="btn-secondary">Save image</button>
            <button type="button" onClick={() => setFresh(null)} className="btn-secondary">I saved it</button>
          </div>
        </section>
      )}

      {!tag ? (
        <section className="card space-y-3 p-5">
          <p className="font-display text-lg font-bold">No tag yet</p>
          <p className="text-ink-soft">The QR on your child's plush or keychain opens a page with only what you choose to share. Nobody needs to sign in to see it.</p>
          {!hasContact && <p className="font-bold text-coral-dark">You have not added an emergency contact, so the page will have no Call button. You can add one in your child's profile.</p>}
          <button type="button" disabled={pending} onClick={make} className="btn-primary w-full">Make my tag</button>
        </section>
      ) : (
        <>
          <section className="card space-y-2 p-5">
            <p className="font-display text-lg font-bold">{tag.enabled ? "Your tag is on" : "Your tag is switched off"}</p>
            <p className="text-ink-soft">Made {tag.createdAt}. Opened {tag.accessCount} {tag.accessCount === 1 ? "time" : "times"}. We keep only this count, nothing about who opened it.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={pending} onClick={() => act(() => switchTagAction(!tag.enabled))} className="btn-secondary">{tag.enabled ? "Switch off for now" : "Switch on"}</button>
              <button type="button" disabled={pending} onClick={make} className="btn-secondary">Make a new QR</button>
            </div>
            <p className="text-sm text-ink-soft">Making a new QR stops the old one at once.</p>
          </section>

          {shown && (
            <section className="card space-y-3 p-5" aria-labelledby="share-title">
              <h2 id="share-title" className="font-display text-lg font-bold">What people see</h2>
              {(Object.keys(FIELD_LABELS) as (keyof FoundFields)[]).map((k) => (
                <label key={k} className="flex min-h-11 items-start gap-3">
                  <input type="checkbox" className="mt-1 h-6 w-6 shrink-0" checked={shown[k]} onChange={(e) => setFields({ ...shown, [k]: e.target.checked })} />
                  <span><span className="block font-bold">{FIELD_LABELS[k].label}</span><span className="block text-sm text-ink-soft">{FIELD_LABELS[k].help}</span></span>
                </label>
              ))}
              <button type="button" disabled={pending} onClick={() => act(() => saveFieldsAction(shown))} className="btn-primary w-full">Save what people see</button>
            </section>
          )}

          <section className="card space-y-2 p-5">
            {!confirmRevoke ? (
              <button type="button" onClick={() => setConfirmRevoke(true)} className="btn-secondary w-full">Stop this tag for good</button>
            ) : (
              <div role="alertdialog" aria-label="Confirm stop this tag" className="space-y-2">
                <p className="font-bold">The QR will stop working and cannot be turned back on. Continue?</p>
                <div className="flex gap-3">
                  <button type="button" disabled={pending} onClick={() => act(() => revokeTagAction(), () => { setConfirmRevoke(false); setFresh(null); })} className="btn-primary flex-1">Yes, stop it</button>
                  <button type="button" onClick={() => setConfirmRevoke(false)} className="btn-secondary flex-1">Keep it</button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
      <p role="status" className="min-h-5 font-bold text-coral-dark">{error}</p>
    </div>
  );
}
