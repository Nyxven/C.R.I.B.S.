import { MapPin } from "lucide-react";
import { getProfessionals } from "@/server/content/service";
import { isSampleListing } from "@/lib/domain/content";

export const metadata = { title: "Directory" };

export default async function Directory() {
  const directory = await getProfessionals();
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight">Professional Support Directory</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>
      <p className="rounded-2xl bg-tint-yellow p-4 text-sm font-semibold text-ink">Sample listings near Taguig City for demonstration. Always verify credentials and availability directly.</p>
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
