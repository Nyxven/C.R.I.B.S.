import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/config/brand";
import { modules } from "@/content";

const benefits = [
  { t: "Everything in one place", d: "Trusted guidance on communication, behavior, sensory needs and school — organized and easy to find." },
  { t: "Ask the guide", d: "Get plain-language answers grounded in the app's own content, any time of day." },
  { t: `${brand.tagName} peace of mind`, d: "Pair your child's smart bear tag and keep an 'if found' card ready." },
];

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Logo size={52} alt="" /><span className="font-display text-xl font-bold">{brand.name}</span></div>
        <Link href="/sign-in" className="font-bold text-ink-soft underline underline-offset-4">Sign in</Link>
      </header>

      <section className="grid items-center gap-10 py-14 md:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
            Gentle, trusted guidance for parents raising children with autism.
          </h1>
          <p className="max-w-md text-lg text-ink-soft">{brand.name} brings guidance, everyday routines and a caring community into one place.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="btn-primary">Create your account</Link>
            <Link href="/sign-in" className="btn-secondary">I have an account</Link>
          </div>
        </div>
        <div className="mx-auto"><Logo size={220} animate /></div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {benefits.map((b) => (
          <div key={b.t} className="card p-5"><h2 className="text-lg font-bold">{b.t}</h2><p className="mt-1 text-ink-soft">{b.d}</p></div>
        ))}
      </section>

      <section className="py-12">
        <h2 className="mb-4 text-2xl font-bold">What you'll find inside</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {modules.map((m) => (
            <li key={m.id} className="card p-4"><b>{m.name}</b><p className="text-sm text-ink-soft">{m.description}</p></li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto text-sm text-ink-soft">
        <p className="mb-3"><Link className="font-bold underline" href="/privacy">Privacy Policy</Link> · <Link className="font-bold underline" href="/terms">Terms of Use</Link></p>
        <p>{brand.name} is a guidance tool, not a medical service. It does not diagnose or replace licensed professionals. Supports SDG 3 (Good Health and Well-being) and SDG 10 (Reduced Inequalities).</p>
      </footer>
    </main>
  );
}
