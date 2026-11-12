import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    <div className="space-y-5">
      <Link href="/community" className="inline-flex min-h-11 items-center gap-1 font-bold text-brand"><ArrowLeft size={18} aria-hidden="true" /> Community</Link>
      <h1 className="text-3xl font-extrabold leading-tight">Posts held for review</h1>
      {q.items.length === 0 ? <p className="card p-5">Nothing is waiting.</p> : (
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
