import { notFound } from "next/navigation";
import { LogsView } from "@/components/logs/LogsView";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/server/auth/session";
import { getLogs } from "@/server/logs/service";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Logs" };

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ add?: string | string[]; tab?: string | string[] }> }) {
  const session = await getSession();
  if (!session) notFound();
  const [{ add, tab }, logs, t] = await Promise.all([searchParams, getLogs(session.user.id), getT()]);
  const pick = (v: unknown) => (v === "behavior" || v === "communication" ? v : undefined);
  return (
    <div className="space-y-6">
      <BackLink href="/home">{t("nav.home")}</BackLink>
      <PageHeader title={t("logs.title")} intro={t("logs.intro")} />
      <LogsView behavior={logs.behavior} communication={logs.communication} startWith={pick(add) ?? pick(tab)} />
    </div>
  );
}
