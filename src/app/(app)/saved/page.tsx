import { notFound } from "next/navigation";
import { Bookmark, BookOpen } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkRow } from "@/components/ui/LinkRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/server/auth/session";
import { getSavedGuides } from "@/server/progress/service";

export const metadata = { title: "Saved guides" };

export default async function Saved() {
  const session = await getSession();
  if (!session) notFound();
  const guides = await getSavedGuides(session.user.id);
  return (
    <div className="space-y-6">
      <BackLink href="/home">Home</BackLink>
      <div data-tour="saved-list"><PageHeader title="Saved guides" intro={guides.length > 0 ? `${guides.length} ${guides.length === 1 ? "guide" : "guides"} to read when you have a quiet moment.` : undefined} /></div>
      {guides.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved guides yet" actionHref="/home" actionLabel="Browse guides">
          Open a guide and tap “Save for later”. It will wait for you here.
        </EmptyState>
      ) : (
        <div className="list-group stagger">
          {guides.map((a) => (
            <LinkRow key={a.slug} href={`/learn/${a.moduleId}/${a.slug}`} title={a.title} sub={`${a.moduleShortName} · ${a.readTime}`}
              lead={<span className="row-icon"><BookOpen size={20} aria-hidden="true" /></span>} />
          ))}
        </div>
      )}
    </div>
  );
}
