import { BookOpen, HelpCircle, SearchX, Stethoscope } from "lucide-react";
import { SearchBox } from "@/components/content/SearchBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkRow } from "@/components/ui/LinkRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { isSearchable, type SearchKind } from "@/lib/domain/search";
import { topicFor } from "@/lib/domain/suggest";
import { getModules, getSuggestIndex, searchContent } from "@/server/content/service";
import { getLocale } from "@/lib/i18n/server";
import { localTitle } from "@/lib/domain/content";
import { localModule } from "@/lib/domain/localize";

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
  const locale = await getLocale();
  const [direct, suggestions, modules] = await Promise.all([searched ? searchContent(query) : Promise.resolve([]), getSuggestIndex(locale), getModules()]);
  // Guide titles and module names in the chosen language (search itself matches English and Filipino).
  const guide = new Map(modules.flatMap((m) => m.articles.map((a) => [a.slug, { title: localTitle(a, locale), module: localModule(m, locale).name }] as const)));
  // Nothing matched the exact words: try the topic those words point to ("tantrum" -> meltdown, "bedtime" -> routine).
  const topic = searched && direct.length === 0 ? topicFor(query) : null;
  const hits = topic ? await searchContent(topic.term) : direct;
  const shownFor = topic && hits.length > 0 ? topic.term : query;

  return (
    <div className="space-y-6">
      <PageHeader title="Search" intro="Find a guide, a common question or a specialist." />
      <SearchBox key={query} defaultValue={query} suggestions={suggestions} />

      {query !== "" && !searched && <p role="status" className="notice notice-info">Type at least 2 letters to search.</p>}

      {searched && (
        <p role="status" className="font-bold text-ink-soft">
          {hits.length === 0 ? `No results for “${query}”.` : `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${shownFor}”`}
        </p>
      )}

      {topic && hits.length > 0 && (
        <p className="notice notice-info" role="note">No guide uses the word “{query}”, so here is what we have about “{topic.term}”.</p>
      )}

      {hits.length > 0 && (
        <ul className="list-group stagger">
          {hits.map((h) => {
            const { label, Icon, box } = KIND[h.kind];
            return (
              <li key={`${h.kind}-${h.id}`}>
                <LinkRow href={h.href} title={h.kind === "guide" ? guide.get(h.id)?.title ?? h.title : h.title} sub={`${label} · ${h.kind === "guide" ? guide.get(h.id)?.module ?? h.meta : h.meta}`} lead={<span className={`row-icon ${box}`} style={{ color: "var(--color-ink)" }}><Icon size={20} aria-hidden="true" /></span>}>
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
