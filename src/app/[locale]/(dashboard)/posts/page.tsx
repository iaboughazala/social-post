"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
} from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin";
type PostStatus = "all" | "draft" | "scheduled" | "publishing" | "published" | "failed";

interface ApiPost {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  errorMsg: string | null;
  createdAt: string;
  postAccounts: {
    socialAccount: { platform: string; name: string };
  }[];
  sourceVariant: { id: string } | null;
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
  string,
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
  publishing: {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    label: "Publishing",
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

const ITEMS_PER_PAGE = 10;

export default function PostsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<PostStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load(status: PostStatus, page: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (status !== "all") params.set("status", status);
      const r = await fetch(`/api/posts?${params.toString()}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("Failed to load posts");
      const d = await r.json();
      setPosts(d.posts || []);
      setTotal(d.pagination?.total || 0);
      setTotalPages(d.pagination?.totalPages || 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadCounts() {
    const statuses: Exclude<PostStatus, "all">[] = [
      "draft",
      "scheduled",
      "publishing",
      "published",
      "failed",
    ];
    const results = await Promise.all(
      statuses.map(async (s) => {
        try {
          const r = await fetch(`/api/posts?status=${s}&limit=1&page=1`, {
            cache: "no-store",
          });
          const d = await r.json();
          return [s, d.pagination?.total ?? 0] as const;
        } catch {
          return [s, 0] as const;
        }
      })
    );
    const totalAll = results.reduce((sum, [, n]) => sum + n, 0);
    const counts: Record<string, number> = { all: totalAll };
    for (const [s, n] of results) counts[s] = n;
    setCounts(counts);
  }

  useEffect(() => {
    load(activeTab, currentPage);
  }, [activeTab, currentPage]);

  useEffect(() => {
    loadCounts();
  }, []);

  const handleTabChange = useCallback((value: string | number | null) => {
    setActiveTab((value as PostStatus) || "all");
    setCurrentPage(1);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
      loadCounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPosts = searchQuery.trim()
    ? posts.filter((p) =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("posts.title")}</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your social media posts
          </p>
        </div>
        <Button render={<Link href={`/${locale}/compose`} />}>
          <FileText className="size-4" />
          New Post
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">
              {t("posts.all")} ({counts.all ?? 0})
            </TabsTrigger>
            <TabsTrigger value="draft">
              {t("posts.draft")} ({counts.draft ?? 0})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              {t("posts.scheduled")} ({counts.scheduled ?? 0})
            </TabsTrigger>
            <TabsTrigger value="published">
              {t("posts.published")} ({counts.published ?? 0})
            </TabsTrigger>
            <TabsTrigger value="failed">
              {t("posts.failed")} ({counts.failed ?? 0})
            </TabsTrigger>
          </TabsList>

          <div className="relative sm:ms-auto">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search") + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-8 w-full sm:w-[250px]"
            />
          </div>
        </div>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <div className="hidden sm:grid grid-cols-[1fr_100px_130px_100px_140px_80px] gap-4 items-center px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Content</span>
            <span>Source</span>
            <span>Platforms</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-end">Actions</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No posts found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPosts.map((post) => {
                const platforms = Array.from(
                  new Set(
                    post.postAccounts.map((pa) => pa.socialAccount.platform)
                  )
                ) as Platform[];
                const status = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
                const displayDate =
                  post.publishedAt ||
                  post.scheduledAt ||
                  post.createdAt;
                const isAI = !!post.sourceVariant;
                return (
                  <div
                    key={post.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_100px_130px_100px_140px_80px] gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      {post.errorMsg && (
                        <p className="text-xs text-destructive mt-0.5 truncate">
                          {post.errorMsg}
                        </p>
                      )}
                    </div>

                    <div>
                      {isAI ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          <Sparkles className="size-3" />
                          AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                          Manual
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {platforms.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        platforms.map((platform) => {
                          const Icon = PLATFORM_ICONS[platform];
                          if (!Icon) return null;
                          return (
                            <Icon
                              key={platform}
                              className={cn(
                                "size-4",
                                PLATFORM_COLORS[platform]
                              )}
                            />
                          );
                        })
                      )}
                    </div>

                    <div>
                      <span
                        className={cn(
                          "inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium",
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {format(new Date(displayDate), "MMM d, yyyy")}
                      <br />
                      {format(new Date(displayDate), "HH:mm")}
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      {post.status === "draft" && isAI && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="Open in queue"
                          render={<Link href={`/${locale}/voice/queue`} />}
                        >
                          <ExternalLink className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title={t("common.delete")}
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                      >
                        {deletingId === post.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} posts
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
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
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
