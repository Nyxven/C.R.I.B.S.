"use client";
import { useCallback, useEffect, useState } from "react";

/** Counts down from `seconds` (it starts right away). Call `restart()` to begin again. */
export function useCooldown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const restart = useCallback(() => setLeft(seconds), [seconds]);
  return { left, active: left > 0, restart };
}

/** 75 -> "1:15" */
export const formatClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
