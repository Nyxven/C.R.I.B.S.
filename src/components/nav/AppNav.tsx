"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Sparkles, HelpCircle, Settings } from "lucide-react";
import { navItems } from "@/config/nav";
import { Logo } from "@/components/Logo";

const icons = { home: Home, "map-pin": MapPin, sparkles: Sparkles, help: HelpCircle, settings: Settings };

export function AppNav() {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col gap-2 border-r border-line bg-white/80 p-5 backdrop-blur lg:flex">
        <div className="mb-4 flex items-center gap-2"><Logo size={52} /><span className="font-display text-xl font-bold">C.R.I.B.S.</span></div>
        <Link href="/ask" className="btn-primary mb-3 w-full"><Sparkles size={18} /> Ask CRIBS</Link>
        {navItems.filter((n) => !("center" in n)).map((n) => {
          const Icon = icons[n.icon];
          return (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 font-bold ${active(n.href) ? "bg-purple/15 text-purple-dark" : "text-ink-soft hover:bg-cream"}`}>
              <Icon size={20} /> {n.label}
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_22px_-14px_rgba(60,40,90,.5)] lg:hidden">
        <ul className="mx-auto flex max-w-md items-end justify-between">
          {navItems.map((n) => {
            const Icon = icons[n.icon];
            const on = active(n.href);
            if ("center" in n) {
              return (
                <li key={n.href} className="-mt-8 flex-1 text-center">
                  <Link href={n.href} aria-label="Ask CRIBS, the AI guide" aria-current={on ? "page" : undefined}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple to-coral text-white shadow-lg transition active:scale-95">
                    <Icon size={26} />
                  </Link>
                  <span className={`text-[11px] font-extrabold ${on ? "text-purple-dark" : "text-ink-soft"}`}>{n.label}</span>
                </li>
              );
            }
            return (
              <li key={n.href} className="flex-1">
                <Link href={n.href} aria-current={on ? "page" : undefined}
                  className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-extrabold ${on ? "text-purple-dark" : "text-ink-soft"}`}>
                  <Icon size={21} /> {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
