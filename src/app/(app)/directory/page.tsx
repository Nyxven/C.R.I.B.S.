import { directory } from "@/content";

export default function Directory() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Professional Support Directory</h1>
      <p className="text-sm text-ink-soft">Sample listings near Taguig City for demonstration. Always verify credentials and availability directly.</p>
      <ul className="space-y-3">
        {directory.map((p) => (
          <li key={p.name} className="card space-y-1 p-4">
            <b>{p.name}</b><p className="text-sm font-bold text-terracotta">{p.role}</p>
            <p className="text-sm text-ink-soft">{p.loc}</p><p className="text-sm">{p.note}</p>
            <span className="inline-block rounded-full bg-line px-3 py-1 text-xs font-bold">Sample listing</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
