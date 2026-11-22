"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, ChevronRight, ClipboardList, HelpCircle, Home, Menu, Settings, ShieldCheck, Smile, Sparkles, Stethoscope, Users, X } from "lucide-react";
import { moreItems, navItems } from "@/config/nav";
import { Logo } from "@/components/Logo";
import { useT } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n/en";

const icons = { home: Home, shield: ShieldCheck, sparkles: Sparkles, stethoscope: Stethoscope, help: HelpCircle, clipboard: ClipboardList, users: Users, bookmark: Bookmark, smile: Smile, bell: Bell, settings: Settings };
const tint: Record<string, string> = { clipboard: "bg-tint-coral", help: "bg-tint-sage", users: "bg-tint-mint", bookmark: "bg-tint-purple", smile: "bg-tint-yellow", bell: "bg-tint-pink", settings: "bg-tint-purple" };

export function AppNav() {
  const path = usePathname();
  const t = useT();
  const sheet = useRef<HTMLDialogElement>(null);
  const label = (href: string) => t(`nav.${href.slice(1)}` as Key);
  // Learn pages open from the Home tiles, so Home stays lit while reading them.
  const active = (href: string) => path === href || path.startsWith(href + "/") || (href === "/home" && path.startsWith("/learn"));
  const moreActive = moreItems.some((m) => active(m.href));

  // Close the "More" sheet after navigating.
  useEffect(() => { sheet.current?.close(); }, [path]);

  const rowClass = (on: boolean, extra = "") => `flex min-h-11 items-center gap-3 rounded-2xl px-4 text-base font-bold transition ${on ? "bg-tint-purple text-brand" : extra || "text-ink-soft hover:bg-cream hover:text-ink"}`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col overflow-y-auto border-r border-line bg-white/90 p-5 backdrop-blur lg:flex">
        <Link href="/home" aria-label="C.R.I.B.S. home" className="mb-6 flex items-center gap-2 rounded-2xl">
          <Logo size={52} alt="" /><span className="font-display text-xl font-bold">C.R.I.B.S.</span>
        </Link>
        <Link href="/ask" data-tour="ask" aria-current={active("/ask") ? "page" : undefined} className="btn-primary mb-5 w-full"><Logo size={30} white alt="" /> Ask CRIBS</Link>
        <nav aria-label={t("nav.main")}>
          <ul className="space-y-1">
            {navItems.filter((n) => !("center" in n)).map((n) => {
              const Icon = icons[n.icon];
              const on = active(n.href);
              return (
                <li key={n.href}>
                  <Link href={n.href} data-tour={`nav-${n.href.slice(1)}`} aria-current={on ? "page" : undefined}
                    className={rowClass(on)}>
                    <Icon size={22} aria-hidden="true" /> {n.href === "/find" ? t("home.find") : label(n.href)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul className="mt-4 space-y-1 border-t border-line pt-4">
            {moreItems.map((m) => {
              const Icon = icons[m.icon];
              const on = active(m.href);
              return (
                <li key={m.href}>
                  <Link href={m.href} data-tour={m.href === "/settings" ? "nav-settings" : undefined} aria-current={on ? "page" : undefined} className={rowClass(on)}>
                    <Icon size={20} aria-hidden="true" /> {t(m.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ribbon-bar mt-auto" aria-hidden="true" />
      </aside>

      {/* Mobile bottom nav: Home, Find, Ask (center), Specialists, More */}
      <nav aria-label={t("nav.main")} className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-line bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_26px_-16px_rgba(55,47,74,.55)] lg:hidden">
        <ul className="mx-auto flex max-w-md items-end justify-between">
          {navItems.map((n) => {
            const on = active(n.href);
            if ("center" in n) {
              return (
                <li key={n.href} className="-mt-9 flex flex-1 flex-col items-center">
                  <Link href={n.href} data-tour="ask" aria-label={t("nav.askAria")} aria-current={on ? "page" : undefined}
                    className="flex h-16 w-16 items-center justify-center rounded-full p-[3px] shadow-lg transition active:scale-95" style={{ background: "var(--ribbon)" }}>
                    <span className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-white">
                      <Logo size={42} alt="" />
                    </span>
                  </Link>
                  <span className={`mt-1 text-xs font-extrabold ${on ? "text-brand" : "text-ink-soft"}`}>{label(n.href)}</span>
                </li>
              );
            }
            const Icon = icons[n.icon];
            return (
              <li key={n.href} className="flex-1">
                <Link href={n.href} data-tour={`nav-${n.href.slice(1)}`} aria-current={on ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-extrabold ${on ? "text-brand" : "text-ink-soft"}`}>
                  <span className={`flex h-7 w-14 items-center justify-center rounded-full transition ${on ? "bg-tint-purple" : ""}`}><Icon size={22} aria-hidden="true" /></span>
                  {label(n.href)}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button type="button" data-tour="nav-settings" aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-extrabold ${moreActive ? "text-brand" : "text-ink-soft"}`}>
              <span className={`flex h-7 w-14 items-center justify-center rounded-full transition ${moreActive ? "bg-tint-purple" : ""}`}><Menu size={22} aria-hidden="true" /></span>
              {t("nav.more")}
            </button>
          </li>
        </ul>
      </nav>

      <dialog ref={sheet} className="sheet sheet-bottom lg:hidden" aria-labelledby="more-h">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="more-h" className="h-section">{t("nav.more")}</h2>
          <button type="button" onClick={() => sheet.current?.close()} className="btn-ghost h-11 w-11 p-0" aria-label={t("nav.close")}><X size={22} aria-hidden="true" /></button>
        </div>
        <ul className="list-group">
          {moreItems.map((m) => {
            const Icon = icons[m.icon];
            const on = active(m.href);
            return (
              <li key={m.href}>
                <Link href={m.href} aria-current={on ? "page" : undefined} className="list-row" onClick={() => sheet.current?.close()}>
                  <span className={`row-icon ${tint[m.icon]}`} style={{ color: "var(--color-ink)" }}><Icon size={20} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1 font-bold">{t(m.key)}</span>
                  <ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
