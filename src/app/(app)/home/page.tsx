import Link from "next/link";
import { Baby, Bell, Bookmark, ChevronRight, QrCode, Users } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getGreeting } from "@/server/onboarding/service";
import { getModules } from "@/server/content/service";
import { getRecommendations } from "@/server/content/recommendations";
import { countUnread } from "@/server/notifications/service";
import { getProgress } from "@/server/progress/service";
import { moduleProgress, progressLabel } from "@/lib/domain/progress";
import { SearchBox } from "@/components/content/SearchBox";
import { moduleLook } from "@/components/content/moduleStyle";

export const metadata = { title: "Home" };

// Directory, FAQ and Ask already live in the navigation, so Home does not repeat them.
const space = [
  { href: "/child", title: "Child profile", sub: "What helps your child", Icon: Baby, tour: "child" },
  { href: "/saved", title: "Saved guides", sub: "Read these later", Icon: Bookmark },
  { href: "/community", title: "Parent community", sub: "Tips and small wins", Icon: Users },
  { href: "/find", title: "Find CRIBS", sub: "Your tag and if-found page", Icon: QrCode },
] as const;

export default async function Home() {
  const [session, modules] = await Promise.all([getSession(), getModules()]);
  const uid = session?.user.id;
  const [g, entries, rec] = await Promise.all([
    uid ? getGreeting(uid) : { parent: "", child: "" },
    uid ? getProgress(uid) : [],
    uid ? getRecommendations(uid) : { child: "", guides: [] },
  ]);
  const unread = uid ? await countUnread(uid).catch(() => 0) : 0;
  const first = (g.parent || session?.user.name || "friend").trim().split(" ")[0];
  const top = rec.guides[0];
  return (
    <div className="space-y-9">
      <header className="rise flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold">Hello, {first}</h1>
          <p className="mt-1 text-ink-soft">{g.child ? `Here for you and ${g.child}.` : "Here for you and your little one."}</p>
        </div>
        <Link href="/notifications" className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink"
          aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications, nothing new"}>
          <Bell size={22} aria-hidden="true" />
          {unread > 0 && <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1 text-xs font-extrabold text-white" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
        </Link>
      </header>

      <div data-tour="search"><SearchBox /></div>

      {top && (
        <section aria-labelledby="start-title" className="rise">
          <h2 id="start-title" className="section-label">{rec.child ? `Start here for ${rec.child}` : "Start here"}</h2>
          <Link href={`/learn/${top.moduleId}/${top.slug}`} className="flex min-h-24 items-center gap-4 rounded-3xl bg-tint-purple p-5 transition-transform duration-150 active:scale-[.99]">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-brand">{top.reason}</span>
              <span className="mt-0.5 block font-display text-xl font-bold leading-snug">{top.title}</span>
              <span className="mt-1 block text-sm text-ink-soft">{top.moduleShortName} · {top.readTime}</span>
            </span>
            <ChevronRight size={22} className="shrink-0 text-brand" aria-hidden="true" />
          </Link>
        </section>
      )}

      <section aria-labelledby="guides-title" data-tour="guides">
        <h2 id="guides-title" className="section-label">Your guides</h2>
        {modules.length === 0 && <p className="rounded-2xl bg-white p-4 text-ink-soft">Guides are being set up. Please check back soon.</p>}
        <ul className="stagger grid grid-cols-2 gap-3">
          {modules.map((m) => {
            const { box, Icon } = moduleLook(m.id);
            return (
              <li key={m.id}>
                <Link href={`/learn/${m.id}`} className={`flex h-full min-h-36 flex-col justify-between rounded-3xl p-4 transition-transform duration-150 active:scale-[.98] ${box}`}>
                  <Icon size={26} aria-hidden="true" />
                  <span>
                    <span className="block font-display text-lg font-bold leading-tight">{m.shortName}</span>
                    <span className="mt-1 block text-sm font-semibold text-ink-soft">{progressLabel(moduleProgress(m.articles.map((a) => a.slug), entries))}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="space-title">
        <h2 id="space-title" className="section-label">Your space</h2>
        <div className="list-group">
          {space.map(({ href, title, sub, Icon, ...r }) => (
            <Link key={href} href={href} className="list-row" data-tour={"tour" in r ? r.tour : undefined}>
              <span className="row-icon"><Icon size={20} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="row-title block">{title}</span><span className="row-sub block">{sub}</span></span>
              <ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
