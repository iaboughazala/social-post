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
import { Loader2, Save, Sparkles, Undo2 } from "lucide-react";
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
 *
 * Regenerate calls POST /api/posts/[id]/regenerate which runs the voice
 * engine on the current text as a seed. It does NOT save — the user
 * reviews the result and clicks Save (or Undo to restore the previous
 * text). One-step undo only, in-memory.
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
  const [regenerating, setRegenerating] = useState(false);
  const [previousText, setPreviousText] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setText(initialContent);
      setPreviousText(null);
    }
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

  const regenerate = async () => {
    if (!postId || !text.trim()) return;
    setRegenerating(true);
    const snapshot = text;
    try {
      const r = await fetch(`/api/posts/${postId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const d = await safeJson<{ content?: string; error?: string }>(r);
      if (!r.ok || !d?.content) throw new Error(errorFromResponse(r, d));
      setPreviousText(snapshot);
      setText(d.content);
      toast.success("Regenerated — click Save to apply, or Undo to revert");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  };

  const undo = () => {
    if (previousText === null) return;
    setText(previousText);
    setPreviousText(null);
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
            disabled={regenerating}
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {text.length} characters
            </span>
            <div className="flex gap-2 flex-wrap">
              {previousText !== null && (
                <Button
                  variant="ghost"
                  onClick={undo}
                  disabled={saving || regenerating}
                  title="Restore the text before regeneration"
                >
                  <Undo2 className="size-4" />
                  Undo
                </Button>
              )}
              <Button
                variant="outline"
                onClick={regenerate}
                disabled={saving || regenerating || !text.trim()}
                title="Rewrite this post through the voice engine using the current text as the idea"
              >
                {regenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Regenerate
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving || regenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving || regenerating || !text.trim()}
              >
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
