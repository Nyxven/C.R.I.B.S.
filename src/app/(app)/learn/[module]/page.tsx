import Link from "next/link";
import { notFound } from "next/navigation";
import { modules } from "@/content";

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const m = modules.find((x) => x.id === module);
  if (!m) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{m.name}</h1>
      <p className="text-ink-soft">{m.description}</p>
      <ul className="space-y-3">
        {m.articles.map((a) => (
          <li key={a.slug}><Link href={`/learn/${m.id}/${a.slug}`} className="card block p-4"><b>{a.title}</b><span className="block text-sm text-ink-soft">{a.readTime}</span></Link></li>
        ))}
      </ul>
    </div>
  );
}
