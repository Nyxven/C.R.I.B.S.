"use client";
import type { MouseEvent } from "react";
import { ArrowUpRight, BookOpen, HelpCircle, Search, Sparkles, Stethoscope, TrendingUp } from "lucide-react";
import type { SuggestItem, SuggestKind } from "@/lib/domain/suggest";
import { useSuggest } from "@/features/content/useSuggest";
import { useT } from "@/lib/i18n/client";

const KIND: Record<SuggestKind, { Icon: typeof BookOpen; box: string }> = {
  guide: { Icon: BookOpen, box: "bg-tint-purple" },
  faq: { Icon: HelpCircle, box: "bg-tint-sage" },
  specialist: { Icon: Stethoscope, box: "bg-tint-pink" },
  page: { Icon: ArrowUpRight, box: "bg-tint-mint" },
  topic: { Icon: Search, box: "bg-tint-yellow" },
};

/**
 * Plain GET form: works without JavaScript and sends the person to /search?q=...
 * With `suggestions`, it is also an ARIA combobox: suggestions appear while typing (and popular topics on focus).
 * Arrow keys move, Enter opens the active one, Escape closes the list.
 */
export function SearchBox({ defaultValue = "", autoFocus = false, suggestions }: { defaultValue?: string; autoFocus?: boolean; suggestions?: SuggestItem[] }) {
  const t = useT();
  const s = useSuggest(suggestions, defaultValue);
  const listId = "q-suggestions";
  return (
    <div className="relative">
      <form action="/search" method="get" role="search" className="search">
        <Search size={20} className="search-icon" aria-hidden="true" />
        <label htmlFor="q" className="sr-only">{t("search.label")}</label>
        <input id="q" name="q" type="search" value={s.value} maxLength={80} autoComplete="off" autoFocus={autoFocus}
          placeholder={t("search.placeholder")}
          role={suggestions ? "combobox" : undefined}
          aria-autocomplete={suggestions ? "list" : undefined}
          aria-expanded={suggestions ? s.shown : undefined}
          aria-controls={suggestions ? listId : undefined}
          aria-activedescendant={s.activeId}
          onChange={(e) => s.onChange(e.target.value)} onKeyDown={s.onKeyDown} onFocus={s.onFocus} onBlur={s.onBlur} />
        <button type="submit" aria-label={t("search.button")}>
          <span className="hidden sm:inline">{t("search.button")}</span>
          <Search size={20} className="sm:hidden" aria-hidden="true" />
        </button>
      </form>

      {suggestions && (
        <>
          <p className="sr-only" aria-live="polite">
            {s.shown ? (s.items.length === 1 ? t("search.countOne") : t("search.count", { n: s.items.length })) : ""}
          </p>
          {s.shown && (
            <div className="suggest-panel">
              {s.empty && (
                <p className="flex items-center gap-2 px-4 pb-1 pt-3 text-sm font-extrabold text-ink-soft">
                  <TrendingUp size={16} aria-hidden="true" /> {t("search.popular")}
                </p>
              )}
              <ul id={listId} role="listbox" aria-label={s.empty ? t("search.popular") : t("search.suggestions")}
                className={s.empty ? "flex flex-wrap gap-2 px-3 pb-3 pt-1" : "py-1"}>
                {s.items.map((it, i) => {
                  const on = i === s.active;
                  // mousedown would blur the input (and close the list) before the click lands
                  const pick = { onMouseDown: (e: MouseEvent) => e.preventDefault(), onClick: () => s.go(it), onMouseEnter: () => s.hover(i) };
                  if (s.empty) {
                    return (
                      <li key={it.id} id={it.id} role="option" aria-selected={on} {...pick}
                        className={`suggest-chip ${on ? "is-active" : ""}`}>
                        <Sparkles size={14} aria-hidden="true" /> {it.title}
                      </li>
                    );
                  }
                  const { Icon, box } = KIND[it.kind];
                  return (
                    <li key={it.id} id={it.id} role="option" aria-selected={on} {...pick}
                      className={`suggest-row ${on ? "is-active" : ""}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${box}`} aria-hidden="true"><Icon size={18} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 font-bold leading-snug text-ink">{it.kind === "topic" ? `“${it.title}”` : it.title}</span>
                        {it.meta && <span className="block truncate text-sm text-ink-soft">{it.meta}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
