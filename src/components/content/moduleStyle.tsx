import { BookOpen, MessageCircle, Heart, GraduationCap, Stethoscope, HelpCircle } from "lucide-react";

type Look = { box: string; Icon: typeof BookOpen };

// One logo color per module. Backgrounds are soft tints, so dark ink text always passes AA.
const modules: Record<string, Look> = {
  info: { box: "bg-tint-purple", Icon: BookOpen },
  comm: { box: "bg-tint-mint", Icon: MessageCircle },
  behave: { box: "bg-tint-coral", Icon: Heart },
  learn: { box: "bg-tint-yellow", Icon: GraduationCap },
};

export const moduleLook = (id: string): Look => modules[id] ?? modules.info!;
export const directoryLook: Look = { box: "bg-tint-pink", Icon: Stethoscope };
export const faqLook: Look = { box: "bg-tint-sage", Icon: HelpCircle };
