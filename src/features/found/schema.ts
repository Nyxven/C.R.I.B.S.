import { z } from "zod";

// Which parts of the "if found" page are public. Strict: unknown keys are rejected.
export const fieldsSchema = z.object({
  nickname: z.boolean(), autism: z.boolean(), communication: z.boolean(), calming: z.boolean(), avoid: z.boolean(), contact: z.boolean(),
}).strict();
