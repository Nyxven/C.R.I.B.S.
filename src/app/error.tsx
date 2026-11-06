"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <h1 className="text-3xl font-extrabold">Something went wrong on our side</h1>
      <p className="text-lg text-ink-soft">It's not you. Please try again. If it keeps happening, come back in a little while.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/home" className="btn-secondary">Go to Home</Link>
      </div>
    </main>
  );
}
