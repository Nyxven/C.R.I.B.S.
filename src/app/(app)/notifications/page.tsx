import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { MarkAllRead } from "@/components/community/NotificationControls";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { safeLink, timeAgo } from "@/lib/notifications/rules";
import { getSession } from "@/server/auth/session";
import { listMine } from "@/server/notifications/service";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) notFound();
  const items = await listMine(session.user.id);
  const now = new Date();
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="space-y-6">
      <BackLink href="/home">Home</BackLink>
      <PageHeader title="Notifications" intro={items.length > 0 ? (unread > 0 ? `${unread} new` : "You have read everything.") : undefined} />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="You are all caught up" actionHref="/community" actionLabel="Visit the community">
          Replies and “helpful” marks on your community posts will show up here.
        </EmptyState>
      ) : (
        <>
          <MarkAllRead disabled={unread === 0} />
          <ul className="list-group stagger">
            {items.map((n) => {
              const link = safeLink(n.link);
              const isNew = !n.readAt;
              const body = (
                <>
                  <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${isNew ? "bg-brand" : "bg-transparent"}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block break-words ${isNew ? "font-bold" : ""}`}>{n.body}</span>
                    <span className="row-sub block">{timeAgo(n.createdAt, now)}{isNew ? " · New" : ""}</span>
                  </span>
                  {link && <ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />}
                </>
              );
              return <li key={n.id}>{link ? <Link href={link} className="list-row">{body}</Link> : <div className="list-row">{body}</div>}</li>;
            })}
          </ul>
        </>
      )}
    </div>
  );
}
