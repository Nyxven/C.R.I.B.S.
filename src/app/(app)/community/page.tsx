import Link from "next/link";
import { notFound } from "next/navigation";
import { Shield } from "lucide-react";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/server/auth/session";
import { feed, isMod } from "@/server/community/service";

export const metadata = { title: "Parent community" };

export default async function CommunityPage() {
  const session = await getSession();
  if (!session) notFound();
  const { posts, next } = await feed(session.user.id);
  return (
    <div className="space-y-6">
      <BackLink href="/home">Home</BackLink>
      <PageHeader title="Parent community" intro="Tips and small wins from other parents."
        action={isMod(session.user.email) ? <Link href="/community/moderation" className="btn-ghost"><Shield size={18} aria-hidden="true" /> Moderation</Link> : undefined} />
      <CommunityFeed initial={posts} next={next} />
    </div>
  );
}
