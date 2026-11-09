// Reading a Server-Sent Events stream from an OpenAI-style API. Pure.

/** Complete events in the buffer (their `data:` text), plus what is left over for the next chunk. */
export function parseSse(buffer: string): { data: string[]; rest: string } {
  const hold = buffer.endsWith("\r") ? "\r" : ""; // might be the first half of \r\n
  const text = (hold ? buffer.slice(0, -1) : buffer).replace(/\r\n?/g, "\n");
  const parts = text.split("\n\n");
  const rest = (parts.pop() ?? "") + hold;
  const data: string[] = [];
  for (const block of parts) {
    const lines = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).replace(/^ /, ""));
    if (lines.length) data.push(lines.join("\n"));
  }
  return { data, rest };
}

export type Delta = { text?: string; usage?: { inputTokens: number; outputTokens: number }; error?: string };

/** What one parsed chunk contributes. Reasoning text is ignored on purpose (it is not part of the answer). */
export function extractDelta(chunk: unknown): Delta {
  if (typeof chunk !== "object" || chunk === null) return {};
  const o = chunk as { choices?: { delta?: { content?: unknown } }[]; usage?: { prompt_tokens?: unknown; completion_tokens?: unknown } | null; error?: { message?: unknown } };
  const out: Delta = {};
  const content = o.choices?.[0]?.delta?.content;
  if (typeof content === "string" && content !== "") out.text = content;
  if (o.usage && typeof o.usage.prompt_tokens === "number" && typeof o.usage.completion_tokens === "number") {
    out.usage = { inputTokens: o.usage.prompt_tokens, outputTokens: o.usage.completion_tokens };
  }
  if (o.error) out.error = typeof o.error.message === "string" ? o.error.message.slice(0, 200) : "error";
  return out;
}
