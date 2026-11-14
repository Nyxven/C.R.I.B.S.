import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ModerationButtons } from "@/components/community/ModerationButtons";
import { getSession } from "@/server/auth/session";
import { moderationQueue } from "@/server/community/service";

export const metadata = { title: "Moderation" };

export default async function ModerationPage() {
  const session = await getSession();
  if (!session) notFound();
  const q = await moderationQueue(session.user.email);
  if (!q.ok) notFound(); // not a moderator: the page does not exist for you
  return (
    <div className="space-y-6">
      <BackLink href="/community">Community</BackLink>
      <PageHeader title="Posts held for review" intro={q.items.length > 0 ? `${q.items.length} waiting` : undefined} />
      {q.items.length === 0 ? <EmptyState icon={ShieldCheck} title="Nothing is waiting" actionHref="/community" actionLabel="Back to the community">Reported posts that need a look will appear here.</EmptyState> : (
        <ul className="space-y-3">
          {q.items.map((p) => (
            <li key={p.id} className="card space-y-2 p-4">
              <p className="text-sm font-bold text-ink-soft">{p.displayName} · {p.reports} {p.reports === 1 ? "report" : "reports"}{p.parentId ? " · a reply" : ""}</p>
              <p className="whitespace-pre-wrap break-words">{p.body}</p>
              <ModerationButtons postId={p.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
