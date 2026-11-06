import { getSession } from "@/server/auth/session";
import { signOutAction } from "@/features/auth/actions";

export const metadata = { title: "Settings" };

export default async function Page() {
  const session = await getSession();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold">Settings</h1>
        <div className="ribbon-bar w-24" aria-hidden="true" />
      </header>
      <section aria-labelledby="account-title" className="card space-y-4 p-5">
        <h2 id="account-title" className="text-xl font-bold">Your account</h2>
        <dl className="space-y-2">
          <div><dt className="text-sm font-bold text-ink-soft">Name</dt><dd className="text-lg">{session?.user.name}</dd></div>
          <div><dt className="text-sm font-bold text-ink-soft">Email</dt><dd className="break-all text-lg">{session?.user.email}</dd></div>
        </dl>
        <form action={signOutAction}><button className="btn-secondary w-full sm:w-auto">Sign out</button></form>
      </section>
      <p className="text-ink-soft">More settings, like changing your password, are coming soon.</p>
    </div>
  );
}
