"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
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
  Sparkles,
  AlertTriangle,
  Loader2,
  Clock,
  Inbox,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
  BlueskyIcon,
  WaslaIcon,
} from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";
import { ViewPostDialog } from "@/components/posts/view-post-dialog";
import { PostActions } from "@/components/posts/post-actions";
import { PostThumbnail, parseMediaUrls } from "@/components/posts/post-thumbnail";
import { ExpandableText } from "@/components/posts/expandable-text";

type Platform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "bluesky"
  | "wasla";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
  bluesky: BlueskyIcon,
  wasla: WaslaIcon,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "text-blue-600",
  instagram: "text-pink-600",
  twitter: "text-neutral-900 dark:text-neutral-100",
  linkedin: "text-blue-700",
  bluesky: "text-sky-500",
  wasla: "",
};

interface DashboardPost {
  id: string;
  content: string;
  mediaUrls: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  platforms: Platform[];
  isAI: boolean;
}

interface DashboardData {
  stats: {
    totalPosts: number;
    scheduled: number;
    published: number;
    drafts: number;
    failed: number;
    connectedAccounts: number;
    voiceQueue: number;
  };
  upcoming: DashboardPost[];
  recentlyPublished: DashboardPost[];
}

export default function DashboardPage() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState<DashboardPost | null>(null);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const userName = session?.user?.name ?? "User";

  const statsCards = data
    ? [
        {
          label: "Total posts",
          value: data.stats.totalPosts,
          icon: FileText,
          tone: "text-foreground",
        },
        {
          label: "Scheduled",
          value: data.stats.scheduled,
          icon: CalendarClock,
          tone: "text-blue-600 dark:text-blue-400",
        },
        {
          label: "Published",
          value: data.stats.published,
          icon: CheckCircle2,
          tone: "text-green-600 dark:text-green-400",
        },
        {
          label: "Connected accounts",
          value: data.stats.connectedAccounts,
          icon: Link2,
          tone: "text-foreground",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
        <p className="text-muted-foreground">Welcome back, {userName}</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Failed to load dashboard.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", stat.tone)}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(data.stats.voiceQueue > 0 ||
            data.stats.drafts > 0 ||
            data.stats.failed > 0) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {data.stats.voiceQueue > 0 && (
                <Link
                  href={`/${locale}/voice/queue`}
                  className="rounded-lg border p-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                >
                  <Sparkles className="size-5 text-purple-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {data.stats.voiceQueue} AI drafts to review
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Open the voice queue
                    </div>
                  </div>
                </Link>
              )}
              {data.stats.drafts > 0 && (
                <Link
                  href={`/${locale}/posts?tab=draft`}
                  className="rounded-lg border p-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                >
                  <Inbox className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {data.stats.drafts} drafts total
                    </div>
                    <div className="text-xs text-muted-foreground">Open posts</div>
                  </div>
                </Link>
              )}
              {data.stats.failed > 0 && (
                <Link
                  href={`/${locale}/posts?tab=failed`}
                  className="rounded-lg border border-destructive/30 p-3 flex items-center gap-3 hover:bg-destructive/5 transition-colors"
                >
                  <AlertTriangle className="size-5 text-destructive" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-destructive">
                      {data.stats.failed} failed post(s)
                    </div>
                    <div className="text-xs text-muted-foreground">Review</div>
                  </div>
                </Link>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button render={<Link href={`/${locale}/compose`} />}>
              <PenSquare className="size-4" />
              New Post
            </Button>
            <Button variant="outline" render={<Link href={`/${locale}/voice/batch`} />}>
              <Sparkles className="size-4" />
              Generate batch
            </Button>
            <Button variant="outline" render={<Link href={`/${locale}/calendar`} />}>
              <CalendarDays className="size-4" />
              Calendar
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-4" />
                  Upcoming scheduled
                </CardTitle>
                <CardDescription>
                  Next {data.upcoming.length} posts to publish
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nothing scheduled. Approve drafts in the Voice queue.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.upcoming.map((p) => (
                      <PostRow
                        key={p.id}
                        post={p}
                        dateLabel={
                          p.scheduledAt
                            ? format(new Date(p.scheduledAt), "MMM d · HH:mm")
                            : "—"
                        }
                        onView={() => setViewingPost(p)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                  Recently published
                </CardTitle>
                <CardDescription>Latest posts that went live</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentlyPublished.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No published posts yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.recentlyPublished.map((p) => (
                      <PostRow
                        key={p.id}
                        post={p}
                        dateLabel={
                          p.publishedAt
                            ? format(new Date(p.publishedAt), "MMM d · HH:mm")
                            : "—"
                        }
                        onView={() => setViewingPost(p)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <ViewPostDialog
        open={viewingPost !== null}
        onOpenChange={(open) => !open && setViewingPost(null)}
        content={viewingPost?.content ?? ""}
        mediaUrls={parseMediaUrls(viewingPost?.mediaUrls)}
      />
    </div>
  );
}

function PostRow({
  post,
  dateLabel,
  onView,
}: {
  post: DashboardPost;
  dateLabel: string;
  onView: () => void;
}) {
  const media = parseMediaUrls(post.mediaUrls);
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-[80px] shrink-0 text-xs text-muted-foreground pt-0.5">
        {dateLabel}
      </div>
      <PostThumbnail url={media[0]} />
      <div className="flex-1 min-w-0">
        <ExpandableText text={post.content} clampLines={2} />
        <div className="flex items-center gap-1.5 mt-1">
          {post.platforms.map((p) => {
            const Icon = PLATFORM_ICONS[p];
            if (!Icon) return null;
            return (
              <Icon key={p} className={cn("size-3.5", PLATFORM_COLORS[p])} />
            );
          })}
          {post.isAI && (
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] px-1.5 py-0">
              <Sparkles className="size-2.5 me-0.5" />
              AI
            </Badge>
          )}
        </div>
      </div>
      <PostActions
        content={post.content}
        onView={onView}
        size="icon-xs"
        className="shrink-0"
      />
    </div>
  );
}
