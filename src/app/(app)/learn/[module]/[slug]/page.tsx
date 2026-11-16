import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { LinkRow } from "@/components/ui/LinkRow";
import { getArticleBySlug, getModule } from "@/server/content/service";
import { getSession } from "@/server/auth/session";
import { getEntryFor } from "@/server/progress/service";
import { ArticleActions } from "@/components/content/ArticleActions";
import { isExpertReviewed } from "@/lib/domain/content";
import { moduleLook } from "@/components/content/moduleStyle";
import { getT } from "@/lib/i18n/server";
import { Logo } from "@/components/Logo";

export async function generateMetadata({ params }: { params: Promise<{ module: string; slug: string }> }) {
  const { module, slug } = await params;
  return { title: (await getArticleBySlug(module, slug))?.title ?? "Guide" };
}

// Seed HTML is trusted, static, first-party content. Sanitize before rendering any user/AI-authored HTML (see BUILD §6.6).
export default async function Article({ params }: { params: Promise<{ module: string; slug: string }> }) {
  const { module, slug } = await params;
  const [a, session, t] = await Promise.all([getArticleBySlug(module, slug), getSession(), getT()]);
  if (!a || !session) notFound();
  const [entry, m] = await Promise.all([getEntryFor(session.user.id, a.slug), getModule(a.moduleId)]);
  const list = m?.articles ?? [];
  const at = list.findIndex((x) => x.slug === a.slug);
  const next = at >= 0 ? list[at + 1] : undefined; // none for the last guide, or if this guide is not in the module list
  const { box, Icon } = moduleLook(a.moduleId);
  return (
    <article className="space-y-7">
      <BackLink href={`/learn/${a.moduleId}`}>{a.moduleShortName}</BackLink>
      <header className={`rise space-y-3 rounded-3xl p-5 ${box}`}>
        <p className="flex items-center gap-2 font-bold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm" aria-hidden="true"><Icon size={20} /></span>
          {a.moduleShortName}
        </p>
        <h1 className="h-page">{a.title}</h1>
        <div className="flex flex-wrap gap-2">
          {at >= 0 && <p className="chip bg-white">{t("article.guideOf", { n: at + 1, total: list.length })}</p>}
          <p className="chip bg-white">{a.readTime}</p>{isExpertReviewed(a) && <p className="chip bg-white">{t("article.reviewed")}</p>}</div>
      </header>
      <div className="prose-cribs" dangerouslySetInnerHTML={{ __html: a.html }} />
      <ArticleActions slug={a.slug} initial={entry} />
      <Link href={`/ask?about=${encodeURIComponent(a.slug)}`} className="btn-secondary w-full"><Logo size={26} alt="" /> {t("article.ask")}</Link>
      {next && (
        <section aria-labelledby="next-title">
          <h2 id="next-title" className="section-label">{t("article.upNext")}</h2>
          <div className="list-group"><LinkRow href={`/learn/${a.moduleId}/${next.slug}`} title={next.title} sub={next.readTime} /></div>
        </section>
      )}
      <p className="notice notice-warn text-sm"><Info size={20} className="mt-0.5 shrink-0 text-amber-dark" aria-hidden="true" /><span>{t("article.note")}</span></p>
      {!next && <Link href={`/learn/${a.moduleId}`} className="btn-secondary w-full">{t("article.backTo", { module: a.moduleShortName })}</Link>}
    </article>
  );
}
