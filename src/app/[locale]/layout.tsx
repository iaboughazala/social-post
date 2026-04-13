import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isRtl } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const rtl = isRtl(locale as Locale);

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={locale}>
      <NextIntlClientProvider messages={messages}>
        <TooltipProvider>
          {children}
          <Toaster position={rtl ? "bottom-left" : "bottom-right"} />
        </TooltipProvider>
      </NextIntlClientProvider>
    </div>
  );
}
