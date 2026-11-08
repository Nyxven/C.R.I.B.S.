import { Search } from "lucide-react";

/** Plain GET form: works without JavaScript and sends the person to /search?q=... */
export function SearchBox({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" method="get" role="search" className="flex gap-2">
      <label htmlFor="q" className="sr-only">Search guides, questions and specialists</label>
      <div className="relative min-w-0 flex-1">
        <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <input id="q" name="q" type="search" defaultValue={defaultValue} maxLength={80} autoComplete="off" autoFocus={autoFocus}
          placeholder="Search guides, questions, specialists" className="field w-full pl-12" />
      </div>
      <button type="submit" className="btn-primary shrink-0 px-5">Search</button>
    </form>
  );
}
