"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Sparkles, HelpCircle, Settings } from "lucide-react";
import { navItems } from "@/config/nav";
import { Logo } from "@/components/Logo";

const icons = { home: Home, "map-pin": MapPin, sparkles: Sparkles, help: HelpCircle, settings: Settings };

export function AppNav() {
  const path = usePathname();
  // Learn pages open from the Home tiles, so Home stays lit while reading them.
  const active = (href: string) => path === href || path.startsWith(href + "/") || (href === "/home" && path.startsWith("/learn"));
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-white/90 p-5 backdrop-blur lg:flex">
        <Link href="/home" className="mb-6 flex items-center gap-2 rounded-2xl">
          <Logo size={52} alt="" /><span className="font-display text-xl font-bold">C.R.I.B.S.</span>
        </Link>
        <Link href="/ask" aria-current={active("/ask") ? "page" : undefined} className="btn-primary mb-4 w-full"><Logo size={30} white alt="" /> Ask CRIBS</Link>
        <nav aria-label="Main">
          <ul className="space-y-1">
            {navItems.filter((n) => !("center" in n)).map((n) => {
              const Icon = icons[n.icon];
              const on = active(n.href);
              return (
                <li key={n.href}>
                  <Link href={n.href} aria-current={on ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-base font-bold transition ${on ? "bg-tint-purple text-brand" : "text-ink-soft hover:bg-cream hover:text-ink"}`}>
                    <Icon size={22} aria-hidden="true" /> {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ribbon-bar mt-auto" aria-hidden="true" />
      </aside>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-line bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_26px_-16px_rgba(55,47,74,.55)] lg:hidden">
        <ul className="mx-auto flex max-w-md items-end justify-between">
          {navItems.map((n) => {
            const on = active(n.href);
            if ("center" in n) {
              return (
                <li key={n.href} className="-mt-9 flex flex-1 flex-col items-center">
                  <Link href={n.href} aria-label="Ask CRIBS, the AI guide" aria-current={on ? "page" : undefined}
                    className="flex h-16 w-16 items-center justify-center rounded-full p-[3px] shadow-lg transition active:scale-95" style={{ background: "var(--ribbon)" }}>
                    <span className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-white">
                      <Logo size={42} alt="" />
                    </span>
                  </Link>
                  <span className={`mt-1 text-xs font-extrabold ${on ? "text-brand" : "text-ink-soft"}`}>{n.label}</span>
                </li>
              );
            }
            const Icon = icons[n.icon];
            return (
              <li key={n.href} className="flex-1">
                <Link href={n.href} aria-current={on ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-extrabold ${on ? "text-brand" : "text-ink-soft"}`}>
                  <span className={`flex h-7 w-14 items-center justify-center rounded-full transition ${on ? "bg-tint-purple" : ""}`}><Icon size={22} aria-hidden="true" /></span>
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
