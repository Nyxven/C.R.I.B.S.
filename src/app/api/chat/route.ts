import { encodeEvent } from "@/lib/ai/events";
import { isSameOrigin } from "@/lib/origin";
import { requestIpBucket } from "@/server/security/request";
import { chatRequestSchema } from "@/features/ask/schema";
import { getSession } from "@/server/auth/session";
import { defaultChatDeps } from "@/server/ai/deps";
import { startChat } from "@/server/ai/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BODY_CHARS = 30_000;
const json = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store", ...(status === 429 || status === 503 ? { "Retry-After": "60" } : {}) } });

// Thin boundary: same-origin check, sign-in, body checks, then hand over to the service. Streams one JSON event per line.
export async function POST(req: Request) {
  if (!isSameOrigin(req.headers.get("origin"), req.headers.get("host"))) return json(403, "This request is not allowed.");
  const session = await getSession();
  if (!session) return json(401, "Your session ended. Please sign in again.");

  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return json(415, "Unsupported request.");
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) return json(413, "That request is too large.");
  let body: unknown;
  try { body = JSON.parse(text); } catch { return json(400, "Please type a question."); }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return json(400, "Please type a question.");

  const accountAgeHours = (Date.now() - session.user.createdAt.getTime()) / 3_600_000;
  const started = await startChat(defaultChatDeps(), { userId: session.user.id, ipBucket: requestIpBucket(req.headers), accountAgeHours, threadId: parsed.data.threadId }, parsed.data.messages);
  if (started.type === "rejected") return json(started.status, started.error);

  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try { await started.run((e) => controller.enqueue(enc.encode(encodeEvent(e))), abort.signal); }
      finally { controller.close(); }
    },
    cancel() { abort.abort(); },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
