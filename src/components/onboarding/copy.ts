import type { StepId } from "@/lib/domain/onboarding";

// Warm, plain wording for each screen. No jargon.
export const STEP_COPY: Record<StepId, { question: string; intro?: string }> = {
  about: { question: "Let's start with you", intro: "This personalizes your guidance. You can change anything later." },
  child: { question: "Tell us about your child", intro: "A nickname is fine." },
  journey: { question: "Where are you on the journey?", intro: "There's no wrong answer. This stays private to your account." },
  communication: { question: "How does your child communicate?", intro: "Pick what fits best today." },
  sensory: { question: "How does your child react to sensory things?", intro: "For each one, pick what you usually see." },
  calming: { question: "What calms and delights them?", intro: "Short notes are enough." },
  challenges: { question: "What is hardest right now?", intro: "Pick up to 3. Your guides will start with these." },
  daily: { question: "What does daily life look like?" },
  safety: {
    question: "Safety information",
    intro: "This helps if your child ever wanders off. Only add what you are comfortable with. Nothing here is shown to anyone else.",
  },
  review: { question: "Does this look right?", intro: "Tap Edit to change anything now." },
};
