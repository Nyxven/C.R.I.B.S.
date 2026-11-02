"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signUpAction, verifyEmailAction, resendCodeAction, signInAction, requestResetAction, resetPasswordAction } from "@/features/auth/actions";
import { Logo } from "@/components/Logo";

function Shell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2"><Logo size={36} /><span className="font-display text-xl font-bold">C.R.I.B.S.</span></Link>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {sub && <p className="mb-5 mt-1 text-ink-soft">{sub}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </main>
  );
}
const Err = ({ m }: { m: string }) => (m ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{m}</p> : null);

export function SignUpForm() {
  const r = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", consent: false });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (f.password.length < 10) return setErr("Password must be at least 10 characters.");
    if (!f.consent) return setErr("Please accept the Terms and Privacy Policy to continue.");
    setBusy(true);
    const res = await signUpAction({ name: f.name, email: f.email, password: f.password });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    r.push(`/verify?email=${encodeURIComponent(f.email.trim())}`);
  }
  return (
    <Shell title="Create your account" sub="It takes a minute. We'll email you a 6-digit code.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold">Your name<input className="field mt-1" required maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></label>
        <label className="block text-sm font-bold">Email<input className="field mt-1" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></label>
        <label className="block text-sm font-bold">Password (10+ characters)
          <div className="relative mt-1"><input className="field pr-20" type={show ? "text" : "password"} required minLength={10} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-sm font-bold text-ink-soft">{show ? "Hide" : "Show"}</button></div>
        </label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
          <span>I'm a parent/guardian aged 18+, and I accept the Terms and Privacy Policy.</span></label>
        <Err m={err} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="text-center text-sm">Already have an account? <Link className="font-bold underline" href="/sign-in">Sign in</Link></p>
    </Shell>
  );
}

export function VerifyForm() {
  const r = useRouter(); const email = useSearchParams().get("email") ?? "";
  const [otp, setOtp] = useState(""); const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const res = await verifyEmailAction({ email, code: otp });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    r.push("/home");
  }
  async function resend() {
    setInfo(""); setErr("");
    const res = await resendCodeAction({ email });
    res.ok ? setInfo("If that email can be verified, a new code is on its way.") : setErr(res.error);
  }
  return (
    <Shell title="Check your email" sub={`If ${email || "your email"} can be used, we sent a 6-digit code.`}>
      <form onSubmit={submit} className="space-y-4">
        <input className="field text-center text-2xl tracking-[.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} aria-label="6-digit code" />
        <Err m={err} />{info && <p role="status" className="text-sm font-semibold text-sage-dark">{info}</p>}
        <button className="btn-primary w-full" disabled={busy || otp.length !== 6}>{busy ? "Verifying…" : "Verify"}</button>
      </form>
      <button onClick={resend} className="w-full text-center text-sm font-bold underline">Send a new code</button>
    </Shell>
  );
}

export function SignInForm() {
  const r = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const res = await signInAction({ email, password });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    if (res.needsVerify) return r.push(`/verify?email=${encodeURIComponent(email.trim())}`);
    r.push("/home");
  }
  return (
    <Shell title="Welcome back" sub="Sign in to continue.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold">Email<input className="field mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label className="block text-sm font-bold">Password<input className="field mt-1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
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
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function sendCode(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const res = await requestResetAction({ email }); // same response whether or not the email exists
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    setStep("reset");
  }
  async function reset(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (password.length < 10) return setErr("Password must be at least 10 characters.");
    setBusy(true);
    const res = await resetPasswordAction({ email, code: otp, password });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    r.push("/sign-in");
  }
  return step === "email" ? (
    <Shell title="Reset your password" sub="Enter your email and we'll send a 6-digit code.">
      <form onSubmit={sendCode} className="space-y-4">
        <input className="field" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <Err m={err} />
        <button className="btn-primary w-full" disabled={busy}>Send code</button>
      </form>
    </Shell>
  ) : (
    <Shell title="Enter your code" sub="If that email has an account, a code is on its way.">
      <form onSubmit={reset} className="space-y-4">
        <input className="field text-center text-2xl tracking-[.5em]" inputMode="numeric" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} aria-label="6-digit code" />
        <input className="field" type="password" required minLength={10} placeholder="New password (10+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" aria-label="New password" />
        <Err m={err} />
        <button className="btn-primary w-full" disabled={busy}>Reset password</button>
      </form>
    </Shell>
  );
}
