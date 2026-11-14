import Link from "next/link";
import { StatePage } from "@/components/ui/StatePage";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatePage title="We can't find that page"
      actions={<><Link href="/home" className="btn-primary">Go to Home</Link><Link href="/faq" className="btn-secondary">Browse the FAQ</Link></>}>
      <p>The link may be old or mistyped. Let&apos;s get you back on track.</p>
    </StatePage>
  );
}
