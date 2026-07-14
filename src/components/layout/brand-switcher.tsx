"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Check, ChevronsUpDown, Loader2, Plus, Layers } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  role: string;
  isActive: boolean;
  _count?: { socialAccounts: number; posts: number; contentTopics: number };
}

export function BrandSwitcher() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/teams", { cache: "no-store" });
        if (!r.ok) throw new Error(`teams ${r.status}`);
        const d = await r.json();
        if (!cancelled) setBrands(Array.isArray(d?.teams) ? d.teams : []);
      } catch (e) {
        if (!cancelled) {
          console.error("[BrandSwitcher] load failed", e);
          setError(e instanceof Error ? e.message : "load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = brands.find((b) => b.isActive) ?? brands[0];

  const switchTo = async (teamId: string) => {
    if (busy || teamId === active?.id) return;
    setBusy(true);
    try {
      const r = await fetch("/api/teams/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!r.ok) throw new Error(`switch ${r.status}`);
      // Hard reload so JWT re-reads active team and every page/API fetches fresh.
      window.location.href = window.location.pathname;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to switch");
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
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Create failed");
      window.location.href = window.location.pathname;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  };

  const label = loading
    ? "Loading…"
    : error
      ? "Brands unavailable"
      : (active?.name ?? "No brand");

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                <Layers className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
                <span className="truncate font-semibold">{label}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {brands.length} brand{brands.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto size-4 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-lg"
              side="bottom"
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Your brands
              </DropdownMenuLabel>
              {brands.map((brand) => (
                <DropdownMenuItem
                  key={brand.id}
                  onClick={() => switchTo(brand.id)}
                  disabled={busy}
                  className="gap-2"
                >
                  <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold shrink-0">
                    {(brand.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm">{brand.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {brand._count?.socialAccounts ?? 0} account(s) ·{" "}
                      {brand._count?.posts ?? 0} post(s)
                    </div>
                  </div>
                  {brand.isActive ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              {brands.length === 0 && !loading && (
                <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                  {error || "No brands yet"}
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateOpen(true)}
                disabled={busy}
                className="gap-2"
              >
                <div className="flex aspect-square size-7 items-center justify-center rounded-md border border-dashed shrink-0">
                  <Plus className="size-4" />
                </div>
                <span className="text-sm">Create new brand</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new brand</DialogTitle>
            <DialogDescription>
              A brand is a fully isolated workspace: its own connected accounts,
              content topics, voice style, samples, and publishing schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Brand name</Label>
              <Input
                placeholder="e.g. Careers by Islam"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={create} disabled={busy || !newName.trim()}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                Create brand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
