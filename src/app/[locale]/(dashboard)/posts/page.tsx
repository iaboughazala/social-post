"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Edit3,
  Trash2,
  Copy,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
} from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin";
type PostStatus = "all" | "draft" | "scheduled" | "published" | "failed";

interface Post {
  id: string;
  content: string;
  platforms: Platform[];
  status: Exclude<PostStatus, "all">;
  date: Date;
  engagement?: { likes: number; comments: number; shares: number };
}

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
};

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: "text-blue-600",
  instagram: "text-pink-600",
  twitter: "text-neutral-900 dark:text-neutral-100",
  linkedin: "text-blue-700",
};

const STATUS_STYLES: Record<
  Exclude<PostStatus, "all">,
  { color: string; label: string }
> = {
  draft: {
    color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    label: "Draft",
  },
  scheduled: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Scheduled",
  },
  published: {
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    label: "Published",
  },
  failed: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "Failed",
  },
};

const now = new Date();

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    content: "Exciting product launch coming this week! Stay tuned for something amazing that will change the way you work.",
    platforms: ["facebook", "instagram"],
    status: "published",
    date: new Date(now.getFullYear(), now.getMonth(), 3, 9, 0),
    engagement: { likes: 234, comments: 18, shares: 42 },
  },
  {
    id: "2",
    content: "5 tips to boost your social media engagement this quarter. Thread incoming!",
    platforms: ["twitter", "linkedin"],
    status: "published",
    date: new Date(now.getFullYear(), now.getMonth(), 5, 14, 0),
    engagement: { likes: 89, comments: 12, shares: 31 },
  },
  {
    id: "3",
    content: "Behind the scenes look at our team working on the new feature. We can't wait to show you what we've been building.",
    platforms: ["instagram"],
    status: "scheduled",
    date: new Date(now.getFullYear(), now.getMonth(), 12, 11, 0),
  },
  {
    id: "4",
    content: "Join us for a live webinar on social media strategy for 2026. Register now at the link in bio!",
    platforms: ["facebook", "linkedin"],
    status: "draft",
    date: new Date(now.getFullYear(), now.getMonth(), 15, 16, 0),
  },
  {
    id: "5",
    content: "Customer spotlight: How businesses are growing 300% using our platform for their social media management.",
    platforms: ["twitter", "facebook", "linkedin"],
    status: "scheduled",
    date: new Date(now.getFullYear(), now.getMonth(), 15, 10, 0),
  },
  {
    id: "6",
    content: "Weekend vibes! What are your plans? Share with us below and let us know how you spend your free time.",
    platforms: ["instagram", "facebook"],
    status: "failed",
    date: new Date(now.getFullYear(), now.getMonth(), 7, 18, 0),
  },
  {
    id: "7",
    content: "New blog post: The complete guide to content scheduling in 2026. Link in comments!",
    platforms: ["linkedin", "twitter"],
    status: "scheduled",
    date: new Date(now.getFullYear(), now.getMonth(), 22, 8, 0),
  },
  {
    id: "8",
    content: "Flash sale! 50% off all plans for the next 48 hours. Don't miss out on this incredible deal.",
    platforms: ["facebook", "instagram", "twitter"],
    status: "draft",
    date: new Date(now.getFullYear(), now.getMonth(), 25, 12, 0),
  },
  {
    id: "9",
    content: "Introducing our new team member! Welcome aboard and looking forward to amazing things.",
    platforms: ["linkedin"],
    status: "published",
    date: new Date(now.getFullYear(), now.getMonth(), 1, 10, 0),
    engagement: { likes: 156, comments: 23, shares: 8 },
  },
  {
    id: "10",
    content: "Monthly recap: Here are our top performing posts and key insights from this month.",
    platforms: ["facebook", "linkedin"],
    status: "draft",
    date: new Date(now.getFullYear(), now.getMonth(), 28, 9, 0),
  },
];

const ITEMS_PER_PAGE = 5;

export default function PostsPage() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<PostStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPosts = useMemo(() => {
    let posts = MOCK_POSTS;

    if (activeTab !== "all") {
      posts = posts.filter((post) => post.status === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter((post) =>
        post.content.toLowerCase().includes(query)
      );
    }

    return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / ITEMS_PER_PAGE));
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = useCallback((value: string | number | null) => {
    setActiveTab((value as PostStatus) || "all");
    setCurrentPage(1);
  }, []);

  const statusCounts = useMemo(() => {
    return {
      all: MOCK_POSTS.length,
      draft: MOCK_POSTS.filter((p) => p.status === "draft").length,
      scheduled: MOCK_POSTS.filter((p) => p.status === "scheduled").length,
      published: MOCK_POSTS.filter((p) => p.status === "published").length,
      failed: MOCK_POSTS.filter((p) => p.status === "failed").length,
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("posts.title")}</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your social media posts
          </p>
        </div>
        <Button>
          <FileText className="size-4" />
          New Post
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">
              {t("posts.all")} ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="draft">
              {t("posts.draft")} ({statusCounts.draft})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              {t("posts.scheduled")} ({statusCounts.scheduled})
            </TabsTrigger>
            <TabsTrigger value="published">
              {t("posts.published")} ({statusCounts.published})
            </TabsTrigger>
            <TabsTrigger value="failed">
              {t("posts.failed")} ({statusCounts.failed})
            </TabsTrigger>
          </TabsList>

          <div className="relative sm:ms-auto">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search") + "..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 w-full sm:w-[250px]"
            />
          </div>
        </div>

        {/* Post list for each tab - we render the same list for all since filtering is done in useMemo */}
        {(["all", "draft", "scheduled", "published", "failed"] as PostStatus[]).map(
          (tab) => (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardContent className="p-0">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-[1fr_120px_100px_140px_100px] gap-4 items-center px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Content</span>
                    <span>Platforms</span>
                    <span>Status</span>
                    <span>Date</span>
                    <span className="text-end">Actions</span>
                  </div>

                  {paginatedPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="size-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No posts found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {paginatedPosts.map((post) => (
                        <div
                          key={post.id}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_140px_100px] gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors"
                        >
                          {/* Content */}
                          <div className="min-w-0">
                            <p className="text-sm truncate">{post.content}</p>
                            {post.engagement && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {post.engagement.likes} likes -{" "}
                                {post.engagement.comments} comments -{" "}
                                {post.engagement.shares} shares
                              </p>
                            )}
                          </div>

                          {/* Platforms */}
                          <div className="flex items-center gap-1.5">
                            {post.platforms.map((platform) => {
                              const Icon = PLATFORM_ICONS[platform];
                              return (
                                <Icon
                                  key={platform}
                                  className={cn(
                                    "size-4",
                                    PLATFORM_COLORS[platform]
                                  )}
                                />
                              );
                            })}
                          </div>

                          {/* Status */}
                          <div>
                            <span
                              className={cn(
                                "inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium",
                                STATUS_STYLES[post.status].color
                              )}
                            >
                              {STATUS_STYLES[post.status].label}
                            </span>
                          </div>

                          {/* Date */}
                          <div className="text-xs text-muted-foreground">
                            {format(post.date, "MMM d, yyyy")}
                            <br />
                            {format(post.date, "h:mm a")}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-xs" title={t("common.edit")}>
                              <Edit3 className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" title="Duplicate">
                              <Copy className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title={t("common.delete")}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        )}
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredPosts.length)} of{" "}
            {filteredPosts.length} posts
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
