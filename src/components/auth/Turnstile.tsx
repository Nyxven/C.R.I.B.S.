"use client";
import { useEffect, useRef } from "react";

// Cloudflare Turnstile (free bot check). Shows nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
export const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const turnstileEnabled = !!SITE_KEY;

type Api = { render(el: HTMLElement, o: { sitekey: string; callback: (t: string) => void; "expired-callback": () => void; "error-callback": () => void }): string; reset(id?: string): void; remove(id?: string): void };
declare global { interface Window { turnstile?: Api } }

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT; s.async = true; s.onload = () => resolve(); s.onerror = () => { loading = null; reject(new Error("turnstile")); };
    document.head.appendChild(s);
  });
  return loading;
}

/** `resetSignal` goes up by one after each submit, because a token can be used only once. */
export function Turnstile({ onToken, resetSignal = 0 }: { onToken: (token: string | null) => void; resetSignal?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const id = useRef<string | undefined>(undefined);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let gone = false;
    loadScript().then(() => {
      if (gone || !box.current || !window.turnstile || id.current) return;
      id.current = window.turnstile.render(box.current, { sitekey: SITE_KEY, callback: (t) => cb.current(t), "expired-callback": () => cb.current(null), "error-callback": () => cb.current(null) });
    }).catch(() => cb.current(null));
    return () => { gone = true; if (id.current) window.turnstile?.remove(id.current); id.current = undefined; };
  }, []);

  useEffect(() => {
    if (resetSignal > 0 && id.current) { window.turnstile?.reset(id.current); cb.current(null); }
  }, [resetSignal]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" aria-label="Security check" />;
}
