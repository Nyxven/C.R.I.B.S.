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

export async function generateMetadata({ params }: { params: Promise<{ module: string; slug: string }> }) {
  const { module, slug } = await params;
  return { title: (await getArticleBySlug(module, slug))?.title ?? "Guide" };
}

// Seed HTML is trusted, static, first-party content. Sanitize before rendering any user/AI-authored HTML (see BUILD §6.6).
export default async function Article({ params }: { params: Promise<{ module: string; slug: string }> }) {
  const { module, slug } = await params;
  const [a, session] = await Promise.all([getArticleBySlug(module, slug), getSession()]);
  if (!a || !session) notFound();
  const [entry, m] = await Promise.all([getEntryFor(session.user.id, a.slug), getModule(a.moduleId)]);
  const list = m?.articles ?? [];
  const next = list[list.findIndex((x) => x.slug === a.slug) + 1]; // undefined for the last guide (or if the guide is not in the list)
  return (
    <article className="space-y-7">
      <BackLink href={`/learn/${a.moduleId}`}>{a.moduleShortName}</BackLink>
      <header className="rise space-y-3">
        <h1 className="h-page">{a.title}</h1>
        <div className="flex flex-wrap gap-2"><p className="chip">{a.readTime}</p>{isExpertReviewed(a) && <p className="chip">Reviewed by experts</p>}</div>
      </header>
      <div className="prose-cribs" dangerouslySetInnerHTML={{ __html: a.html }} />
      <ArticleActions slug={a.slug} initial={entry} />
      {next && (
        <section aria-labelledby="next-title">
          <h2 id="next-title" className="section-label">Up next</h2>
          <div className="list-group"><LinkRow href={`/learn/${a.moduleId}/${next.slug}`} title={next.title} sub={next.readTime} /></div>
        </section>
      )}
      <p className="notice notice-warn text-sm"><Info size={20} className="mt-0.5 shrink-0 text-amber-dark" aria-hidden="true" /><span>General guidance only. It does not replace advice from a licensed professional.</span></p>
      {!next && <Link href={`/learn/${a.moduleId}`} className="btn-secondary w-full">Back to {a.moduleShortName}</Link>}
    </article>
  );
}
