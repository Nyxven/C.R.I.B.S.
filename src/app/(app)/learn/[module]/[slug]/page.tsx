import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { modules } from "@/content";

// Seed HTML is trusted, static, first-party content. Sanitize before rendering any user/AI-authored HTML (see BUILD §6.6).
export default async function Article({ params }: { params: Promise<{ module: string; slug: string }> }) {
  const { module, slug } = await params;
  const m = modules.find((x) => x.id === module);
  const a = m?.articles.find((x) => x.slug === slug);
  if (!m || !a) notFound();
  return (
    <article className="space-y-6">
      <Link href={`/learn/${m.id}`} className="inline-flex min-h-11 items-center gap-1 font-bold text-brand"><ArrowLeft size={18} aria-hidden="true" /> {m.shortName}</Link>
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold leading-tight">{a.title}</h1>
        <p className="chip">{a.readTime}</p>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>
      <div className="prose-cribs" dangerouslySetInnerHTML={{ __html: a.html }} />
      <p className="rounded-2xl bg-tint-yellow p-4 text-sm font-semibold text-ink">General guidance only. It does not replace advice from a licensed professional.</p>
      <Link href={`/learn/${m.id}`} className="btn-secondary w-full">Back to {m.shortName}</Link>
    </article>
  );
}
