import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-baloo" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: { default: "C.R.I.B.S. — Child Raising Information Basis System", template: "%s · C.R.I.B.S." },
  description: "A centralized guide for parents of children with Autism Spectrum Disorder.",
  applicationName: "C.R.I.B.S.",
};
export const viewport: Viewport = { themeColor: "#8E7BD1", viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${baloo.variable} ${nunito.variable}`}>
      <body><I18nProvider locale={locale}>{children}</I18nProvider></body>
    </html>
  );
}
