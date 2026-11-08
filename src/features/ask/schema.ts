import { z } from "zod";

// Loose shape check only. The strict rules (length, order, history) live in lib/ai/limits.ts.
export const chatRequestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(5000) })).min(1).max(30),
}).strict();
export type ChatRequest = z.infer<typeof chatRequestSchema>;
