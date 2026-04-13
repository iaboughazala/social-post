"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CalendarClock,
  CheckCircle2,
  Link2,
  PenSquare,
  CalendarDays,
} from "lucide-react";

const placeholderPosts = [
  {
    id: "1",
    content: "Excited to announce our new product launch!",
    platform: "Twitter",
    status: "scheduled" as const,
    scheduledAt: "2026-04-14T10:00:00Z",
  },
  {
    id: "2",
    content: "Check out our latest blog post about social media trends.",
    platform: "LinkedIn",
    status: "published" as const,
    scheduledAt: "2026-04-12T14:00:00Z",
  },
  {
    id: "3",
    content: "Behind the scenes of our team building event.",
    platform: "Instagram",
    status: "scheduled" as const,
    scheduledAt: "2026-04-15T09:00:00Z",
  },
];

const statsData = [
  { key: "totalPosts", value: "128", icon: FileText },
  { key: "scheduled", value: "12", icon: CalendarClock },
  { key: "published", value: "98", icon: CheckCircle2 },
  { key: "connectedAccounts", value: "5", icon: Link2 },
];

const statsLabels: Record<string, string> = {
  totalPosts: "Total Posts",
  scheduled: "Scheduled",
  published: "Published",
  connectedAccounts: "Connected Accounts",
};

export default function DashboardPage() {
  const t = useTranslations("nav");
  const postT = useTranslations("posts");
  const locale = useLocale();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "User";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard")}
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {userName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {statsLabels[stat.key]}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href={`/${locale}/compose`}>
          <Button>
            <PenSquare className="me-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
        <Link href={`/${locale}/calendar`}>
          <Button variant="outline">
            <CalendarDays className="me-2 h-4 w-4" />
            View Calendar
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Your latest scheduled and published posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {placeholderPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {post.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {post.platform} &middot;{" "}
                    {new Date(post.scheduledAt).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge
                  variant={
                    post.status === "published" ? "default" : "secondary"
                  }
                >
                  {postT(post.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
