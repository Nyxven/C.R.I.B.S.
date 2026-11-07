"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useOnboarding } from "@/features/onboarding/useOnboarding";
import { reviewSections, type OnboardingData } from "@/lib/domain/onboarding";
import { STEP_COPY } from "./copy";
import { ReviewCard } from "./ReviewCard";
import { StepFields } from "./StepFields";

export function OnboardingFlow({ initial, tagName }: { initial: { step: number; data: OnboardingData }; tagName: string }) {
  const router = useRouter();
  const o = useOnboarding(initial);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const n = o.index + 1;
  const isReview = o.step.id === "review";

  // Move focus to the new question so screen readers announce it.
  useEffect(() => { headingRef.current?.focus(); }, [o.index]);

  // Short celebration, then Home.
  useEffect(() => {
    if (!o.done) return;
    const t = setTimeout(() => router.replace("/home"), 1800);
    return () => clearTimeout(t);
  }, [o.done, router]);

  if (o.done) {
    return (
      <div role="status" className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <span className="pop-in flex h-24 w-24 items-center justify-center rounded-full bg-tint-mint text-mint-dark">
          <Check size={48} aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold">You&apos;re all set!</h1>
        <p className="mt-2 text-lg text-ink-soft">{o.data.nickname ? `${o.data.nickname}'s guide is ready.` : "Your guide is ready."}</p>
        <div className="ribbon-bar mt-6 w-24" aria-hidden="true" />
        <button type="button" onClick={() => router.replace("/home")} className="btn-primary mt-8">Go to Home</button>
      </div>
    );
  }

  const copy = STEP_COPY[o.step.id];
  const showBack = o.index > 0;
  const submitLabel = isReview ? (o.pending ? "Creating…" : "Create profile") : o.pending ? "Saving…" : o.fromReview ? "Save" : "Continue";

  return (
    <div className="mx-auto max-w-xl px-5 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Logo size={44} alt="" />
          <span className="font-display text-lg font-bold">C.R.I.B.S.</span>
        </div>
        <div role="progressbar" aria-label="Quiz progress" aria-valuemin={1} aria-valuemax={o.total} aria-valuenow={n}
          aria-valuetext={`Step ${n} of ${o.total}`} className="h-2.5 overflow-hidden rounded-full bg-tint-purple">
          <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${(n / o.total) * 100}%`, background: "var(--ribbon)" }} />
        </div>
        <p className="mt-2 text-sm font-bold text-ink-soft">Step {n} of {o.total}</p>
      </header>

      <form noValidate onSubmit={(e) => { e.preventDefault(); void (isReview ? o.finish() : o.next()); }}>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold leading-tight outline-none sm:text-3xl">{copy.question}</h1>
        {copy.intro && <p className="mt-2 text-base text-ink-soft">{copy.intro}</p>}

        <div className="mt-6 space-y-7">
          {o.step.id === "review" ? (
            <ReviewCard sections={reviewSections(o.data, tagName)} onEdit={o.edit} />
          ) : (
            <StepFields id={o.step.id} data={o.data} update={o.update} tagName={tagName} />
          )}
        </div>

        {o.error && (
          <p role="alert" className="mt-6 rounded-2xl border-2 border-coral-dark bg-tint-coral px-4 py-3 font-bold text-ink">{o.error}</p>
        )}

        <div className="mt-8 space-y-3">
          <button type="submit" disabled={o.pending} className="btn-primary w-full">{submitLabel}</button>
          <div className="flex items-center justify-between gap-3">
            {showBack ? (
              <button type="button" onClick={o.back} disabled={o.pending} className="btn-secondary min-h-12 px-5">
                <ArrowLeft size={18} aria-hidden="true" /> Back
              </button>
            ) : <span />}
            {o.step.skippable && (
              <button type="button" onClick={() => void o.skip()} disabled={o.pending} className="min-h-12 rounded-xl px-3 font-extrabold text-brand underline">
                Skip for now
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
