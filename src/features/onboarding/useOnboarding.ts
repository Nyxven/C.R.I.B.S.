"use client";
import { useCallback, useRef, useState } from "react";
import { STEPS, isSkippable, pickStep, resetStep, stepIndex, type OnboardingData } from "@/lib/domain/onboarding";
import { finishOnboardingAction, saveStepAction, skipStepAction } from "./actions";

const REVIEW = stepIndex("review");

/** Quiz state for the screen: current step, answers, saving, errors. No markup here. */
export function useOnboarding(initial: { step: number; data: OnboardingData }) {
  const [index, setIndex] = useState(initial.step);
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  // After "Edit" on the review screen, Continue/Skip/Back return to the review instead of the next step.
  const [fromReview, setFromReview] = useState(false);
  const saved = useRef(initial.data); // what the server has, so Skip can undo unsaved typing

  const step = STEPS[index];
  const after = (from: number) => { const to = fromReview ? REVIEW : from + 1; setFromReview(false); setIndex(to); };

  const update = useCallback((patch: Partial<OnboardingData>) => { setData((d) => ({ ...d, ...patch })); setError(null); }, []);

  const next = async () => {
    if (pending || step.id === "review") return;
    setPending(true); setError(null);
    const answers = pickStep(data, step.id);
    const r = await saveStepAction({ step: step.id, data: answers });
    setPending(false);
    if (!r.ok) { setError(r.error); return; }
    saved.current = { ...saved.current, ...answers };
    after(index);
  };

  const skip = async () => {
    if (pending || !isSkippable(step.id) || step.id === "review") return;
    setPending(true); setError(null);
    const r = await skipStepAction({ step: step.id });
    setPending(false);
    if (!r.ok) { setError(r.error); return; }
    setData((d) => resetStep(d, saved.current, step.id as Exclude<typeof step.id, "review">));
    after(index);
  };

  const back = () => { setError(null); if (fromReview) { setFromReview(false); setIndex(REVIEW); } else setIndex((i) => Math.max(0, i - 1)); };
  const edit = (id: (typeof STEPS)[number]["id"]) => { setError(null); setFromReview(true); setIndex(stepIndex(id)); };

  const finish = async () => {
    if (pending) return;
    setPending(true); setError(null);
    const r = await finishOnboardingAction();
    setPending(false);
    if (!r.ok) { setError(r.error); return; }
    setDone(true);
  };

  return { index, total: STEPS.length, step, data, update, error, pending, done, fromReview, next, skip, back, edit, finish };
}
