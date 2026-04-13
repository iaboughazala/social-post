"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Eye,
  TrendingUp,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
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
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// Mock data for engagement over time
const ENGAGEMENT_DATA = [
  { name: "Jan", likes: 1200, comments: 340, shares: 180 },
  { name: "Feb", likes: 1400, comments: 420, shares: 220 },
  { name: "Mar", likes: 1100, comments: 380, shares: 190 },
  { name: "Apr", likes: 1800, comments: 520, shares: 310 },
  { name: "May", likes: 2100, comments: 610, shares: 380 },
  { name: "Jun", likes: 1900, comments: 580, shares: 350 },
  { name: "Jul", likes: 2400, comments: 720, shares: 420 },
  { name: "Aug", likes: 2200, comments: 680, shares: 400 },
  { name: "Sep", likes: 2600, comments: 780, shares: 460 },
  { name: "Oct", likes: 2800, comments: 840, shares: 510 },
  { name: "Nov", likes: 3100, comments: 920, shares: 580 },
  { name: "Dec", likes: 3400, comments: 1020, shares: 640 },
];

// Mock data for posts per platform
const PLATFORM_DATA = [
  { name: "Facebook", posts: 42, color: "#1877F2" },
  { name: "Instagram", posts: 38, color: "#E4405F" },
  { name: "X (Twitter)", posts: 56, color: "#1DA1F2" },
  { name: "LinkedIn", posts: 28, color: "#0A66C2" },
];

// Stats cards data
const STATS = [
  {
    title: "followers",
    value: "24,563",
    change: "+12.5%",
    trend: "up" as const,
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "reach",
    value: "482,193",
    change: "+8.2%",
    trend: "up" as const,
    icon: Eye,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    title: "engagement",
    value: "5.4%",
    change: "-0.3%",
    trend: "down" as const,
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    title: "impressions",
    value: "164",
    change: "+23",
    trend: "up" as const,
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
];

// Best performing posts
const TOP_POSTS = [
  {
    id: "1",
    content: "Exciting product launch coming this week! Stay tuned for something amazing.",
    platform: "facebook" as const,
    likes: 1243,
    comments: 89,
    shares: 342,
    date: "Mar 15, 2026",
  },
  {
    id: "2",
    content: "5 tips to boost your social media engagement this quarter.",
    platform: "linkedin" as const,
    likes: 892,
    comments: 67,
    shares: 215,
    date: "Mar 12, 2026",
  },
  {
    id: "3",
    content: "Behind the scenes look at our team working on the new feature.",
    platform: "instagram" as const,
    likes: 756,
    comments: 134,
    shares: 98,
    date: "Mar 10, 2026",
  },
  {
    id: "4",
    content: "Customer spotlight: How businesses grew 300% using our platform.",
    platform: "twitter" as const,
    likes: 623,
    comments: 45,
    shares: 189,
    date: "Mar 8, 2026",
  },
];

const PLATFORM_ICON_MAP: Record<string, React.ElementType> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
};

const PLATFORM_COLOR_MAP: Record<string, string> = {
  facebook: "text-blue-600",
  instagram: "text-pink-600",
  twitter: "text-neutral-900 dark:text-neutral-100",
  linkedin: "text-blue-700",
};

export default function AnalyticsPage() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("analytics.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your social media performance
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex items-center justify-center size-10 rounded-lg",
                      stat.bgColor
                    )}
                  >
                    <Icon className={cn("size-5", stat.color)} />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      stat.trend === "up"
                        ? "text-green-600"
                        : "text-red-500"
                    )}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(`analytics.${stat.title}`)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement line chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
            <CardDescription>
              Likes, comments, and shares across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ENGAGEMENT_DATA}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="Likes"
                  />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Comments"
                  />
                  <Line
                    type="monotone"
                    dataKey="shares"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Shares"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Posts per platform bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Posts by Platform</CardTitle>
            <CardDescription>Distribution this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PLATFORM_DATA} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    horizontal={false}
                  />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="posts"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                    name="Posts"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best performing posts */}
      <Card>
        <CardHeader>
          <CardTitle>Best Performing Posts</CardTitle>
          <CardDescription>
            Your top posts ranked by total engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TOP_POSTS.map((post, index) => {
              const PlatformIcon = PLATFORM_ICON_MAP[post.platform];
              return (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center size-8 rounded-full bg-muted text-sm font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{post.content}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex items-center gap-1">
                        {PlatformIcon && (
                          <PlatformIcon
                            className={cn(
                              "size-3.5",
                              PLATFORM_COLOR_MAP[post.platform]
                            )}
                          />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {post.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="size-3" />
                          {post.likes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="size-3" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="size-3" />
                          {post.shares}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
