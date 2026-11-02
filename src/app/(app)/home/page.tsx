import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { modules } from "@/content";
import { brand } from "@/config/brand";

const grad = ["from-sage to-sage-dark text-ink", "from-purple to-purple-dark text-white", "from-amber to-amber-dark text-ink", "from-gold to-amber-dark text-ink"];

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const first = session?.user.name.split(" ")[0] ?? "friend";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-coral-dark">Hello, {first}!</h1>
        <p className="text-lg font-bold text-coral">You and your little one</p>
      </header>
      <Link href="/find" className="card flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral text-white">📍</span>
        <span><b className="block">Find {brand.tagName}</b><span className="text-sm text-ink-soft">Locate your child's smart bear or keychain</span></span>
      </Link>
      <section className="grid grid-cols-2 gap-3">
        {modules.map((m, i) => (
          <Link key={m.id} href={`/learn/${m.id}`} className={`flex min-h-28 flex-col justify-end rounded-3xl bg-gradient-to-br p-4 font-display text-base font-bold leading-tight shadow ${grad[i % grad.length]}`}>
            {m.shortName}
          </Link>
        ))}
        <Link href="/directory" className="flex min-h-28 flex-col justify-end rounded-3xl bg-gradient-to-br from-terracotta to-coral-dark p-4 font-display font-bold text-white shadow">Professional Support Directory</Link>
        <Link href="/faq" className="flex min-h-28 flex-col justify-end rounded-3xl bg-gradient-to-br from-pink to-purple p-4 font-display font-bold text-white shadow">Frequently Asked Questions</Link>
      </section>
    </div>
  );
}
