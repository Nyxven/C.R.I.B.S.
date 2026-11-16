import { Baby, FileText, History, Languages, LifeBuoy, Lock, ScrollText, Type, User } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";
import { LOCALES } from "@/lib/i18n/core";
import { TEXT_SIZES, normalizeTextSize } from "@/lib/domain/textSize";
import { getSession } from "@/server/auth/session";
import { getPreferences } from "@/server/account/service";
import { PageHeader } from "@/components/ui/PageHeader";
import { RowLink, SettingsGroup } from "@/components/settings/SettingsParts";
import { DeleteAccountRow, DownloadDataRow, NotificationsSwitch, RestartWalkthroughRow, SignOutRow } from "@/components/settings/SettingsActions";

export const metadata = { title: "Settings" };

export default async function Page() {
  const session = await getSession();
  if (!session) return null; // the layout already redirects signed-out visitors
  const [prefs, t, locale] = await Promise.all([getPreferences(session.user.id), getT(), getLocale()]);
  const name = prefs.displayName || session.user.name;
  return (
    <div className="space-y-7">
      <PageHeader title={t("settings.title")} intro={<span className="break-all">{name} · {session.user.email}</span>} />

      <SettingsGroup id="grp-account" label={t("settings.account")}>
        <RowLink href="/settings/profile" icon={User} title={t("settings.profile")} sub={t("settings.profileSub")} />
        <RowLink href="/child" icon={Baby} title={t("settings.child")} sub={t("settings.childSub")} />
        <RowLink href="/settings/security" icon={Lock} title={t("settings.security")} sub={t("settings.securitySub")} />
      </SettingsGroup>

      <SettingsGroup id="grp-prefs" label={t("settings.preferences")}>
        <NotificationsSwitch initial={prefs.notifOn} />
        <RowLink href="/settings/appearance" icon={Type} title={t("settings.textSize")} sub={TEXT_SIZES.find((s) => s.value === normalizeTextSize(prefs.textSize))?.label} />
        <RowLink href="/settings/language" icon={Languages} title={t("lang.title")} sub={LOCALES.find((l) => l.value === locale)?.native} />
        <RowLink href="/ask/history" icon={History} title={t("settings.askHistory")} sub={t("settings.askHistorySub")} />
      </SettingsGroup>

      <SettingsGroup id="grp-support" label={t("settings.support")}>
        <RowLink href="/faq" icon={LifeBuoy} title={t("settings.help")} sub={t("settings.helpSub")} />
        <div data-tour="restart-tour"><RestartWalkthroughRow userId={session.user.id} /></div>
        <RowLink href="/privacy" icon={ScrollText} title={t("settings.privacy")} sub={t("settings.draft")} external />
        <RowLink href="/terms" icon={FileText} title={t("settings.terms")} sub={t("settings.draft")} external />
      </SettingsGroup>

      <SettingsGroup id="grp-data" label={t("settings.data")}>
        <DownloadDataRow />
        <SignOutRow />
      </SettingsGroup>

      <SettingsGroup id="grp-danger" label={t("settings.danger")}>
        <DeleteAccountRow />
      </SettingsGroup>
    </div>
  );
}
