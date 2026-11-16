import { Info } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { LanguageForm } from "@/components/settings/LanguageForm";
import { getLocale, getT } from "@/lib/i18n/server";

export const metadata = { title: "Language" };

export default async function Page() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <div className="space-y-6">
      <BackLink href="/settings">{t("settings.title")}</BackLink>
      <PageHeader title={t("lang.title")} intro={t("lang.intro")} />
      <LanguageForm initial={locale} />
      <p className="notice notice-warn text-sm"><Info size={20} className="mt-0.5 shrink-0 text-amber-dark" aria-hidden="true" /><span>{t("lang.note")}</span></p>
    </div>
  );
}
