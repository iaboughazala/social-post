"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface StyleProfile {
  id: string;
  toneSummary: string;
  voicePillars: string;
  vocabularyNotes: string;
  structureNotes: string;
  doList: string;
  dontList: string;
  rawAnalysis: string;
  sourceSamples: number;
  model: string | null;
  updatedAt: string;
}

function parseArr(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

export default function StylePage() {
  const t = useTranslations("voice.style");
  const [style, setStyle] = useState<StyleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/voice/style", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      setStyle(d.style);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const r = await fetch("/api/voice/analyze", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Analysis failed");
      setStyle(d.style);
      toast.success("Style analyzed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const pillars = parseArr(style?.voicePillars);
  const doList = parseArr(style?.doList);
  const dontList = parseArr(style?.dontList);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={analyze} disabled={analyzing}>
          {analyzing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {analyzing ? t("analyzing") : t("analyze")}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !style ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("notYet")}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 space-y-5">
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-b pb-3">
              <span>
                {t("sourceSamples", { count: style.sourceSamples })}
              </span>
              {style.model && (
                <span>{t("model")}: {style.model}</span>
              )}
              <span>
                {t("lastAnalyzed")}: {format(new Date(style.updatedAt), "MMM d, yyyy p")}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">{t("tone")}</h3>
              <p className="text-sm">{style.toneSummary}</p>
            </div>

            {pillars.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-1">{t("pillars")}</h3>
                <ul className="list-disc ps-5 text-sm space-y-1">
                  {pillars.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">{t("vocabulary")}</h3>
                <p className="text-sm text-muted-foreground">{style.vocabularyNotes}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">{t("structure")}</h3>
                <p className="text-sm text-muted-foreground">{style.structureNotes}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-1 text-green-700 dark:text-green-400">
                  ✓ {t("do")}
                </h3>
                <ul className="list-disc ps-5 text-sm space-y-1">
                  {doList.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1 text-destructive">
                  ✗ {t("dont")}
                </h3>
                <ul className="list-disc ps-5 text-sm space-y-1">
                  {dontList.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            {style.rawAnalysis && (
              <details className="border-t pt-3">
                <summary className="text-sm font-semibold cursor-pointer">
                  {t("raw")}
                </summary>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                  {style.rawAnalysis}
                </p>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
