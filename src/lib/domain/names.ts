/** First letter upper case, the rest as typed ("raven" shows as "Raven"). Display only: the stored name is not changed. */
export function capitalizeFirst(name: string): string {
  const s = name.trim();
  if (!s) return s;
  const [first = ""] = Array.from(s);
  return first.toLocaleUpperCase() + s.slice(first.length);
}
