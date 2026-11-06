import { ChevronDown } from "lucide-react";
import { faqs } from "@/content";

export const metadata = { title: "FAQ" };

export default function Faq() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight">Frequently Asked Questions</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="card group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-3xl p-4 font-display text-lg font-bold leading-snug [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown size={22} className="shrink-0 text-brand transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="px-4 pb-4 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
