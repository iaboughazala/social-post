import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isRtl } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "SocialPost - Schedule & Publish Content",
  description: "Schedule and publish content across social media platforms",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const rtl = isRtl(locale as Locale);
  const fontClass = locale === "ar" ? cairo.variable : inter.variable;

  return (
    <html lang={locale} dir={rtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`${fontClass} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider>
            {children}
            <Toaster position={rtl ? "bottom-left" : "bottom-right"} />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
