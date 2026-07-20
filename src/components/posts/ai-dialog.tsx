"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Check } from "lucide-react";
import { safeJson, errorFromResponse } from "@/lib/fetch-json";

interface AIDialogProps {
  onInsert: (content: string) => void;
  children: React.ReactNode;
}

interface Topic {
  id: string;
  title: string;
  isActive: boolean;
}

interface Variant {
  id: string;
  variantIndex: number;
  content: string;
  hook: string | null;
  hashtags: string[];
}

const NO_TOPIC = "__none__";

export function AIDialog({ onInsert, children }: AIDialogProps) {
  const t = useTranslations();
  const tv = useTranslations("voice.compose");
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string>(NO_TOPIC);
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [variantCount, setVariantCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/voice/topics", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTopics((d.topics || []).filter((x: Topic) => x.isActive)))
      .catch(() => setTopics([]));
  }, [open]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setVariants([]);
    setPickedId(null);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          context: context.trim() || undefined,
          topicId: topicId === NO_TOPIC ? undefined : topicId,
          variantCount,
        }),
      });
      const d = await safeJson<{ error?: string; variants?: Variant[] }>(r);
      if (!r.ok || !d) throw new Error(errorFromResponse(r, d));
      setVariants(d.variants || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [prompt, context, topicId, variantCount]);

  const handlePick = useCallback(
    (variant: Variant) => {
      setPickedId(variant.id);
      onInsert(variant.content);
      setOpen(false);
      // reset for next time
      setVariants([]);
      setPrompt("");
      setContext("");
      toast.success("Inserted");
    },
    [onInsert]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-500" />
            {t("compose.aiGenerate")}
          </DialogTitle>
          <DialogDescription>{t("voice.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-2">
              <Label>{tv("topicLabel")}</Label>
              <Select value={topicId} onValueChange={(v) => v && setTopicId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TOPIC}>{tv("noTopic")}</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tv("variantsLabel")}</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={variantCount}
                onChange={(e) =>
                  setVariantCount(Math.min(5, Math.max(1, Number(e.target.value) || 3)))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{tv("ideaLabel")}</Label>
            <Textarea
              placeholder={tv("ideaPlaceholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>{tv("contextLabel")}</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {tv("generating")}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {variants.length > 0 ? tv("regenerate") : tv("generate")}
              </>
            )}
          </Button>

          {variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold">{tv("variantsTitle")}</h3>
              {variants.map((variant, idx) => (
                <div
                  key={variant.id}
                  className="border rounded-lg p-3 space-y-2 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handlePick(variant)}
                      disabled={pickedId === variant.id}
                    >
                      {pickedId === variant.id ? (
                        <Check className="size-3.5" />
                      ) : null}
                      {tv("useThis")}
                    </Button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                    {variant.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
