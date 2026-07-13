"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Power, Trash2 } from "lucide-react";

interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string;
  frameworks: string;
  angles: string;
  hooks: string;
  hashtags: string;
  isActive: boolean;
  order: number;
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

export default function TopicsPage() {
  const t = useTranslations("voice.topics");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    frameworks: "",
    hashtags: "",
    angles: "",
    hooks: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/voice/topics", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load");
      const d = await r.json();
      setTopics(d.topics || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load topics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (topic: Topic) => {
    try {
      const r = await fetch(`/api/voice/topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !topic.isActive }),
      });
      if (!r.ok) throw new Error("Failed");
      setTopics((prev) =>
        prev.map((x) => (x.id === topic.id ? { ...x, isActive: !x.isActive } : x))
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    try {
      const r = await fetch(`/api/voice/topics/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      setTopics((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/voice/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          frameworks: form.frameworks.split(",").map((s) => s.trim()).filter(Boolean),
          hashtags: form.hashtags.split(",").map((s) => s.trim()).filter(Boolean),
          angles: form.angles.split("\n").map((s) => s.trim()).filter(Boolean),
          hooks: form.hooks.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!r.ok) throw new Error("Failed");
      const { topic } = await r.json();
      setTopics((prev) => [...prev, topic]);
      setOpen(false);
      setForm({ title: "", description: "", frameworks: "", hashtags: "", angles: "", hooks: "" });
      toast.success("Added");
    } catch {
      toast.error("Failed to add");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="size-4" />
                {t("add")}
              </Button>
            }
          />
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("add")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("form.titleLabel")}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>{t("form.descriptionLabel")}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t("form.frameworksLabel")}</Label>
                  <Input value={form.frameworks} onChange={(e) => setForm({ ...form, frameworks: e.target.value })} />
                </div>
                <div>
                  <Label>{t("form.hashtagsLabel")}</Label>
                  <Input value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{t("form.anglesLabel")}</Label>
                <Textarea rows={4} value={form.angles} onChange={(e) => setForm({ ...form, angles: e.target.value })} />
              </div>
              <div>
                <Label>{t("form.hooksLabel")}</Label>
                <Textarea rows={3} value={form.hooks} onChange={(e) => setForm({ ...form, hooks: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={saving || !form.title.trim()}>
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {topics.map((topic) => {
            const hashtags = parseArr(topic.hashtags);
            const frameworks = parseArr(topic.frameworks);
            return (
              <Card key={topic.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {topic.title}
                        <Badge
                          className={
                            topic.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {topic.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{topic.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(topic)}
                        title={topic.isActive ? "Disable" : "Enable"}
                      >
                        <Power className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(topic.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topic.description && (
                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                  )}
                  {frameworks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {frameworks.slice(0, 6).map((f) => (
                        <span key={f} className="text-xs bg-muted px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {hashtags.map((h) => (
                        <span key={h} className="text-xs text-blue-600 dark:text-blue-400">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
