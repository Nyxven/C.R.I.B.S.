"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TOUR_STEPS, nextReadyStep, placeTip, unseenSteps, type Rect, type TourStep } from "@/lib/domain/tour";
import { TOUR_RESTART_EVENT, readSeen, writeSeen } from "./storage";

/** First element for a selector that is really on screen (hidden copies, such as the other nav, are skipped). */
function findVisible(selector: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const r = el.getBoundingClientRect();
    const shown = typeof el.checkVisibility === "function" ? el.checkVisibility() : r.width > 0 && r.height > 0;
    if (shown && r.width > 0 && r.height > 0) return el;
  }
  return null;
}
const isReady = (s: TourStep) => findVisible(s.target) !== null;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Contextual walkthrough. Points at real elements (data-tour attributes), shows a step only while its element
 * exists and is visible on the current page, and waits (with DOM observers, not timers) when it is not there yet.
 */
export function Tour({ userId }: { userId: string }) {
  const path = usePathname();
  const [active, setActive] = useState(false);
  const [seen, setSeen] = useState<string[]>([]); // steps already shown or skipped
  const [cur, setCur] = useState(-1); // step shown right now, -1 = none ready
  const [hasLater, setHasLater] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);
  const tip = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);

  // Start once per person, or again when Settings asks for it. Steps on other pages wait until that page is opened.
  useEffect(() => {
    const stored = readSeen(userId);
    if (stored !== null && unseenSteps(TOUR_STEPS, stored).length > 0) { setSeen(stored); setActive(true); }
    const again = () => { setSeen([]); setActive(true); };
    window.addEventListener(TOUR_RESTART_EVENT, again);
    return () => window.removeEventListener(TOUR_RESTART_EVENT, again);
  }, [userId]);

  const mark = useCallback((ids: string[]) => {
    const next = Array.from(new Set([...seen, ...ids]));
    writeSeen(userId, next);
    setSeen(next);
    if (unseenSteps(TOUR_STEPS, next).length === 0) { setActive(false); setCur(-1); setRect(null); }
  }, [seen, userId]);
  const finish = useCallback(() => mark(TOUR_STEPS.map((s) => s.id)), [mark]); // skip: nothing is shown again

  // Work out which step is ready and where its target is. Re-run whenever the page changes or scrolls.
  const measure = useCallback(() => {
    const ready = (s: TourStep) => !seen.includes(s.id) && isReady(s);
    const i = nextReadyStep(TOUR_STEPS, 0, path, ready);
    setCur(i);
    if (i < 0) { setRect(null); setHasLater(false); return; }
    const el = findVisible(TOUR_STEPS[i].target)!;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    // Bring a partly hidden target into view (the person asked for the tour), then clamp the ring to the screen.
    if (r.top < 0 || r.bottom > vh) {
      el.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
    }
    const top = Math.max(r.top, 0), left = Math.max(r.left, 0);
    setRect({ top, left, width: Math.min(r.right, vw) - left, height: Math.min(r.bottom, vh) - top });
    setHasLater(TOUR_STEPS.some((s, k) => k > i && s.path === path && ready(s)));
  }, [seen, path]);

  useEffect(() => {
    if (!active) return;
    const schedule = () => { cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(measure); };
    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => { cancelAnimationFrame(frame.current); mo.disconnect(); window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule); };
  }, [active, measure]);

  // Place the tip once we know its real size, and move keyboard focus into it.
  useLayoutEffect(() => {
    if (!rect || !tip.current) return;
    const b = tip.current.getBoundingClientRect();
    const p = placeTip({ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }, { width: b.width, height: b.height }, { width: window.innerWidth, height: window.innerHeight });
    setTipPos({ top: p.top, left: p.left });
  }, [rect, cur]);
  useEffect(() => { if (cur >= 0) nextBtn.current?.focus({ preventScroll: true }); }, [cur]);

  useEffect(() => {
    if (!active || cur < 0) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, cur, finish]);

  if (!active || cur < 0 || !rect) return null;
  const step = TOUR_STEPS[cur];
  const number = TOUR_STEPS.filter((s) => s.path === path).findIndex((s) => s.id === step.id) + 1;
  const total = TOUR_STEPS.filter((s) => s.path === path).length;
  const onNext = () => mark([step.id]);

  return (
    <>
      <div className="tour-ring" aria-hidden="true" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }} />
      <div ref={tip} role="dialog" aria-modal="false" aria-labelledby="tour-title" aria-describedby="tour-body" className="tour-tip"
        style={{ top: tipPos?.top ?? 0, left: tipPos?.left ?? 0, visibility: tipPos ? "visible" : "hidden" }}>
        <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">Tip {number} of {total}</p>
        <h2 id="tour-title" className="mt-1 text-lg font-extrabold">{step.title}</h2>
        <p id="tour-body" className="mt-1 text-base text-ink-soft">{step.body}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" onClick={finish} className="btn-ghost min-h-11 px-3">Skip tour</button>
          <button ref={nextBtn} type="button" onClick={onNext} className="btn-primary min-h-11 px-5 text-base">{hasLater ? "Next" : "Done"}</button>
        </div>
      </div>
    </>
  );
}
