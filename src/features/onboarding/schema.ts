import { z } from "zod";
import {
  CHALLENGES, COMM_LEVELS, COMM_TOOLS, JOURNEY_STAGES, MAX_CHALLENGES, PRONOUNS, RELATIONSHIPS, SCHOOL_SETTINGS,
  SENSORY_MODES, STEP_IDS, TAG_NETWORKS, THERAPIST, WANDERING, normalizePhone, valuesOf, type Option, type StepId,
} from "@/lib/domain/onboarding";

// Shared by the forms (client) and the server actions, so both sides agree on the rules.
const GENERIC = "Please check your answers and try again.";

const choice = <T extends readonly Option[]>(list: T) => z.union([z.enum(valuesOf(list)), z.literal("")]);
const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);
const unique = <T>(a: T[]) => [...new Set(a)];
const mode = z.enum(valuesOf(SENSORY_MODES)).optional();

const about = z.object({
  displayName: z.string().trim().min(1, "Please tell us your name.").max(60, "Please keep your name under 60 characters."),
  relationship: choice(RELATIONSHIPS).refine((v) => v !== "", "Please choose one."),
});
const child = z.object({
  nickname: z.string().trim().min(1, "Please add a name or nickname for your child.").max(40, "Please keep this under 40 characters."),
  ageYears: z.number().int().min(0, "Age can't be negative.").max(18, "This guide is for children up to 18.").nullable(),
  pronouns: choice(PRONOUNS),
});
const journey = z.object({ journeyStage: choice(JOURNEY_STAGES) });
const communication = z.object({
  communicationLevel: choice(COMM_LEVELS),
  commTools: z.array(z.enum(valuesOf(COMM_TOOLS))).max(COMM_TOOLS.length).transform(unique),
});
const sensory = z.object({
  sensory: z.object({ sound: mode, light: mode, touch: mode, taste: mode, crowds: mode, movement: mode }),
});
const calming = z.object({ calming: text(300), interests: text(300) });
const challenges = z.object({
  challenges: z.array(z.enum(valuesOf(CHALLENGES))).transform(unique)
    .refine((v) => v.length <= MAX_CHALLENGES, `Please pick up to ${MAX_CHALLENGES}.`),
});
const daily = z.object({ school: choice(SCHOOL_SETTINGS), hasTherapist: choice(THERAPIST) });
const safety = z
  .object({
    wanderingRisk: choice(WANDERING),
    avoid: text(300),
    contactName: text(60),
    contactPhone: z.string().trim().max(30, "That phone number is too long."),
    wearsTag: z.boolean(),
    tagNetwork: choice(TAG_NETWORKS),
  })
  .superRefine((v, ctx) => {
    const phone = normalizePhone(v.contactPhone);
    if (v.contactPhone && !phone) {
      ctx.addIssue({ code: "custom", path: ["contactPhone"], message: "That phone number doesn't look right. Use digits, like 0917 123 4567." });
    } else if (Boolean(v.contactName) !== Boolean(phone)) {
      ctx.addIssue({ code: "custom", path: ["contactName"], message: "Please add both a name and a number, or leave both empty." });
    }
  })
  .transform((v) => ({ ...v, contactPhone: normalizePhone(v.contactPhone) }));

export const stepSchemas = { about, child, journey, communication, sensory, calming, challenges, daily, safety } as const;

export const saveStepInput = z.discriminatedUnion("step", [
  z.object({ step: z.literal("about"), data: about }),
  z.object({ step: z.literal("child"), data: child }),
  z.object({ step: z.literal("journey"), data: journey }),
  z.object({ step: z.literal("communication"), data: communication }),
  z.object({ step: z.literal("sensory"), data: sensory }),
  z.object({ step: z.literal("calming"), data: calming }),
  z.object({ step: z.literal("challenges"), data: challenges }),
  z.object({ step: z.literal("daily"), data: daily }),
  z.object({ step: z.literal("safety"), data: safety }),
]);
export type SaveStepInput = z.infer<typeof saveStepInput>;

export const skipStepInput = z.object({ step: z.enum(STEP_IDS as [StepId, ...StepId[]]) });

/** First message a parent can read. Default Zod wording (only seen with tampered requests) becomes a generic line. */
export function firstMessage(error: z.ZodError): string {
  const m = error.issues[0]?.message ?? GENERIC;
  return /^(Invalid|Too (small|big)|Expected|Required|Unrecognized)/.test(m) ? GENERIC : m;
}
