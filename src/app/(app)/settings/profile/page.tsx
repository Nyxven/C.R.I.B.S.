import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      <Link href="/settings" className="btn-ghost -ml-3"><ArrowLeft size={20} aria-hidden="true" /> Settings</Link>
      <h1 className="text-3xl font-extrabold">Your profile</h1>
      <ProfileForm initialName={prefs.displayName || session.user.name} initialRelationship={prefs.relationship} email={session.user.email} />
    </div>
  );
}
