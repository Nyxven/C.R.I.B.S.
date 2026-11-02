import { notFound } from "next/navigation";
import { modules } from "@/content";

// Seed HTML is trusted, static, first-party content. Sanitize before rendering any user/AI-authored HTML (see BUILD §6.6).
export default async function Article({ params }: { params: Promise<{ module: string; slug: string }> }) {
  const { module, slug } = await params;
  const a = modules.find((m) => m.id === module)?.articles.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <article className="space-y-3 [&_li]:mb-2 [&_li]:leading-relaxed [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="text-2xl font-extrabold">{a.title}</h1>
      <p className="text-sm text-ink-soft">{a.readTime}</p>
      <div dangerouslySetInnerHTML={{ __html: a.html }} />
      <p className="rounded-2xl bg-amber/15 p-3 text-sm text-amber-dark">General guidance only. It does not replace advice from a licensed professional.</p>
    </article>
  );
}
