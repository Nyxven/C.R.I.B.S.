// Which Home sections show, and in what order. Pure. Stored per account in profile.home_layout.
export const HOME_SECTIONS = ["safety", "recommended", "logs", "guides", "help"] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];
export type HomeLayout = { id: HomeSection; visible: boolean }[];

export const DEFAULT_LAYOUT: HomeLayout = HOME_SECTIONS.map((id) => ({ id, visible: true }));
const isSection = (v: unknown): v is HomeSection => typeof v === "string" && (HOME_SECTIONS as readonly string[]).includes(v);

/** Any stored value becomes a full, valid layout: unknown or repeated ids dropped, missing sections added (visible) at the end. */
export function normalizeLayout(stored: unknown): HomeLayout {
  const out: HomeLayout = [];
  if (Array.isArray(stored)) {
    for (const item of stored) {
      const id = (item as { id?: unknown })?.id;
      if (isSection(id) && !out.some((x) => x.id === id)) out.push({ id, visible: (item as { visible?: unknown }).visible !== false });
    }
  }
  for (const id of HOME_SECTIONS) if (!out.some((x) => x.id === id)) out.push({ id, visible: true });
  return out;
}

/** Moves a section one step up (-1) or down (+1). Out-of-range moves change nothing. */
export function moveSection(layout: HomeLayout, id: HomeSection, dir: -1 | 1): HomeLayout {
  const i = layout.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= layout.length) return layout;
  const next = [...layout];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

export const toggleSection = (layout: HomeLayout, id: HomeSection): HomeLayout => layout.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x));

/** The sections to draw, in order. */
export const visibleSections = (layout: HomeLayout): HomeSection[] => layout.filter((x) => x.visible).map((x) => x.id);
