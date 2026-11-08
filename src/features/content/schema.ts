import { z } from "zod";
import { isValidSlug } from "@/lib/domain/progress";

// Shared by the buttons and the server action. The server checks again.
export const toggleSchema = z.object({
  slug: z.string().refine(isValidSlug, "Unknown guide."),
  value: z.boolean(),
});
export type ToggleInput = z.infer<typeof toggleSchema>;
