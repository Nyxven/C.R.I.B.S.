import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
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
    <div className="space-y-5">
      <Link href="/ask" className="inline-flex min-h-11 items-center gap-1 font-bold text-brand"><ArrowLeft size={18} aria-hidden="true" /> Ask CRIBS</Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight">Chat history</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
        <p className="text-ink-soft">Chats are kept for {HISTORY_DAYS} days after your last message, then deleted. Emergency messages are never saved.</p>
      </header>
      <HistoryToggle enabled={enabled} />
      {threads.length === 0 ? (
        <div className="card space-y-2 p-5"><p className="font-display text-lg font-bold">No saved chats</p><p className="text-ink-soft">{enabled ? "Your next chat will show up here." : "Saving is off."}</p></div>
      ) : (
        <ul className="space-y-3">
          {threads.map((t) => (
            <li key={t.id} className="card flex items-center gap-2 p-2 pl-4">
              <Link href={`/ask?thread=${t.id}`} className="flex min-h-14 min-w-0 flex-1 items-center gap-3">
                <span className="min-w-0 flex-1"><span className="block truncate font-bold">{t.title}</span><span className="block text-sm text-ink-soft">{day.format(t.updatedAt)}</span></span>
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
