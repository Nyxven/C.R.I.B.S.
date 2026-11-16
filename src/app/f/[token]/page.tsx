import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { HeartHandshake, Phone } from "lucide-react";
import { requestIpBucket } from "@/server/security/request";
import { dbGuard } from "@/server/security/repo";
import { lookupPublic } from "@/server/found/service";

// Public: no sign-in. Never cached, never indexed, never sends a referrer (see next.config.ts headers for /f/*).
// Only what the parent switched on reaches this file: `card` is built by buildFoundCard from the saved choices.
export const dynamic = "force-dynamic";
export const metadata = { title: "Found a child?", robots: { index: false, follow: false, nocache: true } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 pb-12 pt-6">
      <div className="ribbon-bar" aria-hidden="true" />
      {children}
    </main>
  );
}

export default async function FoundPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await lookupPublic(token, requestIpBucket(await headers()), dbGuard);
  if (result.type === "notfound") notFound(); // the same page for a made-up, switched-off or revoked link

  if (result.type === "limited") {
    return (
      <Shell>
        <h1 className="h-page">Please wait a moment</h1>
        <p className="lead">This page was opened too many times from your connection. Wait a minute and try again.</p>
        <p className="notice notice-warn" role="note">If a child is in danger, call 911 now.</p>
      </Shell>
    );
  }

  const { card } = result;
  return (
    <Shell>
      <header className="space-y-2">
        <p className="flex items-center gap-2 text-base font-extrabold text-coral-dark">
          <HeartHandshake size={20} aria-hidden="true" /> If found
        </p>
        <h1 className="text-4xl font-extrabold leading-tight">{card.heading}</h1>
        <p className="lead">Thank you for helping. This child may be lost.</p>
      </header>

      {card.call && (
        <div className="space-y-2">
          <a href={card.call.href} className="btn-primary w-full text-xl" style={{ minHeight: 64 }}>
            <Phone size={26} aria-hidden="true" /> Call {card.call.name}
          </a>
          <p className="text-center text-base font-bold text-ink-soft">{card.call.display}</p>
        </div>
      )}

      {card.facts.length > 0 && (
        <dl className="card space-y-4 p-5">
          {card.facts.map((f) => (
            <div key={f.label}>
              <dt className="text-base font-extrabold text-ink-soft">{f.label}</dt>
              <dd className="text-xl leading-snug">{f.text}</dd>
            </div>
          ))}
        </dl>
      )}

      <section className="card space-y-3 p-5" aria-labelledby="tips">
        <h2 id="tips" className="h-section">What you can do</h2>
        <ol className="space-y-3">
          {card.tips.map((t, i) => (
            <li key={t} className="flex items-start gap-3 text-lg leading-snug">
              <span aria-hidden="true" className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-tint-purple text-base font-extrabold text-brand">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
