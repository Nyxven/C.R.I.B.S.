import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { requestIpBucket } from "@/server/security/request";
import { dbGuard } from "@/server/security/repo";
import { lookupPublic } from "@/server/found/service";

// Public: no sign-in. Never cached, never indexed, never sends a referrer (see next.config.ts headers for /f/*).
export const dynamic = "force-dynamic";
export const metadata = { title: "Found a child?", robots: { index: false, follow: false, nocache: true } };

export default async function FoundPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await lookupPublic(token, requestIpBucket(await headers()), dbGuard);
  if (result.type === "notfound") notFound(); // the same page for a made-up, switched-off or revoked link

  if (result.type === "limited") {
    return (
      <main className="mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-extrabold">Please wait a moment</h1>
        <p>This page was opened too many times from your connection. Wait a minute and try again. If a child is in danger, call 911.</p>
      </main>
    );
  }

  const { card } = result;
  return (
    <main className="mx-auto max-w-md space-y-5 p-6 pb-12">
      <header className="space-y-1">
        <p className="text-sm font-extrabold uppercase tracking-wide text-coral-dark">If found</p>
        <h1 className="text-3xl font-extrabold leading-tight">{card.heading}</h1>
        <p className="text-ink-soft">Thank you for helping. This child may be lost.</p>
      </header>

      {card.call && (
        <a href={card.call.href} className="btn-primary flex w-full items-center justify-center gap-2 text-xl">
          <Phone size={24} aria-hidden="true" /> Call {card.call.name}
        </a>
      )}
      {card.call && <p className="-mt-3 text-center text-sm text-ink-soft">{card.call.display}</p>}

      {card.facts.length > 0 && (
        <dl className="card space-y-3 p-5">
          {card.facts.map((f) => (
            <div key={f.label}>
              <dt className="text-sm font-extrabold text-ink-soft">{f.label}</dt>
              <dd className="text-lg">{f.text}</dd>
            </div>
          ))}
        </dl>
      )}

      <section className="card space-y-2 p-5" aria-labelledby="tips">
        <h2 id="tips" className="font-display text-lg font-bold">What you can do</h2>
        <ul className="list-disc space-y-1 pl-5">{card.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>
    </main>
  );
}
