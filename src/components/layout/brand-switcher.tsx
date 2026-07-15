"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Layers, ChevronRight } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 * Sidebar chip that shows the active brand and links to /brands.
 * No dropdown, no dialog — just a link. All switching + creation happens
 * on the /brands page which is a plain client component.
 */
export function BrandSwitcher() {
  const locale = useLocale();
  const [label, setLabel] = useState("Loading…");
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/teams", { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        const brands: Brand[] = Array.isArray(d?.teams) ? d.teams : [];
        if (cancelled) return;
        const active = brands.find((b) => b.isActive) ?? brands[0];
        setLabel(active?.name ?? "No brand");
        setCount(brands.length);
      } catch {
        if (!cancelled) setLabel("Brand");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          render={<Link href={`/${locale}/brands`} />}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <Layers className="size-4" />
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
            <span className="truncate font-semibold">{label}</span>
            <span className="truncate text-xs text-muted-foreground">
              {count} brand{count !== 1 ? "s" : ""} · switch
            </span>
          </div>
          <ChevronRight className="ms-auto size-4 shrink-0" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
