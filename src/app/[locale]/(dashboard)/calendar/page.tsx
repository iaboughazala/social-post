"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
  Trash2,
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

type Platform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "bluesky"
  | "wasla";
type PostStatus = "scheduled" | "publishing" | "published" | "failed";

interface CalendarPost {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  platforms: Platform[];
  isAI: boolean;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: "bg-blue-500",
  instagram: "bg-pink-500",
  twitter: "bg-neutral-900 dark:bg-neutral-100",
  linkedin: "bg-blue-700",
  bluesky: "bg-sky-500",
  wasla: "bg-emerald-600",
};

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
  bluesky: BlueskyIcon,
  wasla: WaslaIcon,
};

const PLATFORM_TEXT: Record<Platform, string> = {
  facebook: "text-blue-600",
  instagram: "text-pink-600",
  twitter: "text-neutral-900 dark:text-neutral-100",
  linkedin: "text-blue-700",
  bluesky: "text-sky-500",
  wasla: "",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  publishing:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  published:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function effectiveDate(p: CalendarPost): Date {
  return new Date(p.publishedAt || p.scheduledAt || 0);
}

export default function CalendarPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  useEffect(() => {
    const from = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const to = addDays(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }), 1);
    setLoading(true);
    fetch(
      `/api/calendar?from=${from.toISOString()}&to=${to.toISOString()}`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const getPostsForDate = useCallback(
    (date: Date) => posts.filter((p) => isSameDay(effectiveDate(p), date)),
    [posts]
  );

  const selectedDatePosts = useMemo(() => {
    if (!selectedDate) return [];
    return getPostsForDate(selectedDate).sort(
      (a, b) => effectiveDate(a).getTime() - effectiveDate(b).getTime()
    );
  }, [selectedDate, getPostsForDate]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSheetOpen(true);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("calendar.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage your scheduled content
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentMonth((p) => subMonths(p, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[180px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentMonth((p) => addMonths(p, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
              {loading && (
                <Loader2 className="size-4 animate-spin text-muted-foreground ms-2" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              {t("calendar.today")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {calendarDays.map((day, index) => {
              const postsOnDay = getPostsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "relative min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 text-start bg-card transition-colors hover:bg-muted/50",
                    !isCurrentMonth && "opacity-40",
                    isSelected && "ring-2 ring-primary ring-inset"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                      isTodayDate && "bg-primary text-primary-foreground",
                      !isTodayDate && "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {postsOnDay.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {postsOnDay.slice(0, 3).map((post) => (
                        <div key={post.id} className="flex items-center gap-1">
                          <div className="flex gap-0.5">
                            {post.platforms.slice(0, 2).map((platform) => (
                              <div
                                key={platform}
                                className={cn(
                                  "size-2 rounded-full shrink-0",
                                  PLATFORM_COLORS[platform]
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] leading-tight text-muted-foreground truncate hidden sm:block">
                            {post.content.slice(0, 20)}
                          </span>
                        </div>
                      ))}
                      {postsOnDay.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{postsOnDay.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
            {(
              [
                { platform: "facebook" as Platform, label: "Facebook" },
                { platform: "instagram" as Platform, label: "Instagram" },
                { platform: "twitter" as Platform, label: "X (Twitter)" },
                { platform: "linkedin" as Platform, label: "LinkedIn" },
              ] as const
            ).map(({ platform, label }) => (
              <div key={platform} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "size-3 rounded-full",
                    PLATFORM_COLORS[platform]
                  )}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
            </SheetTitle>
            <SheetDescription>
              {selectedDatePosts.length === 0
                ? "No posts scheduled for this date"
                : `${selectedDatePosts.length} post${selectedDatePosts.length > 1 ? "s" : ""} on this day`}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-4 mt-4 overflow-y-auto flex-1">
            {selectedDatePosts.map((post) => (
              <Card key={post.id} size="sm">
                <CardContent className="pt-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {post.platforms.map((platform) => {
                        const Icon = PLATFORM_ICONS[platform];
                        if (!Icon) return null;
                        return (
                          <Icon
                            key={platform}
                            className={cn("size-4", PLATFORM_TEXT[platform])}
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
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        STATUS_COLORS[post.status] ?? STATUS_COLORS.scheduled
                      )}
                    >
                      {post.status}
                    </span>
                  </div>

                  <p className="text-sm line-clamp-4 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{format(effectiveDate(post), "HH:mm")}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                    >
                      {deletingId === post.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Trash2 className="size-3" />
                      )}
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {selectedDatePosts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="size-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts for this date</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  render={<Link href={`/${locale}/compose`} />}
                >
                  Create a post
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
