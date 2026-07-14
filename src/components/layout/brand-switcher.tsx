"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/teams", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load brands");
      const d = await r.json();
      setBrands(d.teams || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const active = brands.find((b) => b.isActive) ?? brands[0];

  const switchTo = async (teamId: string) => {
    if (teamId === active?.id) return;
    setSwitching(teamId);
    try {
      const r = await fetch("/api/teams/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!r.ok) throw new Error("Switch failed");
      await updateSession();
      router.refresh();
      toast.success("Switched brand");
      setTimeout(() => window.location.reload(), 250);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSwitching(null);
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      toast.success(`Created brand: ${d.team.name}`);
      setCreateOpen(false);
      setNewName("");
      await updateSession();
      setTimeout(() => window.location.reload(), 250);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

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
                <span className="truncate font-semibold">
                  {loading ? "Loading…" : active?.name ?? "No brand"}
                </span>
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
                  disabled={switching !== null}
                  className="gap-2"
                >
                  <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm">{brand.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {brand._count?.socialAccounts ?? 0} account(s) ·{" "}
                      {brand._count?.posts ?? 0} post(s)
                    </div>
                  </div>
                  {switching === brand.id ? (
                    <Loader2 className="size-4 animate-spin shrink-0" />
                  ) : brand.isActive ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateOpen(true)}
                className="gap-2"
              >
                <div className="flex aspect-square size-7 items-center justify-center rounded-md border border-dashed">
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
              <Button
                onClick={create}
                disabled={creating || !newName.trim()}
              >
                {creating && <Loader2 className="size-4 animate-spin" />}
                Create brand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
