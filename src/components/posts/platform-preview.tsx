"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Share2,
  ThumbsUp,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Image as ImageIcon,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
} from "@/components/icons/social-icons";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin";

interface PlatformPreviewProps {
  content: string;
  mediaUrls: string[];
  platform: Platform;
  className?: string;
}

const PLATFORM_LIMITS: Record<Platform, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
};

const PLATFORM_CONFIG: Record<
  Platform,
  {
    name: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  facebook: {
    name: "Facebook",
    icon: FacebookIcon,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  instagram: {
    name: "Instagram",
    icon: InstagramIcon,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
  twitter: {
    name: "X (Twitter)",
    icon: TwitterIcon,
    color: "text-neutral-900 dark:text-neutral-100",
    bgColor: "bg-neutral-50 dark:bg-neutral-950/30",
    borderColor: "border-neutral-200 dark:border-neutral-800",
  },
  linkedin: {
    name: "LinkedIn",
    icon: LinkedinIcon,
    color: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
};

function FacebookPreview({
  content,
  mediaUrls,
}: {
  content: string;
  mediaUrls: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          SP
        </div>
        <div>
          <p className="text-sm font-semibold">Social Post</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Just now</span>
            <span>-</span>
            <Globe className="size-3" />
          </div>
        </div>
        <MoreHorizontal className="size-5 text-muted-foreground ms-auto" />
      </div>
      <p className="text-sm whitespace-pre-wrap">{content || "Your post content will appear here..."}</p>
      {mediaUrls.length > 0 ? (
        <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
          <ImageIcon className="size-8 text-muted-foreground" />
        </div>
      ) : null}
      <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
        <button className="flex items-center gap-1.5 text-xs hover:text-blue-600 transition-colors">
          <ThumbsUp className="size-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-blue-600 transition-colors">
          <MessageCircle className="size-4" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-blue-600 transition-colors">
          <Share2 className="size-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}

function InstagramPreview({
  content,
  mediaUrls,
}: {
  content: string;
  mediaUrls: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="size-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center text-[10px] font-bold">
            SP
          </div>
        </div>
        <p className="text-sm font-semibold">socialpost</p>
        <MoreHorizontal className="size-5 text-muted-foreground ms-auto" />
      </div>
      <div className="rounded-md overflow-hidden bg-muted aspect-square flex items-center justify-center border">
        {mediaUrls.length > 0 ? (
          <ImageIcon className="size-10 text-muted-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground">Image preview</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="size-5" />
          <MessageCircle className="size-5" />
          <Share2 className="size-5" />
        </div>
        <Bookmark className="size-5" />
      </div>
      <p className="text-sm">
        <span className="font-semibold me-1.5">socialpost</span>
        <span className="whitespace-pre-wrap">
          {content || "Your caption will appear here..."}
        </span>
      </p>
    </div>
  );
}

function TwitterPreview({
  content,
  mediaUrls,
}: {
  content: string;
  mediaUrls: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="size-10 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 font-bold text-sm shrink-0">
          SP
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">Social Post</span>
            <span className="text-sm text-muted-foreground">@socialpost</span>
            <span className="text-sm text-muted-foreground">- now</span>
          </div>
          <p className="text-sm whitespace-pre-wrap mt-0.5">
            {content || "Your post content will appear here..."}
          </p>
          {mediaUrls.length > 0 ? (
            <div className="rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center mt-3 border">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>
          ) : null}
          <div className="flex items-center justify-between pt-3 text-muted-foreground max-w-[300px]">
            <MessageCircle className="size-4" />
            <Repeat2 className="size-4" />
            <Heart className="size-4" />
            <Share2 className="size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({
  content,
  mediaUrls,
}: {
  content: string;
  mediaUrls: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm">
          SP
        </div>
        <div>
          <p className="text-sm font-semibold">Social Post</p>
          <p className="text-xs text-muted-foreground">SaaS Company</p>
          <p className="text-xs text-muted-foreground">Just now - <Globe className="size-3 inline" /></p>
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap">{content || "Your post content will appear here..."}</p>
      {mediaUrls.length > 0 ? (
        <div className="overflow-hidden bg-muted aspect-video flex items-center justify-center border-y">
          <ImageIcon className="size-8 text-muted-foreground" />
        </div>
      ) : null}
      <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
        <button className="flex items-center gap-1.5 text-xs hover:text-blue-700 transition-colors">
          <ThumbsUp className="size-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-blue-700 transition-colors">
          <MessageCircle className="size-4" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-blue-700 transition-colors">
          <Repeat2 className="size-4" />
          <span>Repost</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-blue-700 transition-colors">
          <Share2 className="size-4" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

const PREVIEW_COMPONENTS: Record<
  Platform,
  React.ComponentType<{ content: string; mediaUrls: string[] }>
> = {
  facebook: FacebookPreview,
  instagram: InstagramPreview,
  twitter: TwitterPreview,
  linkedin: LinkedInPreview,
};

export function PlatformPreview({
  content,
  mediaUrls,
  platform,
  className,
}: PlatformPreviewProps) {
  const config = PLATFORM_CONFIG[platform];
  const limit = PLATFORM_LIMITS[platform];
  const charCount = content.length;
  const isOverLimit = charCount > limit;
  const PreviewComponent = PREVIEW_COMPONENTS[platform];
  const Icon = config.icon;

  return (
    <Card className={cn("overflow-hidden", config.borderColor, className)}>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("size-4", config.color)} />
            <span className="text-sm font-medium">{config.name}</span>
          </div>
          <Badge
            variant={isOverLimit ? "destructive" : "secondary"}
            className="text-xs"
          >
            {charCount}/{limit}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={cn("pt-4", config.bgColor)}>
        <PreviewComponent content={content} mediaUrls={mediaUrls} />
      </CardContent>
    </Card>
  );
}

export { PLATFORM_CONFIG, PLATFORM_LIMITS };
export type { Platform };
