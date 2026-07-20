"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Layers,
  Loader2,
  Plus,
  Users,
  FileText,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeJson, errorFromResponse } from "@/lib/fetch-json";

interface Brand {
  id: string;
  name: string;
  slug: string;
  role: string;
  isActive: boolean;
  _count?: { socialAccounts: number; posts: number; contentTopics: number };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/teams", { cache: "no-store" });
      if (!r.ok) throw new Error(`teams ${r.status}`);
      const d = await r.json();
      setBrands(Array.isArray(d?.teams) ? d.teams : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const switchTo = async (teamId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/teams/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!r.ok) throw new Error(`switch ${r.status}`);
      window.location.href = window.location.pathname;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  };

  const create = async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const d = await safeJson<{ error?: string }>(r);
      if (!r.ok || !d) throw new Error(errorFromResponse(r, d));
      window.location.href = window.location.pathname;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="size-5" />
          Brands
        </h1>
        <p className="text-muted-foreground mt-1">
          Each brand is a fully isolated workspace: its own connected accounts,
          content topics, voice style, samples, and publishing schedule.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <Label>Create a new brand</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Careers by Islam"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
              }}
              disabled={busy}
            />
            <Button
              onClick={create}
              disabled={!newName.trim() || busy}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            After creating, you become its owner and it becomes your active brand.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Your brands ({brands.length})
        </h2>
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : brands.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No brands yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {brands.map((brand) => (
              <Card
                key={brand.id}
                className={cn(
                  brand.isActive && "ring-2 ring-primary/40"
                )}
              >
                <CardContent className="pt-4 flex items-center gap-4">
                  <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 text-lg font-semibold">
                    {(brand.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold truncate">{brand.name}</div>
                      {brand.isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          <Check className="size-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Link2 className="size-3" />
                        {brand._count?.socialAccounts ?? 0} accounts
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" />
                        {brand._count?.posts ?? 0} posts
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {brand.role}
                      </span>
                    </div>
                  </div>
                  {!brand.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchTo(brand.id)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Switch to
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
