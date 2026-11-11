import { getSession } from "@/server/auth/session";
import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";
import { ChangePassword, DeleteAccount, DownloadData, SignOutOthers } from "@/components/settings/AccountControls";

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
      <section aria-labelledby="pw-title" className="card space-y-3 p-5">
        <h2 id="pw-title" className="text-xl font-bold">Password and devices</h2>
        <ChangePassword />
        <SignOutOthers />
      </section>
      <section aria-labelledby="data-title" className="card space-y-3 p-5">
        <h2 id="data-title" className="text-xl font-bold">Your data</h2>
        <p className="text-ink-soft">Download everything we hold about you, or manage your saved Ask chats.</p>
        <DownloadData />
        <Link href="/ask/history" className="btn-secondary inline-flex w-full justify-center sm:w-auto">Chat history</Link>
      </section>
      <section aria-labelledby="del-title" className="card space-y-3 p-5">
        <h2 id="del-title" className="text-xl font-bold">Delete my account</h2>
        <DeleteAccount />
      </section>
    </div>
  );
}
