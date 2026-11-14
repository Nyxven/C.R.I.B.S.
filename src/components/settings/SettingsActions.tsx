"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Download, LogOut, Play, Trash2, Check } from "lucide-react";
import { deleteAccountAction, exportDataAction, updateSettingsAction } from "@/features/account/actions";
import { signOutAction } from "@/features/auth/actions";
import { restartTour } from "@/components/tour/storage";
import { RowButton } from "./SettingsParts";

/** Short status line that screen readers announce. */
function Status({ ok, text }: { ok: boolean; text: string }) {
  return <p role="status" className={`min-h-5 px-4 pb-3 text-sm font-bold ${ok ? "text-mint-dark" : "text-coral-dark"}`}>{text}</p>;
}

/** On/off switch row for notifications. Updates at once and goes back if saving fails. */
export function NotificationsSwitch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const toggle = () => {
    const next = !on;
    setOn(next); setMsg({ ok: true, text: "" });
    start(async () => {
      const r = await updateSettingsAction({ notifOn: next });
      if (!r.ok) { setOn(!next); setMsg({ ok: false, text: r.error }); } else setMsg({ ok: true, text: next ? "Notifications are on." : "Notifications are off. Account and safety notices still arrive." });
    });
  };
  return (
    <div>
      <div className="list-row">
        <span className="row-icon"><Bell size={20} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span id="notif-label" className="row-title block">Notifications</span>
          <span id="notif-sub" className="row-sub block">Replies and helpful marks on your posts</span>
        </span>
        <button type="button" role="switch" aria-checked={on} aria-labelledby="notif-label" aria-describedby="notif-sub" disabled={pending} onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors duration-200 ${on ? "border-brand bg-brand" : "border-field bg-white"}`}>
          <span className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${on ? "left-[26px] bg-white text-brand" : "left-0.5 bg-field text-white"}`}>
            {on && <Check size={14} aria-hidden="true" />}
          </span>
          <span className="sr-only">{on ? "On" : "Off"}</span>
        </button>
      </div>
      {msg.text && <Status {...msg} />}
    </div>
  );
}

export function RestartWalkthroughRow({ userId }: { userId: string }) {
  const router = useRouter();
  return <RowButton icon={Play} title="Restart the app walkthrough" sub="A short tour of the main buttons" onClick={() => { restartTour(userId); router.push("/home"); }} />;
}

export function DownloadDataRow() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState({ ok: true, text: "" });
  return (
    <div>
      <RowButton icon={Download} title="Download my data" sub="A readable copy of what we hold about you" disabled={pending}
        onClick={() => start(async () => {
          const r = await exportDataAction();
          if (!r.ok) return setMsg({ ok: false, text: r.error });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([r.json], { type: "application/json" }));
          a.download = r.fileName; a.click(); URL.revokeObjectURL(a.href);
          setMsg({ ok: true, text: "Your file was downloaded." });
        })} />
      {msg.text && <Status {...msg} />}
    </div>
  );
}

export function SignOutRow() {
  return (
    <form action={signOutAction}>
      <button className="list-row"><span className="row-icon"><LogOut size={20} aria-hidden="true" /></span><span className="row-title">Sign out</span></button>
    </form>
  );
}

/** Delete account: a confirmation dialog first, then the same checks as before (typed word + password). */
export function DeleteAccountRow() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [f, setF] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const close = () => { dialog.current?.close(); setF({ password: "", confirm: "" }); setError(""); };
  return (
    <>
      <RowButton danger icon={Trash2} title="Delete my account" sub="Removes your account and your child's profile for good" onClick={() => dialog.current?.showModal()} />
      <dialog ref={dialog} className="sheet" aria-labelledby="del-h" onClose={() => setError("")}>
        <form className="space-y-4 p-6" onSubmit={(e) => {
          e.preventDefault();
          start(async () => { const r = await deleteAccountAction({ password: f.password, confirm: f.confirm }); if (r.ok) router.replace("/"); else setError(r.error); });
        }}>
          <h2 id="del-h" className="text-xl font-extrabold">Delete your account?</h2>
          <p className="notice notice-error">This deletes your account, your child&apos;s profile, saved chats, tags and posts. It cannot be undone. Close this and use &ldquo;Download my data&rdquo; first if you want a copy.</p>
          <label className="block"><span className="font-bold">Type DELETE to confirm</span><input className="field mt-1" autoComplete="off" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></label>
          <label className="block"><span className="font-bold">Your password</span><input type="password" className="field mt-1" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          {error && <p role="alert" className="font-bold text-coral-dark">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={close}>Keep my account</button>
            <button className="btn-danger" disabled={pending || f.confirm !== "DELETE" || !f.password}>{pending ? "Deleting…" : "Delete everything"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
