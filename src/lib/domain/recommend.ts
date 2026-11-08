// "Recommended for {child}": simple, explainable rules. Pure: no database, no React.
// Only matches that the guide text really supports are listed. Wandering, toileting, screen time and
// safety outside have no guide yet, so they recommend nothing (add guides first, then add a rule here).

export type RecommendProfile = {
  challenges: readonly string[];
  communicationLevel: string | null;
  journeyStage: string | null;
  sensory: Record<string, string>;
};
export type Recommendation = { slug: string; reason: string };

const BY_CHALLENGE: Record<string, { slugs: string[]; reason: string }> = {
  meltdowns: { slugs: ["responding-to-meltdowns-with-calm"], reason: "Because meltdowns are hard right now" },
  transitions: { slugs: ["creating-predictable-routines", "visual-supports-that-help"], reason: "To make transitions easier" },
  sleep: { slugs: ["creating-predictable-routines"], reason: "Routines can help with bedtime" },
  eating: { slugs: ["understanding-sensory-sensitivities"], reason: "Tastes and textures can be sensory" },
  communication: { slugs: ["building-two-way-communication", "visual-supports-that-help"], reason: "To support communication" },
  school: { slugs: ["working-with-your-child-s-school", "individualized-education-plans-explained"], reason: "For school adjustment" },
};

const SENSORY_REASON = "Matches your sensory answers";
const FEW_WORDS_REASON = "Helpful when words are few";
const NEW_REASON = "A good place to start";
const FALLBACK = ["every-child-is-different", "what-is-autism-spectrum-disorder", "creating-predictable-routines"];

/** Up to `limit` unread guides, most relevant first, each with a short reason. `available` is the list of guides that exist. */
export function recommend(
  profile: RecommendProfile | null,
  available: readonly string[],
  read: ReadonlySet<string>,
  limit = 3,
): Recommendation[] {
  const exists = new Set(available);
  const picked: Recommendation[] = [];
  const add = (slug: string, reason: string) => {
    if (exists.has(slug) && !read.has(slug) && !picked.some((p) => p.slug === slug)) picked.push({ slug, reason });
  };

  if (profile) {
    for (const c of profile.challenges) for (const s of BY_CHALLENGE[c]?.slugs ?? []) add(s, BY_CHALLENGE[c]!.reason);
    if (Object.values(profile.sensory).some((v) => v === "avoids" || v === "seeks")) add("understanding-sensory-sensitivities", SENSORY_REASON);
    if (profile.communicationLevel === "nonspeaking" || profile.communicationLevel === "few_words") {
      add("visual-supports-that-help", FEW_WORDS_REASON);
      add("building-two-way-communication", FEW_WORDS_REASON);
    }
    if (profile.journeyStage === "diagnosed") add("every-child-is-different", NEW_REASON);
    if (profile.journeyStage === "assessment" || profile.journeyStage === "suspect" || profile.journeyStage === "curious") {
      add("early-signs-to-notice", NEW_REASON);
      add("what-is-autism-spectrum-disorder", NEW_REASON);
    }
  }
  if (picked.length === 0) for (const s of FALLBACK) add(s, NEW_REASON);
  return picked.slice(0, limit);
}
