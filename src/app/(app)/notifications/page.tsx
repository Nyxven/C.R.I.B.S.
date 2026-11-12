import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkAllRead } from "@/components/community/NotificationControls";
import { safeLink, timeAgo } from "@/lib/notifications/rules";
import { getSession } from "@/server/auth/session";
import { listMine } from "@/server/notifications/service";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) notFound();
  const items = await listMine(session.user.id);
  const now = new Date();
  return (
    <div className="space-y-5">
      <Link href="/home" className="inline-flex min-h-11 items-center gap-1 font-bold text-brand"><ArrowLeft size={18} aria-hidden="true" /> Home</Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight">Notifications</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>
      <MarkAllRead disabled={items.every((n) => n.readAt)} />
      {items.length === 0 ? <p className="card p-5">Nothing new yet. Replies and helpful marks on your posts show up here.</p> : (
        <ul className="space-y-3">
          {items.map((n) => {
            const link = safeLink(n.link);
            const body = (<><span className={`block ${n.readAt ? "" : "font-bold"}`}>{n.body}</span><span className="block text-sm text-ink-soft">{timeAgo(n.createdAt, now)}{n.readAt ? "" : " · New"}</span></>);
            return <li key={n.id} className="card p-4">{link ? <Link href={link} className="block min-h-11">{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
