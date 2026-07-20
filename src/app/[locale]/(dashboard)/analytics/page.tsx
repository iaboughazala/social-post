"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Info,
  CalendarClock,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
  BlueskyIcon,
  WaslaIcon,
} from "@/components/icons/social-icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface AnalyticsPost {
  id: string;
  content: string;
  publishedAt: string | null;
  platforms: string[];
  isAI: boolean;
}

interface AnalyticsData {
  stats: {
    totalPublished: number;
    publishedThisMonth: number;
    publishedThisWeek: number;
    failed: number;
    successRate: number;
    ai: number;
    manual: number;
  };
  activity: { label: string; count: number }[];
  platformBreakdown: { platform: string; count: number }[];
  weekdayBreakdown: { weekday: string; count: number }[];
  recentPublished: AnalyticsPost[];
}

const PLATFORM_ICON_MAP: Record<string, React.ElementType> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
  bluesky: BlueskyIcon,
  wasla: WaslaIcon,
};

const PLATFORM_COLOR_MAP: Record<string, string> = {
  facebook: "text-blue-600",
  instagram: "text-pink-600",
  twitter: "text-neutral-900 dark:text-neutral-100",
  linkedin: "text-blue-700",
  bluesky: "text-sky-500",
  wasla: "",
};

const PLATFORM_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X",
  linkedin: "LinkedIn",
  bluesky: "Bluesky",
  wasla: "Wasla",
};

const WEEKDAY_LABEL: Record<string, string> = {
  sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed",
  thu: "Thu", fri: "Fri", sat: "Sat",
};

export default function AnalyticsPage() {
  const t = useTranslations();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Failed to load analytics.
        </CardContent>
      </Card>
    );
  }

  const stats = data.stats;
  const aiPct =
    stats.totalPublished === 0
      ? 0
      : Math.round((stats.ai / stats.totalPublished) * 100);
  const successPct = Math.round(stats.successRate * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("analytics.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Publishing activity and delivery health
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Published"
          value={stats.totalPublished}
          hint={`${stats.publishedThisMonth} this month`}
          icon={Send}
          tone="text-foreground"
        />
        <StatCard
          label="Success rate"
          value={`${successPct}%`}
          hint={`${stats.failed} failed`}
          icon={CheckCircle2}
          tone={successPct >= 90 ? "text-green-600 dark:text-green-400" : "text-amber-600"}
        />
        <StatCard
          label="This week"
          value={stats.publishedThisWeek}
          hint="published"
          icon={CalendarClock}
          tone="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="AI-generated"
          value={`${aiPct}%`}
          hint={`${stats.ai} AI / ${stats.manual} manual`}
          icon={Sparkles}
          tone="text-purple-600 dark:text-purple-400"
        />
      </div>

      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900">
        <CardContent className="pt-4 flex items-start gap-3">
          <Info className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Engagement metrics coming soon</p>
            <p className="text-muted-foreground">
              Likes, comments, reach, and impressions require additional LinkedIn
              app review and the r_organization_social scope. For now, this page
              tracks publishing activity from your own database.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Publishing activity</CardTitle>
            <CardDescription>Posts published per week, last 12 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.activity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Published"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By platform</CardTitle>
            <CardDescription>All-time published counts</CardDescription>
          </CardHeader>
          <CardContent>
            {data.platformBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No published posts yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.platformBreakdown
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((row) => {
                    const Icon = PLATFORM_ICON_MAP[row.platform];
                    const max = Math.max(
                      ...data.platformBreakdown.map((r) => r.count)
                    );
                    const pct = max === 0 ? 0 : (row.count / max) * 100;
                    return (
                      <div key={row.platform} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon
                                className={cn(
                                  "size-4",
                                  PLATFORM_COLOR_MAP[row.platform]
                                )}
                              />
                            )}
                            <span>{PLATFORM_LABEL[row.platform] ?? row.platform}</span>
                          </div>
                          <span className="font-medium">{row.count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By weekday</CardTitle>
          <CardDescription>
            Which days you publish most, last 12 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.weekdayBreakdown.map((r) => ({
                  ...r,
                  label: WEEKDAY_LABEL[r.weekday] ?? r.weekday,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently published</CardTitle>
          <CardDescription>
            Your most recent live posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentPublished.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="size-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No posts published yet. Once your schedule fires you'll see them here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {data.recentPublished.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-[110px] shrink-0 text-xs text-muted-foreground pt-0.5">
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "MMM d · HH:mm")
                      : "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {post.platforms.map((p) => {
                        const Icon = PLATFORM_ICON_MAP[p];
                        if (!Icon) return null;
                        return (
                          <Icon
                            key={p}
                            className={cn(
                              "size-3.5",
                              PLATFORM_COLOR_MAP[p]
                            )}
                          />
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          <Icon className={cn("size-4", tone)} />
        </div>
        <div className={cn("text-2xl font-bold mt-2", tone)}>{value}</div>
        {hint && (
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}
