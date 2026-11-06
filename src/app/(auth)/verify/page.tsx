import { Suspense } from "react";
import { VerifyForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Check your email" };
export default function Page() { return <Suspense><VerifyForm /></Suspense>; }
