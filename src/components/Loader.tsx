"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { LOADER_COOKIE } from "@/config/ui";

const lines = ["Getting things ready for you…", "Gathering your guides…", "Almost there…"];

/**
 * Shows once per browser session. The server tells us (`seen`, from a session cookie) whether it already ran,
 * so repeat page loads go straight to the content with no blank flash.
 * The timer is a placeholder: replace it with real prefetch in P3/P4.
 */
export function Loader({ children, seen }: { children: React.ReactNode; seen: boolean }) {
  const [done, setDone] = useState(seen);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (done) return;
    const t1 = setInterval(() => setI((x) => (x + 1) % lines.length), 700);
    const t2 = setTimeout(() => {
      document.cookie = `${LOADER_COOKIE}=1; path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      setDone(true);
    }, 1800);
    return () => { clearInterval(t1); clearTimeout(t2); };
  }, [done]);
  if (done) return <>{children}</>;
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-cream">
      <Logo size={200} animate />
      <p className="font-display text-lg font-semibold text-ink-soft">{lines[i]}</p>
    </div>
  );
}
