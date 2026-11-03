"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const lines = ["Getting things ready for you…", "Gathering your guides…", "Almost there…"];

// Shows once per browser session. Replace the timer with real prefetch in P3/P4.
export function Loader({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"checking" | "loading" | "done">("checking");
  const [i, setI] = useState(0);
  useEffect(() => {
    if (sessionStorage.getItem("cribs_loaded")) return setPhase("done");
    setPhase("loading");
    const t1 = setInterval(() => setI((x) => (x + 1) % lines.length), 700);
    const t2 = setTimeout(() => { sessionStorage.setItem("cribs_loaded", "1"); setPhase("done"); }, 1800);
    return () => { clearInterval(t1); clearTimeout(t2); };
  }, []);
  if (phase === "done") return <>{children}</>;
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-cream">
      {phase === "loading" && (<><Logo size={200} animate /><p className="font-display text-lg font-semibold text-ink-soft">{lines[i]}</p></>)}
    </div>
  );
}
