"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Tells the parent when the phone loses its connection, so a failed action is not a mystery. */
export function ConnectionBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync); window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="notice notice-warn fixed inset-x-3 top-3 z-[60] mx-auto max-w-md shadow-lg lg:left-72">
      <WifiOff size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>You&apos;re offline. Saving and Ask won&apos;t work until you&apos;re back online.</p>
    </div>
  );
}
