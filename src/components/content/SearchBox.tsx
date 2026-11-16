"use client";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/** Plain GET form: works without JavaScript and sends the person to /search?q=... */
export function SearchBox({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  const t = useT();
  return (
    <form action="/search" method="get" role="search" className="search">
      <Search size={20} className="search-icon" aria-hidden="true" />
      <label htmlFor="q" className="sr-only">{t("search.label")}</label>
      <input id="q" name="q" type="search" defaultValue={defaultValue} maxLength={80} autoComplete="off" autoFocus={autoFocus}
        placeholder={t("search.placeholder")} />
      <button type="submit" aria-label={t("search.button")}>
        <span className="hidden sm:inline">{t("search.button")}</span>
        <Search size={20} className="sm:hidden" aria-hidden="true" />
      </button>
    </form>
  );
}
