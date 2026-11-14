import { ChevronDown, HelpCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFaqs } from "@/server/content/service";

export const metadata = { title: "FAQ" };

export default async function Faq() {
  const faqs = await getFaqs();
  return (
    <div className="space-y-6">
      <PageHeader title="Common questions" intro="Short answers to what parents ask most." />
      {faqs.length === 0 ? (
        <EmptyState icon={HelpCircle} title="Questions are being added" actionHref="/search" actionLabel="Search the guides">
          Nothing is listed yet. You can still search the guides.
        </EmptyState>
      ) : (
        <div className="list-group">
          {faqs.map((f) => (
            <details key={f.id} className="group">
              <summary className="list-row cursor-pointer list-none justify-between font-display text-lg font-bold leading-snug [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">{f.question}</span>
                <ChevronDown size={22} className="shrink-0 text-brand transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="rise px-4 pb-4 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
