import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A titled group of rows: one white surface, hairlines between rows. */
export function SettingsGroup({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rise">
      <h2 id={id} className="section-label">{label}</h2>
      <div className="list-group">{children}</div>
    </section>
  );
}

function RowBody({ icon: Icon, title, sub, trailing }: { icon: LucideIcon; title: string; sub?: string; trailing?: ReactNode }) {
  return (
    <>
      <span className="row-icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="row-title block">{title}</span>
        {sub && <span className="row-sub block">{sub}</span>}
      </span>
      {trailing}
    </>
  );
}

/** A row that opens another page. */
export function RowLink({ href, icon, title, sub, external }: { href: string; icon: LucideIcon; title: string; sub?: string; external?: boolean }) {
  return (
    <Link href={href} className="list-row" {...(external ? { target: "_blank", rel: "noopener" } : {})}>
      <RowBody icon={icon} title={title} sub={sub} trailing={<ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />} />
    </Link>
  );
}

/** A row that does something when pressed (client components pass onClick). */
export function RowButton({ icon, title, sub, onClick, disabled, danger, trailing }: {
  icon: LucideIcon; title: string; sub?: string; onClick: () => void; disabled?: boolean; danger?: boolean; trailing?: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`list-row disabled:opacity-60 ${danger ? "danger" : ""}`}>
      <RowBody icon={icon} title={title} sub={sub} trailing={trailing} />
    </button>
  );
}
