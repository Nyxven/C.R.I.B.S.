import { notFound } from "next/navigation";
import { BookOpen, Check } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkRow } from "@/components/ui/LinkRow";
import { getModule } from "@/server/content/service";
import { getSession } from "@/server/auth/session";
import { getProgress } from "@/server/progress/service";
import { moduleProgress, readSlugs } from "@/lib/domain/progress";
import { ProgressBar } from "@/components/content/ProgressBar";
import { moduleLook } from "@/components/content/moduleStyle";

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return { title: (await getModule(module))?.shortName ?? "Guides" };
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const [m, session] = await Promise.all([getModule(module), getSession()]);
  if (!m || !session) notFound();
  const entries = await getProgress(session.user.id);
  const read = readSlugs(entries);
  const progress = moduleProgress(m.articles.map((a) => a.slug), entries);
  const { box, Icon } = moduleLook(m.id);
  return (
    <div className="space-y-6">
      <BackLink href="/home">Home</BackLink>
      <header className={`rise space-y-3 rounded-3xl p-5 ${box}`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink shadow-sm"><Icon size={24} aria-hidden="true" /></span>
        <h1 className="h-page">{m.name}</h1>
        <p className="text-ink-soft">{m.description}</p>
        <ProgressBar progress={progress} />
      </header>
      {m.articles.length === 0 ? (
        <EmptyState icon={BookOpen} title="Guides are on the way" actionHref="/home" actionLabel="Back to Home">
          We are still adding guides to this topic. Please check back soon.
        </EmptyState>
      ) : (
        <ol className="list-group stagger">
          {m.articles.map((a, i) => (
            <li key={a.slug}>
              <LinkRow href={`/learn/${m.id}/${a.slug}`} title={a.title} sub={`${a.readTime}${read.has(a.slug) ? " · Read" : ""}`}
                lead={<span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-ink ${read.has(a.slug) ? "bg-tint-mint" : "bg-tint-purple"}`} aria-hidden="true">{read.has(a.slug) ? <Check size={20} /> : i + 1}</span>} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
