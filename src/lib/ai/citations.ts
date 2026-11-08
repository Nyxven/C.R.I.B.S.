// Turns [[id]] markers in an answer into source chips. Pure.
export type Source = { id: string; title: string; href: string };

/** Removes complete markers, and a half-typed marker at the very end (while the answer is still streaming). */
export function stripMarkers(text: string): string {
  return text
    .replace(/\[\[\s*[a-z0-9_-]+\s*\]\]/gi, "")
    .replace(/\[\[?[a-z0-9_\s-]*\]?$/i, "")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trimEnd();
}

/** Visible text plus the real sources it cited, in order, no repeats. Unknown ids are dropped quietly. */
export function splitCitations(text: string, known: Readonly<Record<string, Source>>): { text: string; sources: Source[] } {
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const m of text.matchAll(/\[\[\s*([a-z0-9_-]+)\s*\]\]/gi)) {
    const id = m[1]!.toLowerCase();
    const s = Object.hasOwn(known, id) ? known[id] : undefined;
    if (s && !seen.has(id)) { seen.add(id); sources.push(s); }
  }
  return { text: stripMarkers(text), sources };
}
