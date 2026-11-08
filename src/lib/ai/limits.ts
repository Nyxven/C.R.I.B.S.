// Input rules for the chat. Pure. The server checks again, whatever the browser sent.
export const MAX_INPUT_CHARS = 1000;
export const MAX_HISTORY_MESSAGES = 6;
const MAX_ASSISTANT_CHARS = 4000; // earlier answers come back from the browser, so they are untrusted and capped
export const MAX_OUTPUT_TOKENS = 700;

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type CleanResult = { ok: true; messages: ChatTurn[]; question: string } | { ok: false; error: "empty" | "too_long" | "bad_order" };

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Trims, removes control characters, joins neighbours with the same role, keeps the last few turns. The last turn must be the user's. */
export function cleanMessages(raw: readonly ChatTurn[]): CleanResult {
  const turns: ChatTurn[] = [];
  for (const m of raw) {
    const content = m.content.replace(CONTROL, "").trim();
    if (m.role === "user" && content.length > MAX_INPUT_CHARS) return { ok: false, error: "too_long" };
    if (content === "") continue;
    const text = m.role === "assistant" ? content.slice(0, MAX_ASSISTANT_CHARS) : content;
    const last = turns.at(-1);
    if (last && last.role === m.role) last.content += `\n\n${text}`;
    else turns.push({ role: m.role, content: text });
  }
  const kept = turns.slice(-MAX_HISTORY_MESSAGES);
  while (kept.length > 0 && kept[0]!.role !== "user") kept.shift();
  const last = kept.at(-1);
  if (!last) return { ok: false, error: "empty" };
  if (last.role !== "user") return { ok: false, error: "bad_order" };
  return { ok: true, messages: kept, question: last.content };
}
