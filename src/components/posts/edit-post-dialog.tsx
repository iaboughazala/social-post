"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Loader2,
  Save,
  Send,
  Sparkles,
  Undo2,
  ImagePlus,
  Upload,
  X,
} from "lucide-react";
import { safeJson, errorFromResponse } from "@/lib/fetch-json";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  initialContent: string;
  initialMediaUrls?: string[];
  /** Enables the "Publish now" button. Pass "draft" or "scheduled". */
  publishableStatus?: "draft" | "scheduled" | null;
  onSaved?: (payload: { content: string; mediaUrls: string[] }) => void;
  onPublished?: () => void;
}

/**
 * Shared modal for editing a Post's content + attached images. Saves via
 * PATCH /api/posts/[id] with { content, mediaUrls }. Regenerate rewrites
 * the text through the voice engine; Generate image renders an on-brand
 * SVG→PNG for the post; Upload attaches an image from disk. Removals are
 * committed only on Save so users can back out with Cancel.
 */
export function EditPostDialog({
  open,
  onOpenChange,
  postId,
  initialContent,
  initialMediaUrls = [],
  publishableStatus = null,
  onSaved,
  onPublished,
}: EditPostDialogProps) {
  const [text, setText] = useState(initialContent);
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialMediaUrls);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText(initialContent);
      setMediaUrls(initialMediaUrls);
      setPreviousText(null);
    }
  }, [open, initialContent, initialMediaUrls]);

  const save = async () => {
    if (!postId) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, mediaUrls }),
      });
      const d = await safeJson<{ error?: string }>(r);
      if (!r.ok) throw new Error(errorFromResponse(r, d));
      toast.success("Saved");
      onSaved?.({ content: text, mediaUrls });
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

  const generateImage = async () => {
    if (!postId || !text.trim()) return;
    setGeneratingImage(true);
    try {
      const r = await fetch(`/api/posts/${postId}/generate-image`, {
        method: "POST",
      });
      const d = await safeJson<{ url?: string; error?: string }>(r);
      if (!r.ok || !d?.url) throw new Error(errorFromResponse(r, d));
      // Server already persisted the URL onto the post, but the dialog
      // has to reflect it locally so the preview shows immediately and
      // the next Save doesn't discard it.
      setMediaUrls((prev) => {
        const withoutOldGen = prev.filter(
          (u) => !u.includes(`/gen-${postId}-`)
        );
        return [d.url!, ...withoutOldGen];
      });
      toast.success("Image generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  };

  const onFilesPicked = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/media/upload", { method: "POST", body: fd });
        const d = await safeJson<{ url?: string; error?: string }>(r);
        if (!r.ok || !d?.url) throw new Error(errorFromResponse(r, d));
        setMediaUrls((prev) => [...prev, d.url!]);
      }
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (url: string) => {
    setMediaUrls((prev) => prev.filter((u) => u !== url));
  };

  const publishNow = async () => {
    if (!postId || !text.trim()) return;
    if (
      !confirm(
        "Publish this post to all its selected platforms right now?"
      )
    ) {
      return;
    }
    setPublishing(true);
    try {
      // Save any pending edits first so the publisher sees the latest text
      // and media state, then trigger the platform publish.
      const saveRes = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, mediaUrls }),
      });
      const saveJson = await safeJson<{ error?: string }>(saveRes);
      if (!saveRes.ok) throw new Error(errorFromResponse(saveRes, saveJson));

      const pubRes = await fetch(`/api/posts/${postId}/publish`, {
        method: "POST",
      });
      const pubJson = await safeJson<{
        error?: string;
        results?: { status: string; error?: string }[];
      }>(pubRes);
      if (!pubRes.ok) throw new Error(errorFromResponse(pubRes, pubJson));

      const failed = (pubJson?.results || []).filter(
        (r) => r.status === "failed"
      );
      if (failed.length > 0) {
        toast.error(`Published with ${failed.length} platform failure(s)`);
      } else {
        toast.success("Published");
      }
      onPublished?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const busy =
    saving || publishing || regenerating || generatingImage || uploading;

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
            className="min-h-[240px] font-sans"
            dir="auto"
            disabled={regenerating}
          />

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
                    disabled={busy}
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
            onChange={(e) => onFilesPicked(e.target.files)}
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {text.length} characters
              {mediaUrls.length > 0 && ` · ${mediaUrls.length} image(s)`}
            </span>
            <div className="flex gap-2 flex-wrap">
              {previousText !== null && (
                <Button
                  variant="ghost"
                  onClick={undo}
                  disabled={busy}
                  title="Restore the text before regeneration"
                >
                  <Undo2 className="size-4" />
                  Undo
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                title="Upload an image from your device"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Upload
              </Button>
              <Button
                variant="outline"
                onClick={generateImage}
                disabled={busy || !text.trim()}
                title="Generate an on-brand image from this post"
              >
                {generatingImage ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                Generate image
              </Button>
              <Button
                variant="outline"
                onClick={regenerate}
                disabled={busy || !text.trim()}
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
                disabled={busy}
              >
                Cancel
              </Button>
              <Button onClick={save} disabled={busy || !text.trim()}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save
              </Button>
              {publishableStatus && (
                <Button
                  onClick={publishNow}
                  disabled={busy || !text.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  title="Save current edits and publish immediately"
                >
                  {publishing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Publish now
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
