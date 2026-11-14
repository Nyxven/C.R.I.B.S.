import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { FoundManager } from "@/components/found/FoundManager";
import { brand } from "@/config/brand";
import { getSession } from "@/server/auth/session";
import { getStatus } from "@/server/found/service";

export const metadata = { title: `Find ${brand.tagName}` };

const day = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });

export default async function FindPage() {
  const session = await getSession();
  if (!session) notFound();
  const status = await getStatus(session.user.id);
  const tag = status.tag ? { enabled: status.tag.enabled, createdAt: day.format(status.tag.createdAt), accessCount: status.tag.accessCount, fields: status.tag.fields } : null;
  return (
    <div className="space-y-6">
      <BackLink href="/home">Home</BackLink>
      <PageHeader title={`Find ${brand.tagName}`} intro="Locate your tag, and choose what a finder can see." />

      <section className="card space-y-3 p-5" aria-labelledby="net-title">
        <h2 id="net-title" className="font-display text-lg font-bold">Locate the tag</h2>
        <p className="text-ink-soft">The tag works with your phone's own network. {brand.name} cannot see where it is or set up a safe zone. Open the network that your tag uses.</p>
        <div className="flex flex-wrap gap-3">
          <a href="https://www.icloud.com/find" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">Apple Find My <ExternalLink size={16} aria-hidden="true" /></a>
          <a href="https://www.google.com/android/find" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">Google Find Hub <ExternalLink size={16} aria-hidden="true" /></a>
        </div>
      </section>

      <h2 className="h-section">If-found page</h2>
      <FoundManager hasChild={status.hasChild} hasContact={status.hasContact} tag={tag} />
    </div>
  );
}
