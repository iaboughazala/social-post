"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  FileText,
  BarChart3,
  Link2,
  Users,
  CheckSquare,
  Settings,
  CreditCard,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "compose", href: "/compose", icon: PenSquare },
  { key: "calendar", href: "/calendar", icon: CalendarDays },
  { key: "posts", href: "/posts", icon: FileText },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
  { key: "accounts", href: "/accounts", icon: Link2 },
  { key: "team", href: "/team", icon: Users },
  { key: "approvals", href: "/approvals", icon: CheckSquare },
] as const;

const bottomNavItems = [
  { key: "settings", href: "/settings", icon: Settings },
  { key: "billing", href: "/billing", icon: CreditCard },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={`/${locale}/dashboard`} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PenSquare className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">SocialPost</span>
                <span className="truncate text-xs text-muted-foreground">
                  Social Media Manager
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    render={<Link href={`/${locale}${item.href}`} />}
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                  >
                    <item.icon />
                    <span>{t(item.key)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    render={<Link href={`/${locale}${item.href}`} />}
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                  >
                    <item.icon />
                    <span>{t(item.key)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
                <ChevronsUpDown className="ms-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => window.location.href = `/${locale}/settings`}>
                  <Settings className="me-2 h-4 w-4" />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = `/${locale}/billing`}>
                  <CreditCard className="me-2 h-4 w-4" />
                  {t("billing")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="me-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
