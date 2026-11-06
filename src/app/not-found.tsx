import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <Logo size={120} alt="" />
      <h1 className="text-3xl font-extrabold">We can't find that page</h1>
      <p className="text-lg text-ink-soft">The link may be old or mistyped. Let's get you back on track.</p>
      <Link href="/home" className="btn-primary">Go to Home</Link>
    </main>
  );
}
