import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { modules } from "@/content";
import { moduleLook } from "@/components/content/moduleStyle";

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const m = modules.find((x) => x.id === module);
  if (!m) notFound();
  const { box, Icon } = moduleLook(m.id);
  return (
    <div className="space-y-6">
      <Link href="/home" className="inline-flex min-h-11 items-center gap-1 font-bold text-brand"><ArrowLeft size={18} aria-hidden="true" /> Home</Link>
      <header className={`space-y-3 rounded-3xl p-5 ${box}`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink shadow-sm"><Icon size={24} aria-hidden="true" /></span>
        <h1 className="text-2xl font-extrabold leading-tight">{m.name}</h1>
        <p className="text-ink-soft">{m.description}</p>
        <p className="text-sm font-bold">{m.articles.length} guides</p>
      </header>
      <ol className="space-y-3">
        {m.articles.map((a, i) => (
          <li key={a.slug}>
            <Link href={`/learn/${m.id}/${a.slug}`} className="card flex min-h-20 items-center gap-4 p-4 transition active:scale-[.99]">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-ink ${box}`} aria-hidden="true">{i + 1}</span>
              <span className="min-w-0 flex-1"><span className="block font-display text-lg font-bold leading-tight">{a.title}</span><span className="block text-sm text-ink-soft">{a.readTime}</span></span>
              <ChevronRight size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
