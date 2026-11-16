import { notFound } from "next/navigation";
import { Bookmark, BookOpen } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkRow } from "@/components/ui/LinkRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/server/auth/session";
import { getSavedGuides } from "@/server/progress/service";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Saved guides" };

export default async function Saved() {
  const session = await getSession();
  if (!session) notFound();
  const [guides, t] = await Promise.all([getSavedGuides(session.user.id), getT()]);
  return (
    <div className="space-y-6">
      <BackLink href="/home">{t("nav.home")}</BackLink>
      <div data-tour="saved-list"><PageHeader title={t("saved.title")} intro={guides.length > 0 ? guides.length === 1 ? t("saved.introOne") : t("saved.introMany", { n: guides.length }) : undefined} /></div>
      {guides.length === 0 ? (
        <EmptyState icon={Bookmark} title={t("saved.emptyTitle")} actionHref="/home" actionLabel={t("saved.browse")}>
          {t("saved.emptyBody")}
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
