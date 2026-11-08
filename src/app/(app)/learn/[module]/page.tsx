import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
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
      <Link href="/home" className="inline-flex min-h-11 items-center gap-1 font-bold text-brand"><ArrowLeft size={18} aria-hidden="true" /> Home</Link>
      <header className={`space-y-3 rounded-3xl p-5 ${box}`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink shadow-sm"><Icon size={24} aria-hidden="true" /></span>
        <h1 className="text-2xl font-extrabold leading-tight">{m.name}</h1>
        <p className="text-ink-soft">{m.description}</p>
        <ProgressBar progress={progress} />
      </header>
      <ol className="space-y-3">
        {m.articles.map((a, i) => (
          <li key={a.slug}>
            <Link href={`/learn/${m.id}/${a.slug}`} className="card flex min-h-20 items-center gap-4 p-4 transition active:scale-[.99]">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-ink ${box}`} aria-hidden="true">{read.has(a.slug) ? <Check size={20} /> : i + 1}</span>
              <span className="min-w-0 flex-1"><span className="block font-display text-lg font-bold leading-tight">{a.title}</span><span className="block text-sm text-ink-soft">{a.readTime}{read.has(a.slug) ? " · Read" : ""}</span></span>
              <ChevronRight size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
