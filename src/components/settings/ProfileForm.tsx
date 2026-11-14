"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { updateSettingsAction } from "@/features/account/actions";
import { RELATIONSHIPS } from "@/lib/domain/onboarding";
import { Choice, TextField } from "@/components/onboarding/controls";

export function ProfileForm({ initialName, initialRelationship, email }: { initialName: string; initialRelationship: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [rel, setRel] = useState(initialRelationship);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const invalid = name.trim().length === 0 || !rel;
  return (
    <form className="space-y-6" noValidate onSubmit={(e) => {
      e.preventDefault();
      if (invalid) return setMsg({ ok: false, text: name.trim() ? "Please choose how you relate to your child." : "Please tell us your name." });
      start(async () => {
        const r = await updateSettingsAction({ displayName: name.trim(), relationship: rel });
        if (r.ok) { setMsg({ ok: true, text: "Saved." }); router.refresh(); } else setMsg({ ok: false, text: r.error });
      });
    }}>
      <TextField id="displayName" label="Your name" value={name} maxLength={60} autoComplete="name" onChange={(v) => { setName(v); setMsg(null); }} />
      <fieldset className="space-y-3">
        <legend className="font-display text-lg font-bold">You are their…</legend>
        <div className="grid grid-cols-2 gap-3">
          {RELATIONSHIPS.map((o) => <Choice key={o.value} type="radio" name="relationship" value={o.value} label={o.label} checked={rel === o.value} onChange={() => { setRel(o.value); setMsg(null); }} />)}
        </div>
      </fieldset>
      <div>
        <p className="font-display text-lg font-bold">Email</p>
        <p className="break-all text-ink-soft">{email}</p>
        <p className="text-sm text-ink-soft">Changing your email is not available yet.</p>
      </div>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`notice ${msg.ok ? "notice-success" : "notice-error"}`}>
          {msg.ok && <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-mint-dark" aria-hidden="true" />}{msg.text}
        </p>
      )}
      <button className="btn-primary w-full sm:w-auto" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
