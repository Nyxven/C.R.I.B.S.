import { ChatView } from "@/components/ask/ChatView";
import { starterChips } from "@/lib/ai/starters";
import { isAiConfigured } from "@/server/ai/deps";
import { getSession } from "@/server/auth/session";
import { getChild } from "@/server/onboarding/repo";

export const metadata = { title: "Ask CRIBS" };

export default async function AskPage() {
  const session = await getSession();
  const child = session ? await getChild(session.user.id) : null;
  return <ChatView starters={starterChips(child?.challenges ?? [])} available={isAiConfigured()} />;
}
