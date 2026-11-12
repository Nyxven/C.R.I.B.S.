import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { getSession } from "@/server/auth/session";
import { feed, isMod } from "@/server/community/service";

export const metadata = { title: "Parent community" };

export default async function CommunityPage() {
  const session = await getSession();
  if (!session) notFound();
  const { posts, next } = await feed(session.user.id);
  return (
    <div className="space-y-5">
      <Link href="/home" className="inline-flex min-h-11 items-center gap-1 font-bold text-brand"><ArrowLeft size={18} aria-hidden="true" /> Home</Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight">Parent community</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
        {isMod(session.user.email) && <Link href="/community/moderation" className="font-bold text-brand underline">Moderation queue</Link>}
      </header>
      <CommunityFeed initial={posts} next={next} />
    </div>
  );
}
