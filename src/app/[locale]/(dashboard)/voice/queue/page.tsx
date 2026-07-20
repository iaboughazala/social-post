"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Edit3, Loader2, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { safeJson, errorFromResponse } from "@/lib/fetch-json";

interface QueueItem {
  id: string;
  content: string;
  createdAt: string;
  topic: { id: string; title: string } | null;
}

interface QueueStats {
  queue: number;
  scheduled: number;
  published: number;
}

export default function QueuePage() {
  const t = useTranslations("voice.queue");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({ queue: 0, scheduled: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/voice/queue", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      setItems(d.posts || []);
      if (d.stats) setStats(d.stats);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const startEdit = (item: QueueItem) => {
    setEditingId(item.id);
    setEditText(item.content);
  };

  const saveEdit = async (id: string) => {
    setBusyId(id);
    try {
      const r = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      if (!r.ok) throw new Error("Failed");
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, content: editText } : x))
      );
      setEditingId(null);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const approveAll = async () => {
    if (items.length === 0) return;
    if (!confirm(t("approveAllConfirm", { count: items.length }))) return;
    setApprovingAll(true);
    try {
      const r = await fetch("/api/voice/queue/approve-all", { method: "POST" });
      const d = await safeJson<{ error?: string; firstSlot?: string; approved?: number }>(r);
      if (!r.ok || !d) throw new Error(errorFromResponse(r, d));
      const first = d.firstSlot
        ? format(new Date(d.firstSlot), "MMM d, HH:mm")
        : "—";
      toast.success(t("approveAllDone", { approved: d.approved ?? 0, first }));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setApprovingAll(false);
    }
  };

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      const r = await fetch(`/api/posts/${id}/approve`, { method: "POST" });
      const d = await safeJson<{ error?: string; scheduledAt?: string }>(r);
      if (!r.ok || !d) throw new Error(errorFromResponse(r, d));
      const when = format(new Date(d.scheduledAt ?? Date.now()), "MMM d, yyyy 'at' HH:mm");
      toast.success(t("approved", { when }));
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {items.length > 0 && (
          <Button
            onClick={approveAll}
            disabled={approvingAll || busyId !== null}
          >
            {approvingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            {t("approveAll", { count: items.length })}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold">{stats.queue}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("stats.queue")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.scheduled}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("stats.scheduled")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.published}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("stats.published")}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const isEditing = editingId === item.id;
            const isBusy = busyId === item.id;
            return (
              <Card key={item.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-muted text-muted-foreground">
                        {item.topic?.title ?? t("noTopic")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                    {!isEditing && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(item)}
                          disabled={isBusy}
                        >
                          <Edit3 className="size-3.5" />
                          {t("edit")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remove(item.id)}
                          disabled={isBusy}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                          {t("delete")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approve(item.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          {t("approve")}
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <>
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[200px] font-sans"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          disabled={isBusy}
                        >
                          <X className="size-3.5" />
                          {t("cancelEdit")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(item.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          {t("saveEdit")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap font-sans max-h-64 overflow-y-auto border-l-2 border-muted-foreground/20 ps-3">
                      {item.content}
                    </pre>
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
