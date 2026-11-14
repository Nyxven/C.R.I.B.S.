/** Text size choices. The database stores a percent (85 to 140); the screen offers three clear steps. */
export const TEXT_SIZES = [
  { value: 100, label: "Standard", sub: "The size most people use" },
  { value: 115, label: "Large", sub: "A little bigger everywhere" },
  { value: 130, label: "Extra large", sub: "Easiest to read at arm's length" },
] as const;

export type TextSize = (typeof TEXT_SIZES)[number]["value"];

/** Any stored number becomes the nearest offered step. Anything that is not a number becomes Standard. */
export function normalizeTextSize(n: unknown): TextSize {
  if (typeof n !== "number" || !Number.isFinite(n)) return 100;
  return TEXT_SIZES.reduce((best, s) => (Math.abs(s.value - n) < Math.abs(best.value - n) ? s : best)).value;
}

/** CSS that scales the whole app (everything is sized in rem). Empty for Standard, so nothing is added. */
export function textSizeCss(n: unknown): string {
  const v = normalizeTextSize(n);
  return v === 100 ? "" : `html{font-size:${v}%}`;
}
