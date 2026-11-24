import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { PushSettings } from "@/components/settings/PushSettings";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/server/auth/session";
import { getPreferences } from "@/server/account/service";
import { pushPublicKey } from "@/server/push/service";

export const metadata = { title: "Phone notifications" };

export default async function Page() {
  const session = await getSession();
  if (!session) return null; // the layout already redirects signed-out visitors
  const [prefs, t] = await Promise.all([getPreferences(session.user.id), getT()]);
  return (
    <div className="space-y-6">
      <BackLink href="/settings">{t("settings.title")}</BackLink>
      <PageHeader title={t("settings.push")} />
      <PushSettings publicKey={pushPublicKey()} remindRead={prefs.remindRead} remindLog={prefs.remindLog} />
    </div>
  );
}
