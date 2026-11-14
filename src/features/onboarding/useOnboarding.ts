"use client";
import { useCallback, useRef, useState } from "react";
import { STEPS, pickStep, stepIndex, type OnboardingData, type StepId } from "@/lib/domain/onboarding";
import { PANELS, lastPanelOf, panelNumber, panelsOf, resetPanel, validatePanel } from "@/lib/domain/panels";
import { finishOnboardingAction, saveStepAction } from "./actions";

const REVIEW = stepIndex("review");

/**
 * Quiz state for the screen: current step + question (panel), answers, saving, errors. No markup here.
 * The server still saves one *step* at a time (when its last question is done), so the database and the
 * resume pointer are unchanged. Going back keeps every answer because all answers live in this state.
 */
export function useOnboarding(initial: { step: number; data: OnboardingData }) {
  const [index, setIndex] = useState(initial.step);
  const [panelIdx, setPanelIdx] = useState(0);
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  // After "Edit" on the review screen, finishing the step returns to the review instead of the next step.
  const [fromReview, setFromReview] = useState(false);
  const saved = useRef(initial.data); // what the server has, so Skip can undo unsaved typing

  const step = STEPS[index];
  const stepPanels = panelsOf(step.id);
  const panel = stepPanels[Math.min(panelIdx, stepPanels.length - 1)];
  const isLast = panelIdx >= stepPanels.length - 1;

  const goTo = (to: number, p = 0) => { setIndex(to); setPanelIdx(p); };
  const after = (from: number) => { const to = fromReview ? REVIEW : from + 1; setFromReview(false); goTo(to); };

  const update = useCallback((patch: Partial<OnboardingData>) => { setData((d) => ({ ...d, ...patch })); setError(null); }, []);

  /** Saves this step's answers (all its questions) and moves on. */
  const saveStep = async (answersSource: OnboardingData) => {
    if (step.id === "review") return;
    setPending(true); setError(null);
    const answers = pickStep(answersSource, step.id);
    const r = await saveStepAction({ step: step.id, data: answers });
    setPending(false);
    if (!r.ok) { setError(r.error); return; }
    saved.current = { ...saved.current, ...answers };
    setData(answersSource);
    after(index);
  };

  const next = async () => {
    if (pending || step.id === "review") return;
    const problem = validatePanel(panel.id, data);
    if (problem) { setError(problem); return; }
    if (!isLast) { setError(null); setPanelIdx(panelIdx + 1); return; }
    await saveStep(data);
  };

  /** Skip leaves this question as last saved and moves on. Required questions cannot be skipped. */
  const skip = async () => {
    if (pending || !panel.skippable) return;
    const reset = resetPanel(data, saved.current, panel);
    setData(reset); setError(null);
    if (!isLast) { setPanelIdx(panelIdx + 1); return; }
    await saveStep(reset);
  };

  const back = () => {
    setError(null);
    if (panelIdx > 0) { setPanelIdx(panelIdx - 1); return; }
    if (fromReview) { setFromReview(false); goTo(REVIEW); return; }
    if (index > 0) { const prev = STEPS[index - 1].id as StepId; goTo(index - 1, lastPanelOf(prev)); }
  };

  const edit = (id: StepId) => { setError(null); setFromReview(true); goTo(stepIndex(id)); };

  const finish = async () => {
    if (pending) return;
    setPending(true); setError(null);
    const r = await finishOnboardingAction();
    setPending(false);
    if (!r.ok) { setError(r.error); return; }
    setDone(true);
  };

  return {
    index, step, panel, isLast, position: panelNumber(step.id, panelIdx), total: PANELS.length,
    canGoBack: panelIdx > 0 || fromReview || index > 0,
    data, update, error, pending, done, fromReview, next, skip, back, edit, finish,
  };
}
