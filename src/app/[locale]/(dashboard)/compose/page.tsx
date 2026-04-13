"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload,
  CalendarIcon,
  Clock,
  Sparkles,
  Send,
  Save,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
} from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";
import { PlatformPreview, type Platform } from "@/components/posts/platform-preview";
import { AIDialog } from "@/components/posts/ai-dialog";

interface ComposeFormData {
  content: string;
  platforms: Platform[];
  scheduleDate: Date | undefined;
  scheduleTime: string;
  isScheduled: boolean;
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
];

export default function ComposePage() {
  const t = useTranslations();
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { control, watch, setValue, handleSubmit } = useForm<ComposeFormData>({
    defaultValues: {
      content: "",
      platforms: [],
      scheduleDate: undefined,
      scheduleTime: "09:00",
      isScheduled: false,
    },
  });

  const content = watch("content");
  const platforms = watch("platforms");
  const isScheduled = watch("isScheduled");
  const scheduleDate = watch("scheduleDate");

  const togglePlatform = useCallback(
    (platformId: Platform) => {
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
    [platforms, setValue]
  );

  const handleAIInsert = useCallback(
    (generatedContent: string) => {
      setValue("content", generatedContent);
    },
    [setValue]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Mock: just add a placeholder
    setMediaFiles((prev) => [...prev, `media-${prev.length + 1}.jpg`]);
  }, []);

  const removeMedia = useCallback((index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = (data: ComposeFormData) => {
    console.log("Form submitted:", data, mediaFiles);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("compose.title")}</h1>
        <p className="text-muted-foreground mt-1">
          Create and schedule your social media posts
        </p>
      </div>

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
                        className="min-h-[160px] text-base"
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
                        </span>
                      </div>
                    </div>
                  )}
                />

                {/* Media upload area */}
                <div>
                  <Label className="mb-2">{t("compose.mediaUpload")}</Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    )}
                  >
                    <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop files here, or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF, MP4 (max 50MB)
                    </p>
                  </div>
                  {mediaFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {mediaFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm"
                        >
                          <ImageIcon className="size-4 text-muted-foreground" />
                          <span>{file}</span>
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Platform selector */}
            <Card>
              <CardHeader>
                <CardTitle>{t("compose.selectPlatforms")}</CardTitle>
                <CardDescription>
                  Choose where to publish your post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = platforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                          isSelected
                            ? platform.bgActive
                            : "border-transparent bg-muted/50 hover:bg-muted"
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
                  <Button type="submit" className="w-full">
                    <Send className="size-4" />
                    {isScheduled ? t("compose.schedule") : t("compose.publishNow")}
                  </Button>
                  <Button type="button" variant="outline" className="w-full">
                    <Save className="size-4" />
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
                        mediaUrls={mediaFiles}
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
