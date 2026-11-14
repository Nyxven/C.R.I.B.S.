import type { PanelId } from "@/lib/domain/panels";

// Warm, plain wording for each screen: one question each. `why` explains sensitive questions.
export const PANEL_COPY: Record<PanelId, { question: string; intro?: string; why?: string }> = {
  name: { question: "What should we call you?", intro: "About 2 minutes in all. You can change any answer later." },
  relationship: { question: "How are you related to your child?" },
  nickname: { question: "What is your child's name or nickname?", intro: "A nickname is fine. We use it to personalize your guides.", why: "We never send your child's name to the AI assistant." },
  age: { question: "How old is your child?", intro: "This helps us pick guidance that fits their age." },
  pronouns: { question: "Which pronouns does your child use?", intro: "Optional. We use them when we write about your child." },
  journey: { question: "Where are you on the journey?", intro: "There's no wrong answer.", why: "This only changes which guides we suggest first. It stays private to your account." },
  commLevel: { question: "How does your child mostly communicate today?", intro: "Pick what fits best right now." },
  commTools: { question: "Which communication tools do you use?", intro: "Pick all that apply." },
  sensory: { question: "How does your child react to sensory things?", intro: "For each one, pick what you usually see." },
  calming: { question: "What helps your child calm down?", intro: "Short notes are enough." },
  interests: { question: "What does your child love?", intro: "Favorite toys, shows, songs or places." },
  challenges: { question: "What is hardest right now?", intro: "Pick up to 3. Your guides will start with these." },
  school: { question: "What does school look like?" },
  therapist: { question: "Does your child see a therapist?" },
  wandering: { question: "Does your child wander or run off?", why: "If you say yes, we point you to safety guidance and the Find CRIBS tag. Nothing is shared." },
  avoid: { question: "Is there anything people should avoid?", intro: "For example: loud voices, touching, sudden movements." },
  contact: { question: "Who should be called in an emergency?", intro: "Optional. Add both a name and a number, or leave both empty.", why: "Only shown on your child's if-found page if you choose to switch that on later." },
  tag: { question: "Does your child wear a CRIBS tag?", intro: "Optional. You can set this up any time from Find CRIBS." },
  review: { question: "Does this look right?", intro: "Tap Edit to change anything now." },
};
