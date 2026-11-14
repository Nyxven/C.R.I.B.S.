import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { ConnectionBanner } from "@/components/ui/ConnectionBanner";
import { Tour } from "@/components/tour/Tour";
import { isOnboarded } from "@/server/onboarding/service";
import { AppNav } from "@/components/nav/AppNav";
import { Loader } from "@/components/Loader";
import { LOADER_COOKIE } from "@/config/ui";
import { Logo } from "@/components/Logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    // A cookie that no longer works means the session ended: say so on the sign-in screen.
    const hadCookie = (await cookies()).has("cribs_session");
    redirect(hadCookie ? "/sign-in?expired=1" : "/sign-in");
  }
  const seen = (await cookies()).has(LOADER_COOKIE);
  // New accounts build their child profile first.
  if (!(await isOnboarded(session.user.id))) redirect("/onboarding");
  return (
    <Loader seen={seen}>
      <a href="#content" className="skip-link">Skip to content</a>
      <ConnectionBanner />
      <Tour userId={session.user.id} />
      <AppNav />
      <header className="sticky top-0 z-10 bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center px-5 py-2">
          <Link href="/home" className="flex items-center gap-2"><Logo size={44} alt="" /><span className="font-display text-lg font-bold">C.R.I.B.S.</span></Link>
        </div>
        <div className="ribbon-bar" aria-hidden="true" />
      </header>
      <div className="lg:pl-64">
        <main id="content" tabIndex={-1} className="mx-auto max-w-2xl px-5 pb-40 pt-6 outline-none lg:max-w-3xl lg:px-8 lg:pb-12 lg:pt-10">{children}</main>
      </div>
    </Loader>
  );
}
