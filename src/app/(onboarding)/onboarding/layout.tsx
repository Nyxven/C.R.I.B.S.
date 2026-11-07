import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { isOnboarded } from "@/server/onboarding/service";

// The quiz has no bottom nav: one question at a time. Signed-out visitors go to sign-in; finished ones go Home.
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (await isOnboarded(session.user.id)) redirect("/home");
  return (
    <>
      <a href="#content" className="skip-link">Skip to content</a>
      <main id="content" tabIndex={-1} className="outline-none">{children}</main>
    </>
  );
}
