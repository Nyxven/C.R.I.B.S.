// Pure rules for the walkthrough. No React, no DOM: the screen passes in what it can measure.

export type TourStep = {
  id: string;
  /** CSS selector of the real element to point at. Only data-tour attributes are used. */
  target: string;
  title: string;
  body: string;
  /** Page the step belongs to. The step only shows there. */
  path: string;
};

/** Short on purpose: the order a parent would use the app. Each step needs a real, visible element. */
export const TOUR_STEPS: readonly TourStep[] = [
  { id: "ask", target: '[data-tour="ask"]', path: "/home", title: "Ask CRIBS", body: "Type a question in your own words, any time. Answers come from our guides, and urgent situations get safety steps first." },
  { id: "guides", target: '[data-tour="guides"]', path: "/home", title: "Your guides", body: "Four topics of practical guidance. Open one, read at your own pace, and mark guides as read to track your progress." },
  { id: "child", target: '[data-tour="child"]', path: "/home", title: "Your child's profile", body: "Everything you told us lives here. Update it any time and your guidance follows." },
  { id: "settings", target: '[data-tour="nav-settings"]', path: "/home", title: "Settings and help", body: "Account, privacy, your data, and this walkthrough all live in Settings." },
];

export type Rect = { top: number; left: number; width: number; height: number };
export type Placement = "above" | "below";

/**
 * Where to put the tip so it never covers the target: below when there is room, otherwise above.
 * Horizontally it is centered on the target and kept inside the screen.
 */
export function placeTip(target: Rect, tip: { width: number; height: number }, view: { width: number; height: number }, gap = 14, margin = 12): { top: number; left: number; placement: Placement } {
  const spaceBelow = view.height - (target.top + target.height) - gap - margin;
  const spaceAbove = target.top - gap - margin;
  const placement: Placement = spaceBelow >= tip.height || spaceBelow >= spaceAbove ? "below" : "above";
  const rawTop = placement === "below" ? target.top + target.height + gap : target.top - gap - tip.height;
  const top = Math.min(Math.max(rawTop, margin), Math.max(margin, view.height - tip.height - margin));
  const centered = target.left + target.width / 2 - tip.width / 2;
  const left = Math.min(Math.max(centered, margin), Math.max(margin, view.width - tip.width - margin));
  return { top, left, placement };
}

/** A target counts as ready only if it has a real size and sits fully inside the screen. */
export function isUsableRect(r: Rect, view: { width: number; height: number }): boolean {
  return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.top + r.height <= view.height && r.left + r.width <= view.width;
}

/** The next step whose page matches and whose target is ready, from `from` on. Steps without a ready target are skipped. */
export function nextReadyStep(steps: readonly TourStep[], from: number, path: string, isReady: (s: TourStep) => boolean): number {
  for (let i = from; i < steps.length; i++) if (steps[i].path === path && isReady(steps[i])) return i;
  return -1;
}
