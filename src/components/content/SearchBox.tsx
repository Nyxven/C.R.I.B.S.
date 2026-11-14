import { Search } from "lucide-react";

/** Plain GET form: works without JavaScript and sends the person to /search?q=... */
export function SearchBox({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" method="get" role="search" className="search">
      <Search size={20} className="search-icon" aria-hidden="true" />
      <label htmlFor="q" className="sr-only">Search guides, questions and specialists</label>
      <input id="q" name="q" type="search" defaultValue={defaultValue} maxLength={80} autoComplete="off" autoFocus={autoFocus}
        placeholder="Search guides and questions" />
      <button type="submit" aria-label="Search">
        <span className="hidden sm:inline">Search</span>
        <Search size={20} className="sm:hidden" aria-hidden="true" />
      </button>
    </form>
  );
}
