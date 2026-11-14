import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/** One tappable row for a `.list-group`: optional leading mark, a title, one line of detail, a chevron. */
export function LinkRow({ href, title, sub, lead, children }: { href: string; title: ReactNode; sub?: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <Link href={href} className="list-row">
      {lead}
      <span className="min-w-0 flex-1">
        <span className="row-title block leading-snug">{title}</span>
        {sub && <span className="row-sub block">{sub}</span>}
        {children}
      </span>
      <ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />
    </Link>
  );
}
