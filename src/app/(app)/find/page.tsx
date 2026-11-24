import { notFound } from "next/navigation";
import { ExternalLink, Phone, Siren } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { FindMyCard } from "@/components/found/FindMyCard";
import { FoundManager } from "@/components/found/FoundManager";
import { brand } from "@/config/brand";
import { EMERGENCY_NUMBER } from "@/config/safety";
import { getLocale, getT } from "@/lib/i18n/server";
import { getSession } from "@/server/auth/session";
import { getFindMy } from "@/server/findmy/service";
import { getStatus } from "@/server/found/service";
import { getChild } from "@/server/onboarding/repo";

export const metadata = { title: `Find ${brand.tagName}` };

export default async function FindPage() {
  const session = await getSession();
  if (!session) notFound();
  const [status, findMy, kid, t, locale] = await Promise.all([getStatus(session.user.id), getFindMy(session.user.id), getChild(session.user.id), getT(), getLocale()]);
  const day = new Intl.DateTimeFormat(locale === "fil" ? "fil-PH" : "en-PH", { dateStyle: "medium" });
  const when = new Intl.DateTimeFormat(locale === "fil" ? "fil-PH" : "en-PH", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
  const tag = status.tag ? { enabled: status.tag.enabled, createdAt: day.format(status.tag.createdAt), accessCount: status.tag.accessCount, fields: status.tag.fields } : null;
  const link = findMy ? { url: findMy.url, state: findMy.state, until: when.format(findMy.expiresAt) } : null;
  return (
    <div className="space-y-6">
      <BackLink href="/home">Home</BackLink>
      <PageHeader title={`Find ${brand.tagName}`} intro="Locate your tag, and choose what a finder can see." />

      <FindMyCard link={link} childName={kid?.nickname ?? null} />

      <section className="card space-y-3 p-5" aria-labelledby="wander-h">
        <h2 id="wander-h" className="flex items-center gap-2 font-display text-lg font-bold"><Siren size={22} className="text-coral-dark" aria-hidden="true" /> {t("wander.title")}</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>{t("wander.1")}</li>
          <li>{t("wander.2", { n: EMERGENCY_NUMBER })}</li>
          <li>{t("wander.3")}</li>
          <li>{t("wander.4")}</li>
        </ol>
        <a href={`tel:${EMERGENCY_NUMBER}`} className="btn-primary w-full bg-coral-dark"><Phone size={18} aria-hidden="true" /> {t("wander.call", { n: EMERGENCY_NUMBER })}</a>
      </section>

      <section className="card space-y-3 p-5" aria-labelledby="net-title">
        <h2 id="net-title" className="font-display text-lg font-bold">Locate the tag</h2>
        <p className="text-ink-soft">{t("findmy.otherNetworks")}</p>
        <div className="flex flex-wrap gap-3">
          <a href="https://www.icloud.com/find" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">Apple Find My <ExternalLink size={16} aria-hidden="true" /></a>
          <a href="https://www.google.com/android/find" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">Google Find Hub <ExternalLink size={16} aria-hidden="true" /></a>
        </div>
      </section>

      <h2 className="h-section">If-found page</h2>
      <FoundManager hasChild={status.hasChild} hasContact={status.hasContact} tag={tag} />
    </div>
  );
}
