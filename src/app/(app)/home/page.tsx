import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { modules } from "@/content";
import { brand } from "@/config/brand";
import { directoryLook, faqLook, moduleLook } from "@/components/content/moduleStyle";

export const metadata = { title: "Home" };

const rows = [
  { href: "/directory", title: "Professional Support Directory", sub: "Specialists near Taguig (sample listings)", look: directoryLook },
  { href: "/faq", title: "Frequently Asked Questions", sub: "Quick answers to common questions", look: faqLook },
];

export default async function Home() {
  const session = await getSession();
  const first = session?.user.name.split(" ")[0] ?? "friend";
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold">Hello, {first}!</h1>
        <p className="text-lg font-bold text-coral-dark">You and your little one</p>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>

      {/* Not a link yet: the Find page arrives in a later phase. */}
      <div className="card flex items-center gap-4 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint-coral text-coral-dark"><MapPin size={24} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight">Find {brand.tagName}</p>
          <p className="text-sm text-ink-soft">Locate your child's smart bear or keychain</p>
        </div>
        <span className="chip shrink-0">Coming soon</span>
      </div>

      <section aria-labelledby="guides-title">
        <h2 id="guides-title" className="mb-3 text-xl font-bold">Your guides</h2>
        <ul className="grid grid-cols-2 gap-3">
          {modules.map((m) => {
            const { box, Icon } = moduleLook(m.id);
            return (
              <li key={m.id}>
                <Link href={`/learn/${m.id}`} className={`flex h-full min-h-40 flex-col justify-between rounded-3xl p-4 shadow-sm transition active:scale-[.98] ${box}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink shadow-sm"><Icon size={22} aria-hidden="true" /></span>
                  <span>
                    <span className="block font-display text-lg font-bold leading-tight">{m.shortName}</span>
                    <span className="mt-1 block text-sm font-semibold text-ink-soft">{m.articles.length} guides</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="help-title">
        <h2 id="help-title" className="mb-3 text-xl font-bold">Help along the way</h2>
        <ul className="space-y-3">
          {rows.map(({ href, title, sub, look }) => (
            <li key={href}>
              <Link href={href} className="card flex min-h-20 items-center gap-4 p-4 transition active:scale-[.99]">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-ink ${look.box}`}><look.Icon size={24} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block font-display text-lg font-bold leading-tight">{title}</span><span className="block text-sm text-ink-soft">{sub}</span></span>
                <ChevronRight size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
