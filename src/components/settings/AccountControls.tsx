"use client";
import { useState, useTransition } from "react";
import { changePasswordAction, signOutOthersAction } from "@/features/account/actions";

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return <p role="status" className={`min-h-5 font-bold ${ok ? "text-ink" : "text-coral-dark"}`}>{text}</p>;
}

export function ChangePassword() {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>({ ok: true, text: "" });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await changePasswordAction({ current: f.current, next: f.next }); if (r.ok) { setF({ current: "", next: "" }); setMsg({ ok: true, text: "Password changed. Your other devices were signed out." }); } else setMsg({ ok: false, text: r.error }); }); }}>
      <label className="block"><span className="font-bold">Current password</span><input type="password" autoComplete="current-password" className="field w-full" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
      <label className="block"><span className="font-bold">New password (10 or more characters)</span><input type="password" autoComplete="new-password" className="field w-full" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></label>
      <button className="btn-primary w-full sm:w-auto" disabled={pending || !f.current || !f.next}>Change password</button>
      <Msg {...msg} />
    </form>
  );
}

export function SignOutOthers() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>({ ok: true, text: "" });
  return (
    <div className="space-y-2">
      <button type="button" className="btn-secondary w-full sm:w-auto" disabled={pending} onClick={() => start(async () => { const r = await signOutOthersAction(); setMsg(r.ok ? { ok: true, text: r.signedOut === 0 ? "No other devices were signed in." : `Signed out ${r.signedOut} other ${r.signedOut === 1 ? "device" : "devices"}.` } : { ok: false, text: r.error }); })}>Sign out my other devices</button>
      <Msg {...msg} />
    </div>
  );
}
