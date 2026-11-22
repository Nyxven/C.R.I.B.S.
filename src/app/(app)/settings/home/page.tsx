import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { HomeLayoutForm } from "@/components/settings/HomeLayoutForm";
import { getPreferences } from "@/server/account/service";
import { getSession } from "@/server/auth/session";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Customize Home" };

export default async function Page() {
  const session = await getSession();
  if (!session) notFound();
  const [prefs, t] = await Promise.all([getPreferences(session.user.id), getT()]);
  return (
    <div className="space-y-6">
      <BackLink href="/settings">{t("settings.title")}</BackLink>
      <PageHeader title={t("layout.title")} intro={t("layout.intro")} />
      <HomeLayoutForm initial={prefs.homeLayout} />
    </div>
  );
}
