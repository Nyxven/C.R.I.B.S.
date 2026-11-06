import Link from "next/link";

/** Friendly placeholder for pages that arrive in a later phase. UI only. */
export function ComingSoon({ title, children, links }: { title: string; children: React.ReactNode; links: { href: string; label: string }[] }) {
  return (
    <div className="card space-y-4 p-6">
      <span className="chip">Coming soon</span>
      <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
      <p className="text-lg text-ink-soft">{children}</p>
      <div className="flex flex-wrap gap-3 pt-1">
        {links.map((l, i) => <Link key={l.href} href={l.href} className={i === 0 ? "btn-primary" : "btn-secondary"}>{l.label}</Link>)}
      </div>
    </div>
  );
}
