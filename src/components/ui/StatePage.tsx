import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/** One calm layout for every "something is off" screen: what happened, why it is okay, what to do next. */
export function StatePage({ title, children, actions, fullScreen = true, headingLevel = 1 }: {
  title: string; children: ReactNode; actions: ReactNode; fullScreen?: boolean; headingLevel?: 1 | 2;
}) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <div role="alert" className={`rise mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-5 text-center ${fullScreen ? "min-h-dvh" : "min-h-[60vh]"}`}>
      <Logo size={96} alt="" />
      <H className="text-2xl font-extrabold sm:text-3xl">{title}</H>
      <div className="text-lg text-ink-soft">{children}</div>
      <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}

export const HomeLink = ({ label = "Go to Home" }: { label?: string }) => <Link href="/home" className="btn-secondary">{label}</Link>;
