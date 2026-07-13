"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Sample {
  id: string;
  content: string;
  notes: string | null;
  createdAt: string;
}

export default function SamplesPage() {
  const t = useTranslations("voice.samples");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/voice/samples", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      setSamples(d.samples || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/voice/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, notes: notes || undefined }),
      });
      if (!r.ok) throw new Error("Failed");
      const { sample } = await r.json();
      setSamples((prev) => [sample, ...prev]);
      setContent("");
      setNotes("");
      toast.success("Added");
    } catch {
      toast.error("Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this sample?")) return;
    try {
      const r = await fetch(`/api/voice/samples/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      setSamples((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <div>
            <Label>{t("paste")}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("paste")}
              className="min-h-[160px] font-mono text-sm"
            />
          </div>
          <div>
            <Label>{t("notes")}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={saving || !content.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t("add")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : samples.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("count", { count: samples.length })}
          </p>
          <div className="grid gap-3">
            {samples.map((sample) => (
              <Card key={sample.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      {sample.notes && (
                        <p className="text-xs font-medium">{sample.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sample.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(sample.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap font-sans max-h-64 overflow-y-auto border-l-2 border-muted-foreground/20 ps-3">
                    {sample.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
