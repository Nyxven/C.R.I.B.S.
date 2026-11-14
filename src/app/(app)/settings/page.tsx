import { Baby, FileText, History, LifeBuoy, Lock, ScrollText, User } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getPreferences } from "@/server/account/service";
import { RowLink, SettingsGroup } from "@/components/settings/SettingsParts";
import { DeleteAccountRow, DownloadDataRow, NotificationsSwitch, RestartWalkthroughRow, SignOutRow } from "@/components/settings/SettingsActions";

export const metadata = { title: "Settings" };

export default async function Page() {
  const session = await getSession();
  if (!session) return null; // the layout already redirects signed-out visitors
  const prefs = await getPreferences(session.user.id);
  const name = prefs.displayName || session.user.name;
  return (
    <div className="space-y-7">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">Settings</h1>
        <p className="break-all text-ink-soft">{name} · {session.user.email}</p>
      </header>

      <SettingsGroup id="grp-account" label="Account">
        <RowLink href="/settings/profile" icon={User} title="Your profile" sub="Your name and how you relate to your child" />
        <RowLink href="/child" icon={Baby} title="Child profile" sub="Communication, sensory needs and care notes" />
        <RowLink href="/settings/security" icon={Lock} title="Security and password" sub="Change password, sign out other devices" />
      </SettingsGroup>

      <SettingsGroup id="grp-prefs" label="Preferences">
        <NotificationsSwitch initial={prefs.notifOn} />
        <RowLink href="/ask/history" icon={History} title="Ask chat history" sub="Review, delete or turn off saved chats" />
      </SettingsGroup>

      <SettingsGroup id="grp-support" label="Support">
        <RowLink href="/faq" icon={LifeBuoy} title="Help center" sub="Answers to common questions" />
        <RestartWalkthroughRow userId={session.user.id} />
        <RowLink href="/privacy" icon={ScrollText} title="Privacy Policy" sub="Draft, pending review" external />
        <RowLink href="/terms" icon={FileText} title="Terms and Conditions" sub="Draft, pending review" external />
      </SettingsGroup>

      <SettingsGroup id="grp-data" label="Your data">
        <DownloadDataRow />
        <SignOutRow />
      </SettingsGroup>

      <SettingsGroup id="grp-danger" label="Danger zone">
        <DeleteAccountRow />
      </SettingsGroup>
    </div>
  );
}
