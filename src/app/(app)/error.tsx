"use client";
import { StatePage, HomeLink } from "@/components/ui/StatePage";

// Route-level boundary inside the signed-in app: the navigation stays on screen, only the page area shows this.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatePage fullScreen={false} title="This page didn't load"
      actions={<><button type="button" onClick={reset} className="btn-primary">Try again</button><HomeLink /></>}>
      <p>Something went wrong while opening this page. Nothing you saved was lost.</p>
      {error.digest && <p className="mt-3 text-sm">Support reference: <span className="font-mono">{error.digest}</span></p>}
    </StatePage>
  );
}
