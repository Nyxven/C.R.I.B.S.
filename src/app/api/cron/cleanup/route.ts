import { getSecurityConfig } from "@/config/env";
import { isAuthorizedCron } from "@/lib/security/cron";
import { runCleanup } from "@/server/maintenance/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Called once a day by Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
// With no CRON_SECRET set, nobody can run it.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req.headers.get("authorization"), getSecurityConfig().cronSecret)) {
    return Response.json({ error: "Not allowed." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ok: true, ...(await runCleanup()) }, { headers: { "Cache-Control": "no-store" } });
}
