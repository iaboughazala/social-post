"use client";

import { useSession, signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, CreditCard, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function Header() {
  const { data: session } = useSession();
  const locale = useLocale();

  const userName = session?.user?.name ?? "User";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="mx-2 h-4" />
      <div className="flex-1" />
      <LanguageSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          }
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm">
            <p className="font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.location.href = `/${locale}/settings`}>
            <Settings className="me-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.location.href = `/${locale}/billing`}>
            <CreditCard className="me-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="me-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
