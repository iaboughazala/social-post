"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy, Edit3, Eye } from "lucide-react";

interface PostActionsProps {
  content: string;
  onView: () => void;
  onEdit?: () => void;
  size?: "sm" | "icon-xs";
  className?: string;
}

/**
 * View + Copy + Edit trio used on every page that lists posts. Edit is
 * optional — pass `onEdit={undefined}` to hide it (e.g. on the dashboard
 * where already-published posts shouldn't be edited).
 */
export function PostActions({
  content,
  onView,
  onEdit,
  size = "sm",
  className = "",
}: PostActionsProps) {
  const iconClass = size === "icon-xs" ? "size-3.5" : "size-4";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <Button
        variant="ghost"
        size={size}
        onClick={onView}
        aria-label="View"
        title="View full post"
      >
        <Eye className={iconClass} />
      </Button>
      <Button
        variant="ghost"
        size={size}
        onClick={copy}
        aria-label="Copy"
        title="Copy content to clipboard"
      >
        <Copy className={iconClass} />
      </Button>
      {onEdit && (
        <Button
          variant="ghost"
          size={size}
          onClick={onEdit}
          aria-label="Edit"
          title="Edit content"
        >
          <Edit3 className={iconClass} />
        </Button>
      )}
    </div>
  );
}
