// WCAG 2 contrast helpers (pure). Used by the brand color test.

function channels(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two #rrggbb colors, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Color a fraction `t` (0 to 1) of the way from `a` to `b`, in sRGB. */
export function mix(a: string, b: string, t: number): string {
  const ca = channels(a), cb = channels(b);
  return "#" + ca.map((v, i) => Math.round(v + (cb[i]! - v) * t).toString(16).padStart(2, "0")).join("");
}
