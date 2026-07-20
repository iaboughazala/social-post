"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { safeJson, errorFromResponse } from "@/lib/fetch-json";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  initialContent: string;
  onSaved?: (newContent: string) => void;
}

/**
 * Shared modal for editing a Post's content — used from Schedule's
 * upcoming list and Posts page's row actions. PATCHes /api/posts/[id]
 * with { content }. The row it's opened from is responsible for
 * refreshing / patching local state via onSaved.
 */
export function EditPostDialog({
  open,
  onOpenChange,
  postId,
  initialContent,
  onSaved,
}: EditPostDialogProps) {
  const [text, setText] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  // Reset the editor when a new post is opened
  useEffect(() => {
    if (open) setText(initialContent);
  }, [open, initialContent]);

  const save = async () => {
    if (!postId) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const d = await safeJson<{ error?: string }>(r);
      if (!r.ok) throw new Error(errorFromResponse(r, d));
      toast.success("Saved");
      onSaved?.(text);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit post content</DialogTitle>
          <DialogDescription>
            Changes apply on the next publish. The scheduled time and target
            platforms stay the same.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[280px] font-sans"
            dir="auto"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {text.length} characters
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving || !text.trim()}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
