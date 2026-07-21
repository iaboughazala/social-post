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

interface Narrative {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  order: number;
}

export default function NarrativesPage() {
  const t = useTranslations("voice.narratives");
  const [items, setItems] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/voice/narratives", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load");
      const d = await r.json();
      setItems(d.narratives || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (n: Narrative) => {
    try {
      const r = await fetch(`/api/voice/narratives/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !n.isActive }),
      });
      if (!r.ok) throw new Error("Failed");
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isActive: !x.isActive } : x))
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this narrative style?")) return;
    try {
      const r = await fetch(`/api/voice/narratives/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/voice/narratives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          order: items.length + 1,
        }),
      });
      if (!r.ok) throw new Error("Failed");
      const { narrative } = await r.json();
      setItems((prev) => [...prev, narrative]);
      setOpen(false);
      setForm({ name: "", description: "" });
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
                <Label>{t("form.nameLabel")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("form.descriptionLabel")}</Label>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={saving || !form.name.trim()}>
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
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((n) => (
            <Card key={n.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {n.name}
                      <Badge
                        className={
                          n.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {n.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{n.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(n)}
                      title={n.isActive ? "Disable" : "Enable"}
                    >
                      <Power className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(n.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {n.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {n.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
