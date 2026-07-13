"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "topics", href: "/voice/topics" },
  { key: "samples", href: "/voice/samples" },
  { key: "style", href: "/voice/style" },
  { key: "batch", href: "/voice/batch" },
  { key: "queue", href: "/voice/queue" },
  { key: "schedule", href: "/voice/schedule" },
] as const;

export default function VoiceLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("voice");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="border-b">
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const href = `/${locale}${tab.href}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={tab.key}
                href={href}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                {t(`tabs.${tab.key}`)}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>{children}</div>
    </div>
  );
}
