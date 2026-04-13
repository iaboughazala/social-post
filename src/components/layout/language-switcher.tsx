"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLocale } from "next-intl";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      <span>{locale === "en" ? "العربية" : "English"}</span>
    </Button>
  );
}
