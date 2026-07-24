"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Clock,
  Sparkles,
  Send,
  Save,
  Image as ImageIcon,
  ImagePlus,
  Upload,
  X,
  Loader2,
  AlertTriangle,
  Newspaper,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
  BlueskyIcon,
} from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";
import { PlatformPreview, type Platform } from "@/components/posts/platform-preview";
import { AIDialog } from "@/components/posts/ai-dialog";
import { safeJson, errorFromResponse } from "@/lib/fetch-json";

interface ComposeFormData {
  content: string;
  mediaUrls: string[];
  platforms: Platform[];
  scheduleDate: Date | undefined;
  scheduleTime: string;
  isScheduled: boolean;
}

interface ConnectedAccount {
  id: string;
  platform: Platform;
  name: string;
  expiresAt: string | null;
}

const PLATFORMS: {
  id: Platform;
  name: string;
  icon: React.ElementType;
  color: string;
  bgActive: string;
}[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: FacebookIcon,
    color: "text-blue-600",
    bgActive: "bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: InstagramIcon,
    color: "text-pink-600",
    bgActive: "bg-pink-50 border-pink-300 dark:bg-pink-950/40 dark:border-pink-700",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: TwitterIcon,
    color: "text-neutral-900 dark:text-neutral-100",
    bgActive: "bg-neutral-100 border-neutral-400 dark:bg-neutral-800 dark:border-neutral-600",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: LinkedinIcon,
    color: "text-blue-700",
    bgActive: "bg-blue-50 border-blue-400 dark:bg-blue-950/40 dark:border-blue-600",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: BlueskyIcon,
    color: "text-sky-500",
    bgActive: "bg-sky-50 border-sky-300 dark:bg-sky-950/40 dark:border-sky-700",
  },
  {
    id: "wasla",
    name: "Wasla",
    icon: Newspaper,
    color: "text-emerald-600",
    bgActive: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700",
  },
];

export default function ComposePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [submitting, setSubmitting] = useState<null | "draft" | "publish" | "schedule">(null);

  const { control, watch, setValue, handleSubmit } = useForm<ComposeFormData>({
    defaultValues: {
      content: "",
      mediaUrls: [],
      platforms: [],
      scheduleDate: undefined,
      scheduleTime: "10:00",
      isScheduled: false,
    },
  });

  const content = watch("content");
  const mediaUrls = watch("mediaUrls");
  const platforms = watch("platforms");
  const isScheduled = watch("isScheduled");
  const scheduleDate = watch("scheduleDate");
  const scheduleTime = watch("scheduleTime");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const next = [...mediaUrls];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/media/upload", { method: "POST", body: fd });
        const d = await safeJson<{ url?: string; error?: string }>(r);
        if (!r.ok || !d?.url) throw new Error(errorFromResponse(r, d));
        next.push(d.url);
      }
      setValue("mediaUrls", next);
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generateImage = async () => {
    if (!content.trim()) {
      toast.error("Write some content first");
      return;
    }
    setGeneratingImage(true);
    try {
      const r = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const d = await safeJson<{ url?: string; error?: string }>(r);
      if (!r.ok || !d?.url) throw new Error(errorFromResponse(r, d));
      setValue("mediaUrls", [d.url, ...mediaUrls]);
      toast.success("Image generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  };

  const removeImage = (url: string) => {
    setValue(
      "mediaUrls",
      mediaUrls.filter((u) => u !== url)
    );
  };

  useEffect(() => {
    fetch("/api/accounts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, []);

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  const togglePlatform = useCallback(
    (platformId: Platform) => {
      if (!connectedPlatforms.has(platformId)) {
        toast.error(`Connect ${platformId} first in Accounts`);
        return;
      }
      const current = platforms;
      if (current.includes(platformId)) {
        setValue(
          "platforms",
          current.filter((p) => p !== platformId)
        );
      } else {
        setValue("platforms", [...current, platformId]);
      }
    },
    [platforms, setValue, connectedPlatforms]
  );

  const handleAIInsert = useCallback(
    (generatedContent: string) => {
      setValue("content", generatedContent);
    },
    [setValue]
  );

  async function createPost(payload: {
    content: string;
    mediaUrls?: string[];
    platforms: Platform[];
    status: "draft" | "scheduled";
    scheduledAt?: string;
  }): Promise<{ id: string } | null> {
    const r = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await safeJson<{ error?: string; id?: string }>(r);
    if (!r.ok || !d) {
      throw new Error(errorFromResponse(r, d));
    }
    return d as { id: string };
  }

  async function handleSaveDraft(data: ComposeFormData) {
    if (!data.content.trim()) {
      toast.error("Add some content first");
      return;
    }
    setSubmitting("draft");
    try {
      await createPost({
        content: data.content.trim(),
        mediaUrls: data.mediaUrls,
        platforms: data.platforms,
        status: "draft",
      });
      toast.success("Draft saved");
      router.push(`/${locale}/posts`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(null);
    }
  }

  async function handlePublishNow(data: ComposeFormData) {
    if (!data.content.trim()) {
      toast.error("Add some content first");
      return;
    }
    if (data.platforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    setSubmitting("publish");
    try {
      const post = await createPost({
        content: data.content.trim(),
        mediaUrls: data.mediaUrls,
        platforms: data.platforms,
        status: "draft", // create as draft first
      });
      if (!post?.id) throw new Error("No post id returned");

      const r = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
      const d = await safeJson<{ error?: string; results?: { status: string }[] }>(r);
      if (!r.ok || !d) throw new Error(errorFromResponse(r, d));

      const failed = (d.results || []).filter((x: { status: string }) => x.status === "failed");
      if (failed.length > 0) {
        toast.error(`Published with ${failed.length} platform failure(s)`);
      } else {
        toast.success("Published");
      }
      router.push(`/${locale}/posts`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSchedule(data: ComposeFormData) {
    if (!data.content.trim()) {
      toast.error("Add some content first");
      return;
    }
    if (data.platforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    if (!data.scheduleDate) {
      toast.error("Pick a date");
      return;
    }
    const [hh, mm] = (data.scheduleTime || "10:00").split(":").map(Number);
    const dt = new Date(data.scheduleDate);
    dt.setHours(hh, mm, 0, 0);
    if (dt.getTime() <= Date.now()) {
      toast.error("Pick a future time");
      return;
    }

    setSubmitting("schedule");
    try {
      await createPost({
        content: data.content.trim(),
        mediaUrls: data.mediaUrls,
        platforms: data.platforms,
        status: "scheduled",
        scheduledAt: dt.toISOString(),
      });
      toast.success(`Scheduled for ${format(dt, "MMM d, yyyy 'at' HH:mm")}`);
      router.push(`/${locale}/posts`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(null);
    }
  }

  const onSubmit = (data: ComposeFormData) => {
    if (isScheduled) handleSchedule(data);
    else handlePublishNow(data);
  };

  const anyConnected = accounts.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("compose.title")}</h1>
        <p className="text-muted-foreground mt-1">
          Create and schedule your social media posts
        </p>
      </div>

      {!accountsLoading && !anyConnected && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium">No accounts connected</p>
              <p className="text-muted-foreground">
                You can save drafts, but you need at least one connected account to
                publish or schedule.
              </p>
            </div>
            <Button variant="outline" size="sm" render={<Link href={`/${locale}/accounts`} />}>
              Connect an account
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Post Content</CardTitle>
                  <AIDialog onInsert={handleAIInsert}>
                    <Button variant="outline" size="sm" type="button">
                      <Sparkles className="size-4 text-purple-500" />
                      {t("compose.aiGenerate")}
                    </Button>
                  </AIDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Textarea
                        {...field}
                        placeholder={t("compose.contentPlaceholder")}
                        className="min-h-[220px] text-base"
                      />
                      <div className="flex justify-end">
                        <span
                          className={cn(
                            "text-xs",
                            content.length > 280
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {content.length} characters
                          {mediaUrls.length > 0 && ` · ${mediaUrls.length} image(s)`}
                        </span>
                      </div>

                      {mediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {mediaUrls.map((url) => (
                            <div
                              key={url}
                              className="relative group rounded-lg border overflow-hidden bg-muted/30"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt="Attached"
                                className="w-full h-32 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                title="Remove image"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        hidden
                        onChange={(e) => uploadImages(e.target.files)}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage || generatingImage}
                          title="Upload an image from your device"
                        >
                          {uploadingImage ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Upload className="size-4" />
                          )}
                          Upload image
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateImage}
                          disabled={uploadingImage || generatingImage || !content.trim()}
                          title="Generate an on-brand image from this post"
                        >
                          {generatingImage ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <ImagePlus className="size-4" />
                          )}
                          Generate image
                        </Button>
                      </div>
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            {/* Platform selector */}
            <Card>
              <CardHeader>
                <CardTitle>{t("compose.selectPlatforms")}</CardTitle>
                <CardDescription>
                  Only connected accounts can be selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = platforms.includes(platform.id);
                    const isConnected = connectedPlatforms.has(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        disabled={!isConnected}
                        className={cn(
                          "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                          isSelected && isConnected
                            ? platform.bgActive
                            : "border-transparent bg-muted/50 hover:bg-muted",
                          !isConnected && "opacity-40 cursor-not-allowed hover:bg-muted/50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-6",
                            isSelected ? platform.color : "text-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {platform.name}
                        </span>
                        {!isConnected && (
                          <span className="absolute top-1 right-1 text-[9px] bg-muted-foreground/10 text-muted-foreground px-1.5 rounded">
                            Not connected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Schedule section */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!isScheduled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setValue("isScheduled", false)}
                  >
                    <Send className="size-4" />
                    {t("compose.publishNow")}
                  </Button>
                  <Button
                    type="button"
                    variant={isScheduled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setValue("isScheduled", true)}
                  >
                    <CalendarIcon className="size-4" />
                    {t("compose.schedule")}
                  </Button>
                </div>

                {isScheduled && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Controller
                      name="scheduleDate"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button variant="outline" size="sm" type="button" />
                            }
                          >
                            <CalendarIcon className="size-4" />
                            {field.value
                              ? format(field.value, "PPP")
                              : "Pick a date"}
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    <Controller
                      name="scheduleTime"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-muted-foreground" />
                          <Input
                            type="time"
                            {...field}
                            className="w-[130px]"
                          />
                        </div>
                      )}
                    />
                    {scheduleDate && (
                      <div className="text-xs text-muted-foreground self-center">
                        → {format(scheduleDate, "MMM d, yyyy")} · {scheduleTime}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Preview & Actions */}
          <div className="space-y-6">
            {/* Action buttons */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting !== null || !anyConnected}
                  >
                    {submitting === "publish" || submitting === "schedule" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {isScheduled ? t("compose.schedule") : t("compose.publishNow")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleSubmit(handleSaveDraft)}
                    disabled={submitting !== null}
                  >
                    {submitting === "draft" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {t("compose.draft")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview section */}
            {platforms.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Preview</h3>
                <Tabs defaultValue={platforms[0]}>
                  <TabsList>
                    {platforms.map((p) => {
                      const config = PLATFORMS.find((pl) => pl.id === p);
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <TabsTrigger key={p} value={p}>
                          <Icon className={cn("size-3.5", config.color)} />
                          <span className="hidden sm:inline">{config.name}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {platforms.map((p) => (
                    <TabsContent key={p} value={p}>
                      <PlatformPreview
                        content={content}
                        mediaUrls={mediaUrls}
                        platform={p}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="size-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Select platforms to see a preview of your post
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
