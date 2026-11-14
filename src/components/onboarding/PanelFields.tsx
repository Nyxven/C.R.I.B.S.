import {
  CALMING_IDEAS, CHALLENGES, COMM_LEVELS, COMM_TOOLS, INTEREST_IDEAS, JOURNEY_STAGES, MAX_CHALLENGES, PRONOUNS, RELATIONSHIPS,
  SCHOOL_SETTINGS, SENSORY_KEYS, SENSORY_MODES, TAG_NETWORKS, THERAPIST, WANDERING, appendIdea, toggleValue,
  type OnboardingData, type Option,
} from "@/lib/domain/onboarding";
import type { PanelId } from "@/lib/domain/panels";
import { AgePicker } from "./AgePicker";
import { Choice, Group, TextField } from "./controls";

// Short button text for the sensory rows (the saved values and review wording do not change).
const SENSORY_SHORT: Record<string, string> = { none: "Fine", avoids: "Avoids", seeks: "Seeks" };

type Props = { id: PanelId; data: OnboardingData; update: (patch: Partial<OnboardingData>) => void; tagName: string };

/** One single-choice question. Tapping the chosen answer again clears it when `optional`. */
function Radios({ name, list, value, onPick, optional = true, cols = 1 }: {
  name: string; list: readonly Option[]; value: string; onPick: (v: string) => void; optional?: boolean; cols?: 1 | 2;
}) {
  return (
    <div className={`grid gap-3 ${cols === 2 ? "grid-cols-2" : ""}`}>
      {list.map((o) => (
        <Choice key={o.value} type="radio" name={name} value={o.value} label={o.label} checked={value === o.value}
          onChange={() => onPick(o.value)} onClear={optional ? () => onPick("") : undefined} />
      ))}
    </div>
  );
}

/** Tap-to-add suggestion chips under a text box. */
function IdeaChips({ label, ideas, onAdd }: { label: string; ideas: readonly string[]; onAdd: (idea: string) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {ideas.map((idea) => (
        <button key={idea} type="button" onClick={() => onAdd(idea)} aria-label={`Add ${idea.toLowerCase()}`}
          className="min-h-11 rounded-full border-2 border-field bg-white px-4 text-sm font-bold text-ink transition-transform duration-150 active:scale-[.97]">
          + {idea}
        </button>
      ))}
    </div>
  );
}

/** The input(s) for exactly one onboarding question. The question text itself comes from PANEL_COPY. */
export function PanelFields({ id, data, update, tagName }: Props) {
  switch (id) {
    case "name":
      return <TextField id="displayName" label="Your first name" hideLabel value={data.displayName} maxLength={60} autoComplete="given-name" onChange={(displayName) => update({ displayName })} />;

    case "relationship":
      return <Radios name="relationship" list={RELATIONSHIPS} value={data.relationship} optional={false} cols={2} onPick={(v) => update({ relationship: v as OnboardingData["relationship"] })} />;

    case "nickname":
      return <TextField id="nickname" label="Your child's name or nickname" hideLabel value={data.nickname} maxLength={40} autoComplete="off" onChange={(nickname) => update({ nickname })} />;

    case "age":
      return <AgePicker value={data.ageYears} onChange={(ageYears) => update({ ageYears })} />;

    case "pronouns":
      return <Radios name="pronouns" list={PRONOUNS} value={data.pronouns} onPick={(v) => update({ pronouns: v as OnboardingData["pronouns"] })} />;

    case "journey":
      return <Radios name="journey" list={JOURNEY_STAGES} value={data.journeyStage} onPick={(v) => update({ journeyStage: v as OnboardingData["journeyStage"] })} />;

    case "commLevel":
      return <Radios name="commLevel" list={COMM_LEVELS} value={data.communicationLevel} onPick={(v) => update({ communicationLevel: v as OnboardingData["communicationLevel"] })} />;

    case "commTools": {
      const toggleTool = (v: OnboardingData["commTools"][number]) =>
        update({ commTools: v === "none" ? (data.commTools.includes("none") ? [] : ["none"]) : toggleValue(data.commTools.filter((t) => t !== "none"), v) });
      return (
        <div className="grid gap-3">
          {COMM_TOOLS.map((o) => (
            <Choice key={o.value} type="checkbox" name="commTools" value={o.value} label={o.label} checked={data.commTools.includes(o.value)} onChange={() => toggleTool(o.value)} />
          ))}
        </div>
      );
    }

    case "sensory":
      return (
        <div className="space-y-5">
          {SENSORY_KEYS.map((k) => (
            <Group key={k.value} legend={k.label}>
              <div className="grid grid-cols-3 gap-2">
                {SENSORY_MODES.map((m) => (
                  <Choice key={m.value} compact type="radio" name={`sensory-${k.value}`} value={m.value} label={SENSORY_SHORT[m.value] ?? m.label}
                    checked={(data.sensory[k.value] ?? "none") === m.value}
                    onChange={() => update({ sensory: { ...data.sensory, [k.value]: m.value } })} />
                ))}
              </div>
            </Group>
          ))}
        </div>
      );

    case "calming":
      return (
        <div className="space-y-3">
          <TextField id="calming" multiline label="What helps your child calm down?" hideLabel value={data.calming} maxLength={300} onChange={(calming) => update({ calming })} />
          <IdeaChips label="Ideas to add" ideas={CALMING_IDEAS} onAdd={(idea) => update({ calming: appendIdea(data.calming, idea, 300) })} />
        </div>
      );

    case "interests":
      return (
        <div className="space-y-3">
          <TextField id="interests" multiline label="What does your child love?" hideLabel value={data.interests} maxLength={300} onChange={(interests) => update({ interests })} />
          <IdeaChips label="Ideas to add for what they love" ideas={INTEREST_IDEAS} onAdd={(idea) => update({ interests: appendIdea(data.interests, idea, 300) })} />
        </div>
      );

    case "challenges":
      return (
        <Group legend="Choose up to 3">
          <div className="grid gap-3 sm:grid-cols-2">
            {CHALLENGES.map((o) => {
              const checked = data.challenges.includes(o.value);
              return (
                <Choice key={o.value} type="checkbox" name="challenges" value={o.value} label={o.label} checked={checked}
                  disabled={!checked && data.challenges.length >= MAX_CHALLENGES}
                  onChange={() => update({ challenges: toggleValue(data.challenges, o.value, MAX_CHALLENGES) })} />
              );
            })}
          </div>
          <p aria-live="polite" className="text-sm font-bold text-ink-soft">{data.challenges.length} of {MAX_CHALLENGES} chosen{data.challenges.length >= MAX_CHALLENGES ? ". Untick one to pick another." : ""}</p>
        </Group>
      );

    case "school":
      return <Radios name="school" list={SCHOOL_SETTINGS} value={data.school} onPick={(v) => update({ school: v as OnboardingData["school"] })} />;

    case "therapist":
      return <Radios name="therapist" list={THERAPIST} value={data.hasTherapist} onPick={(v) => update({ hasTherapist: v as OnboardingData["hasTherapist"] })} />;

    case "wandering":
      return <Radios name="wandering" list={WANDERING} value={data.wanderingRisk} onPick={(v) => update({ wanderingRisk: v as OnboardingData["wanderingRisk"] })} />;

    case "avoid":
      return <TextField id="avoid" multiline label="Anything people should avoid?" hideLabel value={data.avoid} maxLength={300} onChange={(avoid) => update({ avoid })} />;

    case "contact":
      return (
        <div className="space-y-5">
          <TextField id="contactName" label="Name" value={data.contactName} maxLength={60} autoComplete="off" onChange={(contactName) => update({ contactName })} />
          <TextField id="contactPhone" label="Phone number" type="tel" inputMode="tel" value={data.contactPhone} maxLength={30} autoComplete="off" onChange={(contactPhone) => update({ contactPhone })} />
        </div>
      );

    case "tag":
      return (
        <div className="space-y-4">
          <Choice type="checkbox" name="wearsTag" value="yes" label={`My child wears ${tagName}`} checked={data.wearsTag} onChange={() => update({ wearsTag: !data.wearsTag })} />
          {data.wearsTag && (
            <Group legend="Which network is it on?">
              <Radios name="tagNetwork" list={TAG_NETWORKS} value={data.tagNetwork} onPick={(v) => update({ tagNetwork: v as OnboardingData["tagNetwork"] })} />
            </Group>
          )}
        </div>
      );

    case "review":
      return null;
  }
}
