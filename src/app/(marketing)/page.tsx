import Link from "next/link";
import { BookOpenCheck, MessageCircleHeart, QrCode, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { brand } from "@/config/brand";
import { modules } from "@/content";
import { moduleLook } from "@/components/content/moduleStyle";

// What the app really does today, in the order a parent meets it.
const steps = [
  { Icon: BookOpenCheck, t: "Read", d: "Plain-language guides on communication, behavior, sensory needs and school." },
  { Icon: MessageCircleHeart, t: "Ask", d: "Get answers drawn from our own guides, with safety steps first when it's urgent." },
  { Icon: QrCode, t: "Prepare", d: `Set up a private if-found page for your child's ${brand.tagName} tag. You choose every detail it shows.` },
];

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-12 pt-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Logo size={48} alt="" /><span className="font-display text-xl font-bold">{brand.name}</span></div>
        <Link href="/sign-in" className="btn-secondary min-h-11 px-5">Sign in</Link>
      </header>

      <section className="grid items-center gap-8 py-12 md:grid-cols-[1.2fr_1fr] md:py-20">
        <div className="space-y-5">
          <p className="chip bg-tint-purple">For parents of children with autism</p>
          <h1 className="text-4xl font-bold leading-[1.1] md:text-5xl">You don&apos;t have to figure this out alone.</h1>
          <p className="lead max-w-lg">{brand.name} brings trusted guidance, everyday support and a caring community into one calm place, at your pace.</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/sign-up" className="btn-primary">Create your account</Link>
            <Link href="/sign-in" className="btn-secondary">I have an account</Link>
          </div>
          <p className="text-sm text-ink-soft">Takes about 2 minutes. Every question about your child is optional.</p>
        </div>
        <div className="relative mx-auto flex aspect-square w-full max-w-xs items-center justify-center rounded-full bg-tint-purple/60">
          <Logo size={230} animate />
        </div>
      </section>

      <div className="ribbon-bar" aria-hidden="true" />

      <section aria-labelledby="how" className="py-12">
        <h2 id="how" className="h-section mb-6">How it helps</h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map(({ Icon, t, d }, i) => (
            <li key={t} className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint-purple text-brand"><Icon size={24} aria-hidden="true" /></span>
              <div><h3 className="font-display text-lg font-bold"><span className="sr-only">Step {i + 1}: </span>{t}</h3><p className="mt-1 text-ink-soft">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="inside" className="pb-12">
        <h2 id="inside" className="h-section mb-6">What you&apos;ll find inside</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {modules.map((m) => {
            const { box, Icon } = moduleLook(m.id);
            return (
              <li key={m.id} className={`flex gap-4 rounded-3xl p-5 ${box}`}>
                <Icon size={26} className="mt-0.5 shrink-0" aria-hidden="true" />
                <div><p className="font-display text-lg font-bold">{m.name}</p><p className="mt-0.5 text-sm text-ink-soft">{m.description}</p></div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="flex gap-3 rounded-3xl bg-white p-5 shadow-[0_1px_0_var(--color-line)]">
        <ShieldCheck size={24} className="mt-0.5 shrink-0 text-mint-dark" aria-hidden="true" />
        <p className="text-ink-soft"><b className="text-ink">A guide, not a doctor.</b> {brand.name} gives general information and does not diagnose or replace licensed professionals. Your child&apos;s details are private to your account.</p>
      </aside>

      <footer className="mt-auto pt-10 text-sm text-ink-soft">
        <p className="mb-2"><Link className="font-bold underline" href="/privacy">Privacy Policy</Link> · <Link className="font-bold underline" href="/terms">Terms of Use</Link></p>
        <p>Supports SDG 3 (Good Health and Well-being) and SDG 10 (Reduced Inequalities).</p>
      </footer>
    </main>
  );
}
