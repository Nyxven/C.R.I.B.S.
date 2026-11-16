import { HeartHandshake, Phone } from "lucide-react";
import { EMERGENCY_NUMBER } from "@/config/safety";

// Shown for a made-up, switched-off or stopped tag: the same words for all three, so nothing about the child or the tag leaks.
// The reader is a stranger who may be standing next to a lost child, so it gives safe steps instead of app links.
export const metadata = { title: "Found a child?", robots: { index: false, follow: false, nocache: true } };

const steps = [
  "Stay with the child in a safe, quiet spot.",
  "Speak softly and give them space. Do not grab or chase them.",
  "Call the police or ask a guard or shop staff to help.",
];

export default function FoundNotActive() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 pb-12 pt-6">
      <div className="ribbon-bar" aria-hidden="true" />
      <header className="space-y-2">
        <p className="flex items-center gap-2 text-base font-extrabold text-coral-dark">
          <HeartHandshake size={20} aria-hidden="true" /> If found
        </p>
        <h1 className="text-3xl font-extrabold leading-tight">This tag is not active right now</h1>
        <p className="lead">Thank you for helping. If you are with a child who seems lost, please stay with them.</p>
      </header>

      <a href={`tel:${EMERGENCY_NUMBER}`} className="btn-primary w-full text-xl" style={{ minHeight: 64 }}>
        <Phone size={26} aria-hidden="true" /> Call {EMERGENCY_NUMBER}
      </a>

      <section className="card space-y-3 p-5" aria-labelledby="steps">
        <h2 id="steps" className="h-section">What you can do</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3 text-lg leading-snug">
              <span aria-hidden="true" className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-tint-purple text-base font-extrabold text-brand">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
