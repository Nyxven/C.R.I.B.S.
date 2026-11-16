import { BookOpen, HelpCircle, SearchX, Stethoscope } from "lucide-react";
import { SearchBox } from "@/components/content/SearchBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkRow } from "@/components/ui/LinkRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { isSearchable, type SearchKind } from "@/lib/domain/search";
import { searchContent } from "@/server/content/service";

export const metadata = { title: "Search" };

const KIND: Record<SearchKind, { label: string; Icon: typeof BookOpen; box: string }> = {
  guide: { label: "Guide", Icon: BookOpen, box: "bg-tint-purple" },
  faq: { label: "FAQ", Icon: HelpCircle, box: "bg-tint-sage" },
  specialist: { label: "Specialist", Icon: Stethoscope, box: "bg-tint-pink" },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const searched = isSearchable(query);
  const hits = searched ? await searchContent(query) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Search" intro="Find a guide, a common question or a specialist." />
      <SearchBox defaultValue={query} />

      {query !== "" && !searched && <p role="status" className="notice notice-info">Type at least 2 letters to search.</p>}

      {searched && (
        <p role="status" className="font-bold text-ink-soft">
          {hits.length === 0 ? `No results for “${query}”.` : `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${query}”`}
        </p>
      )}

      {hits.length > 0 && (
        <ul className="list-group stagger">
          {hits.map((h) => {
            const { label, Icon, box } = KIND[h.kind];
            return (
              <li key={`${h.kind}-${h.id}`}>
                <LinkRow href={h.href} title={h.title} sub={`${label} · ${h.meta}`} lead={<span className={`row-icon ${box}`} style={{ color: "var(--color-ink)" }}><Icon size={20} aria-hidden="true" /></span>}>
                  <span className="mt-1 block text-sm text-ink">{h.snippet}</span>
                </LinkRow>
              </li>
            );
          })}
        </ul>
      )}

      {searched && hits.length === 0 && (
        <EmptyState icon={SearchX} title="Nothing matched that word" actionHref="/ask" actionLabel="Ask the guide" secondaryHref="/faq" secondaryLabel="Read the FAQ">
          Short, simple words work best, like “routine” or “school”.
        </EmptyState>
      )}
    </div>
  );
}
