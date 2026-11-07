"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signUpAction, verifyEmailAction, resendCodeAction, signInAction, requestResetAction, resetPasswordAction } from "@/features/auth/actions";
import { Logo } from "@/components/Logo";
import { OtpInput } from "@/components/ui/OtpInput";
import { PasswordField } from "@/components/auth/PasswordField";
import { checkSignUp, PASSWORD_MIN, type FieldErrors } from "@/lib/formChecks";
import { formatClock, useCooldown } from "@/features/auth/useCooldown";

function Shell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2"><Logo size={52} alt="" /><span className="font-display text-xl font-bold">C.R.I.B.S.</span></Link>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {sub && <p className="mb-5 mt-1 text-ink-soft">{sub}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </main>
  );
}
const Err = ({ m, id }: { m: string; id?: string }) => (m ? <p id={id} role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{m}</p> : null);

const FieldError = ({ id, m }: { id: string; m?: string }) => (m ? <p id={id} role="alert" className="mt-1 text-sm font-semibold text-red-700">{m}</p> : null);

export function SignUpForm() {
  const r = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", consent: false });
  const [errs, setErrs] = useState<FieldErrors>({});
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const clear = (k: keyof FieldErrors) => setErrs((e) => ({ ...e, [k]: undefined }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const found = checkSignUp(f);
    setErrs(found);
    const first = (["name", "email", "password", "consent"] as const).find((k) => found[k]);
    if (first) { document.getElementById(`su-${first}`)?.focus(); return; }
    setBusy(true);
    const res = await signUpAction({ name: f.name, email: f.email, password: f.password });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    r.push(`/verify?email=${encodeURIComponent(f.email.trim())}`);
  }
  return (
    <Shell title="Create your account" sub="It takes a minute. We'll email you a 6-digit code.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="su-name" className="block text-sm font-bold">Your name</label>
          <input id="su-name" className="field mt-1" maxLength={60} value={f.name} autoComplete="name" aria-invalid={errs.name ? true : undefined} aria-describedby={errs.name ? "su-name-error" : undefined}
            onChange={(e) => { setF({ ...f, name: e.target.value }); clear("name"); }} />
          <FieldError id="su-name-error" m={errs.name} />
        </div>
        <div>
          <label htmlFor="su-email" className="block text-sm font-bold">Email</label>
          <input id="su-email" className="field mt-1" type="email" value={f.email} autoComplete="email" aria-invalid={errs.email ? true : undefined} aria-describedby={errs.email ? "su-email-error" : undefined}
            onChange={(e) => { setF({ ...f, email: e.target.value }); clear("email"); }} />
          <FieldError id="su-email-error" m={errs.email} />
        </div>
        <PasswordField id="su-password" label="Password" value={f.password} autoComplete="new-password" showRule error={errs.password}
          onChange={(v) => { setF({ ...f, password: v }); clear("password"); }} />
        <div>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input id="su-consent" type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-[#5B49A8]" checked={f.consent} aria-invalid={errs.consent ? true : undefined} aria-describedby={errs.consent ? "su-consent-error" : undefined}
              onChange={(e) => { setF({ ...f, consent: e.target.checked }); clear("consent"); }} />
            <span>I'm a parent/guardian aged 18+, and I accept the <Link className="font-bold underline" href="/terms" target="_blank" rel="noopener">Terms of Use</Link> and <Link className="font-bold underline" href="/privacy" target="_blank" rel="noopener">Privacy Policy</Link><span className="sr-only"> (open in a new tab)</span>.</span>
          </label>
          <FieldError id="su-consent-error" m={errs.consent} />
        </div>
        <Err m={err} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="text-center text-sm">Already have an account? <Link className="font-bold underline" href="/sign-in">Sign in</Link></p>
    </Shell>
  );
}

export function VerifyForm() {
  const r = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const fromSignIn = params.get("from") === "signin";
  const [err, setErr] = useState(""); const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false); const [sending, setSending] = useState(false);
  const [boxKey, setBoxKey] = useState(0);
  const working = useRef(false);
  const cooldown = useCooldown(60);

  async function verify(code: string) {
    if (working.current) return;
    working.current = true; setErr(""); setInfo(""); setBusy(true);
    const res = await verifyEmailAction({ email, code });
    if (!res.ok) { working.current = false; setBusy(false); setErr(res.error); setBoxKey((k) => k + 1); return; }
    r.push("/home"); // stay in the "Verifying…" state while the next page loads
  }
  async function resend() {
    if (cooldown.active || sending) return;
    setErr(""); setInfo(""); setSending(true);
    const res = await resendCodeAction({ email });
    setSending(false);
    if (!res.ok) return setErr(res.error);
    cooldown.restart(); setBoxKey((k) => k + 1);
    setInfo(`A new code is on its way to ${email}.`);
  }

  if (!email) {
    return (
      <Shell title="Let's find your code" sub="We lost track of your email address.">
        <Link href="/sign-in" className="btn-primary w-full">Go to sign in</Link>
        <p className="text-center text-sm text-ink-soft">Sign in with your email and password and we'll send you a new code.</p>
      </Shell>
    );
  }
  const sub = fromSignIn
    ? `Let's finish verifying your email. Enter the 6-digit code we emailed to ${email}.`
    : `If ${email} is right, a 6-digit code is on its way. It lasts 10 minutes. Check your spam folder too.`;
  return (
    <Shell title="Check your email" sub={sub}>
      <p className="text-center text-sm">Code for <b>{email}</b>. <Link className="font-bold underline" href="/sign-up">Wrong email?</Link></p>
      <OtpInput key={boxKey} label="6-digit code" onComplete={verify} onChange={() => setErr("")} disabled={busy} invalid={!!err} describedBy={err ? "otp-error" : undefined} />
      <div aria-live="polite" className="min-h-6 text-center">{busy && <p role="status" className="font-bold text-ink-soft">Verifying…</p>}</div>
      <Err m={err} id="otp-error" />
      {info && <p role="status" className="text-center text-sm font-semibold text-sage-dark">{info}</p>}
      <button type="button" onClick={resend} disabled={cooldown.active || sending}
        className="min-h-11 w-full rounded-full text-center text-sm font-bold underline disabled:cursor-not-allowed disabled:text-ink-soft disabled:no-underline">
        {cooldown.active ? `Send a new code in ${formatClock(cooldown.left)}` : sending ? "Sending…" : "Send a new code"}
      </button>
      <p className="text-center text-sm text-ink-soft">No code? If you already have an account, <Link className="font-bold underline" href="/sign-in">sign in</Link> or <Link className="font-bold underline" href="/forgot">reset your password</Link>.</p>
    </Shell>
  );
}

export function SignInForm() {
  const r = useRouter();
  const justReset = useSearchParams().get("reset") === "1";
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const res = await signInAction({ email, password });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    if (res.needsVerify) return r.push(`/verify?email=${encodeURIComponent(email.trim())}&from=signin`);
    r.push("/home");
  }
  return (
    <Shell title="Welcome back" sub="Sign in to continue.">
      {justReset && <p role="status" className="rounded-xl bg-tint-sage p-3 text-sm font-bold">Password updated. Sign in with your new password.</p>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="si-email" className="block text-sm font-bold">Email</label>
          <input id="si-email" className="field mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <PasswordField id="si-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <Err m={err} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <div className="flex justify-between text-sm"><Link className="font-bold underline" href="/forgot">Forgot password?</Link><Link className="font-bold underline" href="/sign-up">Create account</Link></div>
    </Shell>
  );
}

export function ForgotForm() {
  const r = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(""); const [otp, setOtp] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);
  const [boxKey, setBoxKey] = useState(0); const [sending, setSending] = useState(false); const [codeBad, setCodeBad] = useState(false); const [pwErr, setPwErr] = useState("");
  const cooldown = useCooldown(60);
  async function sendCode(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const res = await requestResetAction({ email }); // same response whether or not the email exists
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    cooldown.restart(); setStep("reset");
  }
  async function resend() {
    if (cooldown.active || sending) return;
    setErr(""); setInfo(""); setSending(true);
    const res = await requestResetAction({ email });
    setSending(false);
    if (!res.ok) return setErr(res.error);
    cooldown.restart(); setOtp(""); setBoxKey((k) => k + 1);
    setInfo(`A new code is on its way to ${email.trim()}.`);
  }
  async function reset(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setInfo(""); setPwErr("");
    if (otp.length !== 6) { setCodeBad(true); return setErr("Please enter all 6 digits of the code."); }
    if (password.length < PASSWORD_MIN) { setPwErr(`Please use at least ${PASSWORD_MIN} characters.`); return document.getElementById("fg-password")?.focus(); }
    setBusy(true);
    const res = await resetPasswordAction({ email, code: otp, password });
    if (!res.ok) { setBusy(false); setErr(res.error); setCodeBad(true); setOtp(""); setBoxKey((k) => k + 1); return; }
    setBusy(false);
    r.push("/sign-in?reset=1");
  }
  return step === "email" ? (
    <Shell title="Reset your password" sub="Enter your email and we'll send a 6-digit code.">
      <form onSubmit={sendCode} className="space-y-4">
        <div>
          <label htmlFor="fg-email" className="block text-sm font-bold">Email</label>
          <input id="fg-email" className="field mt-1" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <Err m={err} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
      </form>
    </Shell>
  ) : (
    <Shell title="Enter your code" sub={`If ${email.trim()} has an account, a 6-digit code is on its way. It lasts 10 minutes. Check your spam folder too.`}>
      <form onSubmit={reset} className="space-y-4">
        <p className="text-center text-sm">Code for <b>{email.trim()}</b>. <button type="button" className="font-bold underline" onClick={() => { setStep("email"); setErr(""); setInfo(""); setOtp(""); setBoxKey((k) => k + 1); }}>Wrong email?</button></p>
        <OtpInput key={boxKey} label="6-digit code" onComplete={setOtp} onChange={(c) => { setOtp(c); setErr(""); setCodeBad(false); }} disabled={busy} invalid={codeBad} describedBy={err ? "reset-error" : undefined} />
        <PasswordField id="fg-password" label="New password" value={password} onChange={(v) => { setPassword(v); setPwErr(""); }} autoComplete="new-password" showRule error={pwErr} />
        <Err m={err} id="reset-error" />
        {info && <p role="status" className="text-center text-sm font-semibold text-sage-dark">{info}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Reset password"}</button>
      </form>
      <button type="button" onClick={resend} disabled={cooldown.active || sending}
        className="min-h-11 w-full rounded-full text-center text-sm font-bold underline disabled:cursor-not-allowed disabled:text-ink-soft disabled:no-underline">
        {cooldown.active ? `Send a new code in ${formatClock(cooldown.left)}` : sending ? "Sending…" : "Send a new code"}
      </button>
    </Shell>
  );
}
