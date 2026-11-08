import {
  CALMING_IDEAS, CHALLENGES, INTEREST_IDEAS, appendIdea, COMM_LEVELS, COMM_TOOLS, JOURNEY_STAGES, MAX_CHALLENGES, PRONOUNS, RELATIONSHIPS,
  SCHOOL_SETTINGS, SENSORY_KEYS, SENSORY_MODES, TAG_NETWORKS, THERAPIST, WANDERING, toggleValue,
  type DataStepId, type OnboardingData, type Option,
} from "@/lib/domain/onboarding";
import { Choice, Group, TextField } from "./controls";

// Short button text for the sensory rows (the saved values and review wording do not change).
const SENSORY_SHORT: Record<string, string> = { none: "Fine", avoids: "Avoids", seeks: "Seeks" };

type Props = { id: DataStepId; data: OnboardingData; update: (patch: Partial<OnboardingData>) => void; tagName: string };

/** One single-choice question. Tapping the chosen answer again clears it when `optional`. */
function Radios({ name, list, value, onPick, optional = true, cols = 1 }: {
  name: string; list: readonly Option[]; value: string; onPick: (v: string) => void; optional?: boolean; cols?: 1 | 2;
}) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? "grid-cols-2" : "sm:grid-cols-2"}`}>
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
          className="min-h-11 rounded-full border-2 border-field bg-white px-4 text-sm font-bold text-ink active:scale-[.97]">
          + {idea}
        </button>
      ))}
    </div>
  );
}

export function StepFields({ id, data, update, tagName }: Props) {
  switch (id) {
    case "about":
      return (
        <>
          <TextField id="displayName" label="Your name" value={data.displayName} maxLength={60} autoComplete="name" onChange={(displayName) => update({ displayName })} />
          <Group legend="You are their…">
            <Radios name="relationship" list={RELATIONSHIPS} value={data.relationship} optional={false} cols={2}
              onPick={(v) => update({ relationship: v as OnboardingData["relationship"] })} />
          </Group>
        </>
      );

    case "child":
      return (
        <>
          <TextField id="nickname" label="Your child's name or nickname" value={data.nickname} maxLength={40} autoComplete="off" onChange={(nickname) => update({ nickname })} />
          <TextField id="age" label="Age in years" hint="Use 0 if under 1." inputMode="numeric" autoComplete="off" maxLength={2}
            value={data.ageYears === null ? "" : String(data.ageYears)}
            onChange={(v) => { const d = v.replace(/\D/g, "").slice(0, 2); update({ ageYears: d === "" ? null : Number(d) }); }} />
          <Group legend="Pronouns (optional)">
            <Radios name="pronouns" list={PRONOUNS} value={data.pronouns} cols={2} onPick={(v) => update({ pronouns: v as OnboardingData["pronouns"] })} />
          </Group>
        </>
      );

    case "journey":
      return (
        <Group legend="Choose one">
          <Radios name="journey" list={JOURNEY_STAGES} value={data.journeyStage} onPick={(v) => update({ journeyStage: v as OnboardingData["journeyStage"] })} />
        </Group>
      );

    case "communication": {
      const toggleTool = (v: OnboardingData["commTools"][number]) =>
        update({ commTools: v === "none" ? (data.commTools.includes("none") ? [] : ["none"]) : toggleValue(data.commTools.filter((t) => t !== "none"), v) });
      return (
        <>
          <Group legend="Mostly, your child is…">
            <Radios name="commLevel" list={COMM_LEVELS} value={data.communicationLevel} cols={2} onPick={(v) => update({ communicationLevel: v as OnboardingData["communicationLevel"] })} />
          </Group>
          <Group legend="Tools you use" hint="Pick all that apply.">
            <div className="grid gap-2 sm:grid-cols-2">
              {COMM_TOOLS.map((o) => (
                <Choice key={o.value} type="checkbox" name="commTools" value={o.value} label={o.label} checked={data.commTools.includes(o.value)} onChange={() => toggleTool(o.value)} />
              ))}
            </div>
          </Group>
        </>
      );
    }

    case "sensory":
      return (
        <>
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
        </>
      );

    case "calming": {
      return (
        <>
          <div className="space-y-3">
            <TextField id="calming" multiline label="What helps your child calm down?" value={data.calming} maxLength={300} onChange={(calming) => update({ calming })} />
            <IdeaChips label="Ideas to add" ideas={CALMING_IDEAS} onAdd={(idea) => update({ calming: appendIdea(data.calming, idea, 300) })} />
          </div>
          <div className="space-y-3">
            <TextField id="interests" label="What does your child love?" hint="Favorite toys, shows, songs, places." value={data.interests} maxLength={300} onChange={(interests) => update({ interests })} />
            <IdeaChips label="Ideas to add for what they love" ideas={INTEREST_IDEAS} onAdd={(idea) => update({ interests: appendIdea(data.interests, idea, 300) })} />
          </div>
        </>
      );
    }

    case "challenges":
      return (
        <Group legend="Choose up to 3">
          <div className="grid gap-2 sm:grid-cols-2">
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

    case "daily":
      return (
        <>
          <Group legend="School">
            <Radios name="school" list={SCHOOL_SETTINGS} value={data.school} cols={2} onPick={(v) => update({ school: v as OnboardingData["school"] })} />
          </Group>
          <Group legend="Does your child see a therapist?">
            <Radios name="therapist" list={THERAPIST} value={data.hasTherapist} onPick={(v) => update({ hasTherapist: v as OnboardingData["hasTherapist"] })} />
          </Group>
        </>
      );

    case "safety":
      return (
        <>
          <Group legend="Does your child wander or run off?">
            <Radios name="wandering" list={WANDERING} value={data.wanderingRisk} onPick={(v) => update({ wanderingRisk: v as OnboardingData["wanderingRisk"] })} />
          </Group>
          <TextField id="avoid" multiline label="Anything people should avoid?" hint="For example: loud voices, touching, sudden movements." value={data.avoid} maxLength={300} onChange={(avoid) => update({ avoid })} />
          <Group legend="Emergency contact" hint="Optional, but recommended. Add both a name and a number.">
            <TextField id="contactName" label="Name" value={data.contactName} maxLength={60} autoComplete="off" onChange={(contactName) => update({ contactName })} />
            <TextField id="contactPhone" label="Phone number" type="tel" inputMode="tel" value={data.contactPhone} maxLength={30} autoComplete="off" onChange={(contactPhone) => update({ contactPhone })} />
          </Group>
          <Group legend={tagName}>
            <Choice type="checkbox" name="wearsTag" value="yes" label={`My child wears ${tagName}`} checked={data.wearsTag} onChange={() => update({ wearsTag: !data.wearsTag })} />
            {data.wearsTag && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-ink-soft">Which network is it on?</p>
                <Radios name="tagNetwork" list={TAG_NETWORKS} value={data.tagNetwork} onPick={(v) => update({ tagNetwork: v as OnboardingData["tagNetwork"] })} />
              </div>
            )}
          </Group>
        </>
      );
  }
}
