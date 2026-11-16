import Link from "next/link";
import { Info, MapPin, Stethoscope } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProfessionals } from "@/server/content/service";
import { filterByRole, isSampleListing, rolesOf } from "@/lib/domain/content";

export const metadata = { title: "Directory" };

export default async function Directory({ searchParams }: { searchParams: Promise<{ role?: string | string[] }> }) {
  const { role: raw } = await searchParams;
  const all = await getProfessionals();
  const role = Array.isArray(raw) ? raw[0] : raw;
  const directory = filterByRole(all, role);
  const active = directory.length === all.length ? undefined : role;
  const chip = "flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-bold transition-colors duration-150";
  return (
    <div className="space-y-6">
      <PageHeader title="Specialists" intro="Professionals who support children and families." />
      <p className="notice notice-warn text-sm"><Info size={20} className="mt-0.5 shrink-0 text-amber-dark" aria-hidden="true" /><span>Sample listings near Taguig City for demonstration. Always verify credentials and availability directly.</span></p>
      {all.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No specialists listed yet" actionHref="/search" actionLabel="Search the guides">
          Listings will appear here once they are added.
        </EmptyState>
      ) : (
        <>
          <nav aria-label="Filter by specialist" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href="/directory" aria-current={active ? undefined : "page"} className={`${chip} shrink-0 ${active ? "border-field bg-white" : "border-brand bg-tint-purple"}`}>All</Link>
            {rolesOf(all).map((r) => (
              <Link key={r} href={`/directory?role=${encodeURIComponent(r)}`} aria-current={active === r ? "page" : undefined}
                className={`${chip} shrink-0 ${active === r ? "border-brand bg-tint-purple" : "border-field bg-white"}`}>{r}</Link>
            ))}
          </nav>
          <ul className="list-group stagger">
            {directory.map((p) => (
              <li key={p.id} className="flex items-start gap-3 p-4">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint-pink font-display text-lg font-bold text-ink">{p.name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "").charAt(0).toUpperCase()}</span>
                <div className="min-w-0 space-y-1.5">
                <p className="font-display text-lg font-bold leading-tight">{p.name}</p>
                <p className="font-bold text-pink-dark">{p.role}</p>
                <p className="flex items-start gap-2 text-sm text-ink-soft"><MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{p.location}</p>
                <p>{p.note}</p>
                {isSampleListing(p) && <span className="chip">Sample listing</span>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
