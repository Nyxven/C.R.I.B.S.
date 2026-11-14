import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChangePassword, SignOutOthers } from "@/components/settings/AccountControls";

export const metadata = { title: "Security and password" };

export default function Page() {
  return (
    <div className="space-y-6">
      <BackLink href="/settings">Settings</BackLink>
      <PageHeader title="Security and password" />
      <section aria-labelledby="pw" className="space-y-3">
        <h2 id="pw" className="h-section">Change password</h2>
        <p className="text-ink-soft">Changing it signs out your other devices and sends you a notice.</p>
        <ChangePassword />
      </section>
      <section aria-labelledby="dev" className="space-y-3 border-t border-line pt-6">
        <h2 id="dev" className="h-section">Other devices</h2>
        <p className="text-ink-soft">Signed in somewhere you don&apos;t use anymore? Sign those devices out.</p>
        <SignOutOthers />
      </section>
    </div>
  );
}
