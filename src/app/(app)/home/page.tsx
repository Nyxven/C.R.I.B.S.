import Link from "next/link";
import { Bell, Bookmark, ChevronRight, MapPin, QrCode, Users } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getGreeting } from "@/server/onboarding/service";
import { getModules } from "@/server/content/service";
import { getRecommendations } from "@/server/content/recommendations";
import { countUnread } from "@/server/notifications/service";
import { getProgress } from "@/server/progress/service";
import { moduleProgress, progressLabel } from "@/lib/domain/progress";
import { brand } from "@/config/brand";
import { SearchBox } from "@/components/content/SearchBox";
import { directoryLook, faqLook, moduleLook } from "@/components/content/moduleStyle";

export const metadata = { title: "Home" };

const rows = [
  { href: "/community", title: "Parent community", sub: "Share tips and small wins", look: { box: "bg-tint-sage", Icon: Users } },
  { href: "/find", title: "Find CRIBS", sub: "Your tag and the if-found page", look: { box: "bg-tint-pink", Icon: QrCode } },
  { href: "/saved", title: "Saved guides", sub: "Guides you saved for later", look: { box: "bg-tint-purple", Icon: Bookmark } },
  { href: "/directory", title: "Professional Support Directory", sub: "Specialists near Taguig (sample listings)", look: directoryLook },
  { href: "/faq", title: "Frequently Asked Questions", sub: "Quick answers to common questions", look: faqLook },
];

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
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold">Hello, {first}!</h1>
        <p className="text-lg font-bold text-coral-dark">{g.child ? `You and ${g.child}!` : "You and your little one"}</p>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>

      <SearchBox />

      {/* Not a link yet: the Find page arrives in a later phase. */}
      <div className="card flex items-center gap-4 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint-coral text-coral-dark"><MapPin size={24} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight">Find {brand.tagName}</p>
          <p className="text-sm text-ink-soft">Locate your child's smart bear or keychain</p>
        </div>
        <span className="chip shrink-0">Coming soon</span>
      </div>

      {rec.guides.length > 0 && (
        <section aria-labelledby="rec-title">
          <h2 id="rec-title" className="mb-3 text-xl font-bold">{rec.child ? `Recommended for ${rec.child}` : "Recommended for you"}</h2>
          <ul className="space-y-3">
            {rec.guides.map((a) => (
              <li key={a.slug}>
                <Link href={`/learn/${a.moduleId}/${a.slug}`} className="card flex min-h-20 items-center gap-4 p-4 transition active:scale-[.99]">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-coral-dark">{a.reason}</span>
                    <span className="block font-display text-lg font-bold leading-tight">{a.title}</span>
                    <span className="block text-sm text-ink-soft">{a.moduleShortName} · {a.readTime}</span>
                  </span>
                  <ChevronRight size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="guides-title">
        <h2 id="guides-title" className="mb-3 text-xl font-bold">Your guides</h2>
        {modules.length === 0 && <p className="card p-4 text-ink-soft">Guides are being set up. Please check back soon.</p>}
        <ul className="grid grid-cols-2 gap-3">
          {modules.map((m) => {
            const { box, Icon } = moduleLook(m.id);
            return (
              <li key={m.id}>
                <Link href={`/learn/${m.id}`} className={`flex h-full min-h-40 flex-col justify-between rounded-3xl p-4 shadow-sm transition active:scale-[.98] ${box}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink shadow-sm"><Icon size={22} aria-hidden="true" /></span>
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

      <section aria-labelledby="help-title">
        <h2 id="help-title" className="mb-3 text-xl font-bold">Help along the way</h2>
        <ul className="space-y-3">
          {rows.map(({ href, title, sub, look }) => (
            <li key={href}>
              <Link href={href} className="card flex min-h-20 items-center gap-4 p-4 transition active:scale-[.99]">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-ink ${look.box}`}><look.Icon size={24} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block font-display text-lg font-bold leading-tight">{title}</span><span className="block text-sm text-ink-soft">{sub}</span></span>
                <ChevronRight size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
              </Link>
            </li>
          ))}
          <li>
            <Link href="/notifications" className="card flex min-h-20 items-center gap-4 p-4 transition active:scale-[.99]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint-yellow text-ink"><Bell size={24} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block font-display text-lg font-bold leading-tight">Notifications</span><span className="block text-sm text-ink-soft">{unread > 0 ? `${unread} new` : "Nothing new"}</span></span>
              <ChevronRight size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
