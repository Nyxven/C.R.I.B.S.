import { ChatView } from "@/components/ask/ChatView";
import { starterChips } from "@/lib/ai/starters";
import { isAiConfigured } from "@/server/ai/deps";
import { getSession } from "@/server/auth/session";
import { getMyThread } from "@/server/chat/service";
import { getChild } from "@/server/onboarding/repo";
import type { ChatMessage } from "@/features/ask/chatState";

export const metadata = { title: "Ask CRIBS" };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ thread?: string | string[] }> }) {
  const { thread: raw } = await searchParams;
  const session = await getSession();
  const child = session ? await getChild(session.user.id) : null;
  // Opening a saved chat: only the signed-in person's own chats load (anything else shows a new chat).
  const saved = session ? await getMyThread(session.user.id, (Array.isArray(raw) ? raw[0] : raw) ?? "") : null;
  const initial = saved
    ? { threadId: saved.id, messages: saved.messages.map((m): ChatMessage => ({ id: m.id, role: m.role, text: m.content, status: "done", kind: "answer", sources: m.sources, serverId: m.role === "assistant" ? m.id : undefined, feedback: m.feedback })) }
    : undefined;
  return <ChatView key={initial?.threadId ?? "new"} starters={starterChips(child?.challenges ?? [])} available={isAiConfigured()} initial={initial} />;
}
