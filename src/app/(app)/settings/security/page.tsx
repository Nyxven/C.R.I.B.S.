import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChangePassword, SignOutOthers } from "@/components/settings/AccountControls";

export const metadata = { title: "Security and password" };

export default function Page() {
  return (
    <div className="space-y-6">
      <Link href="/settings" className="btn-ghost -ml-3"><ArrowLeft size={20} aria-hidden="true" /> Settings</Link>
      <h1 className="text-3xl font-extrabold">Security and password</h1>
      <section aria-labelledby="pw" className="space-y-3">
        <h2 id="pw" className="text-xl font-bold">Change password</h2>
        <p className="text-ink-soft">Changing it signs out your other devices and sends you a notice.</p>
        <ChangePassword />
      </section>
      <section aria-labelledby="dev" className="space-y-3 border-t border-line pt-6">
        <h2 id="dev" className="text-xl font-bold">Other devices</h2>
        <p className="text-ink-soft">Signed in somewhere you don&apos;t use anymore? Sign those devices out.</p>
        <SignOutOthers />
      </section>
    </div>
  );
}
