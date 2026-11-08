import Link from "next/link";
import { MapPin } from "lucide-react";
import { getProfessionals } from "@/server/content/service";
import { filterByRole, isSampleListing, rolesOf } from "@/lib/domain/content";

export const metadata = { title: "Directory" };

export default async function Directory({ searchParams }: { searchParams: Promise<{ role?: string | string[] }> }) {
  const { role: raw } = await searchParams;
  const all = await getProfessionals();
  const role = Array.isArray(raw) ? raw[0] : raw;
  const directory = filterByRole(all, role);
  const active = directory.length === all.length ? undefined : role;
  const chip = "flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-bold";
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight">Professional Support Directory</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>
      <p className="rounded-2xl bg-tint-yellow p-4 text-sm font-semibold text-ink">Sample listings near Taguig City for demonstration. Always verify credentials and availability directly.</p>
      <nav aria-label="Filter by specialist" className="flex flex-wrap gap-2">
        <Link href="/directory" aria-current={active ? undefined : "page"} className={`${chip} ${active ? "border-field bg-white" : "border-brand bg-tint-purple"}`}>All</Link>
        {rolesOf(all).map((r) => (
          <Link key={r} href={`/directory?role=${encodeURIComponent(r)}`} aria-current={active === r ? "page" : undefined}
            className={`${chip} ${active === r ? "border-brand bg-tint-purple" : "border-field bg-white"}`}>{r}</Link>
        ))}
      </nav>
      <ul className="space-y-3">
        {directory.map((p) => (
          <li key={p.id} className="card space-y-2 p-5">
            <p className="font-display text-xl font-bold leading-tight">{p.name}</p>
            <p className="font-bold text-pink-dark">{p.role}</p>
            <p className="flex items-start gap-2 text-sm text-ink-soft"><MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{p.location}</p>
            <p>{p.note}</p>
            {isSampleListing(p) && <span className="chip">Sample listing</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
