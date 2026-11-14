import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/server/auth/session";
import { getPreferences } from "@/server/account/service";
import { ProfileForm } from "@/components/settings/ProfileForm";

export const metadata = { title: "Your profile" };

export default async function Page() {
  const session = await getSession();
  if (!session) return null;
  const prefs = await getPreferences(session.user.id);
  return (
    <div className="space-y-6">
      <BackLink href="/settings">Settings</BackLink>
      <PageHeader title="Your profile" />
      <ProfileForm initialName={prefs.displayName || session.user.name} initialRelationship={prefs.relationship} email={session.user.email} />
    </div>
  );
}
