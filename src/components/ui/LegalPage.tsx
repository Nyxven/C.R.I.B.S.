import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Shell for the legal pages. The text is a DRAFT: the team must replace it with approved wording. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-8">
      <Link href="/" className="flex items-center gap-2"><Logo size={48} alt="" /><span className="font-display text-xl font-bold">C.R.I.B.S.</span></Link>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="rounded-2xl bg-tint-yellow p-4 text-sm font-semibold text-ink">Draft for the school project. This text has not been reviewed yet and will be replaced before families use the app for real.</p>
      <div className="space-y-4 text-lg leading-relaxed">{children}</div>
      <Link href="/" className="btn-secondary">Back to start</Link>
    </main>
  );
}
