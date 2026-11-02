import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { AppNav } from "@/components/nav/AppNav";
import { Loader } from "@/components/Loader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  // TODO(P3): if profile.onboardingCompletedAt is null -> redirect("/onboarding")
  return (
    <Loader>
      <AppNav />
      <div className="mx-auto min-h-dvh max-w-2xl px-5 pb-32 pt-6 lg:ml-64 lg:max-w-3xl lg:pb-12">{children}</div>
    </Loader>
  );
}
