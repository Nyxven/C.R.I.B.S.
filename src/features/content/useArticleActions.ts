"use client";
import { useState, useTransition } from "react";
import { markReadAction, saveGuideAction } from "./actions";

type Flags = { saved: boolean; read: boolean };

/** State and handlers for the Save and Mark as read buttons. Updates the screen first, undoes it if the server says no. */
export function useArticleActions(slug: string, initial: Flags) {
  const [flags, setFlags] = useState<Flags>(initial);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(key: keyof Flags) {
    const value = !flags[key];
    const before = flags;
    setFlags({ ...flags, [key]: value });
    setError(null); setDone(null);
    startTransition(async () => {
      const res = await (key === "saved" ? saveGuideAction : markReadAction)({ slug, value });
      if (!res.ok) { setFlags(before); setError(res.error); }
      else setDone(key === "saved" ? (value ? "Saved. Find it under Saved guides." : "Removed from your saved guides.") : (value ? "Marked as read." : "Marked as not read."));
    });
  }

  return { ...flags, error, done, pending, toggleSaved: () => toggle("saved"), toggleRead: () => toggle("read") };
}
