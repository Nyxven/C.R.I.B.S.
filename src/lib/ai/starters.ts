// Starter question chips from the quiz answers. Pure. Only topics the guides really cover get a chip.
const BY_CHALLENGE: Record<string, string> = {
  meltdowns: "What can I do during a meltdown?",
  sleep: "Any ideas for bedtime routines?",
  transitions: "How can I make transitions easier?",
  eating: "Why can mealtimes be hard?",
  school: "How do I work well with my child's school?",
  communication: "How can I help my child communicate?",
};
const DEFAULTS = ["What are visual supports?", "How do I build a predictable routine?", "What are early signs to notice?"];

/** Up to `limit` questions: the person's challenges first, then general starters. */
export function starterChips(challenges: readonly string[], limit = 3): string[] {
  const out: string[] = [];
  for (const c of challenges) { const q = BY_CHALLENGE[c]; if (q && !out.includes(q)) out.push(q); }
  for (const q of DEFAULTS) if (out.length < limit && !out.includes(q)) out.push(q);
  return out.slice(0, limit);
}
