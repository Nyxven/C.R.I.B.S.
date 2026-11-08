// What the chat route streams to the browser: one JSON object per line. Pure.
import type { Source } from "./citations";

export type ChatEvent =
  | { t: "start"; kind: "answer" | "emergency" }
  | { t: "text"; d: string }
  | { t: "done"; sources: Source[] }
  | { t: "error"; message: string };

export const encodeEvent = (e: ChatEvent): string => `${JSON.stringify(e)}\n`;

const isSource = (s: unknown): s is Source =>
  typeof s === "object" && s !== null && typeof (s as Source).id === "string" && typeof (s as Source).title === "string" && typeof (s as Source).href === "string";

function toEvent(v: unknown): ChatEvent | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  switch (o.t) {
    case "start": return o.kind === "answer" || o.kind === "emergency" ? { t: "start", kind: o.kind } : null;
    case "text": return typeof o.d === "string" ? { t: "text", d: o.d } : null;
    case "done": return Array.isArray(o.sources) ? { t: "done", sources: o.sources.filter(isSource) } : null;
    case "error": return typeof o.message === "string" ? { t: "error", message: o.message } : null;
    default: return null;
  }
}

/** Reads complete lines from a growing buffer. Half a line stays in `rest` for the next chunk; broken lines are skipped. */
export function parseEvents(buffer: string): { events: ChatEvent[]; rest: string } {
  const parts = buffer.split("\n");
  const rest = parts.pop() ?? "";
  const events: ChatEvent[] = [];
  for (const line of parts) {
    if (!line.trim()) continue;
    try { const e = toEvent(JSON.parse(line)); if (e) events.push(e); } catch { /* skip a broken line */ }
  }
  return { events, rest };
}
