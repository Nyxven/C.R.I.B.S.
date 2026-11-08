// Emergency contacts shown by the AI guide's safety layer. Never invent a number here.
export const EMERGENCY_NUMBER = "911"; // Philippines national emergency number

/** Crisis lines. Add one only after checking it against an official source, and record where in `source`.
 *  Empty on purpose until the team has verified numbers: the app then shows only 911. */
export type CrisisLine = { name: string; number: string; source: string };
export const CRISIS_LINES: readonly CrisisLine[] = [];
