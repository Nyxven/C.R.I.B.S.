import Link from "next/link";
import { Logo } from "@/components/Logo";

export const LEGAL_VERSION = "Draft v0.2, 14 November 2026";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Shell for the legal pages: draft notice, contents list, numbered sections, review questions. */
export function LegalPage({ title, intro, sections, openQuestions }: {
  title: string; intro: React.ReactNode; sections: LegalSection[]; openQuestions: string[];
}) {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-8">
      <Link href="/" className="flex items-center gap-2 rounded-xl"><Logo size={48} alt="" /><span className="font-display text-xl font-bold">C.R.I.B.S.</span></Link>
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="text-sm font-bold text-ink-soft">{LEGAL_VERSION}</p>
        <div role="note" className="notice notice-warn">
          <p><b>Draft pending review.</b> This text was written for the C.R.I.B.S. school research project and has not been reviewed by the research adviser or a privacy professional. It is not legal advice, and publishing it does not mean the app is compliant with any law.</p>
        </div>
        <div className="text-lg leading-relaxed">{intro}</div>
      </header>

      <nav aria-label="Contents" className="list-group">
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer items-center px-4 font-extrabold">Contents</summary>
          <ol className="space-y-1 px-4 pb-4">
            {sections.map((s, i) => (
              <li key={s.id}><a href={`#${s.id}`} className="inline-flex min-h-11 items-center text-brand underline">{i + 1}. {s.title}</a></li>
            ))}
            <li><a href="#open-questions" className="inline-flex min-h-11 items-center text-brand underline">Open questions for review</a></li>
          </ol>
        </details>
      </nav>

      <div className="space-y-8">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-6 space-y-3">
            <h2 id={`${s.id}-h`} className="text-xl font-extrabold">{i + 1}. {s.title}</h2>
            <div className="space-y-3 text-[1.0625rem] leading-relaxed [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">{s.body}</div>
          </section>
        ))}
      </div>

      <section id="open-questions" aria-labelledby="oq-h" className="scroll-mt-6 space-y-3 rounded-2xl bg-tint-yellow p-5">
        <h2 id="oq-h" className="text-xl font-extrabold">Open questions for review</h2>
        <p>These points are not settled. The research adviser and an appropriate privacy professional should answer them before real families use the app.</p>
        <ul className="list-disc space-y-2 pl-6">{openQuestions.map((q) => <li key={q}>{q}</li>)}</ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn-secondary">Back to start</Link>
        <Link href="/privacy" className="btn-ghost">Privacy Policy</Link>
        <Link href="/terms" className="btn-ghost">Terms of Use</Link>
      </div>
    </main>
  );
}
