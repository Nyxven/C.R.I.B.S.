import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageCircle } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeleteAllButton, DeleteThreadButton, HistoryToggle } from "@/components/ask/HistoryControls";
import { HISTORY_DAYS } from "@/lib/chat/history";
import { getSession } from "@/server/auth/session";
import { getHistorySetting, listMyThreads } from "@/server/chat/service";

export const metadata = { title: "Chat history" };

const day = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) notFound();
  const [threads, enabled] = await Promise.all([listMyThreads(session.user.id), getHistorySetting(session.user.id)]);
  return (
    <div className="space-y-6">
      <BackLink href="/ask">Ask CRIBS</BackLink>
      <PageHeader title="Chat history" intro={`Chats are kept for ${HISTORY_DAYS} days after your last message, then deleted. Emergency messages are never saved.`} />
      <HistoryToggle enabled={enabled} />
      {threads.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No saved chats" actionHref="/ask" actionLabel="Start a chat">
          {enabled ? "Your next chat will show up here." : "Saving is turned off, so new chats are not kept. Turn it on above if you want to come back to them."}
        </EmptyState>
      ) : (
        <ul className="list-group stagger">
          {threads.map((t) => (
            <li key={t.id} className="flex items-center gap-1 pr-2">
              <Link href={`/ask?thread=${t.id}`} className="list-row min-w-0 flex-1">
                <span className="min-w-0 flex-1"><span className="row-title block truncate">{t.title}</span><span className="row-sub block">{day.format(t.updatedAt)}</span></span>
                <ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />
              </Link>
              <DeleteThreadButton id={t.id} title={t.title} />
            </li>
          ))}
        </ul>
      )}
      <DeleteAllButton disabled={threads.length === 0} />
    </div>
  );
}
