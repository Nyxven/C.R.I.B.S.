import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { loadOnboarding } from "@/server/onboarding/service";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { brand } from "@/config/brand";

export const metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const initial = await loadOnboarding(session.user.id, session.user.name);
  return <OnboardingFlow initial={initial} tagName={brand.tagName} />;
}
