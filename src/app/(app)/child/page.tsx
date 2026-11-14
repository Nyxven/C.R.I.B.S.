import { getSession } from "@/server/auth/session";
import { loadOnboarding } from "@/server/onboarding/service";
import { brand } from "@/config/brand";
import { ChildProfile } from "@/components/child/ChildProfile";

export const metadata = { title: "Child profile" };

export default async function Page() {
  const session = await getSession();
  if (!session) return null;
  const state = await loadOnboarding(session.user.id, session.user.name);
  return <ChildProfile initial={state.data} tagName={brand.tagName} />;
}
