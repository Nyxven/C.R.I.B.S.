import Link from "next/link";
import { BookOpen, HelpCircle, Stethoscope } from "lucide-react";
import { SearchBox } from "@/components/content/SearchBox";
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
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight">Search</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>
      <SearchBox defaultValue={query} />

      {query !== "" && !searched && <p className="text-ink-soft">Type at least 2 letters.</p>}

      {searched && (
        <p role="status" className="font-bold text-ink-soft">
          {hits.length === 0 ? `No results for “${query}”.` : `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${query}”`}
        </p>
      )}

      {hits.length > 0 && (
        <ul className="space-y-3">
          {hits.map((h) => {
            const { label, Icon, box } = KIND[h.kind];
            return (
              <li key={`${h.kind}-${h.id}`}>
                <Link href={h.href} className="card flex items-start gap-4 p-4 transition active:scale-[.99]">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ink ${box}`}><Icon size={22} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold leading-tight">{h.title}</span>
                    <span className="block text-sm font-bold text-ink-soft">{label} · {h.meta}</span>
                    <span className="mt-1 block text-ink">{h.snippet}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {searched && hits.length === 0 && (
        <div className="card space-y-3 p-5">
          <p className="font-display text-lg font-bold">Try another word</p>
          <p className="text-ink-soft">Short, simple words work best, like “sleep” or “school”. You can also ask the guide.</p>
          <Link href="/ask" className="btn-secondary">Ask the guide</Link>
        </div>
      )}
    </div>
  );
}
