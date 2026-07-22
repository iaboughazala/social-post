"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

interface PostThumbnailProps {
  url: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Small preview of a post's first attached image, with a graceful
 * fallback when the URL 404s or the browser can't decode it. Used in
 * post-list rows across dashboard / posts / schedule pages.
 */
export function PostThumbnail({
  url,
  size = "sm",
  className = "",
}: PostThumbnailProps) {
  const [broken, setBroken] = useState(false);
  const dim =
    size === "md" ? "w-16 h-16" : "w-12 h-12";

  if (!url) {
    return null;
  }
  if (broken) {
    return (
      <div
        className={`${dim} shrink-0 rounded-md border bg-muted/40 flex items-center justify-center text-muted-foreground ${className}`}
        title="Image unavailable"
      >
        <ImageOff className="size-4" />
      </div>
    );
  }
  return (
    <div
      className={`${dim} shrink-0 rounded-md border overflow-hidden bg-muted/30 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

/** Parse a Prisma-stored mediaUrls JSON string into a string[]. */
export function parseMediaUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}
