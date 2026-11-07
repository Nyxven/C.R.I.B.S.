// Pure rules for the onboarding quiz. No React, no Next, no database: safe to import anywhere.

export type Option<V extends string = string> = { readonly value: V; readonly label: string };

/** The values of an option list, as a non-empty tuple (for z.enum). */
export const valuesOf = <T extends readonly Option[]>(list: T) =>
  list.map((o) => o.value) as unknown as [T[number]["value"], ...T[number]["value"][]];

export const labelOf = (list: readonly Option[], value: string | null | undefined) =>
  list.find((o) => o.value === value)?.label ?? "";

export const RELATIONSHIPS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "grandparent", label: "Grandparent" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Someone else" },
] as const satisfies readonly Option[];

export const PRONOUNS = [
  { value: "she", label: "she/her" },
  { value: "he", label: "he/him" },
  { value: "they", label: "they/them" },
] as const satisfies readonly Option[];

export const JOURNEY_STAGES = [
  { value: "diagnosed", label: "Diagnosed" },
  { value: "assessment", label: "Assessment in progress" },
  { value: "suspect", label: "I suspect it and I'm exploring" },
  { value: "curious", label: "Just curious for now" },
] as const satisfies readonly Option[];

export const COMM_LEVELS = [
  { value: "nonspeaking", label: "Non-speaking" },
  { value: "few_words", label: "A few words" },
  { value: "phrases", label: "Short phrases" },
  { value: "verbal", label: "Mostly verbal" },
] as const satisfies readonly Option[];

export const COMM_TOOLS = [
  { value: "picture_cards", label: "Picture cards" },
  { value: "aac", label: "AAC device or app" },
  { value: "signs", label: "Signs and gestures" },
  { value: "none", label: "None right now" },
] as const satisfies readonly Option[];

export const SENSORY_KEYS = [
  { value: "sound", label: "Sounds" },
  { value: "light", label: "Lights" },
  { value: "touch", label: "Touch and clothing" },
  { value: "taste", label: "Tastes and textures" },
  { value: "crowds", label: "Crowds" },
  { value: "movement", label: "Movement" },
] as const satisfies readonly Option[];

export const SENSORY_MODES = [
  { value: "none", label: "No strong reaction" },
  { value: "avoids", label: "Avoids it" },
  { value: "seeks", label: "Seeks it" },
] as const satisfies readonly Option[];

export const CALMING_IDEAS = [
  "A quiet space", "Music", "Deep pressure hugs", "A favorite toy", "Fresh air outside", "Dim lights", "Swinging",
] as const;

export const CHALLENGES = [
  { value: "meltdowns", label: "Meltdowns" },
  { value: "sleep", label: "Sleep" },
  { value: "wandering", label: "Wandering or running off" },
  { value: "transitions", label: "Transitions" },
  { value: "eating", label: "Eating" },
  { value: "toileting", label: "Toileting" },
  { value: "school", label: "School adjustment" },
  { value: "communication", label: "Communication" },
  { value: "screen_time", label: "Screen time" },
  { value: "safety_outside", label: "Safety outside" },
] as const satisfies readonly Option[];
export const MAX_CHALLENGES = 3;

export const SCHOOL_SETTINGS = [
  { value: "none", label: "Not in school yet" },
  { value: "sped_center", label: "SPED center" },
  { value: "inclusive", label: "Inclusive school" },
  { value: "homeschool", label: "Homeschool" },
] as const satisfies readonly Option[];

export const THERAPIST = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "looking", label: "Looking for one" },
] as const satisfies readonly Option[];

export const WANDERING = [
  { value: "none", label: "Not really" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
] as const satisfies readonly Option[];

export const TAG_NETWORKS = [
  { value: "apple", label: "Apple Find My" },
  { value: "google", label: "Google Find Hub" },
  { value: "not_yet", label: "Not set up yet" },
] as const satisfies readonly Option[];

// ---------- steps ----------
export const STEPS = [
  { id: "about", title: "About you", skippable: false },
  { id: "child", title: "Your child", skippable: false },
  { id: "journey", title: "Your journey", skippable: true },
  { id: "communication", title: "Communication", skippable: true },
  { id: "sensory", title: "Sensory needs", skippable: true },
  { id: "calming", title: "Calming and joy", skippable: true },
  { id: "challenges", title: "Challenges", skippable: true },
  { id: "daily", title: "Daily life", skippable: true },
  { id: "safety", title: "Safety", skippable: true },
  { id: "review", title: "Review", skippable: false },
] as const;
export type StepId = (typeof STEPS)[number]["id"];
export type DataStepId = Exclude<StepId, "review">;
export const STEP_IDS: readonly StepId[] = STEPS.map((s) => s.id);
export const stepIndex = (id: StepId) => STEP_IDS.indexOf(id);
export const isSkippable = (id: StepId) => STEPS.find((s) => s.id === id)?.skippable ?? false;
export const isDataStep = (id: string): id is DataStepId => STEP_IDS.includes(id as StepId) && id !== "review";
/** Keeps a stored step number inside the quiz, whatever the database holds. */
export const clampStep = (n: unknown): number =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 0), STEPS.length - 1) : 0;

// ---------- answers ----------
export type OnboardingData = {
  displayName: string;
  relationship: (typeof RELATIONSHIPS)[number]["value"] | "";
  nickname: string;
  ageYears: number | null;
  pronouns: (typeof PRONOUNS)[number]["value"] | "";
  journeyStage: (typeof JOURNEY_STAGES)[number]["value"] | "";
  communicationLevel: (typeof COMM_LEVELS)[number]["value"] | "";
  commTools: (typeof COMM_TOOLS)[number]["value"][];
  sensory: Partial<Record<(typeof SENSORY_KEYS)[number]["value"], (typeof SENSORY_MODES)[number]["value"]>>;
  calming: string;
  interests: string;
  challenges: (typeof CHALLENGES)[number]["value"][];
  school: (typeof SCHOOL_SETTINGS)[number]["value"] | "";
  hasTherapist: (typeof THERAPIST)[number]["value"] | "";
  wanderingRisk: (typeof WANDERING)[number]["value"] | "";
  avoid: string;
  contactName: string;
  contactPhone: string;
  wearsTag: boolean;
  tagNetwork: (typeof TAG_NETWORKS)[number]["value"] | "";
};

export const emptyData = (displayName = ""): OnboardingData => ({
  displayName, relationship: "", nickname: "", ageYears: null, pronouns: "", journeyStage: "",
  communicationLevel: "", commTools: [], sensory: {}, calming: "", interests: "", challenges: [],
  school: "", hasTherapist: "", wanderingRisk: "", avoid: "", contactName: "", contactPhone: "",
  wearsTag: false, tagNetwork: "",
});

/** Which answers belong to which step. Every answer appears in exactly one step (tested). */
export const STEP_FIELDS: Record<DataStepId, readonly (keyof OnboardingData)[]> = {
  about: ["displayName", "relationship"],
  child: ["nickname", "ageYears", "pronouns"],
  journey: ["journeyStage"],
  communication: ["communicationLevel", "commTools"],
  sensory: ["sensory"],
  calming: ["calming", "interests"],
  challenges: ["challenges"],
  daily: ["school", "hasTherapist"],
  safety: ["wanderingRisk", "avoid", "contactName", "contactPhone", "wearsTag", "tagNetwork"],
};

export function pickStep(data: OnboardingData, id: DataStepId): Partial<OnboardingData> {
  const out: Record<string, unknown> = {};
  for (const k of STEP_FIELDS[id]) out[k] = data[k];
  return out as Partial<OnboardingData>;
}

/** Puts one step's answers back to what was last saved (used by Skip). */
export const resetStep = (data: OnboardingData, saved: OnboardingData, id: DataStepId): OnboardingData => ({
  ...data,
  ...pickStep(saved, id),
});

/** Adds or removes a value. With `max`, a new value is ignored once the list is full. */
export function toggleValue<T extends string>(list: readonly T[], value: T, max = Infinity): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return list.length >= max ? [...list] : [...list, value];
}

/** Returns digits (with a leading + if given), or "" when it does not look like a phone number. */
export function normalizePhone(raw: string): string {
  const t = raw.trim();
  if (!/^\+?[\d\s().-]+$/.test(t)) return "";
  const digits = t.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return (t.startsWith("+") ? "+" : "") + digits;
}

/** The two answers the app cannot do without. */
export const canFinish = (d: Pick<OnboardingData, "displayName" | "nickname">) =>
  d.displayName.trim() !== "" && d.nickname.trim() !== "";

export function ageText(n: number | null): string {
  if (n === null) return "";
  if (n === 0) return "Under 1 year";
  return n === 1 ? "1 year" : `${n} years`;
}

// ---------- review ----------
export type ReviewLine = { label: string; value: string };
export type ReviewSection = { step: DataStepId; title: string; lines: ReviewLine[] };

const joinLabels = (list: readonly Option[], values: readonly string[]) => values.map((v) => labelOf(list, v)).filter(Boolean).join(", ");

/** Plain summary for the last screen. Empty sections mean "skipped". */
export function reviewSections(d: OnboardingData, tagName: string): ReviewSection[] {
  const add = (lines: ReviewLine[], label: string, value: string) => { if (value.trim()) lines.push({ label, value: value.trim() }); };
  const title = (id: DataStepId) => STEPS.find((s) => s.id === id)!.title;
  const make = (id: DataStepId, fill: (l: ReviewLine[]) => void): ReviewSection => {
    const lines: ReviewLine[] = []; fill(lines); return { step: id, title: title(id), lines };
  };
  return [
    make("about", (l) => { add(l, "Your name", d.displayName); add(l, "You are their", labelOf(RELATIONSHIPS, d.relationship).toLowerCase()); }),
    make("child", (l) => { add(l, "Nickname", d.nickname); add(l, "Age", ageText(d.ageYears)); add(l, "Pronouns", labelOf(PRONOUNS, d.pronouns)); }),
    make("journey", (l) => add(l, "Stage", labelOf(JOURNEY_STAGES, d.journeyStage))),
    make("communication", (l) => { add(l, "How they communicate", labelOf(COMM_LEVELS, d.communicationLevel)); add(l, "Tools", joinLabels(COMM_TOOLS, d.commTools)); }),
    make("sensory", (l) => {
      for (const k of SENSORY_KEYS) { const m = d.sensory[k.value]; if (m && m !== "none") add(l, k.label, labelOf(SENSORY_MODES, m)); }
    }),
    make("calming", (l) => { add(l, "What calms them", d.calming); add(l, "What they love", d.interests); }),
    make("challenges", (l) => add(l, "Right now", joinLabels(CHALLENGES, d.challenges))),
    make("daily", (l) => { add(l, "School", labelOf(SCHOOL_SETTINGS, d.school)); add(l, "Therapist", labelOf(THERAPIST, d.hasTherapist)); }),
    make("safety", (l) => {
      add(l, "Wandering", labelOf(WANDERING, d.wanderingRisk));
      add(l, "Please avoid", d.avoid);
      add(l, "Emergency contact", [d.contactName, d.contactPhone].filter((x) => x.trim()).join(", "));
      if (d.wearsTag) add(l, `Wears ${tagName}`, ["Yes", labelOf(TAG_NETWORKS, d.tagNetwork)].filter(Boolean).join(", "));
    }),
  ];
}
