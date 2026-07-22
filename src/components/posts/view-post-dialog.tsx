"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ViewPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  mediaUrls?: string[];
}

/**
 * Read-only viewer for a post's content and attached media. Simpler than
 * the edit dialog — no toolbar, no state, just the text and images as
 * they will publish.
 */
export function ViewPostDialog({
  open,
  onOpenChange,
  content,
  mediaUrls = [],
}: ViewPostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mediaUrls.map((url) => (
                <div
                  key={url}
                  className="rounded-lg border overflow-hidden bg-muted/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Attached"
                    className="w-full h-32 object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          <div
            className="whitespace-pre-wrap text-sm leading-relaxed max-h-[60vh] overflow-y-auto rounded-md border p-4 bg-muted/20"
            dir="auto"
          >
            {content}
          </div>
          <p className="text-xs text-muted-foreground">
            {content.length} characters
            {mediaUrls.length > 0 && ` · ${mediaUrls.length} image(s)`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
