"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Loader2, Plus, Save, X } from "lucide-react";
import { EditPostDialog } from "@/components/posts/edit-post-dialog";
import { ViewPostDialog } from "@/components/posts/view-post-dialog";
import { PostActions } from "@/components/posts/post-actions";
import { PostThumbnail, parseMediaUrls } from "@/components/posts/post-thumbnail";
import { ExpandableText } from "@/components/posts/expandable-text";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const PLATFORMS = ["linkedin", "twitter", "facebook", "instagram", "bluesky", "wasla"] as const;
const TIMEZONES = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Africa/Cairo",
  "UTC",
  "Europe/London",
  "America/New_York",
];

interface Schedule {
  id: string;
  days: string;
  times: string;
  platforms: string;
  timezone: string;
  isActive: boolean;
}

interface UpcomingPost {
  id: string;
  content: string;
  mediaUrls: string | null;
  scheduledAt: string;
  platforms: string[];
  topic: string | null;
}

function parseArr(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

export default function SchedulePage() {
  const t = useTranslations("voice.schedule");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<Set<string>>(new Set());
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("10:00");
  const [platforms, setPlatforms] = useState<Set<string>>(new Set());
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [isActive, setIsActive] = useState(true);
  const [upcoming, setUpcoming] = useState<UpcomingPost[]>([]);
  const [editingPost, setEditingPost] = useState<UpcomingPost | null>(null);
  const [viewingPost, setViewingPost] = useState<UpcomingPost | null>(null);

  async function loadUpcoming() {
    try {
      const r = await fetch("/api/voice/upcoming", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setUpcoming(d.posts || []);
    } catch {}
  }

  useEffect(() => {
    fetch("/api/voice/schedule", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s: Schedule | null = d.schedule;
        if (s) {
          setDays(new Set(parseArr(s.days)));
          setTimes(parseArr(s.times).sort());
          setPlatforms(new Set(parseArr(s.platforms)));
          setTimezone(s.timezone || "Asia/Riyadh");
          setIsActive(s.isActive);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    loadUpcoming();
  }, []);

  const toggle = (set: Set<string>, key: string, setter: (v: Set<string>) => void) => {
    const s = new Set(set);
    if (s.has(key)) s.delete(key);
    else s.add(key);
    setter(s);
  };

  const addTime = () => {
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      toast.error("Time must be HH:mm");
      return;
    }
    if (times.includes(newTime)) return;
    setTimes([...times, newTime].sort());
  };

  const removeTime = (t: string) => {
    setTimes(times.filter((x) => x !== t));
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/voice/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: Array.from(days),
          times,
          platforms: Array.from(platforms),
          timezone,
          isActive,
        }),
      });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      const reslotted = d.reslot?.reslotted ?? 0;
      toast.success(t("saved", { reslotted }));
      await loadUpcoming();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4"
          />
          {t("activeLabel")}
        </label>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-5">
          <div>
            <Label>{t("daysLabel")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const isSel = days.has(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggle(days, d, setDays)}
                    className={
                      "text-sm px-3 py-1.5 rounded-md border min-w-[52px] transition-colors " +
                      (isSel
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-muted-foreground/30 hover:border-muted-foreground/60")
                    }
                  >
                    {t(`day.${d}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>{t("timesLabel")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {times.map((tm) => (
                <span
                  key={tm}
                  className="inline-flex items-center gap-1 text-sm bg-muted rounded-md px-2.5 py-1"
                >
                  {tm}
                  <button
                    onClick={() => removeTime(tm)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-[130px]"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTime}>
                <Plus className="size-4" />
                {t("addTime")}
              </Button>
            </div>
          </div>

          <div>
            <Label>{t("platformsLabel")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const isSel = platforms.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(platforms, p, setPlatforms)}
                    className={
                      "text-sm px-3 py-1.5 rounded-md border capitalize transition-colors " +
                      (isSel
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-muted-foreground/30 hover:border-muted-foreground/60")
                    }
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-xs">
            <Label>{t("timezoneLabel")}</Label>
            <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="size-4" />
            {t("upcoming.title")}
          </h3>
          {upcoming.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {t("upcoming.count", { count: upcoming.length })}
            </span>
          )}
        </div>

        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("upcoming.empty")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {upcoming.map((post) => {
              const media = parseMediaUrls(post.mediaUrls);
              return (
                <Card key={post.id}>
                  <CardContent className="py-3 flex items-start gap-3">
                    <div className="min-w-[130px] shrink-0 text-sm font-medium">
                      <div>{format(new Date(post.scheduledAt), "MMM d, yyyy")}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(post.scheduledAt), "EEE · HH:mm")}
                      </div>
                    </div>
                    <PostThumbnail url={media[0]} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap gap-1.5">
                        {post.topic && (
                          <Badge className="bg-muted text-muted-foreground">
                            {post.topic}
                          </Badge>
                        )}
                        {post.platforms.map((p) => (
                          <Badge
                            key={p}
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize"
                          >
                            {p}
                          </Badge>
                        ))}
                      </div>
                      <ExpandableText
                        text={post.content}
                        clampLines={2}
                        className="text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <PostActions
                        content={post.content}
                        onView={() => setViewingPost(post)}
                        onEdit={() => setEditingPost(post)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Open in Posts"
                        title="Open in Posts (full list)"
                        render={
                          <Link href={`/${locale}/posts?status=scheduled`} />
                        }
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ViewPostDialog
        open={viewingPost !== null}
        onOpenChange={(open) => !open && setViewingPost(null)}
        content={viewingPost?.content ?? ""}
        mediaUrls={parseMediaUrls(viewingPost?.mediaUrls)}
      />

      <EditPostDialog
        open={editingPost !== null}
        onOpenChange={(open) => !open && setEditingPost(null)}
        postId={editingPost?.id ?? null}
        initialContent={editingPost?.content ?? ""}
        initialMediaUrls={parseMediaUrls(editingPost?.mediaUrls)}
        onSaved={({ content, mediaUrls }) => {
          if (!editingPost) return;
          setUpcoming((prev) =>
            prev.map((p) =>
              p.id === editingPost.id
                ? {
                    ...p,
                    content,
                    mediaUrls: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
                  }
                : p
            )
          );
        }}
      />
    </div>
  );
}
