import Link from "next/link";
import { Baby, Bell, BookOpen, Bookmark, ChevronRight, ClipboardList, Plus, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { DEFAULT_LAYOUT, visibleSections, type HomeSection } from "@/lib/domain/homeLayout";
import { getPreferences } from "@/server/account/service";
import { getLogs } from "@/server/logs/service";
import { summarizeBehavior, summarizeCommunication } from "@/lib/domain/logs";
import { capitalizeFirst } from "@/lib/domain/names";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/server/auth/session";
import { getGreeting } from "@/server/onboarding/service";
import { getModules, getSuggestIndex } from "@/server/content/service";
import { getRecommendations } from "@/server/content/recommendations";
import { countUnread } from "@/server/notifications/service";
import { getProgress } from "@/server/progress/service";
import { moduleProgress } from "@/lib/domain/progress";
import { localModule, localModuleShort, localProgress, localReadTime, localReason } from "@/lib/domain/localize";

import { SearchBox } from "@/components/content/SearchBox";
import { moduleLook } from "@/components/content/moduleStyle";
import { getLocale, getT } from "@/lib/i18n/server";
import { localTitle } from "@/lib/domain/content";
import type { Key } from "@/lib/i18n/en";

export const metadata = { title: "Home" };

// Directory, FAQ and Ask already live in the navigation, so Home does not repeat them. Each row keeps its own tint.
const space = [
  { href: "/child", title: "home.child", sub: "home.childSub", Icon: Baby, tint: "bg-tint-yellow", tour: "child" },
  { href: "/community", title: "home.community", sub: "home.communitySub", Icon: Users, tint: "bg-tint-sage" },
  { href: "/saved", title: "home.saved", sub: "home.savedSub", Icon: Bookmark, tint: "bg-tint-purple" },
] as const satisfies readonly { href: string; title: Key; sub: Key; Icon: unknown; tint: string; tour?: string }[];

export default async function Home() {
  const [session, modules, t, suggestions, locale] = await Promise.all([getSession(), getModules(), getT(), getSuggestIndex(await getLocale()), getLocale()]);
  const uid = session?.user.id;
  const [g, entries, rec] = await Promise.all([
    uid ? getGreeting(uid) : { parent: "", child: "" },
    uid ? getProgress(uid) : [],
    uid ? getRecommendations(uid) : { child: "", guides: [] },
  ]);
  const [unread, prefs, logs] = await Promise.all([
    uid ? countUnread(uid).catch(() => 0) : 0,
    uid ? getPreferences(uid) : null,
    uid ? getLogs(uid).catch(() => ({ behavior: [], communication: [] })) : { behavior: [], communication: [] },
  ]);
  const layout = prefs?.homeLayout ?? DEFAULT_LAYOUT;
  const now = new Date();
  const weekB = summarizeBehavior(logs.behavior, now).count, weekC = summarizeCommunication(logs.communication, now).count;
  const first = capitalizeFirst((g.parent || session?.user.name || "friend").trim().split(" ")[0] ?? "friend");
  const child = capitalizeFirst(g.child);
  const sections: Record<HomeSection, React.ReactNode> = {
    // Child safety first: the research found wandering is parents' sharpest worry.
    safety: (
      <Link href="/find" className="find-card rise" data-tour="find-card">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-coral-dark" aria-hidden="true"><ShieldCheck size={22} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold leading-tight text-ink">{child ? t("home.safeTitle", { child }) : t("home.safeTitleDefault")}</span>
          <span className="block text-sm text-ink-soft">{t("home.safeBody")}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-coral-dark" aria-hidden="true" />
      </Link>
    ),
    recommended: (
      rec.guides.length > 0 ? (
        <section aria-labelledby="rec-title" className="rise">
          <h2 id="rec-title" className="mb-3 text-xl font-bold">{rec.child ? t("home.recFor", { child: capitalizeFirst(rec.child) }) : t("home.recDefault")}</h2>
          <ul className="stagger space-y-3">
            {rec.guides.map((a) => (
              <li key={a.slug}>
                <Link href={`/learn/${a.moduleId}/${a.slug}`} className="card flex min-h-20 items-center gap-4 p-4 transition-transform duration-150 active:scale-[.99]">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-coral-dark">{localReason(a.reason, locale)}</span>
                    <span className="block font-display text-lg font-bold leading-tight">{localTitle(a, locale)}</span>
                    <span className="block text-sm text-ink-soft">{localModuleShort(a.moduleId, a.moduleShortName, locale)} · {localReadTime(a.readTime, locale)}</span>
                  </span>
                  <ChevronRight size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null
    ),
    logs: (
      <section aria-labelledby="logs-title" className="find-card rise flex-col items-stretch !bg-white" style={{ borderColor: "var(--color-line)" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tint-coral text-ink" aria-hidden="true"><ClipboardList size={22} /></span>
            <div className="min-w-0 flex-1">
              <h2 id="logs-title" className="font-display text-base font-bold leading-tight"><Link href="/logs" className="hover:underline">{t("home.logsTitle")}</Link></h2>
              <p className="text-sm text-ink-soft">{weekB + weekC > 0 ? t("home.logsWeek", { b: weekB, c: weekC }) : t("home.logsNone")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/logs?add=behavior" className="btn-secondary min-h-11 px-3 text-sm"><Plus size={16} aria-hidden="true" /> {t("home.addBehavior")}</Link>
            <Link href="/logs?add=communication" className="btn-secondary min-h-11 px-3 text-sm"><Plus size={16} aria-hidden="true" /> {t("home.addComm")}</Link>
          </div>
        </section>
    ),
    guides: (
      <section aria-labelledby="guides-title" data-tour="guides">
        <h2 id="guides-title" className="mb-3 text-xl font-bold">{t("home.yourGuides")}</h2>
        {modules.length === 0 && <EmptyState icon={BookOpen} title={t("home.guidesSetup")}>{t("home.guidesSetupBody")}</EmptyState>}
        <ul className="stagger grid grid-cols-2 gap-3">
          {modules.map((m) => {
            const { box, Icon } = moduleLook(m.id);
            return (
              <li key={m.id}>
                <Link href={`/learn/${m.id}`} className={`flex h-full min-h-40 flex-col justify-between rounded-3xl p-4 shadow-sm transition-transform duration-150 active:scale-[.98] ${box}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink shadow-sm"><Icon size={22} aria-hidden="true" /></span>
                  <span>
                    <span className="block font-display text-lg font-bold leading-tight">{localModule(m, locale).shortName}</span>
                    <span className="mt-1 block text-sm font-semibold text-ink-soft">{localProgress(moduleProgress(m.articles.map((a) => a.slug), entries), locale)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    ),
    help: (
      <section aria-labelledby="space-title">
        <h2 id="space-title" className="mb-3 text-xl font-bold">{t("home.help")}</h2>
        <div className="list-group">
          {space.map(({ href, title, sub, Icon, tint, ...r }) => (
            <Link key={href} href={href} className="list-row" data-tour={"tour" in r ? r.tour : undefined}>
              <span className={`row-icon ${tint}`} style={{ color: "var(--color-ink)" }}><Icon size={20} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="row-title block">{t(title)}</span><span className="row-sub block">{t(sub)}</span></span>
              <ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    ),
  };
  return (
    <div className="space-y-8">
      <header className="rise flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="h-page">{t("home.hello", { name: first })}</h1>
          <p className="text-lg font-bold text-coral-dark">{child ? t("home.youAnd", { child }) : t("home.youAndDefault")}</p>
          <div className="ribbon-bar w-24" aria-hidden="true" />
        </div>
        <Link href="/notifications" className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm"
          aria-label={unread > 0 ? t("home.notifNew", { n: unread }) : t("home.notifNone")}>
          <Bell size={22} aria-hidden="true" />
          {unread > 0 && <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1 text-xs font-extrabold text-white" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
        </Link>
      </header>

      {/* Its own layer, so the suggestion list opens over the cards below it. */}
      <div data-tour="search" className="relative z-20"><SearchBox suggestions={suggestions} /></div>

      {/* The person's own order and choice of sections (Settings > Customize Home). */}
      {visibleSections(layout).map((id) => <div key={id}>{sections[id]}</div>)}

      <Link href="/settings/home" className="mx-auto flex min-h-11 w-fit items-center gap-2 rounded-full px-4 text-sm font-bold text-brand hover:bg-white"><SlidersHorizontal size={16} aria-hidden="true" /> {t("home.customize")}</Link>
    </div>
  );
}
