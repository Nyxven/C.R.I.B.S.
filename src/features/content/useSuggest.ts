"use client";
import { useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { POPULAR, suggest, type Suggestion, type SuggestItem } from "@/lib/domain/suggest";

/** State for the search box suggestions (ARIA combobox): what is typed, whether the list is open, which option is active. */
export function useSuggest(index: readonly SuggestItem[] | undefined, initial = "") {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const enabled = !!index && index.length > 0;
  const empty = value.trim() === "";

  const items: Suggestion[] = useMemo(() => {
    if (!enabled) return [];
    if (empty) return POPULAR.map((p, i) => ({ id: `p${i}`, kind: "topic", title: p, meta: "", href: `/search?q=${encodeURIComponent(p)}` }));
    return suggest(index, value);
  }, [enabled, empty, index, value]);

  const shown = enabled && open && items.length > 0;

  function go(s: Suggestion) {
    setOpen(false);
    setActive(-1);
    router.push(s.href);
  }

  function onChange(v: string) {
    setValue(v);
    setOpen(true);
    setActive(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!enabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const n = items.length;
      if (n === 0) return;
      setActive((a) => (e.key === "ArrowDown" ? (a + 1) % n : (a <= 0 ? n - 1 : a - 1)));
    } else if (e.key === "Enter" && shown && active >= 0 && items[active]) {
      e.preventDefault(); // otherwise the form would search for the typed text instead
      go(items[active]);
    } else if (e.key === "Escape" && shown) {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return {
    value, items, shown, active, empty,
    activeId: shown && active >= 0 ? items[active]?.id : undefined,
    onChange, onKeyDown, go,
    onFocus: () => setOpen(true),
    onBlur: () => { setOpen(false); setActive(-1); },
    hover: setActive,
  };
}
