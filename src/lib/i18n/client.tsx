"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, makeT, type Locale, type T } from "./core";

const Ctx = createContext<Locale>(DEFAULT_LOCALE);

/** Put once in the root layout so every client component can call useT(). */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}
export const useLocale = (): Locale => useContext(Ctx);
export function useT(): T {
  const locale = useContext(Ctx);
  return useMemo(() => makeT(locale), [locale]);
}
