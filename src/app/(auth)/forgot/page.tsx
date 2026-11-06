import { Suspense } from "react";
import { ForgotForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Reset your password" };
export default function Page() { return <Suspense><ForgotForm /></Suspense>; }
