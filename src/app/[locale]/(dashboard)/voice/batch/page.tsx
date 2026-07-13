"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  isActive: boolean;
}

export default function BatchPage() {
  const t = useTranslations("voice.batch");
  const locale = useLocale();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [countPerTopic, setCountPerTopic] = useState(3);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    requested: number;
    created: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/voice/topics", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTopics((d.topics || []).filter((x: Topic) => x.isActive)))
      .catch(() => setTopics([]));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await fetch("/api/voice/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countPerTopic,
          topicIds: selected.size > 0 ? Array.from(selected) : undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Batch failed");
      setResult({
        requested: d.requested,
        created: d.created,
        failed: d.failed,
      });
      toast.success(t("result", { created: d.created, requested: d.requested, failed: d.failed }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div>
            <Label>{t("countLabel")}</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={countPerTopic}
              onChange={(e) =>
                setCountPerTopic(Math.min(10, Math.max(1, Number(e.target.value) || 1)))
              }
              className="max-w-[100px]"
            />
          </div>

          <div>
            <Label>{t("topicsLabel")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {topics.map((topic) => {
                const isSel = selected.has(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggle(topic.id)}
                    className={
                      "text-xs px-3 py-1.5 rounded-full border transition-colors " +
                      (isSel
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-muted-foreground/30 hover:border-muted-foreground/60")
                    }
                  >
                    {topic.title}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={run} disabled={running} className="w-full">
            {running ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("running")}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {t("run")}
              </>
            )}
          </Button>

          {result && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>{t("result", { ...result })}</p>
              {result.created > 0 && (
                <Link
                  href={`/${locale}/voice/queue`}
                  className="text-primary underline mt-2 inline-block"
                >
                  → Review Queue
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
