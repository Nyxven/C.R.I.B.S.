import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** The one "go up a level" link used at the top of every sub-page. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-xl px-1 font-bold text-brand">
      <ArrowLeft size={18} aria-hidden="true" /> {children}
    </Link>
  );
}
