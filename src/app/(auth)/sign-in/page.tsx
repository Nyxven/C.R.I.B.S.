import { Suspense } from "react";
import { Info } from "lucide-react";
import { SignInForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Sign in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <>
      {expired === "1" && (
        <div role="status" className="notice notice-info mx-auto mb-4 max-w-md">
          <Info size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>You were signed out for your security. Please sign in again to continue.</p>
        </div>
      )}
      <Suspense><SignInForm /></Suspense>
    </>
  );
}
