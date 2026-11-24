import { getSecurityConfig } from "@/config/env";
import { isAuthorizedCron } from "@/lib/security/cron";
import { runReminders } from "@/server/push/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called once a day by Vercel Cron at 11:00 UTC (7 PM in the Philippines), with `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req.headers.get("authorization"), getSecurityConfig().cronSecret)) {
    return Response.json({ error: "Not allowed." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ok: true, ...(await runReminders()) }, { headers: { "Cache-Control": "no-store" } });
}
