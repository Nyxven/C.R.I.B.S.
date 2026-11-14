"use client";
import { StatePage, HomeLink } from "@/components/ui/StatePage";

// Shown when a page fails. Never shows technical details; the digest is only a support reference.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatePage title="Something went wrong on our side"
      actions={<><button type="button" onClick={reset} className="btn-primary">Try again</button><HomeLink /></>}>
      <p>It&apos;s not you. Your information is safe. Please try again, and if it keeps happening, come back in a little while.</p>
      {error.digest && <p className="mt-3 text-sm">Support reference: <span className="font-mono">{error.digest}</span></p>}
    </StatePage>
  );
}
