import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextSizeForm } from "@/components/settings/TextSizeForm";
import { getPreferences } from "@/server/account/service";
import { getSession } from "@/server/auth/session";

export const metadata = { title: "Text size" };

export default async function Page() {
  const session = await getSession();
  if (!session) notFound();
  const prefs = await getPreferences(session.user.id);
  return (
    <div className="space-y-6">
      <BackLink href="/settings">Settings</BackLink>
      <PageHeader title="Text size" intro="Makes the words and buttons in the app bigger. It applies on every screen and on every device you sign in to." />
      <TextSizeForm initial={prefs.textSize} />
    </div>
  );
}
