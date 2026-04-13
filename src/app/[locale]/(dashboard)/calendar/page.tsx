"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Edit3,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
} from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin";
type PostStatus = "scheduled" | "published" | "draft" | "failed";

interface ScheduledPost {
  id: string;
  content: string;
  platforms: Platform[];
  date: Date;
  time: string;
  status: PostStatus;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: "bg-blue-500",
  instagram: "bg-pink-500",
  twitter: "bg-neutral-900 dark:bg-neutral-100",
  linkedin: "bg-blue-700",
};

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
};

const STATUS_COLORS: Record<PostStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  published: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  draft: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Mock data
const now = new Date();
const MOCK_POSTS: ScheduledPost[] = [
  {
    id: "1",
    content: "Exciting product launch coming this week! Stay tuned for something amazing.",
    platforms: ["facebook", "instagram"],
    date: new Date(now.getFullYear(), now.getMonth(), 5),
    time: "09:00",
    status: "published",
  },
  {
    id: "2",
    content: "5 tips to boost your social media engagement this quarter.",
    platforms: ["twitter", "linkedin"],
    date: new Date(now.getFullYear(), now.getMonth(), 8),
    time: "14:00",
    status: "scheduled",
  },
  {
    id: "3",
    content: "Behind the scenes look at our team working on the new feature.",
    platforms: ["instagram"],
    date: new Date(now.getFullYear(), now.getMonth(), 12),
    time: "11:00",
    status: "scheduled",
  },
  {
    id: "4",
    content: "Join us for a live webinar on social media strategy for 2026.",
    platforms: ["facebook", "linkedin"],
    date: new Date(now.getFullYear(), now.getMonth(), 15),
    time: "16:00",
    status: "draft",
  },
  {
    id: "5",
    content: "Customer spotlight: How @acmecorp grew 300% using our platform.",
    platforms: ["twitter", "facebook", "linkedin"],
    date: new Date(now.getFullYear(), now.getMonth(), 15),
    time: "10:00",
    status: "scheduled",
  },
  {
    id: "6",
    content: "Weekend vibes! What are your plans? Share with us below.",
    platforms: ["instagram", "facebook"],
    date: new Date(now.getFullYear(), now.getMonth(), 20),
    time: "18:00",
    status: "scheduled",
  },
  {
    id: "7",
    content: "New blog post: The complete guide to content scheduling in 2026.",
    platforms: ["linkedin", "twitter"],
    date: new Date(now.getFullYear(), now.getMonth(), 22),
    time: "08:00",
    status: "scheduled",
  },
  {
    id: "8",
    content: "Flash sale! 50% off all plans for the next 48 hours.",
    platforms: ["facebook", "instagram", "twitter"],
    date: new Date(now.getFullYear(), now.getMonth(), 25),
    time: "12:00",
    status: "draft",
  },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const t = useTranslations();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const getPostsForDate = useCallback((date: Date) => {
    return MOCK_POSTS.filter((post) => isSameDay(post.date, date));
  }, []);

  const selectedDatePosts = useMemo(() => {
    if (!selectedDate) return [];
    return getPostsForDate(selectedDate);
  }, [selectedDate, getPostsForDate]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSheetOpen(true);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("calendar.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your scheduled content
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[180px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleNextMonth}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleToday}>
              {t("calendar.today")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
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

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {calendarDays.map((day, index) => {
              const postsOnDay = getPostsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const isSelected =
                selectedDate && isSameDay(day, selectedDate);

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
                      isTodayDate &&
                        "bg-primary text-primary-foreground",
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

          {/* Legend */}
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

      {/* Side panel for selected date */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
            </SheetTitle>
            <SheetDescription>
              {selectedDatePosts.length === 0
                ? "No posts scheduled for this date"
                : `${selectedDatePosts.length} post${selectedDatePosts.length > 1 ? "s" : ""} scheduled`}
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
                        return (
                          <Icon
                            key={platform}
                            className={cn("size-4")}
                          />
                        );
                      })}
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        STATUS_COLORS[post.status]
                      )}
                    >
                      {post.status}
                    </span>
                  </div>

                  <p className="text-sm line-clamp-3">{post.content}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{post.time}</span>
                    </div>
                    <Button variant="ghost" size="xs">
                      <Edit3 className="size-3" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {selectedDatePosts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="size-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts for this date</p>
                <Button variant="outline" size="sm" className="mt-3">
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
