import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getSavedGuides } from "@/server/progress/service";

export const metadata = { title: "Saved guides" };

export default async function Saved() {
  const session = await getSession();
  if (!session) notFound();
  const guides = await getSavedGuides(session.user.id);
  return (
    <div className="space-y-5">
      <Link href="/home" className="inline-flex min-h-11 items-center gap-1 font-bold text-brand"><ArrowLeft size={18} aria-hidden="true" /> Home</Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight">Saved guides</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>
      {guides.length === 0 ? (
        <div className="card space-y-3 p-5">
          <p className="font-display text-lg font-bold">Nothing saved yet</p>
          <p className="text-ink-soft">Open a guide and tap “Save for later”. It will show up here.</p>
          <Link href="/home" className="btn-secondary">Browse guides</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {guides.map((a) => (
            <li key={a.slug}>
              <Link href={`/learn/${a.moduleId}/${a.slug}`} className="card flex min-h-20 items-center gap-4 p-4 transition active:scale-[.99]">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold leading-tight">{a.title}</span>
                  <span className="block text-sm text-ink-soft">{a.moduleShortName} · {a.readTime}</span>
                </span>
                <ChevronRight size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
