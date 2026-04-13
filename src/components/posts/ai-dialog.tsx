"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Sparkles, Loader2, Copy, Check } from "lucide-react";

interface AIDialogProps {
  onInsert: (content: string) => void;
  children: React.ReactNode;
}

const MOCK_RESPONSES: Record<string, string[]> = {
  professional: [
    "We are thrilled to announce our latest innovation that will transform how you manage your social media presence. Our team has worked tirelessly to bring you cutting-edge features designed for modern businesses.\n\nDiscover the future of social media management today.",
    "Excited to share our quarterly results! Thanks to our incredible team and loyal customers, we've achieved remarkable milestones this period.\n\nHere's to continued growth and innovation. #BusinessGrowth #Innovation",
  ],
  casual: [
    "Hey everyone! We've got something awesome cooking and we can't wait to share it with you all! Stay tuned for the big reveal coming very soon.\n\nDrop a comment if you're curious!",
    "Just wrapped up an amazing brainstorming session with the team. The energy was unreal! Big things are coming your way. Who's ready?",
  ],
  humorous: [
    "Our social media scheduler is so good, it practically runs itself. We'd tell our team to take the day off, but they're too busy adding more features nobody asked for (but everyone needs).\n\nTry it free - your future self will thank you!",
    "POV: You finally scheduled all your posts for the week and it's only Monday. That's the power of automation, friends. Now if only we could automate getting out of bed...",
  ],
  informative: [
    "Did you know that businesses posting consistently on social media see 67% more leads than those who don't? Here are 3 tips to boost your social presence:\n\n1. Post at optimal times for your audience\n2. Use a mix of content formats\n3. Engage with your community daily\n\n#SocialMediaTips #MarketingStrategy",
    "The landscape of social media is evolving rapidly. In 2026, short-form video content continues to dominate, while AI-powered content creation is becoming essential for brands of all sizes.\n\nStay ahead of the curve with smart scheduling and AI tools.",
  ],
};

export function AIDialog({ onInsert, children }: AIDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [platform, setPlatform] = useState("general");
  const [language, setLanguage] = useState("en");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedContent("");

    // Mock AI response with delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const responses = MOCK_RESPONSES[tone] || MOCK_RESPONSES.professional;
    const randomIndex = Math.floor(Math.random() * responses.length);
    let result = responses[randomIndex];

    if (topic) {
      result = result.replace(
        /social media|innovation|features/gi,
        topic
      );
    }

    if (language === "ar") {
      result =
        "نحن متحمسون للإعلان عن أحدث ابتكاراتنا التي ستغير طريقة إدارتك لوسائل التواصل الاجتماعي. عمل فريقنا بلا كلل لتقديم ميزات متطورة مصممة للأعمال الحديثة.\n\nاكتشف مستقبل إدارة وسائل التواصل الاجتماعي اليوم.";
    }

    setGeneratedContent(result);
    setIsGenerating(false);
  }, [tone, topic, language]);

  const handleInsert = useCallback(() => {
    onInsert(generatedContent);
    setOpen(false);
    setGeneratedContent("");
    setTopic("");
  }, [generatedContent, onInsert]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedContent]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-500" />
            {t("compose.aiGenerate")}
          </DialogTitle>
          <DialogDescription>
            Generate engaging content for your social media posts using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ai-topic">Topic / Prompt</Label>
            <Input
              id="ai-topic"
              placeholder="e.g., Product launch announcement, Holiday sale..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => v && setTone(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="informative">Informative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">X (Twitter)</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Content
              </>
            )}
          </Button>

          {generatedContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Content</Label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          )}
        </div>

        {generatedContent && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleInsert}>
              Use This Content
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
